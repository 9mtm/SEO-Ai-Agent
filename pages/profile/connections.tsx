import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { toast, Toaster } from 'react-hot-toast';
import { Save, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { useFetchDomains } from '../../services/domains';

const ConnectionsPage: NextPage = () => {
    const router = useRouter();
    const { data: domainsData } = useFetchDomains(router);
    const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // AI Keys State
    const [apiKeys, setApiKeys] = useState({
        perplexity: '',
        gemini: '',
        claude: '',
        chatgpt: ''
    });


    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    // Fetch User Data including keys
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/user', {
                    headers: getAuthHeaders()
                });
                const data = await response.json();

                if (data.success && data.user) {
                    // If api keys exist in user data, populate state
                    if (data.user.ai_api_keys) {
                        setApiKeys({
                            perplexity: data.user.ai_api_keys.perplexity || '',
                            gemini: data.user.ai_api_keys.gemini || '',
                            claude: data.user.ai_api_keys.claude || '',
                            chatgpt: data.user.ai_api_keys.chatgpt || ''
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                toast.error('Failed to load settings');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);


    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/user', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ai_api_keys: apiKeys
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('API Keys saved successfully');
            } else {
                throw new Error(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save API keys');
        } finally {
            setIsSaving(false);
        }
    };


    // Translations
    const translations = {
        en: {
            title: 'AI Connections',
            description: 'Connect your AI accounts by adding your API keys.',
            connectTitle: 'Connect AI Providers',
            connectDesc: 'Enter your API keys to enable AI features powered by these providers.',
            save: 'Save Connections',
            saving: 'Saving...'
        },
        de: {
            title: 'KI-Verbindungen',
            description: 'Verbinden Sie Ihre KI-Konten, indem Sie Ihre API-Schlüssel hinzufügen.',
            connectTitle: 'KI-Anbieter verbinden',
            connectDesc: 'Geben Sie Ihre API-Schlüssel ein, um KI-Funktionen dieser Anbieter zu aktivieren.',
            save: 'Verbindungen speichern',
            saving: 'Speichern...'
        }
    };

    const t = translations[selectedLang];

    const providers = [
        {
            id: 'perplexity',
            name: 'Perplexity AI',
            icon: '/icon/perplexity-logo.svg',
            placeholder: 'pplx-xxxxxxxxxxxxxxxxxxxxxx',
            link: 'https://www.perplexity.ai/settings/api?ref=seo-agent.net'
        },
        {
            id: 'gemini',
            name: 'Google Gemini',
            icon: '/icon/gemini-logo.svg',
            placeholder: 'AIzaSy...',
            link: 'https://aistudio.google.com/app/apikey'
        },
        {
            id: 'claude',
            name: 'Anthropic Claude',
            icon: '/icon/claude-logo.svg',
            placeholder: 'sk-ant-api03-...',
            link: 'https://console.anthropic.com/settings/keys?ref=seo-agent.net'
        },
        {
            id: 'chatgpt',
            name: 'OpenAI ChatGPT',
            icon: '/icon/chatgpt-logo.svg',
            placeholder: 'sk-...',
            link: 'https://platform.openai.com/api-keys?ref=seo-agent.net'
        }
    ];

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

                    {/* AI Connections Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.connectTitle}</CardTitle>
                        <CardDescription>{t.connectDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {providers.map((provider) => (
                            <div key={provider.id} className="grid gap-4 p-4 border rounded-lg bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all duration-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 relative flex items-center justify-center bg-white rounded-md shadow-sm border p-1">
                                            <Image
                                                src={provider.icon}
                                                alt={provider.name}
                                                width={24}
                                                height={24}
                                                className="object-contain"
                                            />
                                        </div>
                                        <Label htmlFor={provider.id} className="text-base font-medium cursor-pointer">
                                            {provider.name}
                                        </Label>
                                    </div>
                                    <a
                                        href={provider.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                                    >
                                        Get API Key <LinkIcon className="h-3 w-3" />
                                    </a>
                                </div>
                                <Input
                                    id={provider.id}
                                    type="password"
                                    value={(apiKeys as any)[provider.id]}
                                    onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                    placeholder={provider.placeholder}
                                    className="font-mono text-sm"
                                />
                            </div>
                        ))}

                        <div className="flex items-start gap-2 p-4 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-100">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p>
                                Your API keys are stored securely. We use them only to process your requests through these AI providers.
                                Usage is billed directly by the respective providers.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t bg-gray-50/50 p-4">
                        <Button onClick={handleSave} disabled={isSaving || isLoading} className="min-w-[150px]">
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t.saving}
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {t.save}
                                </>
                            )}
                        </Button>
                    </CardFooter>
                    </Card>
            </div>
            <Toaster position="bottom-right" />
        </DashboardLayout>
    );
};

export default ConnectionsPage;
