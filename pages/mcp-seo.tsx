import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '@/context/LanguageContext';
import { Menu, X, Globe } from 'lucide-react';
import AccountMenu from '../components/common/AccountMenu';
import { useFetchDomains } from '../services/domains';
import {
  Sparkles,
  Bot,
  Zap,
  Shield,
  Rocket,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

const MCPSEOPage: React.FC = () => {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const [activeTab, setActiveTab] = useState<'claude' | 'chatgpt' | 'api'>('claude');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: domainsData } = useFetchDomains(router, false, { enabled: isLoggedIn });
  const domains = domainsData?.domains || [];

  const getAuthHeaders = () => {
    const headers: any = { 'Content-Type': 'application/json' };
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    fetch('/api/user', { headers: getAuthHeaders() })
      .then((res) => {
        if (res.ok) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {
        // Not logged in
      });
  }, []);

  // Schema.org for the page
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: t('mcp.hero.title'),
    description: t('mcp.hero.description'),
    articleBody: t('mcp.hero.description'),
    author: {
      '@type': 'Organization',
      name: 'Dpro GmbH',
    },
  };

  const mcpFunctions = [
    {
      name: 'list_domains',
      description: t('mcp.functions.listDomains.description'),
      example: t('mcp.functions.listDomains.example'),
    },
    {
      name: 'get_keywords',
      description: t('mcp.functions.getKeywords.description'),
      example: t('mcp.functions.getKeywords.example'),
    },
    {
      name: 'get_rankings',
      description: t('mcp.functions.getRankings.description'),
      example: t('mcp.functions.getRankings.example'),
    },
    {
      name: 'get_gsc_data',
      description: t('mcp.functions.getGSC.description'),
      example: t('mcp.functions.getGSC.example'),
    },
    {
      name: 'analyze_seo',
      description: t('mcp.functions.analyzeSEO.description'),
      example: t('mcp.functions.analyzeSEO.example'),
    },
    {
      name: 'create_post',
      description: t('mcp.functions.createPost.description'),
      example: t('mcp.functions.createPost.example'),
    },
    {
      name: 'publish_post',
      description: t('mcp.functions.publishPost.description'),
      example: t('mcp.functions.publishPost.example'),
    },
    {
      name: 'get_competitors',
      description: t('mcp.functions.getCompetitors.description'),
      example: t('mcp.functions.getCompetitors.example'),
    },
  ];

  const faqs = [
    {
      question: t('mcp.faq.q1.question'),
      answer: t('mcp.faq.q1.answer'),
    },
    {
      question: t('mcp.faq.q2.question'),
      answer: t('mcp.faq.q2.answer'),
    },
    {
      question: t('mcp.faq.q3.question'),
      answer: t('mcp.faq.q3.answer'),
    },
    {
      question: t('mcp.faq.q4.question'),
      answer: t('mcp.faq.q4.answer'),
    },
    {
      question: t('mcp.faq.q5.question'),
      answer: t('mcp.faq.q5.answer'),
    },
    {
      question: t('mcp.faq.q6.question'),
      answer: t('mcp.faq.q6.answer'),
    },
    {
      question: t('mcp.faq.q7.question'),
      answer: t('mcp.faq.q7.answer'),
    },
    {
      question: t('mcp.faq.q8.question'),
      answer: t('mcp.faq.q8.answer'),
    },
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const claudeConfig = `{
  "mcpServers": {
    "seo-agent": {
      "command": "npx",
      "args": ["-y", "seo-agent-mcp-server"],
      "env": {
        "SEO_API_KEY": "your_api_key_here",
        "API_BASE_URL": "https://seo-agent.net"
      }
    }
  }
}`;

  const apiExample = `curl -X POST https://seo-agent.net/api/mcp/keywords \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "example.com", "limit": 10}'`;

  const chatGPTSchema = `paths:
  /api/mcp/keywords:
    get:
      summary: Get tracked keywords
      parameters:
        - name: domain
          in: query
          required: true
          schema:
            type: string`;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        {/* Primary Meta Tags */}
        <title>{t('meta.mcpSeo.title')}</title>
        <meta name="description" content={t('meta.mcpSeo.description')} />
        <meta name="keywords" content={t('meta.mcpSeo.keywords')} />
        <link rel="canonical" href={`https://seo-agent.net${router.locale === 'en' ? '' : '/' + router.locale}/mcp-seo`} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="Dpro GmbH" />

        {/* Hreflang Tags for Multi-language Support */}
        <link rel="alternate" hrefLang="en" href="https://seo-agent.net/mcp-seo" />
        <link rel="alternate" hrefLang="de" href="https://seo-agent.net/de/mcp-seo" />
        <link rel="alternate" hrefLang="fr" href="https://seo-agent.net/fr/mcp-seo" />
        <link rel="alternate" hrefLang="x-default" href="https://seo-agent.net/mcp-seo" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://seo-agent.net${router.locale === 'en' ? '' : '/' + router.locale}/mcp-seo`} />
        <meta property="og:title" content={t('meta.mcpSeo.ogTitle')} />
        <meta property="og:description" content={t('meta.mcpSeo.ogDescription')} />
        <meta property="og:image" content="https://seo-agent.net/ogImage.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="SEO Agent" />
        <meta property="og:locale" content={router.locale === 'de' ? 'de_DE' : 'en_US'} />
        <meta property="og:locale:alternate" content={router.locale === 'de' ? 'en_US' : 'de_DE'} />
        <meta property="article:published_time" content="2024-01-15T00:00:00Z" />
        <meta property="article:modified_time" content="2024-01-16T00:00:00Z" />
        <meta property="article:author" content="Dpro GmbH" />
        <meta property="article:section" content="Technology" />
        <meta property="article:tag" content="MCP" />
        <meta property="article:tag" content="SEO" />
        <meta property="article:tag" content="AI" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://seo-agent.net${router.locale === 'de' ? '/de' : ''}/mcp-seo`} />
        <meta name="twitter:title" content={t('seo.mcpSeo.twitterTitle')} />
        <meta name="twitter:description" content={t('seo.mcpSeo.twitterDescription')} />
        <meta name="twitter:image" content="https://seo-agent.net/twitter-image-mcp.png" />
        <meta name="twitter:creator" content="@DproGmbH" />
        <meta name="twitter:site" content="@SEOAgent" />

        {/* Additional SEO Tags */}
        <meta name="geo.region" content="AT-9" />
        <meta name="geo.placename" content="Vienna" />
        <meta name="geo.position" content="48.208176;16.373819" />
        <meta name="ICBM" content="48.208176, 16.373819" />
        <meta name="language" content={router.locale} />
        <meta httpEquiv="content-language" content={router.locale} />

        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
        />

        {/* Favicons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/fav/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/fav/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/fav/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/fav/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/fav/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/fav/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/fav/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/fav/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/fav/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/fav/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/fav/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/fav/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/fav/favicon-16x16.png" />
        <link rel="manifest" href="/fav/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/fav/ms-icon-144x144.png" />
        <meta name="theme-color" content="#ffffff" />
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
              <Link href="/#features" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                {t('nav.features')}
              </Link>
              <Link href="/mcp-seo" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                {t('nav.mcpIntegration')}
              </Link>

              {isLoggedIn ? (
                <AccountMenu domains={domains} />
              ) : (
                <>
                  <div className="relative">
                    <button
                      onClick={() => setLangMenuOpen(!langMenuOpen)}
                      className="flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                    >
                      <Globe className="h-4 w-4" />
                      {locale === 'de' ? 'DE' : locale === 'fr' ? 'FR' : 'EN'}
                    </button>
                    {langMenuOpen && (
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                        <button
                          onClick={() => {
                            setLocale('en');
                            setLangMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          English
                        </button>
                        <button
                          onClick={() => {
                            setLocale('de');
                            setLangMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          Deutsch
                        </button>
                        <button
                          onClick={() => {
                            setLocale('fr');
                            setLangMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          Français
                        </button>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/login"
                    className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                  >
                    {t('landing.login')}
                  </Link>
                  <Link
                    href="/register"
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
                {t('nav.features')}
              </Link>
              <Link
                href="/mcp-seo"
                className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.mcpIntegration')}
              </Link>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as 'en' | 'de' | 'fr')}
                className="w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm font-medium text-neutral-700"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
              <Link
                href="/login"
                className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.login')}
              </Link>
              <Link
                href="/register"
                className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-semibold hover:bg-blue-700 transition-all active:scale-[0.98]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.cta')}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-violet-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Icons */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center">
                  <Image
                    src="/icon/chatgpt-logo.svg"
                    alt="ChatGPT"
                    width={40}
                    height={40}
                  />
                </div>
                <Sparkles className="w-8 h-8 text-blue-600" />
                <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center">
                  <Image
                    src="/icon/claude-logo.svg"
                    alt="Claude"
                    width={40}
                    height={40}
                  />
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
                {t('mcp.hero.title')}
              </h1>

              <p className="text-xl text-neutral-600 mb-10 leading-relaxed">
                {t('mcp.hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/profile/api-keys"
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {t('mcp.hero.getAPIKey')}
                  <ExternalLink className="w-5 h-5 ml-2" />
                </Link>

              </div>
            </div>
          </div>
        </section>

        {/* What is MCP Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                {t('mcp.whatIs.title')}
              </h2>
              <p className="text-lg text-neutral-700 mb-6 leading-relaxed">
                {t('mcp.whatIs.description1')}
              </p>
              <p className="text-lg text-neutral-700 mb-8 leading-relaxed">
                {t('mcp.whatIs.description2')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('mcp.whatIs.benefit1Title')}
                    </h3>
                    <p className="text-neutral-600 text-sm">
                      {t('mcp.whatIs.benefit1')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('mcp.whatIs.benefit2Title')}
                    </h3>
                    <p className="text-neutral-600 text-sm">
                      {t('mcp.whatIs.benefit2')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('mcp.whatIs.benefit3Title')}
                    </h3>
                    <p className="text-neutral-600 text-sm">
                      {t('mcp.whatIs.benefit3')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('mcp.whatIs.benefit4Title')}
                    </h3>
                    <p className="text-neutral-600 text-sm">
                      {t('mcp.whatIs.benefit4')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Platforms */}
        <section className="py-16 bg-neutral-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-neutral-900 mb-12 text-center">
                {t('mcp.platforms.title')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Image
                      src="/icon/claude-logo.svg"
                      alt="Claude Desktop"
                      width={40}
                      height={40}
                    />
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {t('mcp.platforms.recommended')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    Claude Desktop
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.platforms.claude1')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.platforms.claude2')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.platforms.claude3')}
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl border-2 border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Image
                      src="/icon/chatgpt-logo.svg"
                      alt="ChatGPT"
                      width={40}
                      height={40}
                    />
                    <span className="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
                      {t('mcp.platforms.advanced')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    ChatGPT Custom Actions
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.platforms.chatgpt1')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.platforms.chatgpt2')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.platforms.chatgpt3')}
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl border-2 border-neutral-200 p-6 opacity-75">
                  <div className="flex items-center justify-between mb-4">
                    <Bot className="w-10 h-10 text-neutral-400" />
                    <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded-full">
                      {t('mcp.platforms.comingSoon')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {t('mcp.platforms.otherTools')}
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-neutral-400 mr-2 mt-0.5 flex-shrink-0" />
                      Cursor IDE
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-neutral-400 mr-2 mt-0.5 flex-shrink-0" />
                      Continue
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-neutral-400 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.platforms.moreTools')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Setup Guide */}
        <section className="py-16 bg-white" id="setup-guide">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-neutral-900 mb-12 text-center">
                {t('mcp.setup.title')}
              </h2>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                <button
                  onClick={() => setActiveTab('claude')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'claude'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                >
                  Claude Desktop
                </button>
                <button
                  onClick={() => setActiveTab('chatgpt')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'chatgpt'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                >
                  ChatGPT
                </button>
                <button
                  onClick={() => setActiveTab('api')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'api'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                >
                  Direct API
                </button>
              </div>

              {/* Claude Tab */}
              {activeTab === 'claude' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-neutral-900 mb-4">
                      {t('mcp.setup.claude.step1Title')}
                    </h3>
                    <ol className="space-y-3 text-neutral-700">
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">
                          1
                        </span>
                        <span>{t('mcp.setup.claude.step1.1')}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">
                          2
                        </span>
                        <span>{t('mcp.setup.claude.step1.2')}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">
                          3
                        </span>
                        <span>{t('mcp.setup.claude.step1.3')}</span>
                      </li>
                    </ol>
                  </div>

                  <div className="relative">
                    <div className="bg-neutral-900 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-neutral-400 font-mono">
                          claude_desktop_config.json
                        </span>
                        <button
                          onClick={() => copyToClipboard(claudeConfig, 'claude')}
                          className="flex items-center px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm transition-colors duration-200"
                        >
                          {copiedCode === 'claude' ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              {t('mcp.setup.copied')}
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              {t('mcp.setup.copy')}
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-sm text-neutral-100 overflow-x-auto">
                        <code>{claudeConfig}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">
                      {t('mcp.setup.claude.step2Title')}
                    </h3>
                    <p className="text-neutral-700">{t('mcp.setup.claude.step2')}</p>
                  </div>
                </div>
              )}

              {/* ChatGPT Tab */}
              {activeTab === 'chatgpt' && (
                <div className="space-y-6">
                  <div className="bg-violet-50 border-l-4 border-violet-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-neutral-900 mb-4">
                      {t('mcp.setup.chatgpt.title')}
                    </h3>
                    <ol className="space-y-3 text-neutral-700 list-decimal list-inside">
                      <li>{t('mcp.setup.chatgpt.step1')}</li>
                      <li>{t('mcp.setup.chatgpt.step2')}</li>
                      <li>{t('mcp.setup.chatgpt.step3')}</li>
                      <li>{t('mcp.setup.chatgpt.step4')}</li>
                    </ol>
                  </div>

                  <div className="relative">
                    <div className="bg-neutral-900 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-neutral-400 font-mono">
                          openapi_schema.yaml
                        </span>
                        <button
                          onClick={() => copyToClipboard(chatGPTSchema, 'chatgpt')}
                          className="flex items-center px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm transition-colors duration-200"
                        >
                          {copiedCode === 'chatgpt' ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              {t('mcp.setup.copied')}
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              {t('mcp.setup.copy')}
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-sm text-neutral-100 overflow-x-auto">
                        <code>{chatGPTSchema}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* API Tab */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div className="bg-neutral-50 border-l-4 border-neutral-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">
                      {t('mcp.setup.api.title')}
                    </h3>
                    <p className="text-neutral-700">{t('mcp.setup.api.description')}</p>
                  </div>

                  <div className="relative">
                    <div className="bg-neutral-900 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-neutral-400 font-mono">
                          curl
                        </span>
                        <button
                          onClick={() => copyToClipboard(apiExample, 'api')}
                          className="flex items-center px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm transition-colors duration-200"
                        >
                          {copiedCode === 'api' ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              {t('mcp.setup.copied')}
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              {t('mcp.setup.copy')}
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-sm text-neutral-100 overflow-x-auto">
                        <code>{apiExample}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* MCP Functions Table */}
        <section className="py-16 bg-neutral-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-neutral-900 mb-12 text-center">
                {t('mcp.functions.title')}
              </h2>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">
                        {t('mcp.functions.functionName')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">
                        {t('mcp.functions.description')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">
                        {t('mcp.functions.exampleQuery')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {mcpFunctions.map((func, index) => (
                      <tr key={index} className="hover:bg-neutral-50">
                        <td className="px-6 py-4">
                          <code className="text-sm font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {func.name}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-700">
                          {func.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600 italic">
                          "{func.example}"
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-neutral-900 mb-12 text-center">
                {t('mcp.benefits.title')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border border-blue-100">
                  <Zap className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                    {t('mcp.benefits.speed.title')}
                  </h3>
                  <ul className="space-y-2 text-neutral-700">
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.speed.point1')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.speed.point2')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.speed.point3')}
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-8 border border-violet-100">
                  <Bot className="w-12 h-12 text-violet-600 mb-4" />
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                    {t('mcp.benefits.ai.title')}
                  </h3>
                  <ul className="space-y-2 text-neutral-700">
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-violet-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.ai.point1')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-violet-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.ai.point2')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-violet-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.ai.point3')}
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-8 border border-emerald-100">
                  <Shield className="w-12 h-12 text-emerald-600 mb-4" />
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                    {t('mcp.benefits.security.title')}
                  </h3>
                  <ul className="space-y-2 text-neutral-700">
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.security.point1')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.security.point2')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.security.point3')}
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-8 border border-orange-100">
                  <Rocket className="w-12 h-12 text-orange-600 mb-4" />
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                    {t('mcp.benefits.updates.title')}
                  </h3>
                  <ul className="space-y-2 text-neutral-700">
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.updates.point1')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.updates.point2')}
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                      {t('mcp.benefits.updates.point3')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-neutral-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-neutral-900 mb-12 text-center">
                {t('mcp.faq.title')}
              </h2>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-neutral-200 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors duration-200"
                    >
                      <h3 className="text-lg font-semibold text-neutral-900 pr-8">
                        {faq.question}
                      </h3>
                      {openFAQ === index ? (
                        <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                      )}
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${openFAQ === index ? 'max-h-96' : 'max-h-0'
                        }`}
                    >
                      <div className="px-6 pb-4">
                        <p className="text-neutral-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-violet-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                {t('mcp.finalCTA.title')}
              </h2>
              <p className="text-xl text-blue-100 mb-10">
                {t('mcp.finalCTA.description')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/profile/api-keys"
                  className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                  {t('mcp.finalCTA.getAPIKey')}
                  <ExternalLink className="w-5 h-5 ml-2" />
                </Link>

              </div>

              <p className="mt-8 text-blue-100">
                {t('mcp.finalCTA.joinUsers')}
              </p>
            </div>
          </div>
        </section>
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
                {t('footerMenu.companyDesc')}
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
              <h3 className="text-white font-semibold mb-4">{t('footerMenu.product')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/#features" className="hover:text-white transition-colors">{t('nav.features')}</Link></li>
                <li><Link href="/mcp-seo" className="hover:text-white transition-colors">{t('nav.mcpIntegration')}</Link></li>
                <li><Link href="/profile/api-keys" className="hover:text-white transition-colors">API & Webhooks</Link></li>
                <li><a href="https://flowxtra.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('footerMenu.talentManagement')}</a></li>
                <li><a href="https://flowxtra.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('footerMenu.ats')}</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-4">{t('footerMenu.resources')}</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-neutral-400">{t('footerMenu.documentation')}</span></li>
                <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">{t('footerMenu.legal')}</h3>
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

export default MCPSEOPage;
