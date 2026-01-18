import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, Toaster } from 'react-hot-toast';
import { Loader2, Globe, Download } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useFetchDomains } from '../../services/domains';

const SearchConsolePage: NextPage = () => {
    const router = useRouter();
    const { data: domainsData } = useFetchDomains(router);
    const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
    const [isLoading, setIsLoading] = useState(true);

    // Google Search Console States
    const [sites, setSites] = useState<any[]>([]);
    const [loadingSites, setLoadingSites] = useState(false);
    const [settings, setSettings] = useState<any>({ google_connected: false });

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    // Fetch settings for Google Search Console
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings', {
                    headers: getAuthHeaders()
                });
                const data = await res.json();
                if (data.settings) {
                    setSettings(data.settings);
                }
            } catch (e) {
                console.error('Failed to fetch settings', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // Auto-fetch sites when Google is connected
    useEffect(() => {
        if (settings.google_connected && sites.length === 0 && !loadingSites) {
            fetchSites();
        }
    }, [settings.google_connected]);

    const disconnectGoogle = async () => {
        if (confirm('Are you sure you want to disconnect your Google Account?')) {
            try {
                await fetch('/api/auth/google/disconnect', {
                    method: 'POST',
                    headers: getAuthHeaders()
                });
                window.location.reload();
            } catch (e) {
                toast.error('Failed to disconnect');
            }
        }
    };

    const fetchSites = async () => {
        setLoadingSites(true);
        try {
            const res = await fetch('/api/gsc/sites', {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.sites) {
                // Filter out sc-domain sites to avoid duplicates
                const filteredSites = data.sites.filter((site: any) =>
                    !site.siteUrl.startsWith('sc-domain:')
                );
                setSites(filteredSites);
            } else {
                toast.error('No sites found or error fetching sites.');
            }
        } catch (e) {
            toast.error('Error fetching sites');
        } finally {
            setLoadingSites(false);
        }
    };

    const importSite = async (siteUrl: string) => {
        try {
            const res = await fetch('/api/domains', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ domains: [siteUrl] })
            });
            if (res.ok) {
                toast.success(`Imported ${siteUrl}`);
                router.push('/domains');
            } else {
                toast.error('Failed to import site');
            }
        } catch (e) {
            toast.error('Error importing site');
        }
    };

    // Translations
    const translations = {
        en: {
            title: 'Google Search Console',
            description: 'Connect and manage your Google Search Console account to import domains and track performance.',
        },
        de: {
            title: 'Google Search Console',
            description: 'Verbinden und verwalten Sie Ihr Google Search Console-Konto, um Domains zu importieren und die Leistung zu verfolgen.',
        }
    };

    const t = translations[selectedLang];

    return (
        <DashboardLayout selectedLang={selectedLang} onLanguageChange={setSelectedLang} domains={domainsData?.domains || []}>
            <Head>
                <title>{t.title} - SEO AI Agent</title>
            </Head>

            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t.title}</h1>
                    <p className="text-neutral-600">{t.description}</p>
                </div>

                    {/* Google Search Console Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Google Search Console</CardTitle>
                        <CardDescription>
                            Connect your Google Search Console account to import sitemaps and track performance.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!settings.google_connected ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <div className="bg-neutral-100 p-4 rounded-full">
                                    <img src="/icon/google-logo.svg" alt="Google" className="h-12 w-12" />
                                </div>
                                <h3 className="text-lg font-semibold">Connect Google Account</h3>
                                <p className="text-neutral-500 max-w-sm">
                                    Link your Google account to access your Search Console properties directly.
                                </p>
                                <Button
                                    onClick={() => window.location.href = '/api/auth/google'}
                                    size="lg"
                                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Connect Google
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src="/icon/google-logo.svg" alt="Google" className="h-6 w-6" />
                                        <div>
                                            <h4 className="font-medium text-green-900">Google Account Connected</h4>
                                            <p className="text-sm text-green-700">You can now import sites from Search Console.</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={disconnectGoogle} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        Disconnect
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg">Your Search Console Sites</h3>
                                        <Button variant="outline" size="sm" onClick={fetchSites} disabled={loadingSites}>
                                            {loadingSites ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh List'}
                                        </Button>
                                    </div>

                                    {loadingSites ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                                        </div>
                                    ) : sites.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
                                            <p className="text-neutral-500">No sites found in your Search Console account.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {sites.map((site) => (
                                                <div key={site.siteUrl} className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-lg hover:shadow-sm transition-shadow">
                                                    <div className="flex items-center gap-3">
                                                        <Globe className="h-5 w-5 text-neutral-400" />
                                                        <div className="font-medium">{site.siteUrl}</div>
                                                    </div>
                                                    <Button size="sm" variant="secondary" onClick={() => importSite(site.siteUrl)}>
                                                        Import
                                                        <Download className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    </Card>
            </div>
            <Toaster position="bottom-right" />
        </DashboardLayout>
    );
};

export default SearchConsolePage;
