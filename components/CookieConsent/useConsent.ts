import { useState, useEffect } from 'react';
import { ConsentPreferences, ConsentCategory, getConsent, saveConsent, isCategoryAllowed } from '../../lib/consentManager';

export function useConsent() {
    const [hasConsentState, setHasConsent] = useState(false);
    const [preferences, setPreferences] = useState<ConsentPreferences>({
        essential: true, functional: false, analytics: false, marketing: false,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = getConsent();
        if (stored) {
            setHasConsent(true);
            setPreferences(stored.preferences);
        }
    }, []);

    const dispatchUpdate = (prefs: ConsentPreferences) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('consentUpdated', { detail: { preferences: prefs } }));
        }
    };

    const acceptAll = () => {
        const p: ConsentPreferences = { essential: true, functional: true, analytics: true, marketing: true };
        saveConsent(p, 'banner');
        setPreferences(p);
        setHasConsent(true);
        dispatchUpdate(p);
    };

    const rejectAll = () => {
        const p: ConsentPreferences = { essential: true, functional: false, analytics: false, marketing: false };
        saveConsent(p, 'banner');
        setPreferences(p);
        setHasConsent(true);
        dispatchUpdate(p);
    };

    const savePrefs = (p: ConsentPreferences) => {
        saveConsent(p, 'preferences');
        setPreferences(p);
        setHasConsent(true);
        dispatchUpdate(p);
    };

    return { hasConsent: hasConsentState, preferences, acceptAll, rejectAll, savePreferences: savePrefs, isCategoryAllowed: (c: ConsentCategory) => isCategoryAllowed(c) };
}
