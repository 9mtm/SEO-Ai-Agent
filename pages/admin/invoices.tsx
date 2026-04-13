import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Download, Search } from 'lucide-react';
export { getServerSideProps } from '../../utils/requireSuperAdmin';

interface InvoiceRow {
    id: number;
    invoice_number: string;
    date: string;
    amount_net: number;
    tax_rate: number;
    tax_amount: number;
    amount_gross: number;
    currency: string;
    plan_name: string;
    customer_name: string;
    customer_email: string;
    status: string;
    pdf_url: string | null;
    user: { id: number; name: string; email: string } | null;
}

export default function AdminInvoices() {
    const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/admin/invoices')
            .then(r => r.json())
            .then(d => { if (d.invoices) setInvoices(d.invoices); })
            .finally(() => setLoading(false));
    }, []);

    const filtered = invoices.filter(inv => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            inv.invoice_number.toLowerCase().includes(q) ||
            (inv.customer_name || '').toLowerCase().includes(q) ||
            (inv.customer_email || '').toLowerCase().includes(q) ||
            (inv.plan_name || '').toLowerCase().includes(q)
        );
    });

    const totalNet = filtered.reduce((sum, inv) => sum + inv.amount_net, 0);
    const totalGross = filtered.reduce((sum, inv) => sum + inv.amount_gross, 0);
    const totalTax = filtered.reduce((sum, inv) => sum + inv.tax_amount, 0);

    return (
        <AdminLayout title="Invoices">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Invoices</h1>
                <div className="text-sm text-neutral-500">{filtered.length} invoices</div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border p-4">
                    <div className="text-xs text-neutral-500 uppercase">Total Net</div>
                    <div className="text-2xl font-bold">{totalNet.toFixed(2).replace('.', ',')} EUR</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="text-xs text-neutral-500 uppercase">Total Tax</div>
                    <div className="text-2xl font-bold">{totalTax.toFixed(2).replace('.', ',')} EUR</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="text-xs text-neutral-500 uppercase">Total Gross</div>
                    <div className="text-2xl font-bold">{totalGross.toFixed(2).replace('.', ',')} EUR</div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                    type="text"
                    placeholder="Search by invoice number, customer, plan..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                            <th className="px-4 py-3 text-left">Invoice Nr.</th>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-left">Customer</th>
                            <th className="px-4 py-3 text-left">Plan</th>
                            <th className="px-4 py-3 text-right">Net</th>
                            <th className="px-4 py-3 text-right">Tax</th>
                            <th className="px-4 py-3 text-right">Gross</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">PDF</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={9} className="p-8 text-center text-neutral-400">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={9} className="p-8 text-center text-neutral-400">No invoices found.</td></tr>
                        ) : filtered.map(inv => (
                            <tr key={inv.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-3 font-mono text-xs font-semibold">{inv.invoice_number}</td>
                                <td className="px-4 py-3">{new Date(inv.date).toLocaleDateString('de-AT')}</td>
                                <td className="px-4 py-3">
                                    <div className="font-semibold">{inv.customer_name || '-'}</div>
                                    <div className="text-xs text-neutral-500">{inv.customer_email}</div>
                                </td>
                                <td className="px-4 py-3 capitalize">{inv.plan_name}</td>
                                <td className="px-4 py-3 text-right font-mono">{inv.amount_net.toFixed(2).replace('.', ',')} {inv.currency}</td>
                                <td className="px-4 py-3 text-right font-mono text-neutral-500">
                                    {inv.tax_rate > 0 ? `${inv.tax_amount.toFixed(2).replace('.', ',')} (${inv.tax_rate}%)` : '-'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-semibold">{inv.amount_gross.toFixed(2).replace('.', ',')} {inv.currency}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                                        inv.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-amber-100 text-amber-800'
                                    }`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {inv.pdf_url ? (
                                        <button
                                            onClick={() => window.open(inv.pdf_url!, '_blank')}
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                                        >
                                            <Download className="h-3.5 w-3.5" /> PDF
                                        </button>
                                    ) : (
                                        <span className="text-neutral-300">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
