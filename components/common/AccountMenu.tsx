import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Settings, LogOut, Plus, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

type AccountMenuProps = {
    showAddModal: () => void;
    domains?: DomainType[];
    currentDomain?: DomainType | null;
};

type UserInfo = {
    name: string;
    email: string;
    picture?: string;
};

const AccountMenu = ({ showAddModal, domains = [], currentDomain }: AccountMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo>({ name: 'User', email: 'user@example.com' });
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // Fetch user info
        const fetchUserInfo = async () => {
            try {
                const response = await fetch('/api/user');
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
                headers: new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' })
            };
            const res = await fetch(`${window.location.origin}/api/logout`, fetchOpts).then((result) => result.json());

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
        setIsOpen(false);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Account Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
                {userInfo.picture ? (
                    <img
                        src={userInfo.picture}
                        alt={userInfo.name}
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {getInitials(userInfo.name)}
                    </div>
                )}
                <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-semibold text-neutral-900">{userInfo.name}</span>
                    <span className="text-xs text-neutral-500">{userInfo.email}</span>
                </div>
                <svg
                    className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                    {/* Account Header */}
                    <div className="px-4 py-3 border-b border-neutral-200">
                        <p className="text-sm font-semibold text-neutral-900">Account</p>
                    </div>

                    {/* Domains Section */}
                    {domains.length > 0 && (
                        <div className="px-2 py-2 border-b border-neutral-200">
                            <div className="px-2 py-1 text-xs font-semibold text-neutral-500 uppercase">
                                Domains
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {domains.map((domain) => (
                                    <button
                                        key={domain.slug}
                                        onClick={() => handleDomainChange(domain.slug)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${currentDomain?.slug === domain.slug
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-neutral-700 hover:bg-neutral-100'
                                            }`}
                                    >
                                        <Globe className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{domain.domain}</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    showAddModal();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-md text-sm text-primary hover:bg-primary/10 font-medium transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add Domain</span>
                            </button>
                        </div>
                    )}

                    {/* Settings */}
                    <Link
                        href="/settings"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={() => {
                            logoutUser();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AccountMenu;
