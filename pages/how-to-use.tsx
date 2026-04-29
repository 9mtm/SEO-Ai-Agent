import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Copy, Check, Download, Sparkles, FileCode } from 'lucide-react';
import toast from 'react-hot-toast';
import LandingHeader from '../components/common/LandingHeader';
import Footer from '../components/common/Footer';
import { useLanguage } from '../context/LanguageContext';

export default function HowToUsePage() {
    const { t } = useLanguage();
    const [skill, setSkill] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch('/skills/seo-audit.md')
            .then((r) => r.text())
            .then(setSkill)
            .catch(() => setSkill(''));
    }, []);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(skill);
            setCopied(true);
            toast.success(t('howToUse.copied'));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Copy failed');
        }
    };

    return (
        <>
            <Head>
                <title>{t('howToUse.metaTitle')} — SEO AI Agent</title>
                <meta name="description" content={t('howToUse.metaDescription')} />
                <link rel="canonical" href="https://seo-agent.net/how-to-use" />
            </Head>

            <div className="min-h-screen bg-white">
                <LandingHeader activePage="how-to-use" />

                <main className="pt-24 pb-16">
                    {/* Hero */}
                    <section className="max-w-4xl mx-auto px-4 text-center mb-10">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6">
                            <Sparkles className="h-4 w-4" />
                            {t('howToUse.eyebrow')}
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
                            {t('howToUse.title')}
                        </h1>
                        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                            {t('howToUse.subtitle')}
                        </p>
                    </section>

                    {/* Quick instructions */}
                    <section className="max-w-4xl mx-auto px-4 mb-8">
                        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-6">
                            <h2 className="text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
                                <FileCode className="h-5 w-5 text-indigo-600" />
                                {t('howToUse.quick.title')}
                            </h2>
                            <ol className="list-decimal list-inside space-y-2 text-neutral-700">
                                <li>{t('howToUse.quick.s1')}</li>
                                <li>{t('howToUse.quick.s2')}</li>
                                <li>{t('howToUse.quick.s3')}</li>
                            </ol>
                        </div>
                    </section>

                    {/* Skill viewer */}
                    <section className="max-w-4xl mx-auto px-4">
                        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <FileCode className="h-4 w-4" />
                                    <code className="font-mono">seo-audit.md</code>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={copy}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copied ? t('howToUse.copied') : t('howToUse.copy')}
                                    </button>
                                    <a
                                        href="/skills/seo-audit.md"
                                        download
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-sm font-semibold transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        {t('howToUse.download')}
                                    </a>
                                </div>
                            </div>

                            {/* Content */}
                            <pre className="p-5 overflow-x-auto text-sm leading-relaxed text-neutral-800 bg-white max-h-[600px]">
                                <code className="font-mono whitespace-pre-wrap break-words">{skill || t('howToUse.loading')}</code>
                            </pre>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <Link
                                href="/mcp-seo"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold transition-colors"
                            >
                                {t('howToUse.setupCta')}
                            </Link>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    );
}
