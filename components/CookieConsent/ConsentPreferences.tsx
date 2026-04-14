import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useConsent } from './useConsent';
import { ConsentPreferences as ConsentPrefsType, getConsent } from '../../lib/consentManager';

interface Props { onClose: () => void; }
interface CookieService { name: string; provider: string; storage: string; retention: string; privacyPolicy: string; }

const essentialServices: CookieService[] = [
    { name: 'auth (Authentication Token)', provider: 'SEO Agent', storage: 'Europe', retention: 'Session', privacyPolicy: '/privacy' },
    { name: '__stripe_mid (Stripe)', provider: 'Stripe Inc.', storage: 'US / Europe', retention: '1 year', privacyPolicy: 'https://stripe.com/privacy' },
    { name: '__stripe_sid (Stripe)', provider: 'Stripe Inc.', storage: 'US / Europe', retention: '1 day', privacyPolicy: 'https://stripe.com/privacy' },
    { name: 'locale (Language)', provider: 'SEO Agent', storage: 'Europe', retention: '1 year', privacyPolicy: '/privacy' },
    { name: 'seoagent_consent (Cookie Banner)', provider: 'SEO Agent', storage: 'Europe', retention: '1 year', privacyPolicy: '/privacy' },
    { name: 'ref_code (Referral)', provider: 'SEO Agent', storage: 'Europe', retention: '30 days', privacyPolicy: '/privacy' },
    { name: 'Security (CSRF)', provider: 'SEO Agent', storage: 'Europe', retention: 'Session', privacyPolicy: '/privacy' },
];

const functionalServices: CookieService[] = [
    { name: 'Google Sign-In (OAuth)', provider: 'Google LLC', storage: 'United States', retention: '6 months', privacyPolicy: 'https://policies.google.com/privacy' },
    { name: 'seoagent_accessibility_settings', provider: 'SEO Agent', storage: 'Europe', retention: 'Permanent', privacyPolicy: '/privacy' },
];

const analyticsServices: CookieService[] = [
    { name: 'Google Analytics (_ga, _gid)', provider: 'Google LLC', storage: 'US / Europe', retention: '2 years', privacyPolicy: 'https://policies.google.com/privacy' },
];

const marketingServices: CookieService[] = [
    { name: 'Google Ads (gclid)', provider: 'Google LLC', storage: 'US / Europe', retention: '14 months', privacyPolicy: 'https://policies.google.com/privacy' },
];

const CookieTable = ({ services, isOpen }: { services: CookieService[]; isOpen: boolean }) => {
    if (!isOpen) return null;
    return (
        <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-white border-b border-gray-200">
                        <th className="text-left p-3 font-semibold text-gray-900">Name</th>
                        <th className="text-left p-3 font-semibold text-gray-900">Provider</th>
                        <th className="text-left p-3 font-semibold text-gray-900">Storage</th>
                        <th className="text-left p-3 font-semibold text-gray-900">Retention</th>
                        <th className="text-left p-3 font-semibold text-gray-900">Privacy</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((s, i) => (
                        <tr key={i} className="border-b border-gray-200 bg-white hover:bg-gray-50">
                            <td className="p-3 text-gray-900 font-medium">{s.name}</td>
                            <td className="p-3 text-gray-600">{s.provider}</td>
                            <td className="p-3 text-gray-600">{s.storage}</td>
                            <td className="p-3 text-gray-600">{s.retention}</td>
                            <td className="p-3"><a href={s.privacyPolicy} target="_blank" rel="noopener noreferrer" className="text-blue-600 inline-flex items-center gap-1">View <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
        <div className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${disabled ? 'bg-gray-300' : 'bg-gray-200 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:ring-4 peer-focus:ring-blue-600/30'}`} />
    </label>
);

export default function ConsentPreferencesPanel({ onClose }: Props) {
    const { preferences: initialPrefs, savePreferences } = useConsent();
    const [prefs, setPrefs] = useState<ConsentPrefsType>(initialPrefs);
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'declaration' | 'about'>('declaration');

    const consentData = getConsent();
    const consentId = consentData?.consentId || 'Not yet generated';

    useEffect(() => {
        const saved = getConsent();
        if (saved) setPrefs(saved.preferences);
        else setPrefs(initialPrefs);
    }, [initialPrefs]);

    const toggle = (key: keyof ConsentPrefsType) => {
        if (key === 'essential') return;
        setPrefs(p => ({ ...p, [key]: !p[key] }));
    };

    const ChevronIcon = ({ open }: { open: boolean }) => (
        <svg className={`w-5 h-5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );

    const Section = ({ id, title, desc, services, checked, onToggle, disabled }: { id: string; title: string; desc: string; services: CookieService[]; checked: boolean; onToggle: () => void; disabled?: boolean }) => (
        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setOpenSection(openSection === id ? null : id)}>
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                            <ChevronIcon open={openSection === id} />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{desc}</p>
                        <CookieTable services={services} isOpen={openSection === id} />
                    </div>
                    <div className="ml-4">
                        {disabled ? <input type="checkbox" checked disabled className="w-5 h-5" /> : <Toggle checked={checked} onChange={onToggle} />}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Consent Preferences</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-6">
                        We use cookies to enhance your experience. You can manage your preferences below. See our <Link href="/privacy" className="text-blue-600 underline font-medium">Privacy Policy</Link> for details.
                    </p>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <div className="flex space-x-1">
                            <button onClick={() => setActiveTab('declaration')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'declaration' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>Cookie Declaration</button>
                            <button onClick={() => setActiveTab('about')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>About Cookies</button>
                        </div>
                    </div>

                    {activeTab === 'declaration' && (
                        <div>
                            <Section id="essential" title="Strictly Necessary" desc="These cookies are essential for the website to function. They cannot be disabled." services={essentialServices} checked={true} onToggle={() => {}} disabled />
                            <Section id="functional" title="Functionality Cookies" desc="These cookies enable enhanced functionality like sign-in providers and accessibility settings." services={functionalServices} checked={prefs.functional} onToggle={() => toggle('functional')} />
                            <Section id="analytics" title="Performance Cookies (Analytics)" desc="These cookies help us understand how visitors interact with the website by collecting anonymous data." services={analyticsServices} checked={prefs.analytics} onToggle={() => toggle('analytics')} />
                            <Section id="marketing" title="Targeting Cookies (Marketing)" desc="These cookies are used to deliver relevant advertisements and track campaign performance." services={marketingServices} checked={prefs.marketing} onToggle={() => toggle('marketing')} />
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">Cookies are small text files stored on your device that help websites remember your preferences, improve performance, and deliver relevant content.</p>
                            <p className="text-sm text-gray-600 mb-4">You can change your consent at any time by clicking "Consent Preferences" in the footer. See our <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link> for details.</p>
                            {consentId !== 'Not yet generated' && (
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 mb-2">Your Consent ID (GDPR Article 7)</p>
                                            <code className="block text-xs bg-white px-3 py-2 rounded border border-gray-200 text-gray-800 font-mono break-all">{consentId}</code>
                                        </div>
                                        <button onClick={() => navigator.clipboard.writeText(consentId)} className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-800 transition-colors" title="Copy">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <button onClick={onClose} className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">Cancel</button>
                        <button onClick={() => { savePreferences({ essential: true, functional: false, analytics: false, marketing: false }); onClose(); }} className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-medium">Accept Necessary Only</button>
                        <button onClick={() => { savePreferences(prefs); onClose(); }} className="flex-1 px-6 py-3 bg-blue-600 border-2 border-blue-600 text-white rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-colors font-medium">Save Preferences</button>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">Developed by <a href="https://dpro.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Dpro GmbH</a></p>
                </div>
            </div>
        </div>
    );
}
