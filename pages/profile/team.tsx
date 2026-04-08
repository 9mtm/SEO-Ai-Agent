import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Users, Mail, Trash2, Copy, Clock, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useFetchDomains } from '../../services/domains';
import { useAppDialogs } from '../../components/common/AppDialog';
export { getServerSideProps } from '../../utils/ownerOnlyPage';

type Member = {
    id: number;
    user_id: number;
    role: string;
    status: string;
    joined_at: string;
    user: { id: number; name: string; email: string; picture?: string } | null;
};

export default function TeamPage() {
    const router = useRouter();
    const { data: domainsData } = useFetchDomains(router);
    const { confirmDialog, Dialogs } = useAppDialogs();
    const [members, setMembers] = useState<Member[]>([]);
    const [pending, setPending] = useState<any[]>([]);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
    const [loading, setLoading] = useState(false);

    const loadMembers = async () => {
        try {
            const res = await fetch('/api/workspaces/members');
            const data = await res.json();
            if (data.members) setMembers(data.members);
            if (data.pending) setPending(data.pending);
        } catch (e) { }
    };

    const revokeInvite = async (id: number) => {
        const ok = await confirmDialog({
            title: 'Revoke this invitation?',
            description: 'The invitation link will stop working immediately. You can always send a new invite later.',
            confirmText: 'Revoke invitation',
            variant: 'danger'
        });
        if (!ok) return;
        const res = await fetch(`/api/workspaces/invitations/${id}`, { method: 'DELETE' });
        if (res.ok) { toast.success('Revoked'); loadMembers(); }
        else toast.error('Failed');
    };

    const resendInvite = async (id: number) => {
        const res = await fetch(`/api/workspaces/invitations/${id}`, { method: 'POST' });
        if (res.ok) toast.success('Email resent');
        else { const d = await res.json().catch(() => ({})); toast.error(d.error || 'Failed'); }
    };

    useEffect(() => { loadMembers(); }, []);

    const invite = async () => {
        if (!email) return;
        setLoading(true);
        try {
            const res = await fetch('/api/workspaces/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Invitation created');
                if (data.accept_url) {
                    navigator.clipboard?.writeText(data.accept_url);
                    toast.success('Invite link copied');
                }
                setEmail('');
                loadMembers();
            } else {
                toast.error(data.error || 'Failed to invite');
            }
        } finally {
            setLoading(false);
        }
    };

    const removeMember = async (id: number) => {
        const ok = await confirmDialog({
            title: 'Remove this member?',
            description: 'They will immediately lose access to this workspace. You can invite them again later.',
            confirmText: 'Remove member',
            variant: 'danger'
        });
        if (!ok) return;
        try {
            const res = await fetch(`/api/workspaces/members?member_id=${id}`, { method: 'DELETE' });
            if (res.ok) { toast.success('Removed'); loadMembers(); }
            else toast.error('Failed');
        } catch { toast.error('Error'); }
    };

    const changeRole = async (id: number, newRole: string) => {
        try {
            const res = await fetch(`/api/workspaces/members?member_id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) { toast.success('Role updated'); loadMembers(); }
        } catch { }
    };

    return (
        <DashboardLayout domains={domainsData?.domains || []}>
            <Head><title>Team Members - SEO AI Agent</title></Head>
            <Dialogs />

            <div className="max-w-4xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
                        <Users className="h-7 w-7" /> Team Members
                    </h1>
                    <p className="text-neutral-600">Invite people to collaborate in the current workspace.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Invite a new member</CardTitle>
                        <CardDescription>They will receive an invitation link to join this workspace.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-col md:flex-row gap-2">
                            <Input
                                type="email"
                                placeholder="teammate@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1"
                            />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="border rounded-md px-3 py-2 text-sm"
                            >
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            <Button onClick={invite} disabled={loading || !email}>
                                <Mail className="h-4 w-4 mr-2" /> Invite
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending invitations */}
                {pending.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-600" /> Pending invitations ({pending.length})
                            </CardTitle>
                            <CardDescription>These people were invited but haven't accepted yet.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {pending.map((p) => {
                                    const expired = new Date(p.expires_at) < new Date();
                                    return (
                                        <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-semibold text-sm truncate">{p.email}</div>
                                                    <div className="text-xs text-neutral-500 flex items-center gap-2">
                                                        <span className="capitalize">{p.role}</span>
                                                        <span>•</span>
                                                        {expired ? (
                                                            <span className="text-red-600 font-semibold">Expired</span>
                                                        ) : (
                                                            <span>Expires {new Date(p.expires_at).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    title="Copy link"
                                                    onClick={() => { navigator.clipboard.writeText(p.accept_url); toast.success('Link copied'); }}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                {!expired && (
                                                    <Button variant="outline" size="sm" title="Resend email" onClick={() => resendInvite(p.id)}>
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" title="Revoke" onClick={() => revokeInvite(p.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Current members ({members.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {members.map((m) => (
                                <div key={m.id} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        {m.user?.picture ? (
                                            <img src={m.user.picture} className="w-10 h-10 rounded-full" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                                                {(m.user?.name || '?').substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-semibold">{m.user?.name || 'Unknown'}</div>
                                            <div className="text-sm text-neutral-500">{m.user?.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {m.role === 'owner' ? (
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase">Owner</span>
                                        ) : (
                                            <>
                                                <select
                                                    value={m.role}
                                                    onChange={(e) => changeRole(m.id, e.target.value)}
                                                    className="border rounded-md px-2 py-1 text-sm"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="editor">Editor</option>
                                                    <option value="viewer">Viewer</option>
                                                </select>
                                                <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
