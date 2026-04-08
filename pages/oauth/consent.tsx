/**
 * /oauth/consent
 * --------------
 * HTML consent screen shown to a logged-in user after /api/oauth/authorize
 * detects no pre-existing consent. The user sees:
 *   - App name + logo (from oauth_clients.logo_url)
 *   - The scopes the app is asking for, with friendly descriptions
 *   - Their currently active workspace (scope will be bound to it)
 *   - Approve / Deny buttons
 *
 * On approve, we POST to /api/oauth/consent which stores the consent,
 * issues an authorization code, and returns the redirect URL back to
 * the third-party app.
 */
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, Check, X, AlertCircle, Building2 } from 'lucide-react';

const SCOPE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
    'read:profile': { label: 'View your profile', description: 'Name, email, profile picture and current workspace.' },
    'read:domains': { label: 'View your domains', description: 'List domains and basic settings in your workspace.' },
    'write:domains': { label: 'Manage your domains', description: 'Add, edit and remove domains in your workspace.' },
    'read:gsc': { label: 'View Google Search Console data', description: 'Aggregated GSC stats, keywords, pages and countries.' },
    'read:keywords': { label: 'View tracked keywords', description: 'Keywords being tracked and their position history.' },
    'write:keywords': { label: 'Manage tracked keywords', description: 'Add, edit and remove tracked keywords.' },
    'read:analytics': { label: 'View analytics and reports', description: 'Aggregated analytics, reports and trends.' }
};

export default function ConsentPage() {
    const router = useRouter();
    const [clientInfo, setClientInfo] = useState<any>(null);
    const [workspace, setWorkspace] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<'approve' | 'deny' | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Query params straight from /api/oauth/authorize redirect
    const {
        client_id,
        redirect_uri,
        scope,
        state,
        code_challenge,
        code_challenge_method
    } = router.query as Record<string, string>;

    useEffect(() => {
        if (!router.isReady) return;
        if (!client_id || !redirect_uri) {
            setError('Invalid request — missing client_id or redirect_uri.');
            setLoading(false);
            return;
        }

        // Fetch client + current workspace + user in parallel
        Promise.all([
            fetch(`/api/oauth/clients/public?client_id=${encodeURIComponent(client_id)}`).then((r) => r.json()),
            fetch('/api/user').then((r) => r.json()).catch(() => ({})),
            fetch('/api/workspaces').then((r) => r.json()).catch(() => ({}))
        ])
            .then(([clientRes, userRes, wsRes]) => {
                if (clientRes?.error || !clientRes?.client) {
                    setError('Application not found or inactive.');
                } else {
                    setClientInfo(clientRes.client);
                }
                if (userRes?.success && userRes?.user) setUser(userRes.user);
                if (wsRes?.workspaces) {
                    const current = wsRes.workspaces.find((w: any) => w.is_current) || wsRes.workspaces[0];
                    setWorkspace(current);
                }
            })
            .catch(() => setError('Failed to load consent details.'))
            .finally(() => setLoading(false));
    }, [router.isReady, client_id, redirect_uri]);

    const requestedScopes = (scope || '').split(/[\s,]+/).filter(Boolean);

    const submit = async (approve: boolean) => {
        setSubmitting(approve ? 'approve' : 'deny');
        try {
            const res = await fetch('/api/oauth/consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id,
                    redirect_uri,
                    scope,
                    state,
                    code_challenge,
                    code_challenge_method,
                    approve
                })
            });
            const data = await res.json();
            if (res.ok && data.redirect) {
                window.location.href = data.redirect;
            } else {
                setError(data.error || 'Failed to submit consent.');
                setSubmitting(null);
            }
        } catch (e: any) {
            setError(e?.message || 'Network error.');
            setSubmitting(null);
        }
    };

    return (
        <>
            <Head>
                <title>Authorize {clientInfo?.name || 'App'} — SEO AI Agent</title>
            </Head>
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
                    {/* Header: our logo + app logo */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-xl bg-white border border-neutral-200 flex items-center justify-center">
                            <Image src="/dpro_logo.png" alt="SEO AI Agent" width={48} height={48} />
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full" />
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center overflow-hidden">
                            {clientInfo?.logo_url ? (
                                <img src={clientInfo.logo_url} alt={clientInfo.name} className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-6 h-6 text-neutral-400" />
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center text-neutral-500 py-8">Loading…</div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <p className="text-red-700 font-semibold mb-1">Something went wrong</p>
                            <p className="text-sm text-neutral-600">{error}</p>
                            <Link href="/" className="inline-block mt-4 text-sm text-blue-600 hover:underline">← Back to home</Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-xl font-bold text-neutral-900 text-center mb-2">
                                Authorize <span className="text-blue-600">{clientInfo?.name}</span>
                            </h1>
                            <p className="text-sm text-neutral-600 text-center mb-6">
                                This app wants to access your SEO AI Agent account.
                            </p>

                            {/* Who is signing in + which workspace */}
                            {user && (
                                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3 mb-4 flex items-center gap-3">
                                    {user.picture ? (
                                        <img src={user.picture} alt="" className="w-9 h-9 rounded-full" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                                            {(user.name || '?').substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-neutral-900 truncate">{user.name}</div>
                                        <div className="text-xs text-neutral-500 truncate">{user.email}</div>
                                    </div>
                                </div>
                            )}
                            {workspace && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <div className="text-xs text-blue-900 flex-1 min-w-0">
                                        Access will be bound to workspace <strong className="truncate">{workspace.name}</strong>
                                    </div>
                                </div>
                            )}

                            {/* Scopes */}
                            <div className="mb-6">
                                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                                    This app will be able to
                                </div>
                                <div className="space-y-2">
                                    {requestedScopes.length === 0 && (
                                        <div className="text-sm text-neutral-500 italic">No specific scopes requested.</div>
                                    )}
                                    {requestedScopes.map((s) => {
                                        const info = SCOPE_DESCRIPTIONS[s];
                                        return (
                                            <div key={s} className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-neutral-900">
                                                        {info?.label || s}
                                                    </div>
                                                    {info?.description && (
                                                        <div className="text-xs text-neutral-500">{info.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-amber-800">
                                    Only approve if you trust <strong>{clientInfo?.name}</strong>. You can revoke access any time from <Link href="/profile/oauth-apps" className="underline">Connected Apps</Link>.
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => submit(false)}
                                    disabled={!!submitting}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 disabled:opacity-50"
                                >
                                    {submitting === 'deny' ? 'Denying…' : 'Deny'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => submit(true)}
                                    disabled={!!submitting}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting === 'approve' ? 'Approving…' : 'Approve'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
