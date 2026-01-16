import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import en from '../locales/en/common.json';
import de from '../locales/de/common.json';

type Locale = 'en' | 'de';

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, vars?: Record<string, any>) => string;
    translations: any;
}

const translationsMap = { en, de };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const [isLoaded, setIsLoaded] = useState(false);

    // Get current locale from Next.js router
    const locale = (router.locale || 'en') as Locale;

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const setLocale = (newLocale: Locale) => {
        // Save preference to localStorage
        localStorage.setItem('app_locale', newLocale);

        // Use Next.js router to change locale (this will update the URL)
        router.push(router.pathname, router.asPath, { locale: newLocale });
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
