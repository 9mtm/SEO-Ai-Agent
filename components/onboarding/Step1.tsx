import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Loader2, CheckCircle, Globe, Search, ChevronDown, X } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import UpgradeModal from '../common/UpgradeModal';

const Step1 = ({ onNext }: { onNext: (data: any) => void }) => {
    const { t } = useLanguage();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // GSC Integration States
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [gscSites, setGscSites] = useState<{ siteUrl: string; permissionLevel: string }[]>([]);
    const [selectedSite, setSelectedSite] = useState('');
    const [loadingSites, setLoadingSites] = useState(false);
    const [checkingConnection, setCheckingConnection] = useState(true);
    const [existingDomains, setExistingDomains] = useState<string[]>([]);

    // Timeout and Manual Fallback States
    const [showSkipOption, setShowSkipOption] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

    // Search and Dropdown States
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle outside clicks to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Upgrade Modal State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState('');

    // Check if user already connected Google on mount
    useEffect(() => {
        checkGoogleConnection();
    }, []);

    // Helper for auth headers
    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    };

    const checkGoogleConnection = async () => {
        setCheckingConnection(true);
        try {
            const [settingsRes, domainsRes] = await Promise.all([
                fetch('/api/settings', { headers: getAuthHeaders() }),
                fetch('/api/domains', { headers: getAuthHeaders() }),
            ]);
            const settingsData = await settingsRes.json();
            const domainsData = await domainsRes.json();

            // Store existing domain names for "Already Added" badge
            if (domainsData.domains) {
                setExistingDomains(domainsData.domains.map((d: any) => (d.domain || '').toLowerCase().replace(/^www\./, '')));
            }

            if (settingsData.settings?.google_connected) {
                setIsGoogleConnected(true);
                await fetchGscSites();
            }
        } catch (err) {
            console.error('Error checking Google connection:', err);
        } finally {
            setCheckingConnection(false);
        }
    };

    // Fetch GSC sites
    const fetchGscSites = async () => {
        setLoadingSites(true);
        try {
            const res = await fetch('/api/gsc/sites', {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.sites && Array.isArray(data.sites)) {
                setGscSites(data.sites);
            }
        } catch (err) {
            console.error('Error fetching GSC sites:', err);
        } finally {
            setLoadingSites(false);
        }
    };

    // Handle site selection
    const handleSiteSelect = (siteUrl: string) => {
        setSelectedSite(siteUrl);
        setSearchTerm(formatSiteUrl(siteUrl));
        setIsDropdownOpen(false);
        // Auto-fill Website URL
        const cleanUrl = siteUrl
            .replace('sc-domain:', '')
            .replace(/^https?:\/\//, '')
            .replace(/\/$/, '');
        setUrl(cleanUrl);
        setError('');
    };

    // Connect Google
    const connectGoogle = () => {
        const returnUrl = '/onboarding';
        window.location.href = `/api/auth/google/authorize?returnUrl=${encodeURIComponent(returnUrl)}`;
    };

    // Format site URL for display
    const formatSiteUrl = (siteUrl: string) => {
        return siteUrl
            .replace(/^https?:\/\//, '')
            .replace(/^sc-domain:/, '')
            .replace(/\/$/, '');
    };

    // Check if a GSC site is already added as a domain
    const isSiteAlreadyAdded = (siteUrl: string): boolean => {
        const clean = siteUrl.replace(/^https?:\/\//, '').replace(/^sc-domain:/, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
        return existingDomains.some(d => d === clean || clean.includes(d) || d.includes(clean));
    };

    // Filtered sites based on search
    const filteredSites = React.useMemo(() => {
        return gscSites.filter(site =>
            site.siteUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
            formatSiteUrl(site.siteUrl).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [gscSites, searchTerm]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, [timerInterval]);

    const startTimer = () => {
        setElapsedTime(0);
        setShowSkipOption(false);

        const interval = setInterval(() => {
            setElapsedTime(prev => {
                const newTime = prev + 1;
                // Show skip option after 90 seconds
                if (newTime >= 90) {
                    setShowSkipOption(true);
                }
                return newTime;
            });
        }, 1000);

        setTimerInterval(interval);
    };

    const stopTimer = () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }
        setElapsedTime(0);
        setShowSkipOption(false);
    };

    const handleSkipAI = () => {
        stopTimer();
        setLoading(false);
        // Proceed to next step with empty AI data
        onNext({
            success: true,
            aiData: {
                businessName: '',
                niche: '',
                description: ''
            },
            suggestedKeywords: {
                high: [],
                medium: [],
                low: []
            },
            suggestedCompetitors: []
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!url) {
            setError(t('onboarding.step1.errorSelectSite'));
            return;
        }

        if (!selectedSite) {
            setError(t('onboarding.step1.errorVerifySite'));
            return;
        }

        setLoading(true);
        startTimer();

        try {
            // Save data via API
            const res = await fetch('/api/onboarding/save', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    step: 1,
                    data: {
                        website_url: url,
                        gsc_site_url: selectedSite
                    }
                }),
            });
            const data = await res.json();
            stopTimer();

            if (res.ok) {
                onNext(data);
            } else {
                if (res.status === 403) {
                    // Show Upgrade Modal
                    setUpgradeMessage(data.error);
                    setShowUpgradeModal(true);
                } else {
                    setError(data.error || t('onboarding.step1.errorSave'));
                }
            }
        } catch (err) {
            stopTimer();
            setError(t('onboarding.step1.errorGeneric'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm">
            <div className="mb-6">
                {/* Progress Bar / Dots could go here */}
            </div>

            <h2 className="text-2xl font-bold mb-2 text-gray-900">{t('onboarding.step1.title')}</h2>
            <p className="text-gray-600 mb-6">{t('onboarding.step1.subtitle')}</p>

            {checkingConnection ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-3 text-gray-500">{t('onboarding.step1.checking')}</span>
                </div>
            ) : !isGoogleConnected ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Globe className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('onboarding.step1.connectGoogleTitle')}</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        {t('onboarding.step1.connectGoogleDesc')}
                    </p>
                    <button
                        onClick={connectGoogle}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        <Image src="/icon/google-logo.svg" alt="Google" width={20} height={20} />
                        {t('onboarding.step1.connectBtn')}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* Google Connected Status */}
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 font-medium">
                            <CheckCircle className="h-5 w-5" />
                            {t('onboarding.step1.connected')}
                        </div>
                    </div>

                    {/* Site Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('onboarding.step1.selectSiteLabel')} *
                        </label>
                        {loadingSites ? (
                            <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                <span className="ml-2 text-gray-500">{t('onboarding.step1.loadingSites')}</span>
                            </div>
                        ) : gscSites.length === 0 ? (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    {t('onboarding.step1.noSitesTitle')}
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                    {t('onboarding.step1.noSitesDesc')}
                                </p>
                            </div>
                        ) : (
                            <div className="relative" ref={dropdownRef}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder={t('onboarding.step1.searchSitePlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setIsDropdownOpen(true);
                                            if (selectedSite && e.target.value !== formatSiteUrl(selectedSite)) {
                                                setSelectedSite('');
                                            }
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    />
                                    {searchTerm ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSelectedSite('');
                                                setUrl('');
                                            }}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    )}
                                </div>

                                {isDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto animate-in fade-in slide-in-from-top-1 duration-200">
                                        {filteredSites.length > 0 ? (
                                            filteredSites.map((site) => (
                                                <button
                                                    key={site.siteUrl}
                                                    type="button"
                                                    onClick={() => handleSiteSelect(site.siteUrl)}
                                                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between border-b last:border-0 border-gray-50 transition-colors ${selectedSite === site.siteUrl ? 'bg-blue-50' : ''}`}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-900 font-medium">{formatSiteUrl(site.siteUrl)}</span>
                                                        <span className="text-xs text-gray-500 truncate max-w-[300px]">{site.siteUrl}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isSiteAlreadyAdded(site.siteUrl) && (
                                                            <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                                                                Added
                                                            </span>
                                                        )}
                                                        {site.permissionLevel === 'siteOwner' && (
                                                            <span className="text-[10px] uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">
                                                                {t('onboarding.step1.owner')}
                                                            </span>
                                                        )}
                                                        {selectedSite === site.siteUrl && (
                                                            <CheckCircle className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 text-sm">
                                                {t('onboarding.step1.noResults')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Website URL (Auto-filled) */}
                    <div className="mb-6 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('onboarding.step1.websiteUrlLabel')} *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('onboarding.step1.websiteUrlPlaceholder')}
                                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                value={url}
                                readOnly
                                required
                            />
                            {url && url.includes('.') && (
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}&sz=64`}
                                    alt="Favicon"
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-sm bg-gray-50 bg-opacity-50"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('onboarding.step1.websiteUrlHelp')}
                        </p>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !selectedSite}
                        className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {t('onboarding.step1.saving')}
                                {elapsedTime > 0 && (
                                    <span className="ml-2 text-sm">({elapsedTime}s)</span>
                                )}
                            </>
                        ) : (
                            t('onboarding.step1.continue')
                        )}
                    </button>

                    {/* Skip AI Option - Shows after 90 seconds */}
                    {loading && showSkipOption && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-yellow-900 text-sm mb-1">
                                        {t('onboarding.step1.takingLonger') || 'AI is taking longer than expected'}
                                    </h4>
                                    <p className="text-yellow-700 text-sm mb-3">
                                        {t('onboarding.step1.skipDescription') || 'You can skip AI generation and manually enter your business information on the next step.'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleSkipAI}
                                        className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                                    >
                                        {t('onboarding.step1.skipAndContinue') || 'Skip AI & Continue Manually'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            )}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                message={upgradeMessage}
            />
        </div >
    );
};

export default Step1;
