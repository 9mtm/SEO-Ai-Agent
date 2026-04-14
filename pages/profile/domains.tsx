import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Globe, Trash2, ExternalLink, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDialogs } from '../../components/common/AppDialog';
import { useRouter } from 'next/router';
import { useFetchDomains } from '../../services/domains';
import toast from 'react-hot-toast';

export { getServerSideProps } from '../../utils/ownerOnlyPage';

export default function DomainsPage() {
    const router = useRouter();
    const { confirmDialog, Dialogs } = useAppDialogs();
    const { data: domainsData, refetch } = useFetchDomains(router);
    const [domains, setDomains] = useState<any[]>([]);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    const loadData = async () => {
        try {
            const [domainsRes, wsRes] = await Promise.all([
                fetch('/api/domains?withstats=true', { headers: getAuthHeaders() }),
                fetch('/api/workspaces', { headers: getAuthHeaders() }),
            ]);
            const domainsD = await domainsRes.json();
            const wsD = await wsRes.json();
            if (domainsD.domains) setDomains(domainsD.domains);
            if (wsD.workspaces) setWorkspaces(wsD.workspaces);
        } catch {} finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const getWorkspaceName = (wsId: number) => {
        const ws = workspaces.find((w: any) => w.id === wsId);
        return ws?.name || 'Personal';
    };

    const deleteDomain = async (domain: any) => {
        const ok = await confirmDialog({
            title: `Delete ${domain.domain}?`,
            description: `This will permanently delete "${domain.domain}" and all its keywords, posts, and tracking data. This cannot be undone.`,
            confirmText: 'Delete Domain',
            variant: 'danger',
        });
        if (!ok) return;

        try {
            const res = await fetch(`/api/domains?id=${domain.ID || domain.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                toast.success(`${domain.domain} deleted`);
                loadData();
                refetch();
            } else {
                const d = await res.json();
                toast.error(d.error || 'Failed to delete');
            }
        } catch { toast.error('Network error'); }
    };

    return (
        <DashboardLayout domains={domainsData?.domains || []}>
            <Dialogs />
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Globe className="h-7 w-7 text-blue-600" />
                        <h1 className="text-2xl font-bold">My Domains</h1>
                    </div>
                    <Button onClick={() => router.push('/onboarding')} className="bg-blue-600 hover:bg-blue-700">
                        + Add Domain
                    </Button>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl border p-8 text-center text-neutral-500">Loading...</div>
                ) : domains.length === 0 ? (
                    <div className="bg-white rounded-xl border p-12 text-center">
                        <Globe className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-neutral-900 mb-2">No domains yet</h2>
                        <p className="text-neutral-500 mb-4">Add your first domain to start tracking SEO performance.</p>
                        <Button onClick={() => router.push('/onboarding')}>Add Domain</Button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 text-neutral-600">
                                <tr>
                                    <th className="px-4 py-3 text-left">Domain</th>
                                    <th className="px-4 py-3 text-left">Workspace</th>
                                    <th className="px-4 py-3 text-center">Keywords</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {domains.map((d: any) => (
                                    <tr key={d.ID || d.id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => router.push(`/domain/insight/${d.slug}`)}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={`https://www.google.com/s2/favicons?domain=${d.domain}&sz=32`}
                                                    alt=""
                                                    className="w-5 h-5 rounded-sm"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                                <div className="font-semibold text-neutral-900">{d.domain}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-neutral-600">
                                                <Building2 className="h-3.5 w-3.5" />
                                                <span className="text-sm">{getWorkspaceName(d.workspace_id)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                                {d.keywordCount ?? d.keyword_count ?? d.keywords?.length ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => deleteDomain(d)} className="p-1.5 hover:bg-red-50 rounded text-red-500 hover:text-red-700 transition-colors" title="Delete domain">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
