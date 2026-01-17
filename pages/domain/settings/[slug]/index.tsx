import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Save, Settings, Info, Briefcase, FileText, Plus, X, Globe, Link2, CheckCircle, Target, Zap, Flag, Plug, Download, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { useFetchDomains, useDeleteDomain } from '../../../../services/domains';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import SelectField from '../../../../components/common/SelectField';
import countries from '../../../../utils/countries';
import { useLanguage } from '../../../../context/LanguageContext';

const DomainSettingsPage: NextPage = () => {
    const router = useRouter();
    const { t } = useLanguage();
    const { data: domainsData, refetch } = useFetchDomains(router);
    const [activeDomain, setActiveDomain] = useState<DomainType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'search_console' | 'danger'>('general');

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

    const [targetCountry, setTargetCountry] = useState('US');

    // Integration States
    const [integrationType, setIntegrationType] = useState<string | null>(null);
    const [wpUrl, setWpUrl] = useState('');
    const [wpUsername, setWpUsername] = useState('');
    const [wpAppPassword, setWpAppPassword] = useState('');

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    // Google Search Console States
    const [sites, setSites] = useState<any[]>([]);
    const [loadingSites, setLoadingSites] = useState(false);
    const [settings, setSettings] = useState<any>({ google_connected: false });

    // Categories State
    const [categories, setCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    const { mutate: deleteDomainMutate, isPending: isDeleting } = useDeleteDomain(() => {
        // Navigation is handled inside useDeleteDomain
    });

    useEffect(() => {
        if (domainsData?.domains && router.query.slug) {
            const found = domainsData.domains.find((d: DomainType) => d.slug === router.query.slug);
            if (found) {
                setActiveDomain(found);
                setBusinessName(found.business_name || '');
                setNiche(found.niche || '');
                setDescription(found.description || '');
                setTargetCountry(found.target_country || 'US');
                console.log('[DEBUG] Loaded domain data:', found);

                let loadedCompetitors: string[] = [];
                if (Array.isArray(found.competitors)) {
                    loadedCompetitors = found.competitors;
                } else if (typeof found.competitors === 'string') {
                    try {
                        // Attempt to parse if it's a JSON string
                        const parsed = JSON.parse(found.competitors);
                        if (Array.isArray(parsed)) loadedCompetitors = parsed;
                    } catch (e) {
                        console.error('[DEBUG] Failed to parse competitors JSON:', e);
                    }
                }

                setCompetitors(loadedCompetitors);

                // Load Focus Keywords
                let loadedFocusKeywords: any = found.focus_keywords;

                if (typeof loadedFocusKeywords === 'string') {
                    try {
                        loadedFocusKeywords = JSON.parse(loadedFocusKeywords);
                    } catch (e) {
                        console.error('[DEBUG] Failed to parse focus_keywords JSON:', e);
                        loadedFocusKeywords = null;
                    }
                }

                if (loadedFocusKeywords) {
                    setFocusKeywords({
                        high: [
                            loadedFocusKeywords.high?.[0] || '',
                            loadedFocusKeywords.high?.[1] || '',
                            loadedFocusKeywords.high?.[2] || ''
                        ],
                        medium: [
                            loadedFocusKeywords.medium?.[0] || '',
                            loadedFocusKeywords.medium?.[1] || '',
                            loadedFocusKeywords.medium?.[2] || ''
                        ],
                        low: [
                            loadedFocusKeywords.low?.[0] || '',
                            loadedFocusKeywords.low?.[1] || '',
                            loadedFocusKeywords.low?.[2] || ''
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

        console.log('[DEBUG] Saving focus_keywords:', cleanFocusKeywords);

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
                    focus_keywords: cleanFocusKeywords,
                    target_country: targetCountry
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
            toast.error(t('domainSettings.competitors.exists'));
            return;
        }

        setCompetitors([...competitors, trimmed]);
        setNewCompetitor('');
    };

    const removeCompetitor = (compToRemove: string) => {
        setCompetitors(competitors.filter(c => c !== compToRemove));
    };

    // Fetch settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.settings) {
                    setSettings(data.settings);
                }
            } catch (e) {
                console.error('Failed to fetch settings', e);
            }
        };
        fetchSettings();
    }, []);

    // Sync activeTab with URL query parameter
    useEffect(() => {
        const tab = router.query.tab as string;
        if (tab && ['general', 'integrations', 'search_console', 'danger'].includes(tab)) {
            setActiveTab(tab as 'general' | 'integrations' | 'search_console' | 'danger');
        }
    }, [router.query.tab]);

    // Update URL when tab changes
    const handleTabChange = (tab: 'general' | 'integrations' | 'search_console' | 'danger') => {
        setActiveTab(tab);
        router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, tab }
            },
            undefined,
            { shallow: true }
        );
    };

    // Auto-fetch sites when Google is connected
    useEffect(() => {
        if (settings.google_connected && sites.length === 0 && !loadingSites) {
            fetchSites();
        }
    }, [settings.google_connected]);

    const disconnectGoogle = async () => {
        if (confirm('Are you sure you want to disconnect your Google Account?')) {
            try {
                await fetch('/api/auth/google/disconnect', { method: 'POST' });
                window.location.reload();
            } catch (e) {
                toast.error('Failed to disconnect');
            }
        }
    };

    const fetchSites = async () => {
        setLoadingSites(true);
        try {
            const res = await fetch('/api/gsc/sites');
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
                headers: { 'Content-Type': 'application/json' },
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

    return (
        <DashboardLayout domains={domainsData?.domains || []}>
            <Head>
                <title>{t('domainSettings.title')} - {activeDomain?.domain || 'SEO AI Agent'}</title>
            </Head>

            <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 mb-8">
                    <Settings className="h-6 w-6 text-neutral-600" />
                    <h1 className="text-2xl font-bold text-neutral-900">{t('domainSettings.title')}</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sub-Sidebar */}
                    <div className="lg:col-span-3 space-y-1">
                        <h3 className="font-semibold text-neutral-900 mb-2 px-1">{t('domainSettings.myApp')}</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleTabChange('general')}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'general'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-neutral-600 hover:bg-neutral-100'
                                    }`}
                            >
                                {t('domainSettings.tabs.general')}
                            </button>
                            <button
                                onClick={() => handleTabChange('integrations')}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'integrations'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-neutral-600 hover:bg-neutral-100'
                                    }`}
                            >
                                {t('domainSettings.tabs.integrations')}
                            </button>
                            <button
                                onClick={() => handleTabChange('search_console')}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'search_console'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-neutral-600 hover:bg-neutral-100'
                                    }`}
                            >
                                {t('domainSettings.tabs.searchConsole')}
                            </button>
                            <button
                                onClick={() => handleTabChange('danger')}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'danger'
                                    ? 'bg-red-50 text-red-700'
                                    : 'text-neutral-600 hover:bg-neutral-100'
                                    }`}
                            >
                                {t('domainSettings.tabs.delete')}
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
                                        <CardTitle>{t('domainSettings.general.cardTitle')}</CardTitle>
                                        <CardDescription>
                                            {t('domainSettings.general.cardDesc')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="businessName">{t('domainSettings.general.businessName')}</Label>
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
                                            <p className="text-xs text-muted-foreground">{t('domainSettings.general.businessNameDesc')}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="niche">{t('domainSettings.general.niche')}</Label>
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
                                            <p className="text-xs text-muted-foreground">{t('domainSettings.general.nicheDesc')}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">{t('domainSettings.general.description')}</Label>
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
                                            <p className="text-xs text-muted-foreground">{t('domainSettings.general.descriptionDesc')}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Focus Keywords Strategy Card */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Target className="h-5 w-5 text-blue-600" />
                                                <CardTitle>{t('domainSettings.strategy.cardTitle')}</CardTitle>
                                            </div>

                                            {/* Country Selector */}
                                            <div className="w-48">
                                                <div className="flex items-center gap-2 mb-1 justify-end">
                                                    <Globe size={14} className="text-gray-500" />
                                                    <span className="text-xs font-medium text-gray-500">{t('domainSettings.strategy.country')}</span>
                                                </div>
                                                <SelectField
                                                    multiple={false}
                                                    selected={[targetCountry]}
                                                    options={Object.keys(countries).map((countryISO: string) => ({
                                                        label: countries[countryISO][0],
                                                        value: countryISO
                                                    }))}
                                                    defaultLabel={t('domainSettings.strategy.allCountries')}
                                                    updateField={(updated: string[]) => setTargetCountry(updated[0])}
                                                    rounded='rounded-lg'
                                                    maxHeight={48}
                                                    flags={true}
                                                />
                                            </div>
                                        </div>
                                        <CardDescription>
                                            {t('domainSettings.strategy.cardDesc')}
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
                                                    <h4 className="font-semibold text-sm text-neutral-900">{t('domainSettings.strategy.high')}</h4>
                                                    <p className="text-xs text-neutral-500">{t('domainSettings.strategy.highDesc')}</p>
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
                                                    <h4 className="font-semibold text-sm text-neutral-900">{t('domainSettings.strategy.medium')}</h4>
                                                    <p className="text-xs text-neutral-500">{t('domainSettings.strategy.mediumDesc')}</p>
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
                                                    <h4 className="font-semibold text-sm text-neutral-900">{t('domainSettings.strategy.low')}</h4>
                                                    <p className="text-xs text-neutral-500">{t('domainSettings.strategy.lowDesc')}</p>
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
                                        <CardTitle>{t('domainSettings.competitors.cardTitle')}</CardTitle>
                                        <CardDescription>
                                            {t('domainSettings.competitors.cardDesc')}
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
                                                {t('domainSettings.competitors.add')}
                                            </Button>
                                        </form>

                                        <div className="space-y-2">
                                            <Label>{t('domainSettings.competitors.tracked')}</Label>
                                            <div className="bg-neutral-50 rounded-lg p-4 min-h-[100px] border border-neutral-200">
                                                {!Array.isArray(competitors) || competitors.length === 0 ? (
                                                    <p className="text-sm text-neutral-400 text-center py-4">{t('domainSettings.competitors.empty')}</p>
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
                                        {isLoading ? t('domainSettings.general.saving') : t('domainSettings.general.save')}
                                    </Button>
                                </div>
                            </>
                        )}

                        {activeTab === 'integrations' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('domainSettings.integrations.cardTitle')}</CardTitle>
                                    <CardDescription>
                                        {t('domainSettings.integrations.cardDesc')}
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
                                            <p className="text-sm text-neutral-600">{t('domainSettings.integrations.wpDesc')}</p>
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
                                                <Badge variant="secondary" className="text-xs">{t('domainSettings.integrations.comingSoon')}</Badge>
                                            </div>
                                            <p className="text-sm text-neutral-600">{t('domainSettings.integrations.shopifyDesc')}</p>
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
                                                <Badge variant="secondary" className="text-xs">{t('domainSettings.integrations.comingSoon')}</Badge>
                                            </div>
                                            <p className="text-sm text-neutral-600">{t('domainSettings.integrations.webflowDesc')}</p>
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
                                                <Badge variant="secondary" className="text-xs">{t('domainSettings.integrations.comingSoon')}</Badge>
                                            </div>
                                            <p className="text-sm text-neutral-600">{t('domainSettings.integrations.wixDesc')}</p>
                                        </div>
                                    </div>

                                    {integrationType === 'wordpress' && (
                                        <div className="space-y-4 pt-4 border-t border-neutral-100">
                                            <h4 className="font-medium flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                {t('domainSettings.integrations.settingsTitle')}
                                            </h4>

                                            {/* Help Section */}
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                <div className="flex items-start gap-3">
                                                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <h5 className="font-semibold text-blue-900 mb-2">{t('domainSettings.integrations.helpTitle')}</h5>
                                                        <div className="space-y-3 text-sm text-blue-800">
                                                            <div>
                                                                <strong className="block mb-1">{t('domainSettings.integrations.help.urlLabel')}</strong>
                                                                <p className="text-blue-700">{t('domainSettings.integrations.help.urlDesc')}</p>
                                                            </div>
                                                            <div>
                                                                <strong className="block mb-1">{t('domainSettings.integrations.help.usernameLabel')}</strong>
                                                                <p className="text-blue-700"><span dangerouslySetInnerHTML={{ __html: t('domainSettings.integrations.help.usernameDesc').replace('**', '<strong>').replace('**', '</strong>') }} /></p>
                                                            </div>
                                                            <div>
                                                                <strong className="block mb-1">{t('domainSettings.integrations.help.appPassLabel')}</strong>
                                                                <ol className="list-decimal ml-4 space-y-1 text-blue-700">
                                                                    <li>{t('domainSettings.integrations.help.appPassStep1')}</li>
                                                                    <li>{t('domainSettings.integrations.help.appPassStep2')}</li>
                                                                    <li>{t('domainSettings.integrations.help.appPassStep3')}</li>
                                                                    <li>{t('domainSettings.integrations.help.appPassStep4')}</li>
                                                                    <li>{t('domainSettings.integrations.help.appPassStep5')}</li>
                                                                </ol>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <Label>{t('domainSettings.integrations.url')}</Label>
                                                    <Input
                                                        placeholder={t('domainSettings.integrations.urlPlaceholder')}
                                                        value={wpUrl}
                                                        onChange={(e) => setWpUrl(e.target.value)}
                                                    />
                                                    <p className="text-xs text-neutral-500">{t('domainSettings.integrations.urlHelper')}</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>{t('domainSettings.integrations.username')}</Label>
                                                    <Input
                                                        placeholder={t('domainSettings.integrations.usernamePlaceholder')}
                                                        value={wpUsername}
                                                        onChange={(e) => setWpUsername(e.target.value)}
                                                    />
                                                    <p className="text-xs text-neutral-500">{t('domainSettings.integrations.usernameHelper')}</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>{t('domainSettings.integrations.appPass')}</Label>
                                                    <Input
                                                        type="password"
                                                        placeholder={t('domainSettings.integrations.appPassPlaceholder')}
                                                        value={wpAppPassword}
                                                        onChange={(e) => setWpAppPassword(e.target.value)}
                                                    />
                                                    <p className="text-xs text-neutral-500">
                                                        {t('domainSettings.integrations.appPassHelper')}
                                                    </p>
                                                </div>

                                                {/* Categories Preview */}
                                                <div className="pt-4 border-t border-neutral-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Label>{t('domainSettings.integrations.availCats')}</Label>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={async () => {
                                                                if (!wpUrl || !wpUsername || !wpAppPassword) {
                                                                    toast.error(t('domainSettings.integrations.enterCreds'));
                                                                    return;
                                                                }
                                                                setLoadingCategories(true);
                                                                try {
                                                                    const res = await fetch('/api/cms/wordpress', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            domain: activeDomain?.domain,
                                                                            action: 'get_categories',
                                                                            url: wpUrl,
                                                                            username: wpUsername,
                                                                            app_password: wpAppPassword
                                                                        })
                                                                    });
                                                                    const data = await res.json();
                                                                    if (res.ok && data.success) {
                                                                        setCategories(data.categories);
                                                                        toast.success(t('domainSettings.integrations.foundCats', { count: data.categories.length }));
                                                                    } else {
                                                                        toast.error(data.error || t('domainSettings.integrations.fetchCatsError'));
                                                                    }
                                                                } catch (e) {
                                                                    toast.error(t('domainSettings.integrations.fetchCatsError'));
                                                                }
                                                                setLoadingCategories(false);
                                                            }}
                                                            disabled={loadingCategories}
                                                            className="text-xs h-8"
                                                        >
                                                            {loadingCategories ? t('domainSettings.gsc.loading') : t('domainSettings.integrations.refreshCats')}
                                                        </Button>
                                                    </div>

                                                    <div className="bg-neutral-50 p-3 rounded-lg min-h-[60px]">
                                                        {loadingCategories ? (
                                                            <div className="flex items-center justify-center p-2">
                                                                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                                                            </div>
                                                        ) : categories.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {categories.map((cat: any) => (
                                                                    <Badge key={cat.id} variant="secondary" className="bg-white border text-neutral-600 font-normal">
                                                                        {cat.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <p className="text-xs text-neutral-400">
                                                                    {t('domainSettings.integrations.catsHelper')}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-neutral-50 border-t border-neutral-100 py-4 flex justify-between">
                                    <Button
                                        onClick={async () => {
                                            const toastId = toast.loading(t('domainSettings.integrations.testing'));
                                            try {
                                                const res = await fetch('/api/cms/wordpress', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        domain: activeDomain?.domain,
                                                        action: 'verify_credentials',
                                                        url: wpUrl,
                                                        username: wpUsername,
                                                        app_password: wpAppPassword
                                                    })
                                                });
                                                const data = await res.json();
                                                if (res.ok && data.success) {
                                                    toast.success(t('domainSettings.integrations.connected', { user: data.user.name }), { id: toastId });
                                                } else {
                                                    toast.error(data.error || t('domainSettings.integrations.failed'), { id: toastId });
                                                }
                                            } catch (e) {
                                                toast.error(t('domainSettings.integrations.failed'), { id: toastId });
                                            }
                                        }}
                                        variant="outline"
                                        disabled={isLoading || !wpUrl || !wpUsername || !wpAppPassword}
                                        className="gap-2"
                                    >
                                        <Zap className="h-4 w-4" />
                                        {t('domainSettings.integrations.test')}
                                    </Button>

                                    <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        {t('domainSettings.integrations.saveInt')}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {activeTab === 'search_console' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('domainSettings.gsc.cardTitle')}</CardTitle>
                                    <CardDescription>{t('domainSettings.gsc.cardDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {settings.google_connected ? (
                                        <>
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center text-green-700 font-semibold gap-2">
                                                        <CheckCircle className="h-5 w-5" />
                                                        {t('domainSettings.gsc.connected')}
                                                    </div>
                                                    <Button
                                                        onClick={disconnectGoogle}
                                                        variant="destructive"
                                                        size="sm"
                                                    >
                                                        {t('domainSettings.gsc.disconnect')}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Sites List */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-gray-900">{t('domainSettings.gsc.verifiedSites')}</h3>
                                                    <Button
                                                        onClick={fetchSites}
                                                        disabled={loadingSites}
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                    >
                                                        {loadingSites ? (
                                                            <>
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                {t('domainSettings.gsc.loading')}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Download className="h-3 w-3" />
                                                                {t('domainSettings.gsc.refreshSites')}
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {loadingSites ? (
                                                    <div className="text-center py-8">
                                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                                        <p className="text-sm text-gray-500 mt-2">{t('domainSettings.gsc.loading')}</p>
                                                    </div>
                                                ) : sites.length === 0 ? (
                                                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                                        <p className="text-sm text-gray-500">{t('domainSettings.gsc.noSites')}</p>
                                                        <p className="text-xs text-gray-400 mt-1">Click "{t('domainSettings.gsc.refreshSites')}" to load your sites</p>
                                                    </div>
                                                ) : (() => {
                                                    // Filter sites to show only the current domain
                                                    const currentDomain = activeDomain?.domain || '';
                                                    const filteredSites = sites.filter(site => {
                                                        const cleanSiteUrl = site.siteUrl
                                                            .replace('sc-domain:', '')
                                                            .replace(/^https?:\/\//, '')
                                                            .replace(/\/$/, '')
                                                            .toLowerCase();
                                                        const cleanCurrentDomain = currentDomain
                                                            .replace(/^https?:\/\//, '')
                                                            .replace(/\/$/, '')
                                                            .toLowerCase();

                                                        return cleanSiteUrl === cleanCurrentDomain ||
                                                            cleanSiteUrl.includes(cleanCurrentDomain) ||
                                                            cleanCurrentDomain.includes(cleanSiteUrl);
                                                    });

                                                    if (filteredSites.length === 0) {
                                                        return (
                                                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                                                <p className="text-sm text-gray-500">No matching site found for {activeDomain?.domain}</p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    Make sure this domain is verified in Google Search Console
                                                                </p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="space-y-2">
                                                            {filteredSites.map((site) => {
                                                                const getPermissionBadge = (level: string) => {
                                                                    switch (level) {
                                                                        case 'siteOwner':
                                                                            return (
                                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                    ✓ {t('domainSettings.gsc.owner')}
                                                                                </span>
                                                                            );
                                                                        case 'siteFullUser':
                                                                            return (
                                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                                    {t('domainSettings.gsc.full')}
                                                                                </span>
                                                                            );
                                                                        case 'siteRestrictedUser':
                                                                            return (
                                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                                    {t('domainSettings.gsc.restricted')}
                                                                                </span>
                                                                            );
                                                                        case 'siteUnverifiedUser':
                                                                            return (
                                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                                    ⚠ {t('domainSettings.gsc.unverified')}
                                                                                </span>
                                                                            );
                                                                        default:
                                                                            return (
                                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                                                    {level}
                                                                                </span>
                                                                            );
                                                                    }
                                                                };

                                                                const isImported = domainsData?.domains?.some(d => {
                                                                    const cleanSiteUrl = site.siteUrl.replace('sc-domain:', '').replace(/\/$/, '');
                                                                    const cleanDomain = d.domain.replace(/\/$/, '');
                                                                    return cleanDomain.includes(cleanSiteUrl) || cleanSiteUrl.includes(cleanDomain);
                                                                });

                                                                const formatSiteUrl = (url: string) => {
                                                                    return url
                                                                        .replace(/^https?:\/\//, '') // Remove http:// or https://
                                                                        .replace(/^sc-domain:/, '')  // Remove sc-domain:
                                                                        .replace(/\/$/, '');         // Remove trailing slash
                                                                };

                                                                return (
                                                                    <div
                                                                        key={site.siteUrl}
                                                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <div className="flex-1 mr-4">
                                                                            <p className="font-medium text-sm truncate mb-1">{formatSiteUrl(site.siteUrl)}</p>
                                                                            {getPermissionBadge(site.permissionLevel)}
                                                                        </div>
                                                                        {isImported ? (
                                                                            <Button
                                                                                disabled
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                className="gap-2 bg-green-100 text-green-700 hover:bg-green-100 opacity-100"
                                                                            >
                                                                                <CheckCircle className="h-3 w-3" />
                                                                                {t('domainSettings.gsc.imported')}
                                                                            </Button>
                                                                        ) : (
                                                                            <Button
                                                                                onClick={() => importSite(site.siteUrl)}
                                                                                size="sm"
                                                                                className="gap-2"
                                                                            >
                                                                                <Plus className="h-3 w-3" />
                                                                                {t('domainSettings.gsc.add')}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <p className="text-sm text-yellow-800 mb-2">
                                                    <strong>{t('domainSettings.gsc.notesTitle')}</strong>
                                                </p>
                                                <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                                                    <li>{t('domainSettings.gsc.note1')}</li>
                                                    <li>If a site has permission errors, check that you have Owner access (not just User) in Google Search Console.</li>
                                                    <li>If you recently changed permissions, try disconnecting and reconnecting your Google account.</li>
                                                </ul>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('domainSettings.gsc.cardTitle')}</h3>
                                            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                                                {t('domainSettings.gsc.connectDesc')}
                                            </p>
                                            <Button
                                                onClick={() => {
                                                    const currentUrl = window.location.pathname + window.location.search;
                                                    window.location.href = `/api/auth/google/authorize?returnUrl=${encodeURIComponent(currentUrl)}`;
                                                }}
                                                size="lg"
                                                className="gap-2 bg-black text-white hover:bg-gray-800"
                                            >
                                                <Plug className="h-4 w-4" />
                                                {t('domainSettings.gsc.connectBtn')}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}


                        {activeTab === 'danger' && (
                            <Card className="border-red-200">
                                <CardHeader>
                                    <CardTitle className="text-red-600">{t('domainSettings.delete.cardTitle')}</CardTitle>
                                    <CardDescription>
                                        {t('domainSettings.delete.cardDesc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-100">
                                        <div>
                                            <h4 className="font-semibold text-red-900">{t('domainSettings.delete.cardTitle')}</h4>
                                            <p className="text-sm text-red-700 mb-2">
                                                {t('domainSettings.delete.msg')}
                                            </p>
                                            <p className="text-sm text-red-700 font-medium">
                                                {t('domainSettings.delete.confirm', { domain: activeDomain?.domain })}
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
                                                {isDeleting ? t('domainSettings.delete.deleting') : t('domainSettings.delete.btn')}
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
