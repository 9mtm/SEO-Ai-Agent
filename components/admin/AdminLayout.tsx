import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { LayoutDashboard, Users, Building2, CreditCard, FileText, Receipt, ArrowLeft } from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
}

const nav = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'Invoices', href: '/admin/invoices', icon: Receipt },
    { name: 'Blog Posts', href: '/admin/blog', icon: FileText },
];

export default function AdminLayout({ children, title = 'Admin' }: AdminLayoutProps) {
    const router = useRouter();

    return (
        <>
            <Head><title>{title} — SEO AI Agent Admin</title></Head>
            <div className="min-h-screen bg-neutral-50 flex">
                {/* Sidebar */}
                <aside className="w-64 bg-neutral-900 text-white flex flex-col flex-shrink-0">
                    <div className="p-5 border-b border-neutral-800">
                        <Link href="/admin" className="text-lg font-bold">SEO AI Agent</Link>
                        <div className="text-xs text-neutral-400 mt-1">Super Admin</div>
                    </div>
                    <nav className="flex-1 p-3 space-y-1">
                        {nav.map((item) => {
                            const Icon = item.icon;
                            const active = router.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="p-3 border-t border-neutral-800">
                        <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back to App
                        </Link>
                    </div>
                </aside>

                {/* Main */}
                <main className="flex-1 p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </>
    );
}
