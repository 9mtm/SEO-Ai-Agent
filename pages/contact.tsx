import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Send, CheckCircle2, Mail, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) { toast.error('Please fill all fields.'); return; }
        if (!agreed) { toast.error('Please agree to the privacy policy.'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                setSent(true);
            } else {
                toast.error(data.error || 'Failed to send.');
            }
        } catch {
            toast.error('Network error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Contact Us — SEO AI Agent</title>
                <meta name="description" content="Have questions or feedback? Reach out to the SEO AI Agent team. We respond within 24 hours." />
                <link rel="canonical" href="https://seo-agent.net/contact" />
            </Head>

            <div className="min-h-screen bg-white">
                <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
                    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <Image src="/dpro_logo.png" alt="SEO AI Agent" width={32} height={32} />
                            <span className="font-bold text-lg">SEO AI Agent</span>
                        </Link>
                        <div className="flex items-center gap-6">
                            <Link href="/blog" className="text-sm text-neutral-600 hover:text-neutral-900">Blog</Link>
                            <Link href="/contact" className="text-sm font-semibold text-blue-600">Contact</Link>
                            <Link href="/login" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Get Started</Link>
                        </div>
                    </div>
                </nav>

                <main className="max-w-2xl mx-auto px-4 py-16">
                    <div className="text-center mb-10">
                        <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full mb-4">
                            Get In Touch
                        </span>
                        <h1 className="text-4xl font-bold text-neutral-900 mb-3">
                            Let's Chat, Reach Out To Us.
                        </h1>
                        <p className="text-neutral-600">
                            Have questions or feedback? We're here to help. Send us a message, and we'll respond within 24 hours.
                        </p>
                    </div>

                    {sent ? (
                        <div className="text-center py-16 bg-green-50 rounded-2xl">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Message Sent!</h2>
                            <p className="text-neutral-600 mb-6">We'll get back to you within 24 hours.</p>
                            <Link href="/" className="text-blue-600 hover:underline">← Back to home</Link>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                                    Your Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    placeholder="Write your message here..."
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[150px] resize-y"
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value.slice(0, 500) })}
                                    maxLength={500}
                                    required
                                />
                                <div className="text-right text-xs text-neutral-400 mt-1">{form.message.length} / 500</div>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                    checked={agreed}
                                    onChange={e => setAgreed(e.target.checked)}
                                />
                                <span className="text-sm text-neutral-600">
                                    Yes, I agree with the <Link href="/privacy" className="font-semibold text-neutral-900 hover:underline">privacy policy</Link> and <Link href="/terms" className="font-semibold text-neutral-900 hover:underline">terms and conditions</Link> <span className="text-red-500">*</span>
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:w-auto px-8 py-3 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Send className="h-4 w-4" />
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </main>

                <footer className="border-t bg-neutral-50 py-8">
                    <div className="max-w-6xl mx-auto px-4 text-center text-sm text-neutral-500">
                        © {new Date().getFullYear()} Dpro GmbH — <Link href="/privacy" className="hover:underline">Privacy</Link> · <Link href="/terms" className="hover:underline">Terms</Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
