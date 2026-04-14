import { useEffect, useState } from 'react';

interface Section {
    id: string;
    title: string;
    items?: { id: string; title: string; method?: string }[];
}

const METHOD_DOT: Record<string, string> = {
    GET: 'bg-green-500', POST: 'bg-blue-500', PUT: 'bg-yellow-500', PATCH: 'bg-yellow-500', DELETE: 'bg-red-500',
};

export default function DocsSidebar({ sections }: { sections: Section[] }) {
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.id);
                    break;
                }
            }
        }, { rootMargin: '-100px 0px -60% 0px' });

        sections.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
            s.items?.forEach(item => {
                const itemEl = document.getElementById(item.id);
                if (itemEl) observer.observe(itemEl);
            });
        });

        return () => observer.disconnect();
    }, [sections]);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <nav className="hidden lg:block w-64 flex-shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-4">
            <div className="space-y-4">
                {sections.map(section => (
                    <div key={section.id}>
                        <button onClick={() => scrollTo(section.id)}
                            className={`block w-full text-left text-sm font-semibold mb-1 transition-colors ${activeId === section.id ? 'text-blue-600' : 'text-neutral-900 hover:text-blue-600'}`}>
                            {section.title}
                        </button>
                        {section.items && (
                            <div className="ml-3 space-y-0.5">
                                {section.items.map(item => (
                                    <button key={item.id} onClick={() => scrollTo(item.id)}
                                        className={`flex items-center gap-2 w-full text-left text-xs py-0.5 transition-colors ${activeId === item.id ? 'text-blue-600 font-medium' : 'text-neutral-500 hover:text-neutral-700'}`}>
                                        {item.method && <span className={`w-1.5 h-1.5 rounded-full ${METHOD_DOT[item.method] || 'bg-neutral-400'}`} />}
                                        <span className="truncate">{item.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </nav>
    );
}
