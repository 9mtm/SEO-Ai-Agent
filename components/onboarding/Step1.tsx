import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2, CheckCircle, Globe } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

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

    // Check if user already connected Google on mount
    useEffect(() => {
        checkGoogleConnection();
    }, []);

    const checkGoogleConnection = async () => {
        setCheckingConnection(true);
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.settings?.google_connected) {
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
            const res = await fetch('/api/gsc/sites');
            const data = await res.json();
            if (data.sites && Array.isArray(data.sites)) {
                // Filter out sc-domain sites to avoid duplicates
                const filteredSites = data.sites.filter((site: any) =>
                    !site.siteUrl.startsWith('sc-domain:')
                );
                setGscSites(filteredSites);
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
        try {
            // Save data via API
            const res = await fetch('/api/onboarding/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: 1,
                    data: {
                        website_url: url,
                        gsc_site_url: selectedSite
                    }
                }),
            });
            const data = await res.json();
            if (res.ok) {
                onNext(data);
            } else {
                setError(data.error || t('onboarding.step1.errorSave'));
            }
        } catch (err) {
            setError(t('onboarding.step1.errorGeneric'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm">
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
                            <select
                                value={selectedSite}
                                onChange={(e) => handleSiteSelect(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                            >
                                <option value="">{t('onboarding.step1.chooseSite')}</option>
                                {gscSites.map((site) => (
                                    <option key={site.siteUrl} value={site.siteUrl}>
                                        {formatSiteUrl(site.siteUrl)}
                                        {site.permissionLevel === 'siteOwner' ? ` ${t('onboarding.step1.owner')}` : ''}
                                    </option>
                                ))}
                            </select>
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
                            </>
                        ) : (
                            t('onboarding.step1.continue')
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default Step1;
