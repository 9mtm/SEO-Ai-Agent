import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, Toaster } from 'react-hot-toast';
export { getServerSideProps } from '../../utils/ownerOnlyPage';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useFetchDomains } from '../../services/domains';

const SearchConsolePage: NextPage = () => {
    const router = useRouter();
    const { data: domainsData } = useFetchDomains(router);
    const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
    const [isLoading, setIsLoading] = useState(true);
    const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

    // Google Search Console States
    const [settings, setSettings] = useState<any>({ google_connected: false });
    // Bing Webmaster Tools States
    const [bingConnected, setBingConnected] = useState(false);
    const [showBingDisconnectDialog, setShowBingDisconnectDialog] = useState(false);

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    // Fetch settings for Google Search Console + Bing
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings', {
                    headers: getAuthHeaders()
                });
                const data = await res.json();
                if (data.settings) {
                    setSettings(data.settings);
                    setBingConnected(!!data.settings.bing_connected);
                }
            } catch (e) {
                console.error('Failed to fetch settings', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // Check URL params for Bing connection success/error
    useEffect(() => {
        if (router.query.success === 'bing_connected') {
            toast.success('Bing Webmaster Tools connected successfully!');
            setBingConnected(true);
            router.replace('/profile/search-console', undefined, { shallow: true });
        }
        if (router.query.error === 'bing_auth_failed' || router.query.error === 'bing_callback_failed') {
            toast.error('Failed to connect Bing Webmaster Tools. Please try again.');
            router.replace('/profile/search-console', undefined, { shallow: true });
        }
    }, [router.query]);



    const disconnectGoogle = () => {
        setShowDisconnectDialog(true);
    };

    const confirmDisconnect = async () => {
        try {
            await fetch('/api/auth/google/disconnect', {
                method: 'POST',
                headers: getAuthHeaders()
            });
            window.location.reload();
        } catch (e) {
            toast.error('Failed to disconnect');
        } finally {
            setShowDisconnectDialog(false);
        }
    };

    const confirmBingDisconnect = async () => {
        try {
            await fetch('/api/auth/microsoft/disconnect', {
                method: 'POST',
                headers: getAuthHeaders()
            });
            setBingConnected(false);
            toast.success('Bing account disconnected');
        } catch (e) {
            toast.error('Failed to disconnect Bing');
        } finally {
            setShowBingDisconnectDialog(false);
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
                                    onClick={() => window.location.href = '/api/auth/google/connect'}
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


                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bing Webmaster Tools Card */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Bing Webmaster Tools</CardTitle>
                        <CardDescription>
                            Connect your Microsoft account to access Bing &amp; Yahoo search analytics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!bingConnected ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <div className="bg-neutral-100 p-4 rounded-full">
                                    <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 3v16.5l4.5 2.5V8l5 3.5-4.5 2.5v4l9-5.5L10 7V2L5 3z" fill="#00897B"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold">Connect Bing Webmaster Tools</h3>
                                <p className="text-neutral-500 max-w-sm">
                                    Link your Microsoft account to track Bing &amp; Yahoo keyword rankings, impressions, and clicks.
                                </p>
                                <Button
                                    onClick={() => window.location.href = '/api/auth/microsoft/connect'}
                                    size="lg"
                                    className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                                >
                                    Connect Bing
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                                            <path d="M5 3v16.5l4.5 2.5V8l5 3.5-4.5 2.5v4l9-5.5L10 7V2L5 3z" fill="#00897B"/>
                                        </svg>
                                        <div>
                                            <h4 className="font-medium text-green-900">Bing Account Connected</h4>
                                            <p className="text-sm text-green-700">Bing &amp; Yahoo analytics are available on your domain insight pages.</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setShowBingDisconnectDialog(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        Disconnect
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Disconnect Confirmation Dialog */}
            <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disconnect Google Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to disconnect your Google Account? This will stop automatic sitemap imports and analytics tracking.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDisconnect}>Disconnect</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bing Disconnect Confirmation Dialog */}
            <Dialog open={showBingDisconnectDialog} onOpenChange={setShowBingDisconnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disconnect Bing Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to disconnect Bing Webmaster Tools? Bing &amp; Yahoo analytics will no longer be available.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBingDisconnectDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmBingDisconnect}>Disconnect</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster position="bottom-right" />
        </DashboardLayout>
    );
};

export default SearchConsolePage;
