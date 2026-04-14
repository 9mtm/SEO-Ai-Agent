
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle2, Circle, ArrowRight, Settings, Globe, Database, Key, ShieldCheck, Bot, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useFetchDomains } from '../../services/domains';
import toast from 'react-hot-toast';

export default function SetupPage() {
    const router = useRouter();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);
    const [mcpTrial, setMcpTrial] = useState<any>(null);
    const { data: domainsData } = useFetchDomains(router);

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://seo-agent.net';
    const mcpUrl = `${appUrl}/api/mcp`;

    const copyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        toast.success(`${label} copied!`);
        setTimeout(() => setCopied(null), 2000);
    };

    useEffect(() => {
        fetch('/api/user/setup-status')
            .then(res => res.json())
            .then(data => { setStatus(data); setLoading(false); })
            .catch(() => setLoading(false));
        fetch('/api/user/mcp-trial')
            .then(res => res.json())
            .then(data => setMcpTrial(data))
            .catch(() => {});
    }, []);

    const steps = [
        {
            id: 'account',
            title: 'Create Account',
            desc: 'Sign up and verify your email.',
            done: true,
            icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
            action: null,
            btnText: '',
            required: true
        },
        {
            id: 'gsc_domain',
            title: 'Connect Search Console & Add Site',
            desc: 'Link your Google Search Console to import and track your website data automatically.',
            done: status?.steps?.gsc_domain,
            icon: <Globe className="w-6 h-6 text-blue-600" />,
            action: () => router.push('/onboarding'),
            btnText: 'Connect GSC',
            required: true
        },
        {
            id: 'scraper',
            title: 'Scraper Configuration',
            desc: 'Configure scraping settings to track competitors and keywords efficiently.',
            done: status?.steps?.scraper,
            icon: <Database className="w-6 h-6 text-purple-600" />,
            action: () => router.push('/settings'),
            btnText: 'Configure Scraper',
            required: true
        },
        {
            id: 'ai_connected',
            title: 'Connect Your AI Assistant',
            desc: null, // custom render below
            done: status?.steps?.ai_connected,
            icon: <Bot className="w-6 h-6 text-indigo-600" />,
            action: null,
            btnText: '',
            required: true,
            customContent: true
        }
    ];

    return (
        <DashboardLayout domains={domainsData?.domains || []}>
            <Head><title>System Setup | SEO AI Agent</title></Head>
            <div className="max-w-4xl mx-auto py-10 px-4">
                <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">System Setup Guide</h1>
                    <p className="text-gray-500">Complete these steps to fully unleash the power of your AI Agent.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-700">
                    {/* Progress Header */}
                    <div className="p-6 bg-gray-50 border-b border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                Setup Progress
                                {status?.percentage === 100 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Complete</span>}
                            </span>
                            <span className="text-lg font-bold text-blue-600">{status?.percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${loading ? 0 : (status?.percentage || 0)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Steps List */}
                    <div className="divide-y divide-gray-100">
                        {steps.map((step: any, index) => (
                            <div key={step.id} className={`p-6 transition-all duration-300 hover:bg-gray-50 ${step.done ? 'bg-white opacity-80' : 'bg-white'}`}>
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <div className={`flex-shrink-0 p-3 rounded-xl ${step.done ? 'bg-green-100' : 'bg-gray-100 text-gray-500'}`}>
                                        {step.done ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : step.icon}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-lg font-semibold ${step.done ? 'text-gray-900' : 'text-blue-900'}`}>{step.title}</h3>
                                            {!step.required && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Optional</span>}
                                        </div>
                                        {step.desc && <p className="text-sm text-gray-500 mt-1">{step.desc}</p>}
                                    </div>
                                    <div className="flex-shrink-0 mt-4 md:mt-0 w-full md:w-auto">
                                        {step.done ? (
                                            <Button variant="outline" className="w-full md:w-auto border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 cursor-default">
                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Completed
                                            </Button>
                                        ) : (
                                            step.action && (
                                                <Button onClick={step.action} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                                    {step.btnText} <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* MCP Inline Connect */}
                                {step.customContent && !step.done && (
                                    <div className="mt-4 ml-0 md:ml-16 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-5">
                                        {/* Trial expired */}
                                        {mcpTrial?.trial && !mcpTrial.mcpAllowed && (
                                            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-sm font-semibold text-amber-800 mb-2">Your free MCP trial has ended</p>
                                                <p className="text-sm text-amber-700 mb-3">
                                                    Upgrade to Basic for just <strong>$29/year</strong> (only $2.42/month) to keep using your AI assistant.
                                                </p>
                                                <Button onClick={() => router.push('/profile/billing')} className="bg-amber-600 hover:bg-amber-700 text-white">
                                                    Upgrade Now <ArrowRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-700 mb-4">
                                            Connect your AI assistant in <strong>10 seconds</strong>. No tokens, no copying config files. Just add this URL to Claude Desktop, Cursor or ChatGPT — you'll be sent here to approve, then sent back automatically.
                                        </p>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">1. MCP Server Name</label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-white rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-900">SEO AI Agent</div>
                                                    <Button onClick={() => copyText('SEO AI Agent', 'Name')} variant="outline" className="flex-shrink-0 border-indigo-300 hover:bg-indigo-100">
                                                        {copied === 'Name' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                        {copied === 'Name' ? 'Copied' : 'Copy'}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">2. MCP Server URL</label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-white rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-mono text-gray-900 truncate">{mcpUrl}</div>
                                                    <Button onClick={() => copyText(mcpUrl, 'URL')} variant="outline" className="flex-shrink-0 border-indigo-300 hover:bg-indigo-100">
                                                        {copied === 'URL' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                        {copied === 'URL' ? 'Copied' : 'Copy'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-3">
                                            That's it. Your AI client will automatically open this site in your browser, ask you to approve the connection, and then you'll be redirected back to your AI — already connected.
                                        </p>
                                        <a href="/mcp-seo" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2 font-medium">
                                            View detailed setup guide <ArrowRight className="w-3 h-3" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
