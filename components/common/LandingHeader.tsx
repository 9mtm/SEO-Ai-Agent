import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Globe, Menu, X } from 'lucide-react';
import AccountMenu from './AccountMenu';
import { useFetchDomains } from '../../services/domains';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/router';

interface LandingHeaderProps {
    activePage?: 'blog' | 'contact' | 'home';
}

export default function LandingHeader({ activePage }: LandingHeaderProps) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const { locale, setLocale, t } = useLanguage();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const { data: domainsData } = useFetchDomains(router, false, { enabled: isLoggedIn });
    const domains = domainsData?.domains || [];

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        fetch('/api/user', { headers })
            .then((res) => { if (res.ok) setIsLoggedIn(true); })
            .catch(() => {});
    }, []);

    const linkClass = (page?: string) =>
        page === activePage
            ? 'text-blue-600 font-semibold transition-colors'
            : 'text-neutral-600 hover:text-neutral-900 font-medium transition-colors';

    return (
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                        <Image src="/dpro_logo.png" alt="SEO Agent Logo" width={32} height={32} className="h-8 w-8" />
                        <span className="text-xl font-bold text-neutral-900">SEO Agent</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/#features" className={linkClass()}>
                            {t('nav.features')}
                        </Link>
                        <Link href="/blog" className={linkClass('blog')}>
                            {t('nav.blog')}
                        </Link>
                        <Link href="/contact" className={linkClass('contact')}>
                            {t('nav.contact')}
                        </Link>
                        <Link href="/mcp-seo" className={linkClass()}>
                            {t('nav.mcpIntegration')}
                        </Link>

                        {isLoggedIn ? (
                            <AccountMenu domains={domains} />
                        ) : (
                            <>
                                <div className="relative">
                                    <button
                                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                                        className="flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                                    >
                                        <Globe className="h-4 w-4" />
                                        {locale === 'de' ? 'DE' : locale === 'fr' ? 'FR' : locale === 'es' ? 'ES' : locale === 'pt' ? 'PT' : locale === 'zh' ? 'ZH' : 'EN'}
                                    </button>
                                    {langMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                                            <button onClick={() => { setLocale('en'); setLangMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">English</button>
                                            <button onClick={() => { setLocale('de'); setLangMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Deutsch</button>
                                            <button onClick={() => { setLocale('fr'); setLangMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Français</button>
                                            <button onClick={() => { setLocale('es'); setLangMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Español</button>
                                            <button onClick={() => { setLocale('pt'); setLangMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Português</button>
                                            <button onClick={() => { setLocale('zh'); setLangMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">中文</button>
                                        </div>
                                    )}
                                </div>
                                <Link href="/login" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                                    {t('landing.login')}
                                </Link>
                                <Link href="/register" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
                                    {t('landing.cta')}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
                        aria-label="Toggle mobile menu"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-neutral-200 bg-white">
                    <div className="px-4 py-4 space-y-3">
                        <Link href="/#features" className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                            {t('nav.features')}
                        </Link>
                        <Link href="/blog" className={`block px-4 py-2 rounded-lg ${activePage === 'blog' ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`} onClick={() => setMobileMenuOpen(false)}>
                            {t('nav.blog')}
                        </Link>
                        <Link href="/contact" className={`block px-4 py-2 rounded-lg ${activePage === 'contact' ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'}`} onClick={() => setMobileMenuOpen(false)}>
                            {t('nav.contact')}
                        </Link>
                        <Link href="/mcp-seo" className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                            {t('nav.mcpIntegration')}
                        </Link>
                        {!isLoggedIn && (
                            <>
                                <select value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'de' | 'fr' | 'es' | 'pt' | 'zh')} className="w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm font-medium text-neutral-700">
                                    <option value="en">English</option>
                                    <option value="de">Deutsch</option>
                                    <option value="fr">Français</option>
                                    <option value="es">Español</option>
                                    <option value="pt">Português</option>
                                    <option value="zh">中文</option>
                                </select>
                                <Link href="/login" className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                                    {t('landing.login')}
                                </Link>
                                <Link href="/register" className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-semibold hover:bg-blue-700 transition-all active:scale-[0.98]" onClick={() => setMobileMenuOpen(false)}>
                                    {t('landing.cta')}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
