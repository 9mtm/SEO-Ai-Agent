/**
 * /workspace/invitation/[token]
 * ------------------------------
 * Public landing page for a workspace invitation link. Shows the workspace
 * name + role, then asks the visitor to log in (if not already) and press
 * Accept. On accept we POST to /api/workspaces/invitation/[token], which
 * creates the membership and switches the user's active workspace.
 */
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Check, AlertCircle, LogIn } from 'lucide-react';

export default function InvitationPage() {
    const router = useRouter();
    const token = router.query.token as string;

    const [invite, setInvite] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!token) return;
        Promise.all([
            fetch(`/api/workspaces/invitation/${token}`).then((r) => r.json()),
            fetch('/api/user').then((r) => r.json()).catch(() => ({}))
        ])
            .then(([invRes, userRes]) => {
                if (invRes?.error) setError(invRes.error);
                else setInvite(invRes.invitation);
                if (userRes?.success && userRes?.user) setUser(userRes.user);

                // Auto-accept: if the user is already logged in with the matching
                // email, accept the invitation immediately — no extra click needed.
                const u = userRes?.user;
                const inv = invRes?.invitation;
                if (
                    u &&
                    inv &&
                    !invRes?.error &&
                    u.email?.toLowerCase() === inv.email?.toLowerCase()
                ) {
                    setAccepting(true);
                    fetch(`/api/workspaces/invitation/${token}`, { method: 'POST' })
                        .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
                        .then(({ ok, data }) => {
                            if (ok) {
                                setDone(true);
                                setTimeout(() => { window.location.href = '/'; }, 1200);
                            } else {
                                setError(data?.error || 'Failed to accept invitation.');
                            }
                        })
                        .catch(() => setError('Network error while accepting.'))
                        .finally(() => setAccepting(false));
                }
            })
            .catch(() => setError('Failed to load invitation.'))
            .finally(() => setLoading(false));
    }, [token]);

    const accept = async () => {
        setAccepting(true);
        setError(null);
        try {
            const res = await fetch(`/api/workspaces/invitation/${token}`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setDone(true);
                setTimeout(() => { window.location.href = '/'; }, 1500);
            } else {
                setError(data.error || 'Failed to accept invitation.');
            }
        } catch {
            setError('Network error.');
        } finally {
            setAccepting(false);
        }
    };

    const needsLogin = !user && invite;
    const wrongEmail = user && invite && user.email?.toLowerCase() !== invite.email?.toLowerCase();

    return (
        <>
            <Head>
                <title>Workspace Invitation — SEO AI Agent</title>
            </Head>
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 rounded-xl bg-white border border-neutral-200 flex items-center justify-center">
                            <Image src="/dpro_logo.png" alt="SEO AI Agent" width={48} height={48} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center text-neutral-500 py-8">Loading invitation…</div>
                    ) : error && !invite ? (
                        <div className="text-center py-8">
                            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <p className="text-red-700 font-semibold mb-1">Invitation not available</p>
                            <p className="text-sm text-neutral-600">{error}</p>
                            <Link href="/" className="inline-block mt-4 text-sm text-blue-600 hover:underline">← Back to home</Link>
                        </div>
                    ) : done ? (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                                <Check className="w-7 h-7" />
                            </div>
                            <p className="font-semibold text-neutral-900 mb-1">You're in!</p>
                            <p className="text-sm text-neutral-600">Redirecting to your workspace…</p>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-xl font-bold text-neutral-900 text-center mb-2">
                                You've been invited
                            </h1>
                            <p className="text-sm text-neutral-600 text-center mb-6">
                                Join a workspace on SEO AI Agent.
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center flex-shrink-0">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-neutral-900 truncate">{invite?.workspace?.name || '—'}</div>
                                        <div className="text-xs text-neutral-500 uppercase tracking-wide">Role: {invite?.role}</div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-900">
                                    Invitation for <strong>{invite?.email}</strong>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                                    {error}
                                </div>
                            )}

                            {needsLogin ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-neutral-600 text-center">
                                        Sign in to <strong>{invite?.email}</strong> to accept this invitation.
                                    </p>
                                    <Link
                                        href={`/login?return=${encodeURIComponent(`/workspace/invitation/${token}`)}`}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                                    >
                                        <LogIn className="w-4 h-4" /> Sign in to accept
                                    </Link>
                                </div>
                            ) : wrongEmail ? (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 mb-4">
                                    <div className="font-semibold mb-1">Wrong account</div>
                                    You're signed in as <strong>{user.email}</strong> but this invitation is for <strong>{invite.email}</strong>. Please sign out and sign in with the correct account.
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={accept}
                                    disabled={accepting}
                                    className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {accepting ? 'Accepting…' : `Accept & join ${invite?.workspace?.name}`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
