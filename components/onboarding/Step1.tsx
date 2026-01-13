import React, { useState } from 'react';
import { useRouter } from 'next/router';

const Step1 = ({ onNext }: { onNext: (data: any) => void }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!url) {
            setError('Please enter a website URL');
            return;
        }

        // Basic URL validation
        if (!url.includes('.')) {
            setError('Please enter a valid URL');
            return;
        }

        setLoading(true);
        try {
            // Save data via API
            const res = await fetch('/api/onboarding/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: 1, data: { website_url: url } }),
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

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm">
            <div className="mb-6">
                {/* Progress Bar / Dots could go here */}
            </div>

            <h2 className="text-2xl font-bold mb-2 text-gray-900">Enter your website URL</h2>
            <p className="text-gray-600 mb-6">We'll analyze your website to create a personalized plan.</p>

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                    <input
                        type="text"
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>



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

export default Step1;
