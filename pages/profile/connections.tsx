
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useFetchDomains } from '../../services/domains';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, PowerOff, ShieldCheck, Globe, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const PLATFORM_ICONS: Record<string, string> = {
    wordpress: '/icon/platfourms/wordPress_blue_logo.svg',
    shopify: '/icon/platfourms/shopify-icon.svg',
    wix: '/icon/platfourms/wix.com_website_logo.svg',
    webflow: '/icon/platfourms/webflow.svg',
};

const ConnectionsPage = () => {
    const { t, locale, setLocale } = useLanguage();
    const router = useRouter();
    const { data: domainsData } = useFetchDomains(router);
    const [isLoading, setIsLoading] = useState(true);
    const [integrations, setIntegrations] = useState<any[]>([]);

    // Revoke Confirm State
    const [revokeId, setRevokeId] = useState<number | null>(null);

    // Logs State
    const [logsId, setLogsId] = useState<number | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/platform/integrations', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.success) {
                setIntegrations(data.integrations);
            }
        } catch (error) {
            console.error('Failed to fetch integrations', error);
            toast.error('Failed to load connections');
        } finally {
            setIsLoading(false);
        }
    };

    const viewLogs = async (id: number) => {
        setLogsId(id);
        setLoadingLogs(true);
        setLogs([]);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/platform/logs?integration_id=${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            } else {
                toast.error(data.message || 'Failed to fetch logs');
            }
        } catch (error) {
            toast.error('Error loading logs');
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleRevoke = async () => {
        if (!revokeId) return;
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/platform/integrations', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ id: revokeId })
            });

            if (res.ok) {
                toast.success('Connection revoked successfully');
                // Optimistic update
                setIntegrations(prev => prev.map(i => i.id === revokeId ? { ...i, is_active: false } : i));
            } else {
                toast.error('Failed to revoke connection');
            }
        } catch (error) {
            toast.error('Error revoking connection');
        } finally {
            setRevokeId(null);
        }
    };

    return (
        <DashboardLayout selectedLang={locale || 'en'} onLanguageChange={setLocale} domains={domainsData?.domains || []}>
            <Head>
                <title>Platform Connections - SEO AI Agent</title>
            </Head>

            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">Platform Connections</h1>
                    <p className="text-neutral-600">Manage your connected external platforms (WordPress, Shopify, etc).</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                    </div>
                ) : integrations.length === 0 ? (
                    <Card className="bg-neutral-50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <Globe className="h-12 w-12 text-neutral-300 mb-4" />
                            <h3 className="text-lg font-medium text-neutral-900">No active connections</h3>
                            <p className="text-neutral-500 mt-1 max-w-sm">
                                You haven&apos;t connected any external platforms yet. Install the SEO AI Agent plugin on your WordPress site to get started.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {integrations.map((integration) => (
                            <Card key={integration.id} className={`transition-all ${!integration.is_active ? 'opacity-60 bg-neutral-50' : ''}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {/* Icon based on type */}
                                            <div className="h-10 w-10 flex-shrink-0">
                                                {PLATFORM_ICONS[integration.platform_type] ? (
                                                    <Image
                                                        src={PLATFORM_ICONS[integration.platform_type]}
                                                        alt={integration.platform_type}
                                                        width={40}
                                                        height={40}
                                                        className="h-full w-full object-contain"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                        {integration.platform_type.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    {integration.platform_domain}
                                                    {!integration.is_active && <Badge variant="destructive" className="text-xs">Revoked</Badge>}
                                                    {integration.is_active && <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Active</Badge>}
                                                </CardTitle>
                                                <CardDescription>
                                                    Connected via {integration.platform_type} • ID: {integration.platform_user_id}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => viewLogs(integration.id)}>
                                                <FileText className="h-4 w-4 mr-2" />
                                                Logs
                                            </Button>
                                            {integration.is_active && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setRevokeId(integration.id)}
                                                >
                                                    <PowerOff className="h-4 w-4 mr-2" />
                                                    Revoke
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-neutral-500">Connected On</span>
                                            <span className="font-medium">{new Date(integration.createdAt || integration.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-neutral-500">Last Login</span>
                                            <span className="font-medium">{integration.last_login ? new Date(integration.last_login).toLocaleString() : 'Never'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                {integration.is_active && (
                                    <CardFooter className="pt-0 text-xs text-neutral-400 flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3" />
                                        Secure Connection Established
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Revoke Confirmation Dialog */}
            <Dialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke Connection?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to disconnect this platform? The plugin on <strong>{integrations.find(i => i.id === revokeId)?.platform_domain}</strong> will stop working immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevokeId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRevoke}>Revoke Connection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Logs Dialog */}
            <Dialog open={!!logsId} onOpenChange={(open) => !open && setLogsId(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Integration Logs</DialogTitle>
                        <DialogDescription>
                            Audit logs for {integrations.find(i => i.id === logsId)?.platform_domain}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto mt-4">
                        {loadingLogs ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : logs.length === 0 ? (
                            <p className="text-center text-neutral-500 py-8">No logs found.</p>
                        ) : (
                            <div className="relative w-full overflow-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Action</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">IP</th>
                                            <th className="px-4 py-3">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id} className="border-b">
                                                <td className="px-4 py-3 text-neutral-600">{new Date(log.created_at).toLocaleString()}</td>
                                                <td className="px-4 py-3 font-medium">{log.action}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={log.status === 'success' ? 'outline' : 'destructive'} className={log.status === 'success' ? 'text-green-700 bg-green-50 border-green-200' : ''}>
                                                        {log.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-500 font-mono text-xs">{log.ip_address}</td>
                                                <td className="px-4 py-3 text-neutral-500 max-w-[200px] truncate" title={JSON.stringify(log.details)}>
                                                    {JSON.stringify(log.details)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
};

export default ConnectionsPage;
