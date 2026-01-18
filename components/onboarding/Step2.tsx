import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Step2Props {
    onNext: (data: any) => void;
    onBack: () => void;
    initialData?: {
        businessName?: string;
        niche?: string;
        description?: string;
    };
}

const Step2 = ({ onNext, onBack, initialData }: Step2Props) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        businessName: '',
        niche: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill with AI data
    React.useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                businessName: initialData.businessName || prev.businessName,
                niche: initialData.niche || prev.niche,
                description: initialData.description || prev.description,
            }));
        }
    }, [initialData]);

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

        if (!formData.businessName || !formData.niche || !formData.description) {
            setError(t('onboarding.step2.errorFields'));
            return;
        }

        if (formData.niche.split(' ').length > 3) {
            setError(t('onboarding.step2.errorNiche'));
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/onboarding/save', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ step: 2, data: formData }),
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

    const charCount = formData.description.length;
    const maxChars = 500;

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress Dots */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex space-x-2">
                    <div className="w-8 h-1 bg-black rounded"></div>
                    <div className="w-8 h-1 bg-black rounded"></div>
                    <div className="w-8 h-1 bg-gray-300 rounded"></div>
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

            <h2 className="text-3xl font-bold mb-2 text-gray-900">{t('onboarding.step2.title')}</h2>
            <p className="text-gray-500 mb-8">{t('onboarding.step2.subtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Niche Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('onboarding.step2.nameLabel')}</label>
                        <input
                            type="text"
                            placeholder={t('onboarding.step2.namePlaceholder')}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            value={formData.businessName}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('onboarding.step2.nameHelp')}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('onboarding.step2.nicheLabel')}</label>
                        <input
                            type="text"
                            placeholder={t('onboarding.step2.nichePlaceholder')}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            value={formData.niche}
                            onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('onboarding.step2.nicheHelp')}</p>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('onboarding.step2.descLabel')}</label>
                    <textarea
                        rows={6}
                        placeholder={t('onboarding.step2.descPlaceholder')}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        maxLength={maxChars}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {t('onboarding.step2.descHelp')} ({charCount}/{maxChars})
                    </p>
                </div>



                {/* Important Note */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                            i
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">{t('onboarding.step2.importantTitle')}</h4>
                            <p className="text-gray-600 text-sm">
                                {t('onboarding.step2.importantDesc')}
                            </p>
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70"
                >
                    {loading ? t('onboarding.step1.saving') : t('onboarding.step1.continue')}
                </button>
            </form>
        </div>
    );
};

export default Step2;
