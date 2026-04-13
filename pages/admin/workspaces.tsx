import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
export { getServerSideProps } from '../../utils/requireSuperAdmin';

export default function AdminWorkspaces() {
    const [workspaces, setWorkspaces] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/admin/workspaces-list').then(r => r.json()).then(d => {
            if (d.workspaces) setWorkspaces(d.workspaces);
        }).catch(() => {});
    }, []);

    return (
        <AdminLayout title="Workspaces">
            <h1 className="text-2xl font-bold mb-6">Workspaces ({workspaces.length})</h1>
            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                            <th className="px-4 py-3 text-left">Workspace</th>
                            <th className="px-4 py-3 text-left">Owner</th>
                            <th className="px-4 py-3 text-center">Members</th>
                            <th className="px-4 py-3 text-center">Domains</th>
                            <th className="px-4 py-3 text-left">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {workspaces.map(w => (
                            <tr key={w.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-3 font-semibold">{w.name} {w.is_personal ? <span className="text-xs bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded ml-1">Personal</span> : null}</td>
                                <td className="px-4 py-3 text-neutral-600">{w.owner_email}</td>
                                <td className="px-4 py-3 text-center">{w.member_count}</td>
                                <td className="px-4 py-3 text-center">{w.domain_count}</td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
