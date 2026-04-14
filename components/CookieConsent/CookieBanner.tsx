import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useConsent } from './useConsent';
import { getConsent } from '../../lib/consentManager';
import dynamic from 'next/dynamic';

const ConsentPreferencesPanel = dynamic(() => import('./ConsentPreferences'), { ssr: false });

export default function CookieBanner() {
    const { acceptAll, rejectAll } = useConsent();
    const [shouldShow, setShouldShow] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;

        const update = () => {
            const consent = getConsent();
            setShouldShow(!consent);
        };
        update();

        // Delay banner to avoid LCP impact
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => setIsReady(true), { timeout: 300 });
        } else {
            setTimeout(() => setIsReady(true), 300);
        }

        window.addEventListener('consentUpdated', update);
        return () => window.removeEventListener('consentUpdated', update);
    }, [mounted]);

    if (!shouldShow || !mounted) return null;

    return (
        <>
            <div className={`fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t-2 border-gray-200 shadow-2xl ${isReady ? 'animate-slideUp' : 'opacity-95'}`}>
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">We value your privacy</h3>
                            <p className="text-sm md:text-base text-gray-600">
                                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.{' '}
                                <Link href="/privacy" className="text-blue-600 underline hover:text-blue-800 font-medium">Privacy Policy</Link>
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <button onClick={rejectAll} className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors font-medium text-sm md:text-base">
                                Reject All
                            </button>
                            <button onClick={() => setShowPreferences(true)} className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm md:text-base">
                                Preferences
                            </button>
                            <button onClick={acceptAll} className="px-4 py-2 bg-blue-600 border-2 border-blue-600 text-white rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-colors font-medium text-sm md:text-base">
                                Accept All
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showPreferences && <ConsentPreferencesPanel onClose={() => setShowPreferences(false)} />}
        </>
    );
}
