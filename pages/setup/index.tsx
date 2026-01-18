
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle2, Circle, ArrowRight, Settings, Globe, Database, Key, ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function SetupPage() {
    const router = useRouter();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/user/setup-status')
            .then(res => res.json())
            .then(data => {
                setStatus(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
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
            id: 'platform',
            title: 'Platform Connections',
            desc: 'Connect WordPress, LinkedIn, or other platforms for auto-publishing.',
            done: status?.steps?.platform,
            icon: <Settings className="w-6 h-6 text-orange-600" />,
            action: () => router.push('/profile/connections'),
            btnText: 'Connect Platforms',
            required: false
        },
        {
            id: 'mcp',
            title: 'API & MCP Setup',
            desc: 'Generate API Keys for AI Agents and programmatic access.',
            done: status?.steps?.mcp,
            icon: <Key className="w-6 h-6 text-indigo-600" />,
            action: () => router.push('/profile/api-keys'),
            btnText: 'Manage API Keys',
            required: false
        }
    ];

    return (
        <DashboardLayout>
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
                        {steps.map((step, index) => (
                            <div key={step.id} className={`p-6 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all duration-300 hover:bg-gray-50 ${step.done ? 'bg-white opacity-80' : 'bg-white'}`}>
                                <div className={`flex-shrink-0 p-3 rounded-xl ${step.done ? 'bg-green-100' : 'bg-gray-100 text-gray-500'}`}>
                                    {step.done ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : step.icon}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`text-lg font-semibold ${step.done ? 'text-gray-900' : 'text-blue-900'}`}>{step.title}</h3>
                                        {!step.required && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Optional</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{step.desc}</p>
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
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
