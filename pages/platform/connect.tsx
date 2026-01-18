import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const PlatformConnect = () => {
    const router = useRouter();
    const [platform, setPlatform] = useState('wordpress');
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    // Check auth via API (handles both Cookies and LocalStorage tokens)
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/user');
                if (res.status === 401) {
                    const returnUrl = encodeURIComponent(router.asPath);
                    router.push(`/login?redirect=${returnUrl}`);
                }
            } catch (e) {
                console.error('Auth check failed', e);
            }
        };
        // Avoid running on server side
        if (typeof window !== 'undefined') {
            checkAuth();
        }
    }, [router]);

    // Auto-generate key if coming from plugin
    useEffect(() => {
        if (!router.isReady) return;

        const { domain: urlDomain, source, platform: urlPlatform } = router.query;

        if (urlDomain) {
            const decodedDomain = decodeURIComponent(String(urlDomain));
            setDomain(decodedDomain);

            if (source === 'wordpress_plugin') {
                // Check if user is logged in before trying to generate
                const token = localStorage.getItem('auth_token');
                if (token) {
                    // Auto-trigger generation
                    generateKey(decodedDomain, 'wordpress');
                }
            }
        }
    }, [router.isReady, router.query]);

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    const generateKey = async (targetDomain: string, targetPlatform: string) => {
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/platform/connect', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    platform_type: targetPlatform,
                    platform_domain: targetDomain.replace(/^https?:\/\//, '').replace(/\/$/, ''), // Clean domain
                    platform_user_id: 'admin' // Initial binding
                })
            });

            const data = await res.json();

            if (data.success) {
                setResult(data);
                toast.success('API Key Generated Successfully!');
            } else {
                toast.error(data.error || 'Failed to generate key');
            }
        } catch (err) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        await generateKey(domain, platform);
    };

    const copyToClipboard = () => {
        if (result?.api_key) {
            navigator.clipboard.writeText(result.api_key);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Copied to clipboard');
        }
    };

    return (
        <DashboardLayout hideSidebar={true}>
            <Head>
                <title>Platform Integrations | SEO AI Agent</title>
            </Head>

            <div className="container mx-auto max-w-4xl py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Platform Integrations</h1>
                    <p className="text-gray-600 mt-2">
                        Connect your SEO AI Agent to external platforms like WordPress, Shopify, or Wix.
                    </p>
                </div>

                <Tabs defaultValue="wordpress" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="wordpress" onClick={() => setPlatform('wordpress')}>WordPress</TabsTrigger>
                        <TabsTrigger value="shopify" onClick={() => setPlatform('shopify')}>Shopify</TabsTrigger>
                        <TabsTrigger value="wix" onClick={() => setPlatform('wix')}>Wix</TabsTrigger>
                    </TabsList>

                    {/* WordPress Integration Tab */}
                    <TabsContent value="wordpress">
                        <Card className="max-w-2xl mx-auto">
                            <CardHeader>
                                <CardTitle className="text-gray-900">WordPress Connection</CardTitle>
                                <CardDescription className="text-gray-600">
                                    Generate a unique API Key to connect your WordPress site.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleConnect} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="domain" className="text-gray-900">WordPress Site URL</Label>
                                        <Input
                                            id="domain"
                                            placeholder="e.g. example.com"
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            required
                                            className="bg-white text-gray-900"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Enter the domain without http:// or https://
                                        </p>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? 'Generating Key...' : 'Generate API Key'}
                                    </Button>
                                </form>

                                {result && (
                                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                                        <h4 className="font-semibold text-green-800 mb-3">Connection Created!</h4>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-green-700">Website:</Label>
                                                <div className="p-3 bg-white rounded border border-green-200">
                                                    <p className="font-mono text-sm text-gray-900">{domain}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-green-700">Your API Key:</Label>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 p-3 bg-white rounded border border-green-200">
                                                        <code className="font-mono text-sm text-gray-900 break-all">
                                                            {result.api_key}
                                                        </code>
                                                    </div>
                                                    <Button size="icon" variant="outline" onClick={copyToClipboard} className="flex-shrink-0">
                                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                                <p className="text-sm text-blue-800">
                                                    <strong>Next:</strong> Install the SEO AI Agent plugin on your WordPress site, then click on <strong>SEO AI Agent</strong> in the admin sidebar and paste this API Key.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Shopify Tab Placeholder */}
                    <TabsContent value="shopify">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-12">
                                    <h3 className="text-lg font-medium text-gray-900">Shopify App Integration</h3>
                                    <p className="text-gray-600 mt-2">Coming Soon. Allows installation via Shopify App Store.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Wix Tab Placeholder */}
                    <TabsContent value="wix">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-12">
                                    <h3 className="text-lg font-medium text-gray-900">Wix App Integration</h3>
                                    <p className="text-gray-600 mt-2">Coming Soon. Allows installation via Wix App Market.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default PlatformConnect;
