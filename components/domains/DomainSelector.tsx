import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Plus, Globe, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

type DomainSelectorProps = {
    domains?: DomainType[];
    currentDomain?: DomainType | null;
};

const DomainSelector = ({ domains = [], currentDomain }: DomainSelectorProps) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
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

    // Focus search when dropdown opens
    useEffect(() => {
        if (isOpen && domains.length > 5 && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
        if (!isOpen) setSearchTerm('');
    }, [isOpen, domains.length]);

    const filteredDomains = useMemo(() => {
        if (!searchTerm.trim()) return domains;
        const q = searchTerm.toLowerCase();
        return domains.filter(d => d.domain.toLowerCase().includes(q));
    }, [domains, searchTerm]);

    const handleDomainChange = (slug: string) => {
        router.push(`/domain/insight/${slug}`);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:ring-2 hover:ring-blue-100 transition-all w-full lg:min-w-[220px] justify-between group"
            >
                <div className="flex items-center gap-2 truncate">
                    <div className="p-1 bg-gray-100 rounded-md group-hover:bg-blue-50 transition-colors">
                        {currentDomain ? (
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${currentDomain.domain}&sz=64`}
                                alt={currentDomain.domain}
                                className="h-4 w-4 rounded-sm"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <Globe className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
                        )}
                    </div>
                    <div className="flex flex-col items-start truncate">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">{t('domainSelector.current')}</span>
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">
                            {currentDomain ? currentDomain.domain : t('domainSelector.select')}
                        </span>
                    </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-full min-w-[240px] bg-white rounded-lg shadow-xl border border-neutral-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 slide-in-from-bottom-2">
                    <div className="px-4 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                        {t('domainSelector.switch')}
                    </div>

                    {/* Search — only show when 5+ domains */}
                    {domains.length > 5 && (
                        <div className="px-2 pb-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search domains..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    <div className="max-h-64 overflow-y-auto px-2 space-y-0.5">
                        {filteredDomains.length > 0 ? (
                            filteredDomains.map((domain) => (
                                <button
                                    key={domain.slug}
                                    onClick={() => handleDomainChange(domain.slug)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${currentDomain?.slug === domain.slug
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                        }`}
                                >
                                    <img
                                        src={`https://www.google.com/s2/favicons?domain=${domain.domain}&sz=64`}
                                        alt={domain.domain}
                                        className="h-4 w-4 flex-shrink-0 rounded-sm"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=example.com'; // Fallback or hide
                                            (e.target as HTMLImageElement).style.opacity = '0.5';
                                        }}
                                    />
                                    <span className="truncate">{domain.domain}</span>
                                    {currentDomain?.slug === domain.slug && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center italic">
                                {searchTerm ? 'No domains found' : t('domainSelector.empty')}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-neutral-100 mt-2 pt-2 px-2">
                        <button
                            onClick={() => {
                                router.push('/onboarding');
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            <span>{t('domainSelector.add')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DomainSelector;
