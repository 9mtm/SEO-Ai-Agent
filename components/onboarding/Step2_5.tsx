import React, { useState, useEffect } from 'react';
import { ChevronLeft, Sparkles, Target, Zap, Flag, Loader2, Globe } from 'lucide-react';
import SelectField from '../common/SelectField';
import countries from '../../utils/countries';
import { useLanguage } from '@/context/LanguageContext';

interface Step2_5Props {
    onNext: (data: any) => void;
    onBack: () => void;
    suggestedKeywords?: {
        high: string[];
        medium: string[];
        low: string[];
    };
}

const Step2_5 = ({ onNext, onBack, suggestedKeywords }: Step2_5Props) => {
    const { t } = useLanguage();
    const [focusKeywords, setFocusKeywords] = useState({
        high: ['', '', ''],
        medium: ['', '', ''],
        low: ['', '', '']
    });
    const [targetCountry, setTargetCountry] = useState('US');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill with AI-suggested keywords
    useEffect(() => {
        if (suggestedKeywords && typeof suggestedKeywords === 'object') {
            setFocusKeywords({
                high: [
                    suggestedKeywords.high?.[0] || '',
                    suggestedKeywords.high?.[1] || '',
                    suggestedKeywords.high?.[2] || ''
                ],
                medium: [
                    suggestedKeywords.medium?.[0] || '',
                    suggestedKeywords.medium?.[1] || '',
                    suggestedKeywords.medium?.[2] || ''
                ],
                low: [
                    suggestedKeywords.low?.[0] || '',
                    suggestedKeywords.low?.[1] || '',
                    suggestedKeywords.low?.[2] || ''
                ]
            });
        }

        // Load default country
        const savedCountry = localStorage.getItem('default_country');
        if (savedCountry) {
            setTargetCountry(savedCountry);
        }
    }, [suggestedKeywords]);

    const handleKeywordChange = (level: 'high' | 'medium' | 'low', index: number, value: string) => {
        setFocusKeywords(prev => {
            const newList = [...prev[level]];
            newList[index] = value;
            return { ...prev, [level]: newList };
        });
    };

    const handleCountryChange = (updated: string[]) => {
        setTargetCountry(updated[0]);
        localStorage.setItem('default_country', updated[0]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Filter out empty keywords
        const cleanKeywords = {
            high: focusKeywords.high.filter(k => k.trim() !== ''),
            medium: focusKeywords.medium.filter(k => k.trim() !== ''),
            low: focusKeywords.low.filter(k => k.trim() !== '')
        };

        // At least one keyword should be filled
        const totalKeywords = cleanKeywords.high.length + cleanKeywords.medium.length + cleanKeywords.low.length;
        if (totalKeywords === 0) {
            setError(t('onboarding.step2_5.errorKeywords'));
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/onboarding/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: 2.5,
                    data: {
                        focus_keywords: cleanKeywords,
                        target_country: targetCountry
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
        <div className="max-w-3xl mx-auto">
            {/* Progress Dots */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex space-x-2">
                    <div className="w-8 h-1 bg-black rounded"></div>
                    <div className="w-8 h-1 bg-black rounded"></div>
                    <div className="w-8 h-1 bg-black rounded"></div>
                    <div className="w-8 h-1 bg-gray-300 rounded"></div>
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

            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">{t('onboarding.step2_5.title')}</h2>
            </div>

            <p className="text-gray-500 mb-8">
                {t('onboarding.step2_5.subtitle')}
            </p>

            {suggestedKeywords && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-blue-900 text-sm mb-1">{t('onboarding.step2_5.aiTitle')}</h4>
                        <p className="text-blue-700 text-sm">
                            {t('onboarding.step2_5.aiDesc')}
                        </p>
                    </div>
                </div>
            )}

            {/* Country Selector - Moved Here */}
            <div className="mb-8 flex justify-end">
                <div className="w-48">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                        <Globe size={14} className="text-gray-500" />
                        <span className="text-xs font-medium text-gray-500">{t('onboarding.step2_5.targetCountry')}</span>
                    </div>
                    <SelectField
                        multiple={false}
                        selected={[targetCountry]}
                        options={Object.keys(countries).map((countryISO: string) => ({
                            label: countries[countryISO][0],
                            value: countryISO
                        }))}
                        defaultLabel={t('domainSettings.strategy.allCountries')}
                        updateField={handleCountryChange}
                        rounded='rounded-lg'
                        maxHeight={48}
                        flags={true}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* High Priority */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Zap className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{t('onboarding.step2_5.highPriorityTitle')}</h3>
                            <p className="text-sm text-gray-500">{t('onboarding.step2_5.highPriorityDesc')}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                            <div key={`high-${i}`} className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                    <span className="text-red-600 font-bold text-sm">#{i + 1}</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder={`${t('onboarding.step2_5.keywordPlaceholder')} #${i + 1}`}
                                    value={focusKeywords.high[i]}
                                    onChange={(e) => handleKeywordChange('high', i, e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-lg border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Medium Priority */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Flag className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{t('onboarding.step2_5.mediumPriorityTitle')}</h3>
                            <p className="text-sm text-gray-500">{t('onboarding.step2_5.mediumPriorityDesc')}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                            <div key={`medium-${i}`} className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <span className="text-yellow-600 font-bold text-sm">#{i + 4}</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder={`${t('onboarding.step2_5.keywordPlaceholder')} #${i + 4}`}
                                    value={focusKeywords.medium[i]}
                                    onChange={(e) => handleKeywordChange('medium', i, e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-lg border-2 border-yellow-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Low Priority */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Flag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{t('onboarding.step2_5.lowPriorityTitle')}</h3>
                            <p className="text-sm text-gray-500">{t('onboarding.step2_5.lowPriorityDesc')}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                            <div key={`low-${i}`} className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-sm">#{i + 7}</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder={`${t('onboarding.step2_5.keywordPlaceholder')} #${i + 7}`}
                                    value={focusKeywords.low[i]}
                                    onChange={(e) => handleKeywordChange('low', i, e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {t('onboarding.step1.saving')}
                        </>
                    ) : (
                        t('onboarding.step1.continue')
                    )}
                </button>
            </form>
        </div>
    );
};
export default Step2_5;
