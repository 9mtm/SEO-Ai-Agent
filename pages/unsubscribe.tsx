import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

const Unsubscribe: NextPage = () => {
    const router = useRouter();
    const { token } = router.query;
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!router.isReady) return;

        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing unsubscribe token.');
            return;
        }

        const unsubscribe = async () => {
            try {
                const res = await fetch('/api/user/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    setStatus('success');
                    setMessage('Your email preferences have been updated. You will no longer receive marketing emails or weekly reports.');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Failed to process your unsubscribe request.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An unexpected error occurred. Please try again later.');
            }
        };

        unsubscribe();
    }, [router.isReady, token]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Head>
                <title>Unsubscribe - SEO AI Agent</title>
            </Head>

            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    {status === 'loading' && <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />}
                    {status === 'success' && <CheckCircle className="h-16 w-16 text-green-500" />}
                    {status === 'error' && <XCircle className="h-16 w-16 text-red-500" />}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {status === 'loading' && 'Processing...'}
                    {status === 'success' && 'Unsubscribed Successfully'}
                    {status === 'error' && 'Unsubscribe Failed'}
                </h1>

                <p className="text-gray-600 mb-8">
                    {message}
                </p>

                <Link href="/" className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Go to Homepage
                </Link>
            </div>

            <div className="mt-8 text-center text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} SEO AI Agent. All rights reserved.
            </div>
        </div>
    );
};

export default Unsubscribe;
