import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.businessName || !formData.niche || !formData.description) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.niche.split(' ').length > 3) {
            setError('Niche should be max 3 words');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/onboarding/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: 2, data: formData }),
            });
            const data = await res.json();
            if (res.ok) {
                onNext(data);
            } else {
                setError(data.error || 'Failed to save');
            }
        } catch (err) {
            setError('An error occurred');
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
                    Back
                </button>
            </div>

            <h2 className="text-3xl font-bold mb-2 text-gray-900">Tell us about your business</h2>
            <p className="text-gray-500 mb-8">Share some details about your business.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Niche Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                            type="text"
                            placeholder="Flowxtra"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            value={formData.businessName}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Your business name</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Niche</label>
                        <input
                            type="text"
                            placeholder="recruiting software"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            value={formData.niche}
                            onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Short and focused (max 3 words)</p>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                        rows={6}
                        placeholder="Flowxtra offers a free Applicant Tracking System (ATS) that allows unlimited job postings and helps streamline the hiring process with AI-powered recruitment solutions..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        maxLength={maxChars}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        A brief description of what your business is about ({charCount}/{maxChars})
                    </p>
                </div>



                {/* Important Note */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                            i
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">Important (Read for best results)</h4>
                            <p className="text-gray-600 text-sm">
                                Review all fields. If unsure, just keep the auto-filled suggestion. Make sure that everything is written in selected language.
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
                    {loading ? 'Saving...' : 'Continue'}
                </button>
            </form>
        </div>
    );
};

export default Step2;
