import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useFetchDomains } from '../../services/domains';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'react-hot-toast';
import {
    Key,
    Plus,
    Trash2,
    Copy,
    CheckCircle2,
    AlertCircle,
    Clock,
    Shield,
    Activity,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Info,
    AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ApiKeysPage() {
    const router = useRouter();
    const { t, locale, setLocale } = useLanguage();
    const currentLocale = locale || 'en';

    const { data: domainsData } = useFetchDomains(router);

    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyData, setNewKeyData] = useState<any>(null);
    const [expandedKeyId, setExpandedKeyId] = useState<number | null>(null);
    const [userApiKeys, setUserApiKeys] = useState<{ [keyId: number]: string }>({});

    // Confirmation State
    const [confirmId, setConfirmId] = useState<number | null>(null);
    const [confirmAction, setConfirmAction] = useState<'delete' | 'revoke' | null>(null);

    // Form state
    const [keyName, setKeyName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [expiresInDays, setExpiresInDays] = useState(30);

    const AVAILABLE_PERMISSIONS = {
        'read:domains': { label: t('apiKeys.permLabels.readDomains'), desc: t('apiKeys.permLabels.readDomainsDesc') },
        'read:keywords': { label: t('apiKeys.permLabels.readKeywords'), desc: t('apiKeys.permLabels.readKeywordsDesc') },
        'read:posts': { label: t('apiKeys.permLabels.readPosts'), desc: t('apiKeys.permLabels.readPostsDesc') },
        'read:gsc': { label: t('apiKeys.permLabels.readGsc'), desc: t('apiKeys.permLabels.readGscDesc') },
        'write:posts': { label: t('apiKeys.permLabels.writePosts'), desc: t('apiKeys.permLabels.writePostsDesc') },
        'write:keywords': { label: t('apiKeys.permLabels.writeKeywords'), desc: t('apiKeys.permLabels.writeKeywordsDesc') },
        'publish:wordpress': { label: t('apiKeys.permLabels.publishWordpress'), desc: t('apiKeys.permLabels.publishWordpressDesc') },
    };

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const fetchApiKeys = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/mcp/keys', {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (res.ok) {
                setApiKeys(data.keys || []);
            }
        } catch (error) {
            console.error('Failed to fetch API keys', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateKey = async () => {
        if (!keyName.trim()) {
            toast.error('Please enter a name for your connection');
            return;
        }

        if (selectedPermissions.length === 0) {
            toast.error('Please select at least one permission');
            return;
        }

        try {
            const res = await fetch('/api/mcp/keys', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: keyName,
                    permissions: selectedPermissions,
                    expiresInDays
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create connection');
            }

            setNewKeyData(data);
            setShowCreateModal(false);
            fetchApiKeys();
            toast.success('Connection created successfully!', { icon: '✅' });

            // Reset form
            setKeyName('');
            setSelectedPermissions([]);
            setExpiresInDays(30);

        } catch (error: any) {
            toast.error(error.message || 'Failed to create connection', { icon: '❌' });
        }
    };

    const initiateRevoke = (keyId: number) => {
        setConfirmId(keyId);
        setConfirmAction('revoke');
    };

    const initiateDelete = (keyId: number) => {
        setConfirmId(keyId);
        setConfirmAction('delete');
    };

    const closeConfirmModal = () => {
        setConfirmId(null);
        setConfirmAction(null);
    };

    const performConfirmAction = async () => {
        if (!confirmId || !confirmAction) return;

        if (confirmAction === 'revoke') {
            await handleRevokeKey(confirmId);
        } else {
            await handleDeleteKey(confirmId);
        }

        closeConfirmModal();
    };

    const handleRevokeKey = async (keyId: number) => {
        try {
            const res = await fetch('/api/mcp/keys', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ keyId, revoked: true })
            });

            if (!res.ok) {
                throw new Error('Failed to disable connection');
            }

            fetchApiKeys();
            toast.success('Connection disabled successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to disable connection');
        }
    };

    const handleDeleteKey = async (keyId: number) => {
        try {
            const res = await fetch(`/api/mcp/keys?keyId=${keyId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!res.ok) {
                throw new Error('Failed to delete connection');
            }

            fetchApiKeys();
            toast.success('Connection deleted successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete connection');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(t('apiKeys.successModal.copy') + '!', { icon: '📋' });
    };

    const togglePermission = (perm: string) => {
        if (selectedPermissions.includes(perm)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
        } else {
            setSelectedPermissions([...selectedPermissions, perm]);
        }
    };

    const handleViewSetup = async (keyId: number) => {
        // Toggle expanded state
        if (expandedKeyId === keyId) {
            setExpandedKeyId(null);
            return;
        }

        setExpandedKeyId(keyId);

        // Security: API keys cannot be retrieved after creation
        // Show a message instead
        if (!userApiKeys[keyId]) {
            setUserApiKeys(prev => ({ ...prev, [keyId]: '***************************' }));
        }
    };

    return (
        <DashboardLayout selectedLang={currentLocale} onLanguageChange={setLocale} domains={domainsData?.domains || []}>
            <Head>
                <title>{t('apiKeys.title')}</title>
            </Head>

            <div className="h-full w-full p-6 space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Key className="h-6 w-6" />
                        {t('apiKeys.title')}
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        {t('apiKeys.subtitle')}
                    </p>
                </div>

                {/* New Key Success Modal */}
                {newKeyData && (
                    <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                        <CardHeader className="border-b border-green-200">
                            <CardTitle className="flex items-center gap-2 text-green-900">
                                <CheckCircle2 className="h-6 w-6" />
                                {t('apiKeys.successModal.title')}
                            </CardTitle>
                            <CardDescription className="text-green-700">
                                {t('apiKeys.successModal.subtitle')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Step 1 */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                    <h4 className="font-semibold text-green-900">{t('apiKeys.successModal.step1')}</h4>
                                </div>
                                <div className="ml-8">
                                    <p className="text-sm text-green-700 mb-2">{t('apiKeys.successModal.step1Desc')}</p>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-white border-2 border-green-300 p-4 rounded-lg text-green-900 font-mono text-sm break-all">
                                            {newKeyData.apiKey}
                                        </code>
                                        <Button
                                            onClick={() => copyToClipboard(newKeyData.apiKey)}
                                            className="bg-green-600 hover:bg-green-700"
                                            size="lg"
                                        >
                                            <Copy className="h-5 w-5 mr-2" />
                                            {t('apiKeys.successModal.copy')}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                    <h4 className="font-semibold text-green-900">{t('apiKeys.successModal.step2')}</h4>
                                </div>
                                <div className="ml-8 space-y-2">
                                    <p className="text-sm text-green-700">{t('apiKeys.successModal.step2Desc')}</p>
                                    <div className="bg-white border-2 border-green-300 rounded-lg p-4">
                                        <code className="text-xs text-green-900 block whitespace-pre">
                                            {`{
  "mcpServers": {
    "dpro-seo-agent": {
      "url": "http://localhost:55781/api/mcp/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer ${newKeyData.apiKey}"
      }
    }
  }
}`}
                                        </code>
                                    </div>
                                    <a
                                        href="https://docs.anthropic.com/claude/docs/mcp"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-green-700 hover:text-green-900 flex items-center gap-1 mt-2"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        {t('apiKeys.viewGuide')}
                                    </a>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                    <h4 className="font-semibold text-green-900">{t('apiKeys.successModal.step3')}</h4>
                                </div>
                                <div className="ml-8">
                                    <p className="text-sm text-green-700">{t('apiKeys.successModal.step3Desc')}</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 ml-8">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-900">{t('apiKeys.successModal.important')}</p>
                                        <p className="text-sm text-amber-800">{t('apiKeys.successModal.importantDesc')}</p>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={() => setNewKeyData(null)} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                {t('apiKeys.successModal.saved')}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {showCreateModal && (
                    <Card className="border-blue-300 shadow-xl">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <CardTitle className="text-xl">{t('apiKeys.createModal.title')}</CardTitle>
                            <CardDescription>{t('apiKeys.createModal.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Connection Name */}
                            <div className="bg-neutral-50 p-5 rounded-lg">
                                <label className="text-base font-semibold mb-3 block">{t('apiKeys.createModal.nameLabel')}</label>
                                <input
                                    type="text"
                                    placeholder={t('apiKeys.createModal.namePlaceholder')}
                                    value={keyName}
                                    onChange={(e) => setKeyName(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                />
                                <p className="text-xs text-neutral-500 mt-2">{t('apiKeys.createModal.nameHelp')}</p>
                            </div>

                            {/* Permissions */}
                            <div className="bg-neutral-50 p-5 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-base font-semibold">{t('apiKeys.createModal.permLabel')}</label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (selectedPermissions.length === Object.keys(AVAILABLE_PERMISSIONS).length) {
                                                setSelectedPermissions([]);
                                            } else {
                                                setSelectedPermissions(Object.keys(AVAILABLE_PERMISSIONS));
                                            }
                                        }}
                                        className="text-xs"
                                    >
                                        {selectedPermissions.length === Object.keys(AVAILABLE_PERMISSIONS).length ? t('apiKeys.createModal.deselectAll') : t('apiKeys.createModal.selectAll')}
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {Object.entries(AVAILABLE_PERMISSIONS).map(([key, { label, desc }]) => (
                                        <label
                                            key={key}
                                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPermissions.includes(key)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-neutral-200 bg-white hover:border-blue-300 hover:bg-neutral-50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes(key)}
                                                onChange={() => togglePermission(key)}
                                                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-neutral-900">{label}</div>
                                                <div className="text-sm text-neutral-600 mt-0.5">{desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Expiration */}
                            <div className="bg-neutral-50 p-5 rounded-lg">
                                <label className="text-base font-semibold mb-3 block">{t('apiKeys.createModal.expiryLabel')}</label>
                                <select
                                    value={expiresInDays}
                                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                                    className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                >
                                    <option value={7}>{t('apiKeys.expiryOptions.7')}</option>
                                    <option value={30}>{t('apiKeys.expiryOptions.30')}</option>
                                    <option value={90}>{t('apiKeys.expiryOptions.90')}</option>
                                    <option value={365}>{t('apiKeys.expiryOptions.365')}</option>
                                    <option value={0}>{t('apiKeys.expiryOptions.0')}</option>
                                </select>
                                <p className="text-xs text-neutral-500 mt-2">{t('apiKeys.createModal.expiryHelp')}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                <Button onClick={handleCreateKey} className="flex-1 bg-blue-600 hover:bg-blue-700" size="lg">
                                    <Plus className="mr-2 h-5 w-5" />
                                    {t('apiKeys.createModal.create')}
                                </Button>
                                <Button onClick={() => setShowCreateModal(false)} variant="outline" className="flex-1" size="lg">
                                    {t('apiKeys.createModal.cancel')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Create Button (always visible) */}
                {!showCreateModal && !newKeyData && apiKeys.length > 0 && (
                    <div className="flex justify-end">
                        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700" size="lg">
                            <Plus className="mr-2 h-5 w-5" />
                            {t('apiKeys.create')}
                        </Button>
                    </div>
                )}

                {/* Active Connections List */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        {t('apiKeys.activeConnections', { count: apiKeys.length })}
                    </h2>

                    {isLoading ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Activity className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                                <p className="text-neutral-500">{t('common.loading')}</p>
                            </CardContent>
                        </Card>
                    ) : apiKeys.length === 0 ? (
                        <Card className="border-2 border-dashed border-neutral-300">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="bg-neutral-100 p-4 rounded-full mb-4">
                                    <Key className="h-12 w-12 text-neutral-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{t('apiKeys.noConnections')}</h3>
                                <p className="text-neutral-500 text-center max-w-md mb-6">
                                    {t('apiKeys.noConnectionsDesc')}
                                </p>
                                <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700" size="lg">
                                    <Plus className="mr-2 h-5 w-5" />
                                    {t('apiKeys.createFirst')}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {apiKeys.map((key) => (
                                <Card key={key.id} className={key.revoked ? 'border-red-200 bg-red-50' : 'border-neutral-200 hover:shadow-md transition-shadow'}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`p-2 rounded-lg ${key.revoked ? 'bg-red-100' : 'bg-blue-100'}`}>
                                                        <Key className={`h-5 w-5 ${key.revoked ? 'text-red-600' : 'text-blue-600'}`} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{key.name}</h3>
                                                        {key.revoked && <Badge variant="destructive" className="mt-1">{t('apiKeys.disabled')}</Badge>}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                                    <div className="flex items-center gap-2 text-neutral-600">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{t('apiKeys.created', { date: new Date(key.created_at).toLocaleDateString() })}</span>
                                                    </div>
                                                    {key.last_used_at && (
                                                        <div className="flex items-center gap-2 text-neutral-600">
                                                            <Activity className="h-4 w-4" />
                                                            <span>{t('apiKeys.lastUsed', { date: new Date(key.last_used_at).toLocaleDateString() })}</span>
                                                        </div>
                                                    )}
                                                    {key.expires_at && (
                                                        <div className="flex items-center gap-2 text-neutral-600">
                                                            <AlertCircle className="h-4 w-4" />
                                                            <span>{t('apiKeys.expires', { date: new Date(key.expires_at).toLocaleDateString() })}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="text-xs font-semibold text-neutral-500 mb-2">{t('apiKeys.permissions')}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {key.permissions.map((perm: string) => {
                                                            const permInfo = AVAILABLE_PERMISSIONS[perm as keyof typeof AVAILABLE_PERMISSIONS];
                                                            return (
                                                                <Badge key={perm} variant="secondary" className="text-xs">
                                                                    <Shield className="h-3 w-3 mr-1" />
                                                                    {permInfo?.label || perm}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 ml-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewSetup(key.id)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    {expandedKeyId === key.id ? (
                                                        <>
                                                            <ChevronUp className="h-4 w-4 mr-1" />
                                                            {t('apiKeys.hideSetup')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Info className="h-4 w-4 mr-1" />
                                                            {t('apiKeys.viewSetup')}
                                                        </>
                                                    )}
                                                </Button>
                                                {!key.revoked && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => initiateRevoke(key.id)}
                                                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                    >
                                                        {t('apiKeys.disable')}
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => initiateDelete(key.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    {t('apiKeys.delete')}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Expandable Setup Instructions */}
                                        {expandedKeyId === key.id && (
                                            <div className="mt-4 pt-4 border-t border-neutral-200">
                                                {/* Security Notice */}
                                                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-amber-900">{t('apiKeys.securityNotice')}</p>
                                                            <p className="text-sm text-amber-800 mt-1">
                                                                {t('apiKeys.securityDesc')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                                        <Info className="h-4 w-4" />
                                                        {t('apiKeys.setupTitle')}
                                                    </h4>
                                                    <div className="space-y-3 text-sm">
                                                        <div>
                                                            <p className="font-medium text-blue-900 mb-1">{t('apiKeys.setupClaude')}</p>
                                                            <p className="text-blue-700 mb-2">{t('apiKeys.setupConfig')}</p>
                                                            <div className="relative bg-white border border-blue-300 rounded p-3">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => copyToClipboard(`{
  "mcpServers": {
    "dpro-seo-agent": {
      "url": "http://localhost:55781/api/mcp/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer ${userApiKeys[key.id] || 'YOUR_API_KEY'}"
      }
    }
  }
}`)}
                                                                    className="absolute top-2 right-2 h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                                                >
                                                                    <Copy className="h-4 w-4" />
                                                                </Button>
                                                                <code className="text-xs text-blue-900 block whitespace-pre pr-10">
                                                                    {`{
  "mcpServers": {
    "dpro-seo-agent": {
      "url": "http://localhost:55781/api/mcp/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer ${userApiKeys[key.id] || 'YOUR_API_KEY'}"
      }
    }
  }
}`}
                                                                </code>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href="https://docs.anthropic.com/claude/docs/mcp"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-700 hover:text-blue-900 flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            {t('apiKeys.viewGuide')}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirmation Dialog */}
                <Dialog open={!!confirmId} onOpenChange={(open) => !open && closeConfirmModal()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                {confirmAction === 'delete' ? 'Delete Connection?' : 'Disable Connection?'}
                            </DialogTitle>
                            <DialogDescription>
                                {confirmAction === 'delete'
                                    ? 'Are you sure you want to delete this connection permanently? This action cannot be undone.'
                                    : 'Are you sure you want to disable this connection? Any applications using it will stop working immediately.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeConfirmModal}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={performConfirmAction}>
                                {confirmAction === 'delete' ? 'Delete Permanently' : 'Disable Connection'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
}
