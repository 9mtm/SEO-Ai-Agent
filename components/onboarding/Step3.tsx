import React, { useState } from 'react';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Step3Props {
    onNext: (data: any) => void;
    onBack: () => void;
    suggestedCompetitors?: string[];
}

const Step3 = ({ onNext, onBack, suggestedCompetitors }: Step3Props) => {
    const { t } = useLanguage();
    const [competitors, setCompetitors] = useState<string[]>(['']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const MAX_COMPETITORS = 3;

    const handleAddCompetitor = () => {
        if (competitors.length < MAX_COMPETITORS) {
            setCompetitors([...competitors, '']);
        }
    };

    const handleRemoveCompetitor = (index: number) => {
        if (competitors.length > 1) {
            const newCompetitors = competitors.filter((_, i) => i !== index);
            setCompetitors(newCompetitors);
        }
    };

    const handleCompetitorChange = (index: number, value: string) => {
        const newCompetitors = [...competitors];
        newCompetitors[index] = value;
        setCompetitors(newCompetitors);
    };

    const handleAddSuggested = (site: string) => {
        // Check if already added
        if (competitors.some(c => c.includes(site))) return;

        // Find first empty slot or add new if < MAX
        const firstEmpty = competitors.findIndex(c => c.trim() === '');
        if (firstEmpty !== -1) {
            handleCompetitorChange(firstEmpty, site.startsWith('http') ? site : `https://${site}`);
        } else if (competitors.length < MAX_COMPETITORS) {
            setCompetitors([...competitors, site.startsWith('http') ? site : `https://${site}`]);
        }
    };

    // Helper for auth headers
    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Filter out empty URLs
        const validCompetitors = competitors.filter(c => c.trim() !== '');

        setLoading(true);
        try {
            const res = await fetch('/api/onboarding/save', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ step: 3, data: { competitors: validCompetitors } }),
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
        <div className="max-w-2xl mx-auto">
            {/* Progress Dots */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex space-x-2">
                    <div className="w-8 h-1 bg-black rounded"></div>
                    <div className="w-8 h-1 bg-black rounded"></div>
                    <div className="w-8 h-1 bg-black rounded"></div>
                    <div className="w-8 h-1 bg-black rounded"></div>
                    <div className="w-8 h-1 bg-gray-300 rounded"></div>
                    <div className="w-8 h-1 bg-gray-300 rounded"></div>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                    <ChevronLeft size={16} className="mr-1" />
                    {t('onboarding.step2.back')}
                </button>
            </div>

            <h2 className="text-3xl font-bold mb-2 text-gray-900">{t('onboarding.step3.title')}</h2>
            <p className="text-gray-500 mb-8">{t('onboarding.step3.subtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {competitors.map((competitor, index) => (
                    <div key={index} className="flex items-start space-x-3">
                        <div className="flex-1">
                            <input
                                type="url"
                                placeholder={t('onboarding.step3.placeholder')}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                value={competitor}
                                onChange={(e) => handleCompetitorChange(index, e.target.value)}
                            />
                            {index === 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('onboarding.step3.help')}
                                </p>
                            )}
                        </div>
                        {competitors.length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveCompetitor(index)}
                                className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={handleAddCompetitor}
                    disabled={competitors.length >= MAX_COMPETITORS}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={16} className="mr-1" />
                    {t('onboarding.step3.add')} {competitors.length >= MAX_COMPETITORS && t('onboarding.step3.maxReached')}
                </button>

                {/* Proposed Competitors */}
                {suggestedCompetitors && suggestedCompetitors.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('onboarding.step3.suggestions')}</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedCompetitors.map((site, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleAddSuggested(site)}
                                    className="pl-2 pr-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-full text-sm transition-all border border-gray-200 flex items-center shadow-sm hover:shadow-md group"
                                >
                                    <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center mr-2 group-hover:bg-blue-50">
                                        <Plus size={12} className="text-gray-400 group-hover:text-blue-500" />
                                    </div>
                                    <img
                                        src={`https://www.google.com/s2/favicons?domain=${site}&sz=32`}
                                        alt=""
                                        className="w-4 h-4 mr-2"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    {site}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70"
                    >
                        {loading ? t('onboarding.step1.saving') : t('onboarding.step1.continue')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Step3;
