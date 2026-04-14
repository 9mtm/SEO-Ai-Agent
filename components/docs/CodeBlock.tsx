import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CodeBlockProps {
    examples: { label: string; code: string }[];
}

export default function CodeBlock({ examples }: CodeBlockProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(examples[activeTab].code);
        setCopied(true);
        toast.success('Copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900">
            <div className="flex items-center justify-between bg-neutral-800 px-3 py-1.5">
                <div className="flex gap-1">
                    {examples.map((ex, i) => (
                        <button key={i} onClick={() => setActiveTab(i)}
                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === i ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}>
                            {ex.label}
                        </button>
                    ))}
                </div>
                <button onClick={copy} className="p-1 text-neutral-400 hover:text-white transition-colors" title="Copy">
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
            </div>
            <pre className="p-4 text-sm text-neutral-300 overflow-x-auto font-mono leading-relaxed whitespace-pre">
                {examples[activeTab].code}
            </pre>
        </div>
    );
}
