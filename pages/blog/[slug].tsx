import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import LandingHeader from '../../components/common/LandingHeader';
import Footer from '../../components/common/Footer';
import TableOfContents from '../../components/blog/TableOfContents';
import BlogSidebar from '../../components/blog/BlogSidebar';

interface BlogPostData {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  author_name: string;
  author_avatar: string;
  category: string;
  tags: string;
  published_at: string;
  reading_time: number;
  views_count: number;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  updatedAt: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BlogPostPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch the main post
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/blog/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.post) setPost(d.post);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Fetch all posts for related + prev/next navigation
  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((d) => {
        if (d.posts) setAllPosts(d.posts);
      })
      .catch(() => {});
  }, []);

  // Compute previous/next and related posts
  const { previousPost, nextPost } = useMemo(() => {
    if (!post || allPosts.length === 0) return { previousPost: null, nextPost: null };
    const idx = allPosts.findIndex((p: any) => p.id === post.id);
    return {
      previousPost: idx > 0 ? allPosts[idx - 1] : null,
      nextPost: idx < allPosts.length - 1 ? allPosts[idx + 1] : null,
    };
  }, [post, allPosts]);

  const computedRelatedPosts = useMemo(() => {
    if (!post || allPosts.length === 0) return [];
    return allPosts
      .filter((p: any) => p.id !== post.id && p.category === post.category)
      .slice(0, 3);
  }, [post, allPosts]);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://seo-agent.net';

  // JSON-LD structured data
  const jsonLd = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.meta_title || post.title,
        description: post.meta_description || post.excerpt,
        image: post.featured_image || `${appUrl}/ogImage.png`,
        author: { '@type': 'Person', name: post.author_name },
        publisher: {
          '@type': 'Organization',
          name: 'SEO AI Agent',
          logo: { '@type': 'ImageObject', url: `${appUrl}/dpro_logo.png` },
        },
        datePublished: post.published_at,
        dateModified: post.updatedAt,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${appUrl}/blog/${post.slug}` },
        wordCount: post.content?.replace(/<[^>]+>/g, ' ').split(/\s+/).length || 0,
        timeRequired: `PT${post.reading_time || 1}M`,
      }
    : null;

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
        {jsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        )}
      </Head>

      <div className="min-h-screen bg-white">
        <LandingHeader activePage="blog" />

        {loading ? (
          /* Skeleton loading */
          <div className="w-full pt-20 pb-16 px-[10px] bg-white">
            <div className="w-full rounded-[10px] px-[10px] py-16 md:py-20 bg-[#f4f6f8]">
              <div className="container mx-auto px-4 md:px-8 lg:px-12 animate-pulse">
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                  <span className="text-gray-400">/</span>
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
                <div className="h-10 w-full md:w-3/4 bg-gray-200 rounded mb-4" />
                <div className="h-6 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="container mx-auto px-4 md:px-8 lg:px-12 mt-12">
              <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !post ? (
          <div className="max-w-3xl mx-auto px-4 pt-24 py-20 text-center">
            <h1 className="text-2xl font-bold mb-2">Post not found</h1>
            <Link href="/blog" className="text-blue-600 hover:underline">
              &larr; Back to blog
            </Link>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section className="w-full pt-20 pb-16 md:pb-24 px-[10px] bg-white">
              <div className="w-full rounded-[10px] px-[10px] py-16 md:py-20 bg-[#f4f6f8]">
                <div className="container mx-auto px-4 md:px-8 lg:px-12">
                  {/* Breadcrumbs */}
                  <nav className="text-sm text-gray-600 mb-6">
                    <Link href="/" className="hover:text-blue-600 transition-colors underline decoration-1 underline-offset-2">
                      Home
                    </Link>
                    {' / '}
                    <Link href="/blog" className="hover:text-blue-600 transition-colors underline decoration-1 underline-offset-2">
                      Blog
                    </Link>
                    {' / '}
                    <span className="text-gray-700">{post.title}</span>
                  </nav>

                  {/* Category Badge */}
                  {post.category && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        {post.category}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                    {post.title}
                  </h1>

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(post.published_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{post.reading_time} min read</span>
                    </div>
                    {post.author_name && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{post.author_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Content Section - 3 Column Layout */}
            <section className="w-full py-12 md:py-16 px-[10px] bg-white" aria-label="Blog post content">
              <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
                <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
                  {/* Left Sidebar - Table of Contents */}
                  {post.content && <TableOfContents content={post.content} />}

                  {/* Main Content */}
                  <div className="flex-1 min-w-0 max-w-4xl w-full lg:w-auto mx-auto">
                    {/* Featured Image */}
                    {post.featured_image && (
                      <div className="mb-10 rounded-xl overflow-hidden">
                        <img src={post.featured_image} alt={post.title} className="w-full h-auto" />
                      </div>
                    )}

                    {/* Article Content */}
                    <article
                      className="prose prose-lg max-w-none blog-content prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-img:rounded-xl"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Author Section */}
                    {post.author_name && (
                      <div className="mt-16 pt-8 border-t border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {post.author_avatar ? (
                              <img
                                src={post.author_avatar}
                                alt={post.author_name}
                                className="w-full h-full object-cover rounded-full"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">{post.author_name}</div>
                            <p className="text-sm text-gray-600">SEO & Content Specialist</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Previous/Next Post Navigation */}
                    {(previousPost || nextPost) && (
                      <div className="mt-16 pt-8 border-t border-gray-200">
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                          {previousPost ? (
                            <Link
                              href={`/blog/${previousPost.slug}`}
                              className="flex-1 group flex items-center gap-3"
                            >
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-600 mb-1">Previous Post</div>
                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                  {previousPost.title}
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex-1" />
                          )}
                          {nextPost ? (
                            <Link
                              href={`/blog/${nextPost.slug}`}
                              className="flex-1 group flex items-center gap-3"
                            >
                              <div className="flex-1 min-w-0 text-right">
                                <div className="text-xs text-gray-600 mb-1">Next Post</div>
                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                  {nextPost.title}
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ) : (
                            <div className="flex-1" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Sidebar - CTA + Latest Posts */}
                  <BlogSidebar />
                </div>
              </div>
            </section>

            {/* Related Posts Section */}
            {computedRelatedPosts.length > 0 && (
              <section className="w-full py-16 md:py-24 px-[10px] bg-white">
                <div className="container mx-auto px-4 md:px-8 lg:px-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Related Posts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {computedRelatedPosts.map((relatedPost: any) => (
                      <article
                        key={relatedPost.id}
                        className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <Link href={`/blog/${relatedPost.slug}`} className="block cursor-pointer">
                          <div className="relative w-full aspect-[16/10] mt-3 rounded-lg overflow-hidden">
                            {relatedPost.featured_image ? (
                              <img
                                src={relatedPost.featured_image}
                                alt={relatedPost.title}
                                className="w-full h-full object-cover transition-transform hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <span className="text-4xl">📊</span>
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="p-4">
                          {relatedPost.category && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                {relatedPost.category}
                              </span>
                            </div>
                          )}
                          <Link href={`/blog/${relatedPost.slug}`}>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2">
                              {relatedPost.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2">
                            {relatedPost.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                            <span>{formatDateShort(relatedPost.published_at)}</span>
                            <span>&bull;</span>
                            <span>{relatedPost.reading_time} min read</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        <Footer />
      </div>
    </>
  );
}
