import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Calendar } from 'lucide-react';

export default function BlogPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/blog').then(r => r.json()).then(d => {
            if (d.posts) setPosts(d.posts);
        }).finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Head>
                <title>Blog — SEO AI Agent | SEO Tips, AI Insights & Industry Updates</title>
                <meta name="description" content="Expert SEO strategies, AI-powered content tips, and industry insights to help you rank higher on Google, ChatGPT, and AI search engines." />
                <meta property="og:title" content="SEO AI Agent Blog" />
                <meta property="og:description" content="Expert SEO strategies and AI-powered content tips." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://seo-agent.net/blog" />
                <link rel="canonical" href="https://seo-agent.net/blog" />
            </Head>

            <div className="min-h-screen bg-white">
                {/* Nav */}
                <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
                    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <Image src="/dpro_logo.png" alt="SEO AI Agent" width={32} height={32} />
                            <span className="font-bold text-lg">SEO AI Agent</span>
                        </Link>
                        <div className="flex items-center gap-6">
                            <Link href="/blog" className="text-sm font-semibold text-blue-600">Blog</Link>
                            <Link href="/contact" className="text-sm text-neutral-600 hover:text-neutral-900">Contact</Link>
                            <Link href="/login" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Get Started</Link>
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <header className="bg-gradient-to-b from-blue-50 to-white py-16">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                            SEO Insights & AI Strategies
                        </h1>
                        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                            Actionable tips to rank higher on Google, ChatGPT, and AI search engines. Written by SEO professionals.
                        </p>
                    </div>
                </header>

                {/* Posts */}
                <main className="max-w-6xl mx-auto px-4 py-12">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array(6).fill(0).map((_, i) => (
                                <div key={i} className="bg-white rounded-xl border animate-pulse">
                                    <div className="h-48 bg-neutral-200 rounded-t-xl" />
                                    <div className="p-5 space-y-3">
                                        <div className="h-4 w-20 bg-neutral-200 rounded" />
                                        <div className="h-6 bg-neutral-300 rounded" />
                                        <div className="h-4 bg-neutral-200 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">📝</div>
                            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Coming Soon</h2>
                            <p className="text-neutral-600">We're working on great content. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map((post) => (
                                <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white rounded-xl border hover:shadow-lg transition-shadow overflow-hidden">
                                    {post.featured_image ? (
                                        <div className="h-48 overflow-hidden">
                                            <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                            <span className="text-4xl">📊</span>
                                        </div>
                                    )}
                                    <div className="p-5">
                                        {post.category && (
                                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{post.category}</span>
                                        )}
                                        <h2 className="text-lg font-bold text-neutral-900 mt-1 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {post.title}
                                        </h2>
                                        <p className="text-sm text-neutral-600 line-clamp-2 mb-4">{post.excerpt}</p>
                                        <div className="flex items-center justify-between text-xs text-neutral-500">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</span>
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.reading_time} min</span>
                                            </div>
                                            <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Read <ArrowRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t bg-neutral-50 py-8">
                    <div className="max-w-6xl mx-auto px-4 text-center text-sm text-neutral-500">
                        © {new Date().getFullYear()} Dpro GmbH — <Link href="/privacy" className="hover:underline">Privacy</Link> · <Link href="/terms" className="hover:underline">Terms</Link> · <Link href="/imprint" className="hover:underline">Imprint</Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
