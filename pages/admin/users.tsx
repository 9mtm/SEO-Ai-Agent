import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Search, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
export { getServerSideProps } from '../../utils/requireSuperAdmin';

const PLANS = ['free', 'basic', 'pro', 'premium', 'enterprise'];

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const load = (q = '') => {
        setLoading(true);
        fetch(`/api/admin/users?search=${encodeURIComponent(q)}`).then(r => r.json())
            .then(d => { if (d.users) setUsers(d.users); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const changePlan = async (id: number, plan: string) => {
        await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, subscription_plan: plan }) });
        toast.success('Plan updated');
        load(search);
    };

    const toggleActive = async (id: number, active: boolean) => {
        await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: active }) });
        toast.success(active ? 'Activated' : 'Deactivated');
        load(search);
    };

    return (
        <AdminLayout title="Users">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Users ({users.length})</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
                        value={search}
                        onChange={e => { setSearch(e.target.value); load(e.target.value); }}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                            <th className="px-4 py-3 text-left">User</th>
                            <th className="px-4 py-3 text-left">Plan</th>
                            <th className="px-4 py-3 text-center">Domains</th>
                            <th className="px-4 py-3 text-center">Keywords</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-left">Last Login</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {u.picture ? <img src={u.picture} className="w-8 h-8 rounded-full" alt="" referrerPolicy="no-referrer" /> : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">{(u.name || '?').substring(0, 2).toUpperCase()}</div>}
                                        <div>
                                            <div className="font-semibold">{u.name}</div>
                                            <div className="text-xs text-neutral-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <select value={u.subscription_plan} onChange={e => changePlan(u.id, e.target.value)} className="border rounded px-2 py-1 text-xs">
                                        {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </td>
                                <td className="px-4 py-3 text-center">{u.domain_count}</td>
                                <td className="px-4 py-3 text-center">{u.keyword_count}</td>
                                <td className="px-4 py-3 text-center">
                                    <button onClick={() => toggleActive(u.id, !u.is_active)} className={`px-2 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {u.is_active ? 'Active' : 'Disabled'}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
