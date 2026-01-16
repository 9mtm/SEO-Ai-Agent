import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Globe, ChevronRight, Menu, X } from 'lucide-react';
import AccountMenu from '../components/common/AccountMenu';
import { useFetchDomains } from '../services/domains';
import { useLanguage } from '../context/LanguageContext';

// Import new landing page components
import Stats from '../components/landing/Stats';
import HowItWorks from '../components/landing/HowItWorks';
import EnhancedFeatures from '../components/landing/EnhancedFeatures';
import AIIntegrationsShowcase from '../components/landing/AIIntegrationsShowcase';
import Testimonials from '../components/landing/Testimonials';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';
import FinalCTA from '../components/landing/FinalCTA';

const Home: NextPage = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, setLocale, t } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: domainsData } = useFetchDomains(router, false, { enabled: isLoggedIn });
  const domains = domainsData?.domains || [];

  useEffect(() => {
    fetch('/api/user')
      .then((res) => {
        if (res.ok) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {
        // Not logged in
      });
  }, []);

  // Organization Schema for SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SEO Agent',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '0',
      highPrice: '99',
      offerCount: '3',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '100',
    },
    author: {
      '@type': 'Organization',
      name: 'Dpro GmbH',
      url: 'https://seo-agent.net',
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        {/* Primary Meta Tags */}
        <title>SEO Agent - Track Rankings, Create AI Content & Publish to WordPress | Multi-Country SEO Tool</title>
        <meta
          name="description"
          content="Complete SEO platform: Track keyword rankings in 200+ countries, analyze Google Search Console data, generate AI content with GPT-5 & Claude, publish directly to WordPress. Free plan available."
        />
        <meta
          name="keywords"
          content="SEO tracking tool, keyword rank tracker, multi-country SEO, Google Search Console integration, AI content generator, ChatGPT SEO, Claude AI content, WordPress auto-publish, SEO analytics, competitor tracking, MCP API, SEO automation"
        />
        <link rel="canonical" href="https://seo-agent.net/" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Dpro GmbH" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://seo-agent.net/" />
        <meta property="og:title" content="SEO Agent - Complete SEO Tracking & AI Content Platform" />
        <meta
          property="og:description"
          content="Track rankings in 200+ countries, generate AI content, and publish to WordPress. Integrate with ChatGPT & Claude via MCP API."
        />
        <meta property="og:image" content="https://seo-agent.net/og-image.png" />
        <meta property="og:site_name" content="SEO Agent" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://seo-agent.net/" />
        <meta property="twitter:title" content="SEO Agent - AI-Powered SEO Platform" />
        <meta
          property="twitter:description"
          content="Track rankings, create AI content, publish to WordPress. 200+ countries supported."
        />
        <meta property="twitter:image" content="https://seo-agent.net/twitter-image.png" />

        {/* Additional SEO Tags */}
        <meta name="geo.region" content="AT-9" />
        <meta name="geo.placename" content="Vienna" />
        <meta name="language" content={locale} />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Image src="/dpro_logo.png" alt="SEO Agent Logo" width={32} height={32} className="h-8 w-8" />
              <span className="text-xl font-bold text-neutral-900">SEO Agent</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                Features
              </Link>
              <Link href="/mcp-seo" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                MCP Integration
              </Link>

              {isLoggedIn ? (
                <AccountMenu domains={domains} />
              ) : (
                <>
                  <div className="relative group">
                    <button className="flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900">
                      <Globe className="h-4 w-4" />
                      {locale === 'de' ? 'DE' : 'EN'}
                    </button>
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 hidden group-hover:block">
                      <button
                        onClick={() => setLocale('en')}
                        className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        English
                      </button>
                      <button
                        onClick={() => setLocale('de')}
                        className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        Deutsch
                      </button>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                  >
                    {t('landing.login')}
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    {t('landing.cta')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link
                href="#features"
                className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/mcp-seo"
                className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                MCP Integration
              </Link>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as 'en' | 'de')}
                className="w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm font-medium text-neutral-700"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
              <Link
                href="/login"
                className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.login')}
              </Link>
              <Link
                href="/login"
                className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-semibold hover:bg-blue-700 transition-all active:scale-[0.98]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.cta')}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Enhanced */}
      <main className="pt-24">
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 via-white to-neutral-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
                Track, Analyze, Create & Publish
                <span className="block text-blue-600 mt-2">All in One AI-Powered SEO Platform</span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                Monitor rankings in 200+ countries, generate AI content with GPT-5 & Claude, and publish directly to WordPress. The complete SEO solution for modern businesses.
              </p>

              {/* USP Bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-3xl mx-auto">
                <div className="flex items-center justify-start sm:justify-center text-left gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-neutral-700 font-medium">Multi-Country Tracking</span>
                </div>
                <div className="flex items-center justify-start sm:justify-center text-left gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-neutral-700 font-medium">AI Content with GPT-5 & Claude</span>
                </div>
                <div className="flex items-center justify-start sm:justify-center text-left gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-neutral-700 font-medium">WordPress Direct Publishing</span>
                </div>
                <div className="flex items-center justify-start sm:justify-center text-left gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-neutral-700 font-medium">ChatGPT & Claude MCP Integration</span>
                </div>
              </div>

              {/* CTAs - Hidden */}
              {/* <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/auth/register"
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group active:scale-[0.98]"
                >
                  Start Free Trial
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div> */}

              {/* Social Proof - Platform Icons */}
              <div className="mt-12">
                <p className="text-sm text-neutral-500 mb-4">Trusted by 5,000+ SEO professionals worldwide</p>
                <div className="flex space-x-3 mb-4 items-center justify-center">
                  <img src="/icon/google-logo.svg" alt="Google" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                  <img src="/icon/chatgpt-logo.svg" alt="ChatGPT" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                  <img src="/icon/claude-logo.svg" alt="Claude" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                  <img src="/icon/gemini-logo.svg" alt="Gemini" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                  <img src="/icon/perplexity-logo.svg" alt="Perplexity" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                  <img src="/icon/bing-logo.svg" alt="Bing" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <Stats />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Enhanced Features Section (9 features) */}
        <EnhancedFeatures />

        {/* AI Integrations Showcase */}
        <AIIntegrationsShowcase />

        {/* Testimonials */}
        <Testimonials />

        {/* Pricing - Hidden for now */}
        {/* <Pricing /> */}

        {/* FAQ */}
        <FAQ />

        {/* Final CTA */}
        <FinalCTA />
      </main>

      {/* Footer - Enhanced */}
      <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image src="/dpro_logo.png" alt="SEO Agent" width={32} height={32} className="h-8 w-8" />
                <span className="text-lg font-bold text-white">SEO Agent</span>
              </div>
              <p className="text-sm text-neutral-400 mb-4">
                Complete SEO tracking and AI content platform by Dpro GmbH
              </p>
              <div className="text-sm text-neutral-400">
                <p>Dpro GmbH</p>
                <p>Wipplingerstraße 20/18</p>
                <p>1010 Wien, Austria</p>
                <p className="mt-2">+43 676 905 4441</p>
                <p>office@dpro.at</p>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/mcp-seo" className="hover:text-white transition-colors">MCP Integration</Link></li>
                <li><Link href="/profile/api-keys" className="hover:text-white transition-colors">API & Webhooks</Link></li>
                <li><a href="https://flowxtra.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Talent Management</a></li>
                <li><a href="https://flowxtra.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Applicant Tracking Software</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-neutral-400">Documentation</span></li>
                <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-400">
            <p>© 2026 SEO Agent by <a href="https://dpro.at" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Dpro GmbH</a>. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
