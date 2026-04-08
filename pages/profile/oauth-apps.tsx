import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Key, Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
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
    const [newClient, setNewClient] = useState<any>(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        website_url: '',
        redirect_uris: '',
        scopes: ['read:profile'] as string[]
    });

    const load = async () => {
        const res = await fetch('/api/oauth/clients');
        const data = await res.json();
        if (data.clients) setClients(data.clients);
    };

    useEffect(() => { load(); }, []);

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
                        <Key className="h-7 w-7" /> OAuth Apps
                    </h1>
                    <p className="text-neutral-600">Register third-party apps that can "Sign in with SEO AI Agent" and access our API on behalf of users.</p>
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
