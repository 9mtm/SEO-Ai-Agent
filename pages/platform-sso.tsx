import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const PlatformSSO = () => {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Only run on client-side when router fields are ready
        if (!router.isReady) return;

        const { token, platform } = router.query;

        if (!token) {
            setStatus('error');
            setErrorMessage('Missing authentication token');
            return;
        }

        const authenticate = async () => {
            try {
                const res = await fetch('/api/platform/set-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (data.success) {
                    setStatus('success');

                    if (token) {
                        try {
                            localStorage.setItem('auth_token', String(token));
                        } catch (e) {
                            console.error('Cannot set localStorage', e);
                        }
                    } else {
                        console.warn('No token found in query to save to localStorage');
                    }

                    // fetch domains to determine where to redirect
                    try {
                        const headers: any = {};
                        if (token) headers.Authorization = `Bearer ${token}`;

                        const domainRes = await fetch('/api/domains', { headers });
                        if (domainRes.ok) {
                            const domainData = await domainRes.json();
                            if (domainData.domains && domainData.domains.length > 0) {
                                // Redirect to first domain dashboard
                                const firstDomain = domainData.domains[0];
                                router.push(`/domain/insight/${firstDomain.slug}`);
                                return;
                            }
                        }
                        // Fallback: No domains found -> Onboarding
                        router.push('/onboarding');
                    } catch (e) {
                        router.push('/onboarding');
                    }
                } else {
                    setStatus('error');
                    setErrorMessage(data.error || 'Authentication failed');
                }
            } catch (err) {
                console.error(err);
                setStatus('error');
                setErrorMessage('Connection error');
            }
        };

        authenticate();
    }, [router.isReady, router.query]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900">
            <Head>
                <title>Authenticating... | SEO AI Agent</title>
            </Head>

            <div className="text-center">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 border-4 border-t-blue-600 border-b-transparent border-l-transparent border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                            Connecting to {router.query.platform ? String(router.query.platform).toUpperCase() : 'Platform'}...
                        </h2>
                        <p className="text-gray-500 mt-2">Please wait while we log you in.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                            Successfully Connected!
                        </h2>
                        <p className="text-gray-500 mt-2">Redirecting to dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                            Authentication Failed
                        </h2>
                        <p className="text-gray-500 mt-2">{errorMessage}</p>
                        <button
                            onClick={() => router.reload()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PlatformSSO;
