import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Clock, Calendar, ArrowLeft, User } from 'lucide-react';
import LandingHeader from '../../components/common/LandingHeader';
import Footer from '../../components/common/Footer';

export default function BlogPostPage() {
    const router = useRouter();
    const slug = router.query.slug as string;
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        fetch(`/api/blog/${slug}`).then(r => r.json()).then(d => {
            if (d.post) setPost(d.post);
        }).finally(() => setLoading(false));
    }, [slug]);

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://seo-agent.net';

    // JSON-LD structured data for SEO
    const jsonLd = post ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.meta_title || post.title,
        description: post.meta_description || post.excerpt,
        image: post.featured_image || `${appUrl}/ogImage.png`,
        author: { '@type': 'Person', name: post.author_name },
        publisher: { '@type': 'Organization', name: 'SEO AI Agent', logo: { '@type': 'ImageObject', url: `${appUrl}/dpro_logo.png` } },
        datePublished: post.published_at,
        dateModified: post.updatedAt,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${appUrl}/blog/${post.slug}` },
        wordCount: post.content?.replace(/<[^>]+>/g, ' ').split(/\s+/).length || 0,
        timeRequired: `PT${post.reading_time || 1}M`
    } : null;

    return (
        <>
            <Head>
                <title>{post?.meta_title || post?.title || 'Blog'} — SEO AI Agent</title>
                <meta name="description" content={post?.meta_description || post?.excerpt || ''} />
                {post?.canonical_url && <link rel="canonical" href={post.canonical_url} />}
                {!post?.canonical_url && post?.slug && <link rel="canonical" href={`${appUrl}/blog/${post.slug}`} />}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={post?.meta_title || post?.title || ''} />
                <meta property="og:description" content={post?.meta_description || post?.excerpt || ''} />
                {post?.featured_image && <meta property="og:image" content={post.featured_image} />}
                <meta property="og:url" content={`${appUrl}/blog/${post?.slug}`} />
                <meta property="article:published_time" content={post?.published_at} />
                <meta property="article:author" content={post?.author_name} />
                {post?.category && <meta property="article:section" content={post.category} />}
                {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
            </Head>

            <div className="min-h-screen bg-white">
                <LandingHeader activePage="blog" />

                {loading ? (
                    <div className="max-w-3xl mx-auto px-4 pt-24 py-16 animate-pulse space-y-4">
                        <div className="h-8 w-3/4 bg-neutral-200 rounded" />
                        <div className="h-4 w-1/2 bg-neutral-200 rounded" />
                        <div className="h-64 bg-neutral-100 rounded-xl mt-8" />
                    </div>
                ) : !post ? (
                    <div className="max-w-3xl mx-auto px-4 pt-24 py-20 text-center">
                        <h1 className="text-2xl font-bold mb-2">Post not found</h1>
                        <Link href="/blog" className="text-blue-600 hover:underline">← Back to blog</Link>
                    </div>
                ) : (
                    <article className="max-w-3xl mx-auto px-4 pt-24 py-12">
                        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-6">
                            <ArrowLeft className="h-4 w-4" /> Back to blog
                        </Link>

                        {post.category && (
                            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">{post.category}</span>
                        )}

                        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-8 pb-8 border-b">
                            <div className="flex items-center gap-2">
                                {post.author_avatar ? (
                                    <img src={post.author_avatar} alt={post.author_name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><User className="h-4 w-4 text-blue-600" /></div>
                                )}
                                <span className="font-medium text-neutral-700">{post.author_name}</span>
                            </div>
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {post.published_at ? new Date(post.published_at).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {post.reading_time} min read</span>
                        </div>

                        {post.featured_image && (
                            <div className="mb-10 rounded-xl overflow-hidden">
                                <img src={post.featured_image} alt={post.title} className="w-full h-auto" />
                            </div>
                        )}

                        <div
                            className="prose prose-lg prose-neutral max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {/* CTA */}
                        <div className="mt-16 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl text-center">
                            <h2 className="text-2xl font-bold text-neutral-900 mb-3">Ready to boost your SEO?</h2>
                            <p className="text-neutral-600 mb-6">Track rankings, analyze keywords, and generate AI-optimized content — all in one place.</p>
                            <Link href="/register" className="inline-flex px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                                Start Free Trial
                            </Link>
                        </div>
                    </article>
                )}

                <Footer />
            </div>
        </>
    );
}
