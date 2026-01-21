import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useFetchDomains } from '../../services/domains';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import {
    Zap,
    Copy,
    CheckCircle2,
    ExternalLink,
    Terminal,
    Sparkles,
    ArrowRight,
    Shield,
    Rocket,
    BarChart3,
    Search,
    FileText,
    TrendingUp
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function MCPConnectPage() {
    const router = useRouter();
    const { t, locale, setLocale } = useLanguage();
    const currentLocale = locale || 'en';
    const { data: domainsData } = useFetchDomains(router);

    const [step, setStep] = useState(1);
    const [apiKey, setApiKey] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
        'read:domains',
        'read:keywords',
        'read:posts',
        'read:gsc',
        'write:posts',
        'write:keywords',
        'publish:wordpress'
    ]);

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    const handleGenerateKey = async () => {
        try {
            const res = await fetch('/api/mcp/keys', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: 'MCP Connection - ' + new Date().toLocaleDateString(),
                    permissions: selectedPermissions,
                    expiresInDays: 365
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create API key');
            }

            setApiKey(data.apiKey);
            setStep(2);
            toast.success('API Key generated successfully!', { icon: '✅' });

        } catch (error: any) {
            toast.error(error.message || 'Failed to generate API key', { icon: '❌' });
        }
    };

    const configCode = `{
  "mcpServers": {
    "dpro-seo-agent": {
      "command": "npx",
      "args": ["-y", "seo-agent-mcp-server"],
      "env": {
        "SEO_API_KEY": "${apiKey || 'YOUR_API_KEY'}",
        "API_BASE_URL": "${typeof window !== 'undefined' ? window.location.origin : 'https://seo-agent.net'}"
      }
    }
  }
}`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!', { icon: '📋' });
    };

    return (
        <DashboardLayout selectedLang={currentLocale} onLanguageChange={setLocale} domains={domainsData?.domains || []}>
            <Head>
                <title>Connect MCP - Dpro SEO Agent</title>
            </Head>

            <div className="h-full w-full p-6 space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
                        <Zap className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        Connect to Claude Desktop
                    </h1>
                    <p className="text-neutral-500 text-lg">
                        Get instant access to your SEO data in Claude
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-neutral-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-neutral-200'}`}>
                            {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                        </div>
                        <span className="font-medium">Generate Key</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-neutral-400" />
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-neutral-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-neutral-200'}`}>
                            {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : '2'}
                        </div>
                        <span className="font-medium">Configure</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-neutral-400" />
                    <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-neutral-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-neutral-200'}`}>
                            3
                        </div>
                        <span className="font-medium">Done!</span>
                    </div>
                </div>

                {/* Step 1: Generate API Key */}
                {step === 1 && (
                    <Card className="border-2">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Step 1: Generate Your API Key
                            </CardTitle>
                            <CardDescription>
                                This key will allow Claude Desktop to access your SEO data securely
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Permissions Selection */}
                            <div className="bg-neutral-50 p-5 rounded-lg border-2 border-neutral-200">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-base font-semibold">Choose Permissions</label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const allPermissions = ['read:domains', 'read:keywords', 'read:posts', 'read:gsc', 'write:posts', 'write:keywords', 'publish:wordpress'];
                                            if (selectedPermissions.length === allPermissions.length) {
                                                setSelectedPermissions([]);
                                            } else {
                                                setSelectedPermissions(allPermissions);
                                            }
                                        }}
                                        className="text-xs"
                                    >
                                        {selectedPermissions.length === 7 ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {[
                                        { key: 'read:domains', label: 'View Domains', desc: 'Access your website list and basic info' },
                                        { key: 'read:keywords', label: 'View Keywords', desc: 'See keyword rankings and tracking data' },
                                        { key: 'read:posts', label: 'View Posts', desc: 'Access your blog posts and content' },
                                        { key: 'read:gsc', label: 'View Analytics', desc: 'Access Google Search Console data' },
                                        { key: 'write:posts', label: 'Create Posts', desc: 'Generate and save new blog posts' },
                                        { key: 'write:keywords', label: 'Add Keywords', desc: 'Start tracking new keywords' },
                                        { key: 'publish:wordpress', label: 'Publish to WordPress', desc: 'Publish content directly to your site' },
                                    ].map(({ key, label, desc }) => (
                                        <label
                                            key={key}
                                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedPermissions.includes(key)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-neutral-200 bg-white hover:border-blue-300 hover:bg-neutral-50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes(key)}
                                                onChange={() => {
                                                    if (selectedPermissions.includes(key)) {
                                                        setSelectedPermissions(selectedPermissions.filter(p => p !== key));
                                                    } else {
                                                        setSelectedPermissions([...selectedPermissions, key]);
                                                    }
                                                }}
                                                className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-neutral-900 text-sm">{label}</div>
                                                <div className="text-xs text-neutral-600 mt-0.5">{desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateKey}
                                disabled={selectedPermissions.length === 0}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                size="lg"
                            >
                                <Sparkles className="mr-2 h-5 w-5" />
                                Generate API Key
                            </Button>
                            {selectedPermissions.length === 0 && (
                                <p className="text-sm text-amber-600 text-center">Please select at least one permission</p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Configuration */}
                {step === 2 && (
                    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-900">
                                <CheckCircle2 className="h-6 w-6" />
                                Step 2: Configure Claude Desktop
                            </CardTitle>
                            <CardDescription className="text-green-700">
                                Copy this configuration to your Claude Desktop settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* API Key Display */}
                            <div>
                                <label className="text-sm font-semibold text-green-900 mb-2 block">
                                    Your API Key (save this securely!)
                                </label>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-white border-2 border-green-300 p-4 rounded-lg text-green-900 font-mono text-sm break-all">
                                        {apiKey}
                                    </code>
                                    <Button
                                        onClick={() => copyToClipboard(apiKey)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Copy className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Configuration Code */}
                            <div>
                                <label className="text-sm font-semibold text-green-900 mb-2 block flex items-center gap-2">
                                    <Terminal className="h-4 w-4" />
                                    Configuration
                                </label>
                                <div className="relative">
                                    <Button
                                        onClick={() => copyToClipboard(configCode)}
                                        className="absolute top-3 right-3 z-10 bg-green-600 hover:bg-green-700"
                                        size="sm"
                                    >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                    </Button>
                                    <pre className="bg-neutral-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                                        {configCode}
                                    </pre>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setStep(3)}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    size="lg"
                                >
                                    <Rocket className="mr-2 h-5 w-5" />
                                    I've Added the Configuration
                                </Button>
                            </div>

                            <a
                                href="https://docs.anthropic.com/claude/docs/mcp"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-700 hover:text-green-900 flex items-center gap-1 justify-center"
                            >
                                <ExternalLink className="h-3 w-3" />
                                View Claude MCP Documentation
                            </a>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="pt-12 pb-12 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
                                <CheckCircle2 className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold mb-3">You're All Set!</h2>
                            <p className="text-neutral-600 text-lg mb-8 max-w-md mx-auto">
                                Your SEO Agent is now connected to Claude Desktop. Start asking questions about your SEO data!
                            </p>

                            <div className="bg-white border-2 border-blue-300 rounded-lg p-6 max-w-lg mx-auto mb-6">
                                <h4 className="font-semibold text-blue-900 mb-3">Try these commands:</h4>
                                <div className="space-y-2 text-sm text-left">
                                    <div className="bg-blue-50 p-3 rounded">
                                        <code className="text-blue-900">"Show me my keyword rankings"</code>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded">
                                        <code className="text-blue-900">"What are my top performing pages?"</code>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded">
                                        <code className="text-blue-900">"Create a blog post about [topic]"</code>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => router.push('/profile/api-keys')}
                                variant="outline"
                                size="lg"
                            >
                                Manage API Keys
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
