import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import LandingHeader from '../../components/common/LandingHeader';
import Footer from '../../components/common/Footer';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
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
}

const POSTS_PER_PAGE = 9;

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BlogPage() {
  const router = useRouter();
  const locale = router.locale || 'en';
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const searchModalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/blog?locale=${locale}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.posts) setAllPosts(d.posts);
      })
      .finally(() => setLoading(false));
  }, [locale]);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === 'Escape' && showSearchModal) {
        e.preventDefault();
        setShowSearchModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchModal]);

  // Focus search input when modal opens
  useEffect(() => {
    if (showSearchModal && searchModalInputRef.current) {
      setTimeout(() => searchModalInputRef.current?.focus(), 100);
    }
  }, [showSearchModal]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allPosts.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats);
  }, [allPosts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    let posts = allPosts;
    if (!selectedCategories.includes('all') && selectedCategories.length > 0) {
      posts = posts.filter((p) => selectedCategories.includes(p.category));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }
    return posts;
  }, [allPosts, selectedCategories, searchQuery]);

  // Search results for modal
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredPosts.slice(0, 6);
  }, [filteredPosts, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const currentPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  // Latest post for hero card
  const latestPost = allPosts.length > 0 ? allPosts[0] : null;

  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      if (category === 'all') return ['all'];
      let next = prev.filter((c) => c !== 'all');
      if (next.includes(category)) {
        next = next.filter((c) => c !== category);
      } else {
        next = [...next, category];
      }
      return next.length === 0 ? ['all'] : next;
    });
    setCurrentPage(1);
  }, []);

  const isCategorySelected = (category: string) => {
    if (category === 'all') return selectedCategories.includes('all');
    return selectedCategories.includes(category);
  };

  // Blog post card component
  const PostCard = ({ post, isGrid }: { post: BlogPost; isGrid: boolean }) => (
    <article className={`bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${!isGrid ? 'flex flex-row' : ''}`}>
      <Link href={`/blog/${post.slug}`} className={`block cursor-pointer ${!isGrid ? 'w-1/3 flex-shrink-0' : ''}`}>
        <div className={`relative w-full ${isGrid ? 'aspect-[16/10]' : 'h-full min-h-[160px]'} overflow-hidden rounded-lg ${isGrid ? 'mt-3' : ''}`}>
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
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
        {post.category && (
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{post.category}</span>
          </div>
        )}
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2">
            {post.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2">{post.excerpt}</p>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>{formatDate(post.published_at)}</span>
          <span className="mx-1">&bull;</span>
          <span>{post.reading_time} min read</span>
          {post.author_name && (
            <>
              <span className="mx-1">&bull;</span>
              <span>{post.author_name}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );

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
        <LandingHeader activePage="blog" />

        {/* Search Modal */}
        {showSearchModal && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSearchModal(false); }}
          >
            <div className="relative w-full max-w-2xl">
              <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden max-h-[80vh] flex flex-col">
                {/* Search Input */}
                <div className="relative border-b border-gray-200">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchModalInputRef}
                    type="text"
                    placeholder="Search blog posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-20 py-4 text-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none border-none"
                    onKeyDown={(e) => { if (e.key === 'Escape') setShowSearchModal(false); }}
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">Esc</kbd>
                  </div>
                </div>
                {/* Results */}
                <div className="overflow-y-auto flex-1 max-h-[60vh]">
                  {searchQuery.trim() ? (
                    searchResults.length > 0 ? (
                      <div className="p-2">
                        {searchResults.map((post) => (
                          <Link
                            key={post.id}
                            href={`/blog/${post.slug}`}
                            onClick={() => setShowSearchModal(false)}
                            className="block p-3 rounded-lg hover:bg-gray-100 transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{post.category}</span>
                                  <span className="text-xs text-gray-400">&bull;</span>
                                  <span className="text-xs text-gray-400">{formatDate(post.published_at)}</span>
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{post.title}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                              </div>
                              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="mt-4 text-sm text-gray-500">No results found for &ldquo;{searchQuery}&rdquo;</p>
                      </div>
                    )
                  ) : (
                    <div className="p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="mt-4 text-sm text-gray-500">Start typing to search...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="w-full pt-20 pb-16 md:pb-24 px-[10px] bg-white">
          <div className="w-full rounded-[10px] px-[10px] py-16 md:py-20 bg-[#f4f6f8]">
            <div className="container mx-auto px-4 md:px-8 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Left Side */}
                <div className="lg:col-span-7 flex items-center">
                  <div className="w-full">
                    <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
                      <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                      {' / '}
                      <span className="text-gray-700">Blog</span>
                    </nav>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                      SEO Insights & AI Strategies
                    </h1>
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                      Actionable tips to rank higher on Google, ChatGPT, and AI search engines. Written by SEO professionals.
                    </p>
                    <div className="mt-6 text-sm text-gray-500">
                      <p>Explore our comprehensive blog covering SEO strategies, keyword research, content optimization, and the latest trends in AI-powered search. Learn from industry experts and discover best practices for growing your online presence.</p>
                    </div>
                  </div>
                </div>

                {/* Right Side - Latest Post Card */}
                {!loading && latestPost && (
                  <div className="lg:col-span-5">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow max-w-md mx-auto lg:mx-0">
                      <div className="px-4 pt-4">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {latestPost.category}
                        </span>
                      </div>
                      <Link href={`/blog/${latestPost.slug}`} className="block cursor-pointer">
                        <div className="relative w-full h-48 md:h-56 lg:h-64 mt-3 overflow-hidden rounded-lg">
                          {latestPost.featured_image ? (
                            <img
                              src={latestPost.featured_image}
                              alt={latestPost.title}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                              <span className="text-5xl">📊</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="p-4 md:p-5">
                        <Link href={`/blog/${latestPost.slug}`}>
                          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors cursor-pointer">
                            {latestPost.title}
                          </h2>
                        </Link>
                        <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed line-clamp-3">
                          {latestPost.excerpt}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* All Blogs Section */}
        <section className="w-full py-16 md:py-24 px-[10px] bg-white">
          <div className="container mx-auto px-4 md:px-8 lg:px-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">All Blogs</h2>

            {/* Category Filters, Search, and View Mode */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex flex-wrap gap-3">
                {['all', ...categories].map((category) => {
                  const isSelected = isCategorySelected(category);
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-white border-white' : 'bg-transparent border-gray-400'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {category === 'all' ? 'All' : category}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                  <kbd className="ml-2 px-1.5 py-0.5 text-xs font-semibold text-gray-400 bg-white border border-gray-200 rounded">⌘K</kbd>
                </button>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    title="Grid view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    title="List view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Posts Grid/List */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                    <div className="w-full aspect-[16/10] bg-gray-200 mt-3 rounded-lg" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                      <div className="h-5 bg-gray-300 rounded" />
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-3 w-2/3 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : currentPosts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {searchQuery ? 'No results found' : 'Coming Soon'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? `No posts matching "${searchQuery}". Try a different search.`
                    : "We're working on great content. Check back soon!"}
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'flex flex-col gap-6'
              }>
                {currentPosts.map((post) => (
                  <PostCard key={post.id} post={post} isGrid={viewMode === 'grid'} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
