import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Copy, Check, Users, DollarSign, TrendingUp, Clock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

export { getServerSideProps } from '../../utils/ownerOnlyPage';

interface ReferralData {
    referral_code: string;
    referral_link: string;
    stats: { totalReferrals: number; activeReferrals: number; pendingEarnings: number; totalEarned: number };
    referrals: Array<{ id: number; name: string; plan: string; status: string; commission: number; date: string; activatedAt: string | null }>;
}

interface PayoutData {
    id: number; amount_eur: number; status: string; paypal_email: string;
    requested_at: string | null; processed_at: string | null; admin_note: string | null;
}

const COUNTRIES = [
    'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria',
    'Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
    'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia',
    'Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica',
    'Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt',
    'El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon',
    'Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
    'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel',
    'Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos',
    'Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi',
    'Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova',
    'Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands',
    'New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau',
    'Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania',
    'Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino',
    'Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia',
    'Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden',
    'Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago',
    'Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States',
    'Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

export default function ReferralsPage() {
    const { t } = useLanguage();
    const [tab, setTab] = useState<'referrals' | 'payouts'>('referrals');
    const [data, setData] = useState<ReferralData | null>(null);
    const [payouts, setPayouts] = useState<PayoutData[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const [settings, setSettings] = useState({
        paypal_email: '', name: '', address: '', city: '', zip: '', country: '', company_name: '', vat_id: '', is_business: false,
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    const loadData = async () => {
        try {
            const [refRes, settingsRes, payoutsRes] = await Promise.all([
                fetch('/api/referrals', { headers: getAuthHeaders() }),
                fetch('/api/referrals/payout-settings', { headers: getAuthHeaders() }),
                fetch('/api/referrals/payouts', { headers: getAuthHeaders() }),
            ]);
            const refData = await refRes.json();
            const settingsData = await settingsRes.json();
            const payoutsData = await payoutsRes.json();

            if (refData.referral_code) setData(refData);
            if (settingsData.settings) {
                setSettings(prev => ({ ...prev, ...settingsData.settings }));
            }
            if (payoutsData.payouts) setPayouts(payoutsData.payouts);
        } catch {
            toast.error('Failed to load referral data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const copyLink = () => {
        if (!data) return;
        navigator.clipboard.writeText(data.referral_link);
        setCopied(true);
        toast.success('Link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await fetch('/api/referrals/payout-settings', {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(settings),
            });
            const d = await res.json();
            if (res.ok) toast.success('Settings saved');
            else toast.error(d.error || 'Failed');
        } catch { toast.error('Network error'); }
        finally { setSavingSettings(false); }
    };

    const requestPayout = async (payoutId: number) => {
        if (!settings.paypal_email) { toast.error('Please save your PayPal email first'); return; }
        try {
            const res = await fetch('/api/referrals/payouts', {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ payoutId }),
            });
            const d = await res.json();
            if (res.ok) { toast.success('Payout requested'); loadData(); }
            else toast.error(d.error || 'Failed');
        } catch { toast.error('Network error'); }
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            active: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
            requested: 'bg-blue-100 text-blue-700',
            approved: 'bg-indigo-100 text-indigo-700',
            paid: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
    };

    if (loading) return <DashboardLayout><div className="p-8 text-center text-neutral-500">Loading...</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Gift className="h-7 w-7 text-blue-600" />
                    <h1 className="text-2xl font-bold">Referral Program</h1>
                </div>

                {/* Referral Link Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border p-6 mb-6">
                    <h2 className="font-semibold text-lg mb-2">Your Referral Link</h2>
                    <p className="text-sm text-neutral-600 mb-4">Share this link with friends. When they subscribe, you earn commissions!</p>
                    <div className="flex gap-2">
                        <Input value={data?.referral_link || ''} readOnly className="bg-white font-mono text-sm" />
                        <Button onClick={copyLink} variant="outline" className="flex-shrink-0">
                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                </div>

                {/* Terms Link */}
                <p className="text-sm text-neutral-500 mb-6">
                    By participating in the referral program, you agree to the <a href="/terms#referral-program" className="text-blue-600 hover:underline font-medium">Referral Program Terms</a>.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border p-4">
                        <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1"><Users className="h-4 w-4" /> Total Referrals</div>
                        <div className="text-2xl font-bold">{data?.stats.totalReferrals || 0}</div>
                    </div>
                    <div className="bg-white rounded-xl border p-4">
                        <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1"><TrendingUp className="h-4 w-4" /> Active</div>
                        <div className="text-2xl font-bold text-green-600">{data?.stats.activeReferrals || 0}</div>
                    </div>
                    <div className="bg-white rounded-xl border p-4">
                        <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1"><Clock className="h-4 w-4" /> Pending</div>
                        <div className="text-2xl font-bold text-yellow-600">{(data?.stats.pendingEarnings || 0).toFixed(2).replace('.', ',')} EUR</div>
                    </div>
                    <div className="bg-white rounded-xl border p-4">
                        <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1"><DollarSign className="h-4 w-4" /> Earned</div>
                        <div className="text-2xl font-bold text-green-600">{(data?.stats.totalEarned || 0).toFixed(2).replace('.', ',')} EUR</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 border-b">
                    <button onClick={() => setTab('referrals')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === 'referrals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
                        My Referrals
                    </button>
                    <button onClick={() => setTab('payouts')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === 'payouts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
                        Payout Settings & History
                    </button>
                </div>

                {tab === 'referrals' && (
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 text-neutral-600">
                                <tr>
                                    <th className="px-4 py-3 text-left">Name</th>
                                    <th className="px-4 py-3 text-center">Plan</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Commission</th>
                                    <th className="px-4 py-3 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {(data?.referrals || []).map(r => (
                                    <tr key={r.id} className="hover:bg-neutral-50">
                                        <td className="px-4 py-3 font-medium">{r.name}</td>
                                        <td className="px-4 py-3 text-center">{statusBadge(r.plan || 'free')}</td>
                                        <td className="px-4 py-3 text-center">{statusBadge(r.status)}</td>
                                        <td className="px-4 py-3 text-center font-semibold">{r.commission > 0 ? `${r.commission.toFixed(2).replace('.', ',')} EUR` : '—'}</td>
                                        <td className="px-4 py-3 text-neutral-500">{new Date(r.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {(!data?.referrals || data.referrals.length === 0) && (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No referrals yet. Share your link to get started!</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'payouts' && (
                    <div className="space-y-6">
                        {/* Payout Settings Form */}
                        <div className="bg-white rounded-xl border p-6">
                            <h3 className="font-semibold text-lg mb-4">Payout Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">PayPal Email *</label>
                                    <Input placeholder="your@paypal.com" value={settings.paypal_email} onChange={e => setSettings({ ...settings, paypal_email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                                    <Input placeholder="Your full name" value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                                    <Input placeholder="Street address" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                                        <Input placeholder="City" value={settings.city} onChange={e => setSettings({ ...settings, city: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">ZIP</label>
                                        <Input placeholder="ZIP code" value={settings.zip} onChange={e => setSettings({ ...settings, zip: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Country</label>
                                        <select value={settings.country} onChange={e => setSettings({ ...settings, country: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                                            <option value="">Select country</option>
                                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Business Toggle */}
                                <div className="flex items-center justify-between py-3 border-t">
                                    <span className="text-sm font-medium text-neutral-700">I want to get rewarded as a business</span>
                                    <button type="button" onClick={() => setSettings({ ...settings, is_business: !settings.is_business })}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${settings.is_business ? 'bg-blue-600' : 'bg-neutral-300'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.is_business ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>

                                {settings.is_business && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Company Name</label>
                                            <Input placeholder="Company Name" value={settings.company_name} onChange={e => setSettings({ ...settings, company_name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">VAT Number</label>
                                            <Input placeholder="VAT Number" value={settings.vat_id} onChange={e => setSettings({ ...settings, vat_id: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                <Button onClick={saveSettings} disabled={savingSettings}>
                                    {savingSettings ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </div>
                        </div>

                        {/* Payout History */}
                        <div className="bg-white rounded-xl border overflow-hidden">
                            <div className="px-4 py-3 border-b bg-neutral-50">
                                <h3 className="font-semibold">Payout History</h3>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-neutral-50 text-neutral-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Amount</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-left">Requested</th>
                                        <th className="px-4 py-3 text-left">Processed</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {payouts.map(p => (
                                        <tr key={p.id} className="hover:bg-neutral-50">
                                            <td className="px-4 py-3 font-semibold">{Number(p.amount_eur).toFixed(2).replace('.', ',')} EUR</td>
                                            <td className="px-4 py-3 text-center">{statusBadge(p.status)}</td>
                                            <td className="px-4 py-3 text-neutral-500">{p.requested_at ? new Date(p.requested_at).toLocaleDateString() : '—'}</td>
                                            <td className="px-4 py-3 text-neutral-500">{p.processed_at ? new Date(p.processed_at).toLocaleDateString() : '—'}</td>
                                            <td className="px-4 py-3 text-right">
                                                {p.status === 'pending' && (
                                                    <Button size="sm" variant="outline" onClick={() => requestPayout(p.id)}>Request Payout</Button>
                                                )}
                                                {p.admin_note && <span className="text-xs text-neutral-500 ml-2" title={p.admin_note}>Note</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {payouts.length === 0 && (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No payouts yet. Refer users to earn commissions!</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
