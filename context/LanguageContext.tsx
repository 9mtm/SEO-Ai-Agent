import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import enCommon from '../locales/en/common.json';
import deCommon from '../locales/de/common.json';
import frCommon from '../locales/fr/common.json';
import esCommon from '../locales/es/common.json';
import enMeta from '../locales/en/metadata.json';
import deMeta from '../locales/de/metadata.json';
import frMeta from '../locales/fr/metadata.json';
import esMeta from '../locales/es/metadata.json';
import ptCommon from '../locales/pt/common.json';
import ptMeta from '../locales/pt/metadata.json';
import zhCommon from '../locales/zh/common.json';
import zhMeta from '../locales/zh/metadata.json';
import itCommon from '../locales/it/common.json';
import itMeta from '../locales/it/metadata.json';
import nlCommon from '../locales/nl/common.json';
import nlMeta from '../locales/nl/metadata.json';
import trCommon from '../locales/tr/common.json';
import trMeta from '../locales/tr/metadata.json';

type Locale = 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'zh' | 'nl' | 'tr';

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, vars?: Record<string, any>) => string;
    translations: any;
}

const en = { ...enCommon, meta: enMeta };
const de = { ...deCommon, meta: deMeta };
const fr = { ...frCommon, meta: frMeta };
const es = { ...esCommon, meta: esMeta };
const pt = { ...ptCommon, meta: ptMeta };
const zh = { ...zhCommon, meta: zhMeta };
const it = { ...itCommon, meta: itMeta };
const nl = { ...nlCommon, meta: nlMeta };
const tr = { ...trCommon, meta: trMeta };

const translationsMap = { en, de, fr, es, it, pt, zh, nl, tr };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const [isLoaded, setIsLoaded] = useState(false);

    // Get current locale from Next.js router
    const locale = (router.locale || 'en') as Locale;

    useEffect(() => {
        setIsLoaded(true);

        // Sync language from User DB if logged in
        const syncFromDb = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const res = await fetch('/api/user', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success && data.user?.language && data.user.language !== locale) {
                        // If DB has a different language, switch to it
                        router.push(router.pathname, router.asPath, { locale: data.user.language });
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
        };
        syncFromDb();
    }, []);

    const setLocale = (newLocale: Locale) => {
        // Save preference to localStorage
        localStorage.setItem('app_locale', newLocale);

        // Use Next.js router to change locale
        router.push(router.pathname, router.asPath, { locale: newLocale });

        // Save to Database if logged in
        const token = localStorage.getItem('auth_token');
        if (token) {
            fetch('/api/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ language: newLocale })
            }).catch(console.error);
        }
    };

    const t = (key: string, vars: Record<string, any> = {}) => {
        const keys = key.split('.');
        let value: any = translationsMap[locale];

        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                // Try fallback to English if key missing in current locale
                let fallback: any = translationsMap['en'];
                let foundFallback = true;
                for (const fk of keys) {
                    if (fallback && fallback[fk]) fallback = fallback[fk];
                    else { foundFallback = false; break; }
                }
                if (foundFallback && typeof fallback === 'string') value = fallback;
                else return key;
            }
        }

        if (typeof value === 'string') {
            Object.keys(vars).forEach(v => {
                value = value.replace(new RegExp(`{{${v}}}`, 'g'), String(vars[v]));
            });
            return value;
        }

        return key;
    };

    if (!isLoaded) return null; // Prevent hydration mismatch

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, translations: translationsMap[locale] }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
    return context;
};
