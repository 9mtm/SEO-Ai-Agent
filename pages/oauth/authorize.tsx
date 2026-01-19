import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';

export default function Authorize() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Query params standard to OAuth
    const { redirect_uri, state } = router.query;

    const handleAllow = async () => {
        setLoading(true);
        // Ensure client-side usage
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
            return;
        }

        try {
            const res = await fetch('/api/oauth/code', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();

            if (data.code && redirect_uri) {
                const callbackUrl = new URL(redirect_uri as string);
                callbackUrl.searchParams.set('code', data.code);
                if (state) callbackUrl.searchParams.set('state', state as string);

                window.location.href = callbackUrl.toString();
            } else if (data.code && !redirect_uri) {
                setError('Authorization successful, but no redirect URI provided. Please copy this code if asked: ' + data.code);
            } else {
                setError('Failed to generate authorization code.');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to authorize application.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <Head><title>Authorize SEO Agent</title></Head>
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="mb-6 flex justify-center">
                    <img src="/dpro_logo.png" width={64} height={64} alt="Logo" className="rounded-lg w-16 h-16 object-contain" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Connect Application</h1>
                <p className="text-gray-600 mb-6">
                    Allow external application to access your SEO Agent account?
                </p>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm break-all">{error}</div>}

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAllow}
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium disabled:opacity-50"
                    >
                        {loading ? 'Authorizing...' : 'Authorize'}
                    </button>
                </div>
            </div>
        </div>
    )
}
