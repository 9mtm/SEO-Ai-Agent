import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Settings, LogOut, Plus, Globe, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

type AccountMenuProps = {
    domains?: DomainType[];
    currentDomain?: DomainType | null;
};

type UserInfo = {
    name: string;
    email: string;
    picture?: string;
};

const AccountMenu = ({ domains = [], currentDomain }: AccountMenuProps) => {
    const { locale: selectedLang, setLocale, t } = useLanguage();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo>({ name: 'User', email: 'user@example.com' });
    const menuRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setIsLangOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getAuthHeaders = (contentType = 'application/json') => {
        const headers: any = { 'Content-Type': contentType, Accept: 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    useEffect(() => {
        // Fetch user info
        const fetchUserInfo = async () => {
            try {
                const response = await fetch('/api/user', {
                    headers: getAuthHeaders()
                });
                const data = await response.json();
                if (data.success && data.user) {
                    setUserInfo(data.user);
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        fetchUserInfo();
    }, []);

    const logoutUser = async () => {
        try {
            const fetchOpts = {
                method: 'POST',
                headers: getAuthHeaders()
            };
            const res = await fetch(`${window.location.origin}/api/logout`, fetchOpts).then((result) => result.json());

            // Clear local storage on logout
            localStorage.removeItem('auth_token');

            if (!res.success) {
                toast(res.error, { icon: '⚠️' });
            } else {
                router.push('/login');
            }
        } catch (fetchError) {
            toast('Could not logout, The Server is not responsive.', { icon: '⚠️' });
        }
    };

    const handleDomainChange = (slug: string) => {
        router.push(`/domain/${slug}`);
        setIsMenuOpen(false);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const currentLangLabel = selectedLang === 'de' ? 'DE' : selectedLang === 'fr' ? 'FR' : 'EN';
    const currentLangFlag = selectedLang === 'de' ? '🇩🇪' : selectedLang === 'fr' ? '🇫🇷' : '🇺🇸';

    return (
        <div className="flex items-center gap-4">
            {/* Language Switcher Standalone */}
            <div className="relative" ref={langRef}>
                <button
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-600 font-medium text-sm"
                    title="Change Language"
                >
                    <span className="text-lg leading-none">{currentLangFlag}</span>
                    <span className="hidden sm:inline">{currentLangLabel}</span>
                    <svg
                        className={`w-3 h-3 text-neutral-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isLangOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50 overflow-hidden">
                        <button
                            onClick={() => { setLocale('en'); setIsLangOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${selectedLang === 'en' ? 'bg-blue-50 text-blue-700' : 'text-neutral-700 hover:bg-neutral-50'}`}
                        >
                            <span className="text-lg">🇺🇸</span>
                            <span>English</span>
                        </button>
                        <button
                            onClick={() => { setLocale('de'); setIsLangOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${selectedLang === 'de' ? 'bg-blue-50 text-blue-700' : 'text-neutral-700 hover:bg-neutral-50'}`}
                        >
                            <span className="text-lg">🇩🇪</span>
                            <span>Deutsch</span>
                        </button>
                        <button
                            onClick={() => { setLocale('fr'); setIsLangOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${selectedLang === 'fr' ? 'bg-blue-50 text-blue-700' : 'text-neutral-700 hover:bg-neutral-50'}`}
                        >
                            <span className="text-lg">🇫🇷</span>
                            <span>Français</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Account Button */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                    {userInfo.picture ? (
                        <img
                            src={userInfo.picture}
                            alt={userInfo.name}
                            className="w-8 h-8 rounded-full border border-neutral-200"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs shadow-sm">
                            {getInitials(userInfo.name)}
                        </div>
                    )}
                    <div className="hidden lg:flex flex-col items-start">
                        <span className="text-sm font-semibold text-neutral-900 leading-tight">{userInfo.name}</span>
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                        {/* Account Header */}
                        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/50">
                            <p className="text-sm font-semibold text-neutral-900">{userInfo.name}</p>
                            <p className="text-xs text-neutral-500 truncate">{userInfo.email}</p>
                        </div>

                        <div className="py-1">
                            <Link
                                href="/profile"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                            >
                                <User className="h-4 w-4 text-neutral-500" />
                                <span>{t('sidebar.profile')}</span>
                            </Link>
                            <Link
                                href="/profile/notifications"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                            >
                                <Settings className="h-4 w-4 text-neutral-500" />
                                <span>{t('sidebar.notifications')}</span>
                            </Link>
                        </div>

                        <div className="border-t border-neutral-200 py-1">
                            <button
                                onClick={() => {
                                    logoutUser();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>{t('common.logout')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountMenu;
