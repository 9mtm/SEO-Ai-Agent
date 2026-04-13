import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
export { getServerSideProps } from '../../utils/requireSuperAdmin';

const PLANS = ['free', 'basic', 'pro', 'premium', 'enterprise'];

export default function AdminSubscriptions() {
    const [users, setUsers] = useState<any[]>([]);

    const load = () => {
        fetch('/api/admin/users').then(r => r.json()).then(d => {
            if (d.users) setUsers(d.users);
        });
    };
    useEffect(() => { load(); }, []);

    const changePlan = async (id: number, plan: string) => {
        await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, subscription_plan: plan }) });
        toast.success('Plan updated');
        load();
    };

    const paid = users.filter(u => u.subscription_plan !== 'free');
    const free = users.filter(u => u.subscription_plan === 'free');

    return (
        <AdminLayout title="Subscriptions">
            <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {PLANS.map(p => {
                    const count = users.filter(u => u.subscription_plan === p).length;
                    return (
                        <div key={p} className="bg-white rounded-xl border p-4">
                            <div className="text-xs text-neutral-500 uppercase">{p}</div>
                            <div className="text-2xl font-bold">{count}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-4 py-3 bg-neutral-50 font-semibold text-sm text-neutral-700">
                    Paid Users ({paid.length})
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50/50 text-neutral-600">
                        <tr>
                            <th className="px-4 py-2 text-left">User</th>
                            <th className="px-4 py-2 text-left">Plan</th>
                            <th className="px-4 py-2 text-center">Domains</th>
                            <th className="px-4 py-2 text-center">Keywords</th>
                            <th className="px-4 py-2 text-left">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {(paid.length > 0 ? paid : free.slice(0, 20)).map(u => (
                            <tr key={u.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-3">
                                    <div className="font-semibold">{u.name}</div>
                                    <div className="text-xs text-neutral-500">{u.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <select value={u.subscription_plan} onChange={e => changePlan(u.id, e.target.value)} className="border rounded px-2 py-1 text-xs">
                                        {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </td>
                                <td className="px-4 py-3 text-center">{u.domain_count}</td>
                                <td className="px-4 py-3 text-center">{u.keyword_count}</td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
