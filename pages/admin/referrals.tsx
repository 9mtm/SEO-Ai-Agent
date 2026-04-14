import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Users, DollarSign, TrendingUp, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDialogs } from '../../components/common/AppDialog';
import toast from 'react-hot-toast';
export { getServerSideProps } from '../../utils/requireSuperAdmin';

export default function AdminReferrals() {
    const { confirmDialog, promptDialog, Dialogs } = useAppDialogs();
    const [tab, setTab] = useState<'referrals' | 'payouts'>('referrals');
    const [stats, setStats] = useState({ totalReferrals: 0, activeReferrals: 0, totalCommissions: 0, pendingPayouts: 0 });
    const [referrals, setReferrals] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [payoutFilter, setPayoutFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadStats = () => {
        fetch('/api/admin/referrals?view=stats').then(r => r.json()).then(d => setStats(d));
    };

    const loadReferrals = () => {
        fetch(`/api/admin/referrals?view=referrals&page=${page}&limit=20&search=${encodeURIComponent(search)}`)
            .then(r => r.json()).then(d => { setReferrals(d.referrals || []); setTotalPages(d.totalPages || 1); });
    };

    const loadPayouts = () => {
        fetch(`/api/admin/referrals?view=payouts&page=${page}&limit=20&status=${payoutFilter}`)
            .then(r => r.json()).then(d => { setPayouts(d.payouts || []); setTotalPages(d.totalPages || 1); });
    };

    useEffect(() => { loadStats(); }, []);
    useEffect(() => { if (tab === 'referrals') loadReferrals(); else loadPayouts(); }, [tab, page, search, payoutFilter]);

    const updatePayoutStatus = async (payoutId: number, newStatus: string) => {
        let adminNote = '';
        if (newStatus === 'rejected') {
            const note = await promptDialog({ title: 'Reject Payout', description: 'Reason for rejection (optional):', placeholder: 'Enter reason...', confirmText: 'Reject' });
            if (note === null) return;
            adminNote = note;
        } else if (newStatus === 'approved') {
            const ok = await confirmDialog({ title: 'Approve Payout', description: 'Approve this payout request?', confirmText: 'Approve' });
            if (!ok) return;
        } else if (newStatus === 'paid') {
            const ok = await confirmDialog({ title: 'Mark as Paid', description: 'Confirm you have sent the PayPal payment?', confirmText: 'Mark Paid' });
            if (!ok) return;
        }

        try {
            const res = await fetch(`/api/admin/referrals/${payoutId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, admin_note: adminNote }),
            });
            if (res.ok) { toast.success(`Payout ${newStatus}`); loadPayouts(); loadStats(); }
            else { const d = await res.json(); toast.error(d.error || 'Failed'); }
        } catch { toast.error('Network error'); }
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700', active: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700', requested: 'bg-blue-100 text-blue-700',
            approved: 'bg-indigo-100 text-indigo-700', paid: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
    };

    return (
        <AdminLayout title="Referrals">
            <Dialogs />
            <h1 className="text-2xl font-bold mb-6">Referral Management</h1>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1"><Users className="h-4 w-4" /> Total Referrals</div>
                    <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1"><TrendingUp className="h-4 w-4" /> Active</div>
                    <div className="text-2xl font-bold text-green-600">{stats.activeReferrals}</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1"><DollarSign className="h-4 w-4" /> Total Commissions</div>
                    <div className="text-2xl font-bold">{Number(stats.totalCommissions).toFixed(2).replace('.', ',')} EUR</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1"><Clock className="h-4 w-4" /> Pending Payouts</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayouts}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b">
                <button onClick={() => { setTab('referrals'); setPage(1); }} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === 'referrals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500'}`}>
                    Referrals
                </button>
                <button onClick={() => { setTab('payouts'); setPage(1); }} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === 'payouts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500'}`}>
                    Payouts
                </button>
            </div>

            {tab === 'referrals' && (
                <>
                    <div className="mb-4">
                        <Input placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" />
                    </div>
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 text-neutral-600">
                                <tr>
                                    <th className="px-4 py-3 text-left">Referrer</th>
                                    <th className="px-4 py-3 text-left">Referred User</th>
                                    <th className="px-4 py-3 text-center">Plan</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Commission</th>
                                    <th className="px-4 py-3 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {referrals.map(r => (
                                    <tr key={r.id} className="hover:bg-neutral-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{r.referrer?.name}</div>
                                            <div className="text-xs text-neutral-500">{r.referrer?.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{r.referred?.name}</div>
                                            <div className="text-xs text-neutral-500">{r.referred?.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">{r.plan ? statusBadge(r.plan) : '—'}</td>
                                        <td className="px-4 py-3 text-center">{statusBadge(r.status)}</td>
                                        <td className="px-4 py-3 text-center font-semibold">{Number(r.commission_eur) > 0 ? `${Number(r.commission_eur).toFixed(2)} EUR` : '—'}</td>
                                        <td className="px-4 py-3 text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {referrals.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-500">No referrals found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {tab === 'payouts' && (
                <>
                    <div className="mb-4">
                        <select value={payoutFilter} onChange={e => { setPayoutFilter(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="requested">Requested</option>
                            <option value="approved">Approved</option>
                            <option value="paid">Paid</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 text-neutral-600">
                                <tr>
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-center">Amount</th>
                                    <th className="px-4 py-3 text-left">PayPal</th>
                                    <th className="px-4 py-3 text-center">Business</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-left">Requested</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payouts.map(p => (
                                    <tr key={p.id} className="hover:bg-neutral-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{p.user?.name}</div>
                                            <div className="text-xs text-neutral-500">{p.user?.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold">{Number(p.amount_eur).toFixed(2)} EUR</td>
                                        <td className="px-4 py-3 text-sm">{p.paypal_email || '—'}</td>
                                        <td className="px-4 py-3 text-center">{p.is_business ? 'Yes' : 'No'}</td>
                                        <td className="px-4 py-3 text-center">{statusBadge(p.status)}</td>
                                        <td className="px-4 py-3 text-neutral-500">{p.requested_at ? new Date(p.requested_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {p.status === 'requested' && (
                                                    <>
                                                        <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => updatePayoutStatus(p.id, 'approved')}>
                                                            <Check className="h-3 w-3 mr-1" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => updatePayoutStatus(p.id, 'rejected')}>
                                                            <X className="h-3 w-3 mr-1" /> Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {p.status === 'approved' && (
                                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50" onClick={() => updatePayoutStatus(p.id, 'paid')}>
                                                        <DollarSign className="h-3 w-3 mr-1" /> Mark Paid
                                                    </Button>
                                                )}
                                                {p.admin_note && <span className="text-xs text-neutral-500 ml-1" title={p.admin_note}>📝</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {payouts.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500">No payouts found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="px-3 py-1 text-sm text-neutral-600">Page {page} of {totalPages}</span>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
            )}
        </AdminLayout>
    );
}
