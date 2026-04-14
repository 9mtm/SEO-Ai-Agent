export type ConsentCategory = 'essential' | 'functional' | 'analytics' | 'marketing';

export interface ConsentPreferences {
    essential: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
}

export interface ConsentData {
    consentId: string;
    preferences: ConsentPreferences;
    timestamp: string;
    version: string;
    userAgent?: string;
    language?: string;
    consentMethod?: 'banner' | 'preferences';
}

const CONSENT_STORAGE_KEY = 'seoagent_consent';
const CONSENT_VERSION = '1.0';

function generateConsentId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getConsent(): ConsentData | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
}

export function saveConsent(preferences: ConsentPreferences, method: 'banner' | 'preferences' = 'banner'): void {
    const existing = getConsent();
    const data: ConsentData = {
        consentId: existing?.consentId || generateConsentId(),
        preferences: { essential: true, functional: preferences.functional, analytics: preferences.analytics, marketing: preferences.marketing },
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        language: typeof window !== 'undefined' ? navigator.language : undefined,
        consentMethod: method,
    };
    try { localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(data)); } catch {}

    // Log to server for GDPR Article 7
    logConsentToServer(data);
}

export function hasConsent(): boolean {
    return getConsent() !== null;
}

export function isCategoryAllowed(category: ConsentCategory): boolean {
    const consent = getConsent();
    if (!consent) return false;
    if (category === 'essential') return true;
    return consent.preferences[category] === true;
}

export function revokeConsent(): void {
    try { localStorage.removeItem(CONSENT_STORAGE_KEY); } catch {}
}

async function logConsentToServer(data: ConsentData): Promise<void> {
    try {
        await fetch('/api/consent/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'omit',
        });
    } catch {}
}
