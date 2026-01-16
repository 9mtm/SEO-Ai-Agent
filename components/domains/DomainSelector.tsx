import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, Globe, ChevronDown } from 'lucide-react';

type DomainSelectorProps = {
    domains?: DomainType[];
    currentDomain?: DomainType | null;
};

const DomainSelector = ({ domains = [], currentDomain }: DomainSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
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
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Current Domain</span>
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">
                            {currentDomain ? currentDomain.domain : 'Select Domain'}
                        </span>
                    </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-full min-w-[240px] bg-white rounded-lg shadow-xl border border-neutral-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 slide-in-from-bottom-2">
                    <div className="px-4 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                        Switch Domain
                    </div>

                    <div className="max-h-64 overflow-y-auto px-2 space-y-0.5">
                        {domains.length > 0 ? (
                            domains.map((domain) => (
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
                            <div className="px-3 py-4 text-sm text-gray-500 text-center italic">No domains found</div>
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
                            <span>Add New Domain</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DomainSelector;
