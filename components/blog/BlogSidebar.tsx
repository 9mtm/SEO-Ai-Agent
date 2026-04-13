import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SidebarPost {
  id: number;
  title: string;
  slug: string;
  published_at: string;
}

export default function BlogSidebar() {
  const [latestPosts, setLatestPosts] = useState<SidebarPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((d) => {
        if (d.posts) {
          setLatestPosts(d.posts.slice(0, 6));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      {/* CTA Card */}
      <div className="px-6 py-6 rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Free Plan</h2>
        <div className="space-y-4 relative z-10">
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">$0</span>
              <span className="text-sm text-white/80">/month</span>
            </div>
            <p className="text-sm text-white/90 mt-1">For growing businesses</p>
          </div>
          <nav className="space-y-2">
            <div className="text-sm">
              <div className="font-medium mb-2 text-white">Key Features:</div>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-white mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/90">1 Domain tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-white mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/90">9 Keywords</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-white mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/90">AI SEO Agent</span>
                </li>
              </ul>
            </div>
          </nav>
          <Link
            href="/register"
            className="block w-full text-center bg-white border-2 border-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm mt-4"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Latest Posts */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Posts</h3>
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : latestPosts.length > 0 ? (
          <ul className="space-y-4">
            {latestPosts.map((post) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="block group">
                  <h4 className="text-sm font-medium text-blue-600 group-hover:text-blue-800 transition-colors mb-1 line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No posts available</p>
        )}
      </div>
    </aside>
  );
}
