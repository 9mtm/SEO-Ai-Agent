import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Key, Plus, Trash2, Copy, AlertCircle, Shield, Link2, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useFetchDomains } from '../../services/domains';

const ALL_SCOPES = [
    { id: 'read:profile', label: 'Read profile' },
    { id: 'read:domains', label: 'Read domains' },
    { id: 'write:domains', label: 'Write domains' },
    { id: 'read:gsc', label: 'Read GSC data' },
    { id: 'read:keywords', label: 'Read keywords' },
    { id: 'write:keywords', label: 'Write keywords' },
    { id: 'read:analytics', label: 'Read analytics' }
];

export default function OAuthAppsPage() {
    const router = useRouter();
    const { data: domainsData } = useFetchDomains(router);
    const [clients, setClients] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [personalTokens, setPersonalTokens] = useState<any[]>([]);
    const [newPersonalToken, setNewPersonalToken] = useState<string | null>(null);
    const [newClient, setNewClient] = useState<any>(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        website_url: '',
        redirect_uris: '',
        scopes: ['read:profile'] as string[]
    });

    const load = async () => {
        const [clientsRes, connsRes, tokensRes] = await Promise.all([
            fetch('/api/oauth/clients').then((r) => r.json()).catch(() => ({})),
            fetch('/api/oauth/connections').then((r) => r.json()).catch(() => ({})),
            fetch('/api/oauth/personal-token').then((r) => r.json()).catch(() => ({}))
        ]);
        if (clientsRes?.clients) setClients(clientsRes.clients);
        if (connsRes?.connections) setConnections(connsRes.connections);
        if (tokensRes?.tokens) setPersonalTokens(tokensRes.tokens);
    };

    const generatePersonalToken = async () => {
        const name = prompt('Name this token (e.g. "Claude Desktop - MacBook"):', 'Personal Access Token');
        if (!name) return;
        const res = await fetch('/api/oauth/personal-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            setNewPersonalToken(data.token);
            load();
            toast.success('Token generated — copy it now!');
        } else {
            toast.error(data.error || 'Failed');
        }
    };

    const revokePersonalToken = async (id: number) => {
        if (!confirm('Revoke this token? Any client using it will stop working.')) return;
        const res = await fetch(`/api/oauth/personal-token?id=${id}`, { method: 'DELETE' });
        if (res.ok) { toast.success('Revoked'); load(); }
        else toast.error('Failed');
    };

    useEffect(() => { load(); }, []);

    const revokeConnection = async (id: number) => {
        if (!confirm('Disconnect this app? It will no longer be able to access your data.')) return;
        const res = await fetch(`/api/oauth/connections?client_id=${id}`, { method: 'DELETE' });
        if (res.ok) { toast.success('Disconnected'); load(); }
        else toast.error('Failed');
    };

    const fmtDate = (d: string | null) => {
        if (!d) return 'Never';
        const date = new Date(d);
        const now = Date.now();
        const diff = now - date.getTime();
        if (diff < 60 * 1000) return 'Just now';
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}d ago`;
        return date.toLocaleDateString();
    };

    const create = async () => {
        if (!form.name || !form.redirect_uris) { toast.error('Name and redirect URIs are required'); return; }
        const uris = form.redirect_uris.split(/\s+|,/).filter(Boolean);
        try {
            const res = await fetch('/api/oauth/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, redirect_uris: uris })
            });
            const data = await res.json();
            if (res.ok) {
                setNewClient(data.client);
                setForm({ name: '', description: '', website_url: '', redirect_uris: '', scopes: ['read:profile'] });
                load();
                toast.success('App created — copy your secret now!');
            } else {
                toast.error(data.error || 'Failed');
            }
        } catch { toast.error('Error'); }
    };

    const remove = async (id: number) => {
        if (!confirm('Delete this app? Existing tokens will stop working.')) return;
        const res = await fetch(`/api/oauth/clients?id=${id}`, { method: 'DELETE' });
        if (res.ok) { toast.success('Deleted'); load(); }
    };

    const toggleScope = (s: string) => {
        setForm((f) => ({
            ...f,
            scopes: f.scopes.includes(s) ? f.scopes.filter((x) => x !== s) : [...f.scopes, s]
        }));
    };

    return (
        <DashboardLayout domains={domainsData?.domains || []}>
            <Head><title>OAuth Apps - SEO AI Agent</title></Head>

            <div className="max-w-4xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
                        <Shield className="h-7 w-7" /> Connected Apps
                    </h1>
                    <p className="text-neutral-600">AI assistants and third-party apps that are currently authorized to access your workspace.</p>
                </div>

                {/* Quick-Connect Instructions */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <Link2 className="h-5 w-5" /> Connect your AI assistant in 10 seconds
                        </CardTitle>
                        <CardDescription className="text-blue-800">
                            No tokens, no copying. Just add this URL to Claude Desktop, Cursor or ChatGPT — you'll be sent here to approve, then sent back automatically.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <div className="text-xs font-semibold text-blue-900 mb-1">1. MCP Server Name</div>
                            <div className="flex items-center gap-2">
                                <code className="bg-white px-3 py-2 rounded border border-blue-200 flex-1 text-sm font-mono">SEO AI Agent</code>
                                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText('SEO AI Agent'); toast.success('Copied'); }}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-blue-900 mb-1">2. MCP Server URL</div>
                            <div className="flex items-center gap-2">
                                <code className="bg-white px-3 py-2 rounded border border-blue-200 flex-1 text-sm font-mono truncate">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : '/api/mcp'}
                                </code>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const url = typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : '/api/mcp';
                                        navigator.clipboard.writeText(url);
                                        toast.success('Copied');
                                    }}
                                >
                                    <Copy className="h-3 w-3 mr-1" /> Copy URL
                                </Button>
                            </div>
                        </div>
                        <div className="text-xs text-blue-800 pt-2 border-t border-blue-200">
                            <strong>That's it.</strong> Your AI client will automatically open this site in your browser, ask you to approve the connection, and then you'll be redirected back to your AI — already connected.
                        </div>
                    </CardContent>
                </Card>

                {/* Active Connections */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5" />
                            Active Connections ({connections.length})
                        </CardTitle>
                        <CardDescription>
                            These apps have an active access token for your account. Revoke any you no longer use.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {connections.length === 0 ? (
                            <div className="text-center py-8 text-sm text-neutral-500">
                                <Link2 className="h-10 w-10 mx-auto mb-2 text-neutral-300" />
                                <p>No external app is currently connected.</p>
                                <p className="mt-1 text-xs">
                                    When you connect Claude Desktop, Cursor, ChatGPT or any MCP-compatible AI assistant, it will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {connections.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between gap-3 py-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                                                {c.logo_url ? (
                                                    <img src={c.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <Shield className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold flex items-center gap-2">
                                                    <span className="truncate">{c.name}</span>
                                                    {c.is_own_app && (
                                                        <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">Your app</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-neutral-500 flex items-center gap-3 mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> Last used {fmtDate(c.last_used_at || c.first_authorized_at)}
                                                    </span>
                                                    <span>• {c.active_tokens} active token{c.active_tokens !== 1 && 's'}</span>
                                                </div>
                                                {c.scopes?.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {c.scopes.map((s: string) => (
                                                            <span key={s} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => revokeConnection(c.id)}>
                                            <Trash2 className="h-4 w-4 mr-1 text-red-600" /> Revoke
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="pt-4 border-t border-neutral-200">
                    <h2 className="text-xl font-bold text-neutral-900 mb-1 flex items-center gap-2">
                        <Key className="h-5 w-5" /> Developer — Register an App
                    </h2>
                    <p className="text-sm text-neutral-600">If you're building an app, register it here to get OAuth credentials.</p>
                </div>

                {newClient && (
                    <Card className="border-yellow-300 bg-yellow-50">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-2 mb-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold text-yellow-900">Save your client secret now!</div>
                                    <div className="text-sm text-yellow-800">This secret is shown only once.</div>
                                </div>
                            </div>
                            <div className="space-y-2 font-mono text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">client_id:</span>
                                    <code className="bg-white px-2 py-1 rounded flex-1 truncate">{newClient.client_id}</code>
                                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newClient.client_id); toast.success('Copied'); }}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">client_secret:</span>
                                    <code className="bg-white px-2 py-1 rounded flex-1 truncate">{newClient.client_secret}</code>
                                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newClient.client_secret); toast.success('Copied'); }}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <Button className="mt-3" variant="outline" onClick={() => setNewClient(null)}>I saved it</Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Register new app</CardTitle>
                        <CardDescription>Create OAuth credentials for a third-party app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input placeholder="App name (e.g. My Dashboard)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        <Input placeholder="Website URL (optional)" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
                        <Input placeholder="Redirect URIs (comma or space separated)" value={form.redirect_uris} onChange={(e) => setForm({ ...form, redirect_uris: e.target.value })} />
                        <div>
                            <div className="text-sm font-semibold mb-2">Scopes</div>
                            <div className="flex flex-wrap gap-2">
                                {ALL_SCOPES.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => toggleScope(s.id)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.scopes.includes(s.id) ? 'bg-primary text-white border-primary' : 'bg-white text-neutral-600 border-neutral-300'}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button onClick={create}><Plus className="h-4 w-4 mr-2" /> Create App</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your apps ({clients.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {clients.length === 0 && <div className="text-sm text-neutral-500 py-4">No apps yet.</div>}
                            {clients.map((c) => (
                                <div key={c.id} className="flex items-center justify-between py-3">
                                    <div>
                                        <div className="font-semibold">{c.name}</div>
                                        <div className="text-xs text-neutral-500 font-mono">{c.client_id}</div>
                                        <div className="text-xs text-neutral-500 mt-1">
                                            Scopes: {(c.allowed_scopes || []).join(', ')}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
