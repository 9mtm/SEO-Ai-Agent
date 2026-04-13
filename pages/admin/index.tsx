import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Users, Globe, Key, Building2, FileText, TrendingUp } from 'lucide-react';
export { getServerSideProps } from '../../utils/requireSuperAdmin';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {});
    }, []);

    const cards = stats ? [
        { label: 'Total Users', value: stats.total_users, icon: Users, color: 'bg-blue-50 text-blue-700' },
        { label: 'New Users (7d)', value: stats.new_users_7d, icon: TrendingUp, color: 'bg-green-50 text-green-700' },
        { label: 'Domains', value: stats.total_domains, icon: Globe, color: 'bg-purple-50 text-purple-700' },
        { label: 'Keywords', value: stats.total_keywords, icon: Key, color: 'bg-orange-50 text-orange-700' },
        { label: 'Workspaces', value: stats.total_workspaces, icon: Building2, color: 'bg-cyan-50 text-cyan-700' },
        { label: 'Blog Posts', value: stats.total_blog_posts, icon: FileText, color: 'bg-pink-50 text-pink-700' },
    ] : [];

    return (
        <AdminLayout title="Dashboard">
            <h1 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard</h1>

            {!stats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
                            <div className="h-4 w-20 bg-neutral-200 rounded mb-3"></div>
                            <div className="h-8 w-16 bg-neutral-300 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {cards.map((c) => {
                            const Icon = c.icon;
                            return (
                                <div key={c.label} className="bg-white rounded-xl border p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-neutral-500">{c.label}</span>
                                        <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-neutral-900">{c.value}</div>
                                </div>
                            );
                        })}
                    </div>

                    {stats.plan_breakdown && (
                        <div className="bg-white rounded-xl border p-6">
                            <h2 className="text-lg font-semibold mb-4">Plan Breakdown</h2>
                            <div className="flex gap-4 flex-wrap">
                                {Object.entries(stats.plan_breakdown).map(([plan, count]) => (
                                    <div key={plan} className="px-4 py-2 bg-neutral-50 rounded-lg border">
                                        <div className="text-xs text-neutral-500 uppercase">{plan}</div>
                                        <div className="text-xl font-bold">{count as number}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </AdminLayout>
    );
}
