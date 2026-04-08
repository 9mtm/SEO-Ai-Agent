import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Building2, Plus, Check, Pencil, X, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useFetchDomains } from '../../services/domains';

type WS = { id: number; name: string; slug: string; role: string; is_personal: boolean; is_current: boolean };

export default function WorkspacesPage() {
    const router = useRouter();
    const { data: domainsData } = useFetchDomains(router);
    const [workspaces, setWorkspaces] = useState<WS[]>([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const load = async () => {
        const res = await fetch('/api/workspaces');
        const data = await res.json();
        if (data.workspaces) setWorkspaces(data.workspaces);
    };

    useEffect(() => { load(); }, []);

    const create = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (res.ok) { toast.success('Workspace created'); setName(''); load(); }
            else toast.error('Failed');
        } finally { setLoading(false); }
    };

    const startEdit = (ws: WS) => {
        setEditingId(ws.id);
        setEditName(ws.name);
    };

    const saveRename = async (id: number) => {
        if (!editName.trim()) return;
        try {
            const res = await fetch(`/api/workspaces?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() })
            });
            const data = await res.json();
            if (res.ok) { toast.success('Renamed'); setEditingId(null); load(); }
            else toast.error(data.error || 'Failed');
        } catch { toast.error('Error'); }
    };

    const cancelEdit = () => { setEditingId(null); setEditName(''); };

    const deleteWorkspace = async (ws: WS) => {
        const confirmName = prompt(`This will permanently delete "${ws.name}" and all its domains, keywords and posts.\n\nType the workspace name to confirm:`);
        if (confirmName !== ws.name) {
            if (confirmName !== null) toast.error('Name did not match — cancelled');
            return;
        }
        const res = await fetch(`/api/workspaces?id=${ws.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            toast.success('Workspace deleted');
            if (ws.is_current) window.location.reload();
            else load();
        } else {
            toast.error(data.error || 'Failed');
        }
    };

    const switchTo = async (id: number) => {
        const res = await fetch('/api/workspaces/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: id })
        });
        if (res.ok) { toast.success('Switched'); window.location.reload(); }
    };

    return (
        <DashboardLayout domains={domainsData?.domains || []}>
            <Head><title>Workspaces - SEO AI Agent</title></Head>

            <div className="max-w-4xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
                        <Building2 className="h-7 w-7" /> Workspaces
                    </h1>
                    <p className="text-neutral-600">Create separate workspaces for different clients, teams or brands.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create new workspace</CardTitle>
                        <CardDescription>You will be the owner and can invite team members.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Workspace name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={create} disabled={loading || !name.trim()}>
                                <Plus className="h-4 w-4 mr-2" /> Create
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your workspaces ({workspaces.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {workspaces.map((ws) => {
                                const canRename = ws.role === 'owner' || ws.role === 'admin';
                                const isEditing = editingId === ws.id;
                                return (
                                    <div key={ws.id} className="flex items-center justify-between py-3 gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') saveRename(ws.id);
                                                                if (e.key === 'Escape') cancelEdit();
                                                            }}
                                                            autoFocus
                                                            className="h-8 text-sm"
                                                        />
                                                        <Button size="sm" onClick={() => saveRename(ws.id)} className="h-8 px-2">
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 px-2">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="font-semibold flex items-center gap-2">
                                                            <span className="truncate">{ws.name}</span>
                                                            {ws.is_personal && <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">Personal</span>}
                                                            {canRename && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEdit(ws)}
                                                                    className="text-neutral-400 hover:text-neutral-700 transition-colors"
                                                                    title="Rename"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-neutral-500 uppercase tracking-wide">{ws.role}</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {!isEditing && (
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {ws.is_current ? (
                                                    <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                                                        <Check className="h-4 w-4" /> Current
                                                    </span>
                                                ) : (
                                                    <Button variant="outline" size="sm" onClick={() => switchTo(ws.id)}>
                                                        Switch
                                                    </Button>
                                                )}
                                                {ws.role === 'owner' && !ws.is_personal && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Delete workspace"
                                                        onClick={() => deleteWorkspace(ws)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
