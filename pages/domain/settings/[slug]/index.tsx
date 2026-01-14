import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Save, Settings, Info, Briefcase, FileText, Plus, X, Globe, Link2, CheckCircle, Target, Zap, Flag } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { useFetchDomains, useDeleteDomain } from '../../../../services/domains';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const DomainSettingsPage: NextPage = () => {
    const router = useRouter();
    const { data: domainsData, refetch } = useFetchDomains(router);
    const [activeDomain, setActiveDomain] = useState<DomainType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'danger'>('general');

    // General Form States
    const [businessName, setBusinessName] = useState('');
    const [niche, setNiche] = useState('');
    const [description, setDescription] = useState('');

    // Competitors State
    const [competitors, setCompetitors] = useState<string[]>([]);
    const [newCompetitor, setNewCompetitor] = useState('');

    // Focus Keywords State
    const [focusKeywords, setFocusKeywords] = useState<{ high: string[], medium: string[], low: string[] }>({
        high: ['', '', ''],
        medium: ['', '', ''],
        low: ['', '', '']
    });

    // Integration States
    const [integrationType, setIntegrationType] = useState<string | null>(null);
    const [wpUrl, setWpUrl] = useState('');
    const [wpUsername, setWpUsername] = useState('');
    const [wpAppPassword, setWpAppPassword] = useState('');

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const { mutate: deleteDomainMutate, isPending: isDeleting } = useDeleteDomain(() => {
        router.push('/');
    });

    useEffect(() => {
        if (domainsData?.domains && router.query.slug) {
            const found = domainsData.domains.find((d: DomainType) => d.slug === router.query.slug);
            if (found) {
                setActiveDomain(found);
                setBusinessName(found.business_name || '');
                setNiche(found.niche || '');
                setDescription(found.description || '');
                setCompetitors(Array.isArray(found.competitors) ? found.competitors : []);

                // Load Focus Keywords
                if (found.focus_keywords) {
                    setFocusKeywords({
                        high: [
                            found.focus_keywords.high?.[0] || '',
                            found.focus_keywords.high?.[1] || '',
                            found.focus_keywords.high?.[2] || ''
                        ],
                        medium: [
                            found.focus_keywords.medium?.[0] || '',
                            found.focus_keywords.medium?.[1] || '',
                            found.focus_keywords.medium?.[2] || ''
                        ],
                        low: [
                            found.focus_keywords.low?.[0] || '',
                            found.focus_keywords.low?.[1] || '',
                            found.focus_keywords.low?.[2] || ''
                        ]
                    });
                }

                // Load integration settings
                const intSettings = found.integration_settings;
                if (intSettings && intSettings.type) {
                    setIntegrationType(intSettings.type);
                    if (intSettings.type === 'wordpress') {
                        setWpUrl(intSettings.url || '');
                        setWpUsername(intSettings.username || '');
                        setWpAppPassword(intSettings.app_password || '');
                    }
                }
            }
        }
    }, [domainsData, router.query.slug]);

    const handleFocusKeywordChange = (level: 'high' | 'medium' | 'low', index: number, value: string) => {
        setFocusKeywords(prev => {
            const newList = [...prev[level]];
            newList[index] = value;
            return { ...prev, [level]: newList };
        });
    };

    const handleDeleteDomain = () => {
        if (!activeDomain) return;

        if (deleteConfirmation !== activeDomain.domain) {
            toast.error('Please type the domain name correctly to confirm deletion');
            return;
        }

        deleteDomainMutate(activeDomain);
    };

    const handleSave = async () => {
        if (!activeDomain) return;
        setIsLoading(true);

        const integrationPayload = integrationType === 'wordpress' ? {
            type: 'wordpress',
            url: wpUrl,
            username: wpUsername,
            app_password: wpAppPassword
        } : (integrationType ? { type: integrationType } : null);

        // Filter out empty strings for storage
        const cleanFocusKeywords = {
            high: focusKeywords.high.filter(k => k.trim() !== ''),
            medium: focusKeywords.medium.filter(k => k.trim() !== ''),
            low: focusKeywords.low.filter(k => k.trim() !== '')
        };

        try {
            const res = await fetch(`/api/domains?domain=${activeDomain.domain}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_name: businessName,
                    niche: niche,
                    description: description,
                    competitors: competitors,
                    integration_settings: integrationPayload,
                    focus_keywords: cleanFocusKeywords
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Settings updated successfully', { icon: '✔️' });
                refetch();
            } else {
                toast.error(data.error || 'Failed to update settings');
            }
        } catch (e) {
            toast.error('An error occurred');
            console.error(e);
        }
        setIsLoading(false);
    };

    const addCompetitor = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = newCompetitor.trim();
        if (!trimmed) return;

        if (competitors.includes(trimmed)) {
            toast.error('Competitor already added');
            return;
        }

        setCompetitors([...competitors, trimmed]);
        setNewCompetitor('');
    };

    const removeCompetitor = (compToRemove: string) => {
        setCompetitors(competitors.filter(c => c !== compToRemove));
    };

    return (
        <DashboardLayout domains={domainsData?.domains || []}>
            <Head>
                <title>Settings - {activeDomain?.domain || 'SEO AI Agent'}</title>
            </Head>

            <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 mb-8">
                    <Settings className="h-6 w-6 text-neutral-600" />
                    <h1 className="text-2xl font-bold text-neutral-900">Domain Settings</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sub-Sidebar */}
                    <div className="lg:col-span-3 space-y-1">
                        <h3 className="font-semibold text-neutral-900 mb-2 px-1">My App</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'general'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-neutral-600 hover:bg-neutral-100'
                                    }`}
                            >
                                General
                            </button>
                            <button
                                onClick={() => setActiveTab('integrations')}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'integrations'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-neutral-600 hover:bg-neutral-100'
                                    }`}
                            >
                                Integrations
                            </button>
                            <button
                                onClick={() => setActiveTab('danger')}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'danger'
                                    ? 'bg-red-50 text-red-700'
                                    : 'text-neutral-600 hover:bg-neutral-100'
                                    }`}
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9 space-y-8">
                        {activeTab === 'general' && (
                            <>
                                {/* General Info Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>General Information</CardTitle>
                                        <CardDescription>
                                            Update your domain's business information and niche details.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="businessName">Business Name</Label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="businessName"
                                                    placeholder="e.g. My Awesome Company"
                                                    value={businessName}
                                                    onChange={(e) => setBusinessName(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">The official name of your business or brand.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="niche">Niche / Industry</Label>
                                            <div className="relative">
                                                <Info className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="niche"
                                                    placeholder="e.g. Digital Marketing, E-commerce, Local Plumbing"
                                                    value={niche}
                                                    onChange={(e) => setNiche(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">The primary industry or topic of your website.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Business Description</Label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Textarea
                                                    id="description"
                                                    placeholder="Briefly describe what your business does..."
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="pl-9 min-h-[100px]"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">A short description used for AI context generation.</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Focus Keywords Strategy Card */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Target className="h-5 w-5 text-blue-600" />
                                            <CardTitle>Target Keywords Strategy</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Define up to 9 focus keywords ranked by importance. These guide your SEO strategy for the next 6 months.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-8">
                                        {/* High Priority */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-red-100 rounded-md">
                                                    <Zap className="h-4 w-4 text-red-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-neutral-900">High Importance (Top 3)</h4>
                                                    <p className="text-xs text-neutral-500">Critical keywords you must dominate to drive core business.</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[0, 1, 2].map((i) => (
                                                    <Input
                                                        key={`high-${i}`}
                                                        placeholder={`Priority Keyword #${i + 1}`}
                                                        value={focusKeywords.high[i]}
                                                        onChange={(e) => handleFocusKeywordChange('high', i, e.target.value)}
                                                        className="border-red-200 focus-visible:ring-red-500"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Medium Priority */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-yellow-100 rounded-md">
                                                    <Flag className="h-4 w-4 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-neutral-900">Medium Importance</h4>
                                                    <p className="text-xs text-neutral-500">Important keywords that support your main services.</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[0, 1, 2].map((i) => (
                                                    <Input
                                                        key={`medium-${i}`}
                                                        placeholder={`Keyword #${i + 1}`}
                                                        value={focusKeywords.medium[i]}
                                                        onChange={(e) => handleFocusKeywordChange('medium', i, e.target.value)}
                                                        className="border-yellow-200 focus-visible:ring-yellow-500"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Low Priority */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-100 rounded-md">
                                                    <Flag className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-neutral-900">Low Importance</h4>
                                                    <p className="text-xs text-neutral-500">Long-tail or future opportunity keywords.</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[0, 1, 2].map((i) => (
                                                    <Input
                                                        key={`low-${i}`}
                                                        placeholder={`Keyword #${i + 1}`}
                                                        value={focusKeywords.low[i]}
                                                        onChange={(e) => handleFocusKeywordChange('low', i, e.target.value)}
                                                        className="border-blue-200 focus-visible:ring-blue-500"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Competitors Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Competitors</CardTitle>
                                        <CardDescription>
                                            Track your competitors to benchmark your performance.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <form onSubmit={addCompetitor} className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    placeholder="e.g. competitor.com"
                                                    value={newCompetitor}
                                                    onChange={(e) => setNewCompetitor(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                            <Button type="submit" variant="outline" className="gap-2">
                                                <Plus className="h-4 w-4" />
                                                Add
                                            </Button>
                                        </form>

                                        <div className="space-y-2">
                                            <Label>Tracked Competitors</Label>
                                            <div className="bg-neutral-50 rounded-lg p-4 min-h-[100px] border border-neutral-200">
                                                {!Array.isArray(competitors) || competitors.length === 0 ? (
                                                    <p className="text-sm text-neutral-400 text-center py-4">No competitors added yet.</p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {competitors.map((comp, idx) => (
                                                            <Badge key={idx} variant="secondary" className="px-3 py-1.5 gap-2 text-sm font-normal bg-white border-neutral-200 shadow-sm">
                                                                {comp}
                                                                <button
                                                                    onClick={() => removeCompetitor(comp)}
                                                                    className="text-neutral-400 hover:text-red-500 transition-colors"
                                                                    title="Remove competitor"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex justify-end pt-4 pb-4">
                                    <Button onClick={handleSave} disabled={isLoading} size="lg" className="gap-2 min-w-[150px]">
                                        <Save className="h-4 w-4" />
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </>
                        )}

                        {activeTab === 'integrations' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>CMS Integrations</CardTitle>
                                    <CardDescription>
                                        Connect your website CMS to enable auto-blogging features.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div
                                            className={`border rounded-lg p-4 cursor-pointer transition-all ${integrationType === 'wordpress' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-neutral-200 hover:border-blue-300'}`}
                                            onClick={() => setIntegrationType('wordpress')}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 flex items-center justify-center">
                                                        <img src="/icon/platfourms/wordPress_blue_logo.svg" alt="WordPress" className="w-8 h-8" />
                                                    </div>
                                                    <h3 className="font-semibold">WordPress</h3>
                                                </div>
                                                {integrationType === 'wordpress' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                                            </div>
                                            <p className="text-sm text-neutral-600">Connect your self-hosted WordPress site using Application Passwords.</p>
                                        </div>

                                        <div
                                            className={`border rounded-lg p-4 cursor-pointer transition-all opacity-60`}
                                            title="Coming Soon"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 flex items-center justify-center">
                                                        <img src="/icon/platfourms/shopify-icon.svg" alt="Shopify" className="w-8 h-8" />
                                                    </div>
                                                    <h3 className="font-semibold">Shopify</h3>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">Soon</Badge>
                                            </div>
                                            <p className="text-sm text-neutral-600">Connect your Shopify store using Access Tokens.</p>
                                        </div>

                                        <div
                                            className={`border rounded-lg p-4 cursor-default transition-all bg-neutral-50`}
                                            title="Coming Soon"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 flex items-center justify-center">
                                                        <img src="/icon/platfourms/webflow.svg" alt="Webflow" className="w-8 h-8" />
                                                    </div>
                                                    <h3 className="font-semibold">Webflow</h3>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">Soon</Badge>
                                            </div>
                                            <p className="text-sm text-neutral-600">Connect your Webflow site seamlessly.</p>
                                        </div>

                                        <div
                                            className={`border rounded-lg p-4 cursor-default transition-all bg-neutral-50`}
                                            title="Coming Soon"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 flex items-center justify-center">
                                                        <img src="/icon/platfourms/wix.com_website_logo.svg" alt="Wix" className="w-8 h-8" />
                                                    </div>
                                                    <h3 className="font-semibold">Wix</h3>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">Soon</Badge>
                                            </div>
                                            <p className="text-sm text-neutral-600">Connect your Wix website easily.</p>
                                        </div>
                                    </div>

                                    {integrationType === 'wordpress' && (
                                        <div className="space-y-4 pt-4 border-t border-neutral-100">
                                            <h4 className="font-medium flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                WordPress Settings
                                            </h4>

                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <Label>Website URL</Label>
                                                    <Input
                                                        placeholder="https://yourwebsite.com"
                                                        value={wpUrl}
                                                        onChange={(e) => setWpUrl(e.target.value)}
                                                    />
                                                    <p className="text-xs text-neutral-500">The full URL of your WordPress site.</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Username</Label>
                                                    <Input
                                                        placeholder="admin"
                                                        value={wpUsername}
                                                        onChange={(e) => setWpUsername(e.target.value)}
                                                    />
                                                    <p className="text-xs text-neutral-500">Your WordPress username (not email).</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Application Password</Label>
                                                    <Input
                                                        type="password"
                                                        placeholder="xxxx xxxx xxxx xxxx"
                                                        value={wpAppPassword}
                                                        onChange={(e) => setWpAppPassword(e.target.value)}
                                                    />
                                                    <p className="text-xs text-neutral-500">
                                                        Create this in WP Admin &gt; Users &gt; Profile &gt; Application Passwords.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-neutral-50 border-t border-neutral-100 py-4 flex justify-end">
                                    <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        Save Integration
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {activeTab === 'danger' && (
                            <Card className="border-red-200">
                                <CardHeader>
                                    <CardTitle className="text-red-600">Delete Site</CardTitle>
                                    <CardDescription>
                                        Irreversible actions for your site.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-100">
                                        <div>
                                            <h4 className="font-semibold text-red-900">Delete Site</h4>
                                            <p className="text-sm text-red-700 mb-2">
                                                Permanently remove this site and all its data. This action cannot be undone.
                                            </p>
                                            <p className="text-sm text-red-700 font-medium">
                                                Please type <span className="font-mono bg-red-100 px-1 rounded select-all">{activeDomain?.domain}</span> to confirm.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder={activeDomain?.domain}
                                                value={deleteConfirmation}
                                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                                className="bg-white border-red-200 focus-visible:ring-red-500"
                                            />
                                            <Button
                                                variant="destructive"
                                                onClick={handleDeleteDomain}
                                                disabled={isDeleting || deleteConfirmation !== activeDomain?.domain}
                                            >
                                                {isDeleting ? 'Deleting...' : 'Delete Site'}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
            <Toaster position="bottom-right" />
        </DashboardLayout>
    );
};

export default DomainSettingsPage;
