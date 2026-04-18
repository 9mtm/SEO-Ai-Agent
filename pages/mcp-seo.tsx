import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetStaticProps } from 'next';
import { useLanguage } from '@/context/LanguageContext';
import LandingHeader from '../components/common/LandingHeader';
import Footer from '../components/common/Footer';
import { tStatic, buildHreflangs, OG_LOCALE_MAP, SUPPORTED_LOCALES } from '../utils/i18nHelpers';
import { loadMessages } from '../utils/serverTranslate';
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
  AlertCircle,
  Globe,
} from 'lucide-react';

type McpSeoProps = {
  ssrMessages: Record<string, any>;
  ssrLocale: string;
};

const MCPSEOPage: React.FC<McpSeoProps> = ({ ssrMessages, ssrLocale }) => {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const tSSR = (key: string, vars?: Record<string, any>) => tStatic(ssrMessages, key, vars);
  const canonicalPath = ssrLocale === 'en' ? '/mcp-seo' : `/${ssrLocale}/mcp-seo`;
  const canonicalUrl = `https://seo-agent.net${canonicalPath}`;
  const hreflangs = buildHreflangs('/mcp-seo');
  const ogLocale = OG_LOCALE_MAP[ssrLocale] || 'en_US';
  const ogLocaleAlternates = SUPPORTED_LOCALES.filter(l => l !== ssrLocale).map(l => OG_LOCALE_MAP[l]);
  const [activeTab, setActiveTab] = useState<'claude' | 'cursor' | 'chatgpt' | 'web' | 'windsurf' | 'zed' | 'api'>('claude');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  // Schema.org for the page
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: tSSR('mcp.hero.title'),
    description: tSSR('mcp.hero.description'),
    articleBody: tSSR('mcp.hero.description'),
    author: {
      '@type': 'Organization',
      name: 'Dpro GmbH',
    },
  };

  // Full tool registry — mirrors lib/mcp/tools.ts exactly.
  const mcpFunctions = [
    // User / Workspace
    { name: 'get_profile', category: 'Profile', description: 'Return the authenticated user profile (name, email, picture).', example: 'Who am I signed in as?' },
    { name: 'get_current_workspace', category: 'Profile', description: 'Return info about the workspace the current credentials are bound to.', example: 'Which workspace am I in right now?' },

    // Domains
    { name: 'list_domains', category: 'Domains', description: 'List all domains in the active workspace.', example: 'Show me all my domains.' },

    // GSC insights
    { name: 'get_domain_insight', category: 'GSC', description: 'Get aggregated GSC stats (clicks, impressions, CTR, position), top keywords, pages and countries.', example: 'How is example.com performing in Google in the last 30 days?' },
    { name: 'get_domain_keywords', category: 'GSC', description: 'GSC keyword breakdown by query/device/country for the last N days.', example: 'Top queries for example.com by country last month.' },

    // Rank tracker
    { name: 'list_tracked_keywords', category: 'Tracking', description: 'List manually-tracked rank keywords for a domain.', example: 'What keywords am I tracking for example.com?' },
    { name: 'add_tracked_keyword', category: 'Tracking', description: 'Add a keyword to the rank tracker for a domain.', example: 'Start tracking "ai seo tools" on example.com.' },

    // Competitors
    { name: 'list_domain_competitors', category: 'Competitors', description: 'List competitor domains configured for a given domain.', example: 'Who are my competitors for example.com?' },
    { name: 'update_domain_competitors', category: 'Competitors', description: 'Replace the competitor list for a domain.', example: 'Set competitors for example.com to ahrefs.com and semrush.com.' },
    { name: 'get_keyword_competitors', category: 'Competitors', description: 'Current competitor ranking positions for a specific tracked keyword.', example: 'Who ranks near me for "seo ai tools"?' },
    { name: 'get_competitor_history', category: 'Competitors', description: 'Time-series ranking history for competitors on a keyword.', example: 'How has competitor.com ranked for "seo ai" over time?' },

    // Content research — BEFORE writing
    { name: 'get_domain_seo_overview', category: 'Research', description: 'Domain-level SEO health: clicks, impressions, CTR, position + period-over-period change.', example: 'Give me a 30-day SEO summary for example.com.' },
    { name: 'find_keyword_opportunities', category: 'Research', description: 'Quick-win buckets: striking distance, low CTR, zero-click, rising keywords.', example: 'Find keyword opportunities for example.com.' },
    { name: 'generate_content_brief', category: 'Research', description: 'Full content brief for a new article: primary/secondary keywords, target word count, suggested structure, internal link candidates.', example: 'Build a content brief for "best ai seo tools" on example.com.' },

    // Posts + SEO analyzer
    { name: 'list_posts', category: 'Posts', description: 'List articles/posts in a domain (draft, published, scheduled).', example: 'Show all my draft posts for example.com.' },
    { name: 'get_post', category: 'Posts', description: 'Fetch a single post with full HTML content and metadata.', example: 'Show me post #42.' },
    { name: 'analyze_seo', category: 'Posts', description: 'Run the built-in analyzer on article content (20+ on-page checks, 0-100 score, actionable fixes).', example: 'Analyze this draft for SEO.' },
    { name: 'save_post', category: 'Posts', description: 'Create or update a post. Automatically computes the SEO score and returns both the saved post and the full analyzer report.', example: 'Save this article as a draft and tell me the SEO score.' },
    { name: 'delete_post', category: 'Posts', description: 'Delete a post by ID.', example: 'Delete post #42.' }
  ];

  const faqs = [
    {
      question: 'Do I need an API key to connect Claude, Cursor or ChatGPT?',
      answer: 'No. The server supports OAuth 2.0 Dynamic Client Registration (RFC 7591) and the MCP 2025-06-18 auth spec. You paste a single URL (/api/mcp) into your AI client — it auto-registers, opens your browser for approval, and gets its own access token. Nothing to copy, nothing to manage.'
    },
    {
      question: 'How does the authentication actually work under the hood?',
      answer: 'Your AI client first hits /api/mcp and receives HTTP 401 with a WWW-Authenticate header. It discovers the authorization server at /.well-known/oauth-authorization-server, registers a client at /api/oauth/register, then runs the Authorization Code + PKCE flow at /api/oauth/authorize. You approve once on the consent screen, it receives a code, exchanges it for an access_token + refresh_token at /api/oauth/token, and the MCP session is live.'
    },
    {
      question: 'Which workspace does my AI assistant access?',
      answer: 'The workspace that is active at the moment you approve the connection. You can switch workspaces from the sidebar, then reconnect your assistant — it will be bound to the new workspace. You can also revoke any connection any time from /profile/oauth-apps.'
    },
    {
      question: 'Can team members connect their own AI assistants to the same workspace?',
      answer: 'Yes. Each team member runs the same OAuth flow under their own account — they each get a personal access token scoped to the workspaces they are a member of, with the role (owner / admin / editor / viewer) they have in each. Owners and admins can revoke any teammate connection from the Connected Apps page.'
    },
    {
      question: 'Which scopes are requested and what do they control?',
      answer: 'read:profile (your user info + current workspace), read:domains / write:domains, read:gsc (GSC aggregates), read:keywords / write:keywords (rank tracker), and read:analytics. Your AI client only asks for what it needs — the consent screen shows you exactly which scopes you are granting before you approve.'
    },
    {
      question: 'What does the MCP server expose — which tools can the AI call?',
      answer: 'All 19 tools listed in the "Available MCP Tools" table above: profile + workspace info, domains, GSC insights + keywords, rank tracker with competitors, content research (SEO overview, keyword opportunities, content briefs), posts CRUD, and a built-in SEO analyzer that scores articles 0-100 across 20+ on-page factors.'
    },
    {
      question: 'Is my data safe when an AI assistant is connected?',
      answer: 'Access tokens are short-lived (1 hour) and refreshed automatically. All tokens are sha256-hashed in the database — we never store them in plain text. Every sync triggered via MCP is logged in gsc_sync_log with the source (mcp / oauth / web) so you have a full audit trail. Revoking a connection invalidates every token it holds immediately.'
    },
    {
      question: 'Can I register my own OAuth app that end-users of my product can sign in with?',
      answer: 'Yes. Go to /profile/oauth-apps → Developer section → Register an App. You will receive a client_id (and client_secret for confidential clients). Your app can then redirect users to /api/oauth/authorize with "Sign in with SEO AI Agent" — they approve, and your backend exchanges the code for an access token bound to their workspace.'
    }
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // New auto-connect config — no API key, no manual copy.
  // Clients auto-discover /.well-known/oauth-authorization-server, register
  // themselves (RFC 7591), and run OAuth Authorization Code + PKCE in the
  // user's browser. Just paste the URL in Claude Desktop / Cursor / ChatGPT.
  const claudeConfig = `{
  "mcpServers": {
    "seo-ai-agent": {
      "url": "https://seo-agent.net/api/mcp"
    }
  }
}`;

  const apiExample = `# After OAuth (Authorization Code + PKCE), the client has an access token.
# All MCP JSON-RPC methods hit the same endpoint:

curl -X POST https://seo-agent.net/api/mcp \\
  -H "Authorization: Bearer <oauth-access-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": { "name": "get_domain_insight", "arguments": { "domain": "example.com" } }
  }'`;

  const chatGPTProxyConfig = `{
  "mcpServers": {
    "seo-ai-agent": {
      "url": "https://seo-agent.net/api/mcp"
    }
  }
}`;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        {/* Primary Meta Tags */}
        <title>{tSSR('meta.mcpSeo.title')}</title>
        <meta name="description" content={tSSR('meta.mcpSeo.description')} />
        <meta name="keywords" content={tSSR('meta.mcpSeo.keywords')} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="Dpro GmbH" />

        {/* Hreflang Tags for Multi-language Support (11 locales + x-default) */}
        {hreflangs.map(h => (
          <link key={h.hrefLang} rel="alternate" hrefLang={h.hrefLang} href={h.href} />
        ))}

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={tSSR('meta.mcpSeo.ogTitle')} />
        <meta property="og:description" content={tSSR('meta.mcpSeo.ogDescription')} />
        <meta property="og:image" content="https://seo-agent.net/ogImage.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="SEO Agent" />
        <meta property="og:locale" content={ogLocale} />
        {ogLocaleAlternates.map(alt => (
          <meta key={alt} property="og:locale:alternate" content={alt} />
        ))}
        <meta property="article:author" content="Dpro GmbH" />
        <meta property="article:section" content="Technology" />
        <meta property="article:tag" content="MCP" />
        <meta property="article:tag" content="SEO" />
        <meta property="article:tag" content="AI" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={tSSR('seo.mcpSeo.twitterTitle')} />
        <meta name="twitter:description" content={tSSR('seo.mcpSeo.twitterDescription')} />
        <meta name="twitter:image" content="https://seo-agent.net/twitter-image-mcp.png" />
        <meta name="twitter:creator" content="@DproGmbH" />
        <meta name="twitter:site" content="@SEOAgent" />

        {/* Additional SEO Tags */}
        <meta name="geo.region" content="AT-9" />
        <meta name="geo.placename" content="Vienna" />
        <meta name="geo.position" content="48.208176;16.373819" />
        <meta name="ICBM" content="48.208176, 16.373819" />
        <meta name="language" content={ssrLocale} />
        <meta httpEquiv="content-language" content={ssrLocale} />

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

      <LandingHeader />

      {/* Main Content */}
      <main className="pt-24">
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
                  href="/profile/oauth-apps"
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {t('mcp.autoConnect.heroCta')}
                  <ExternalLink className="w-5 h-5 ml-2" />
                </Link>
              </div>
              <p className="text-sm text-neutral-500 mt-4">
                {t('mcp.autoConnect.heroSubtext')}
              </p>
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

                <div className="bg-white rounded-xl border-2 border-green-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Bot className="w-10 h-10 text-green-600" />
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Supported
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    Cursor, Windsurf, Zed & more
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Any MCP-compatible client
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      OAuth 2.0 auto-registration
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Single-URL setup
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
                  onClick={() => setActiveTab('cursor')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'cursor'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                >
                  Cursor
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
                  onClick={() => setActiveTab('web')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === 'web'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                >
                  <Globe className="w-4 h-4" />
                  Web-Based
                </button>
                <button
                  onClick={() => setActiveTab('windsurf')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'windsurf'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                >
                  Windsurf
                </button>
                <button
                  onClick={() => setActiveTab('zed')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'zed'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                >
                  Zed
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
                      {t('mcp.autoConnect.claudeTitle')}
                    </h3>
                    <ol className="space-y-3 text-neutral-700">
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">1</span>
                        <span>Open Claude Desktop Settings → Developer → Edit Config</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">2</span>
                        <span>Paste the configuration below — <strong>no API key needed</strong></span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">3</span>
                        <span>Restart Claude Desktop. It will open your browser to approve the connection, then log you in automatically.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">4</span>
                        <span>Done — you can now ask Claude about your SEO data.</span>
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
                      {t('mcp.autoConnect.doneTitle')}
                    </h3>
                    <p className="text-neutral-700">
                      On first use Claude Desktop will open a tab on seo-agent.net, ask you to approve the connection, and redirect back automatically. After that, every MCP call is handled by the access token Claude received — no further action needed.
                    </p>
                  </div>
                </div>
              )}

              {/* Cursor Tab */}
              {activeTab === 'cursor' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-neutral-900 mb-4">
                      {t('mcp.autoConnect.cursorTitle')}
                    </h3>
                    <ol className="space-y-3 text-neutral-700">
                      <li className="flex items-start">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">1</span>
                        <span>Open Cursor → Settings → MCP → <strong>Add new MCP server</strong>.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">2</span>
                        <span>Name it "SEO AI Agent" and set Type to <strong>http</strong>.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">3</span>
                        <span>Paste the URL <code>https://seo-agent.net/api/mcp</code> — leave auth blank.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">4</span>
                        <span>Save. Cursor opens your browser for OAuth approval, then stays connected.</span>
                      </li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-neutral-900 rounded-lg p-6">
                      <div className="text-sm text-neutral-400 mb-2">Name</div>
                      <code className="text-green-400 block mb-4">seo-ai-agent</code>

                      <div className="text-sm text-neutral-400 mb-2">Type</div>
                      <code className="text-green-400 block mb-4">http</code>

                      <div className="text-sm text-neutral-400 mb-2">URL</div>
                      <div className="flex items-center gap-2">
                        <code className="text-green-400 block text-xs break-all">https://seo-agent.net/api/mcp</code>
                        <button onClick={() => copyToClipboard('https://seo-agent.net/api/mcp', 'cmd')} className="text-neutral-500 hover:text-white">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-neutral-900 rounded-lg p-6">
                      <div className="text-sm text-neutral-400 mb-2">Authentication</div>
                      <div className="space-y-3">
                        <div className="text-xs text-green-400 font-mono">OAuth 2.0 (automatic)</div>
                        <div className="text-xs text-neutral-400 leading-relaxed">
                          When you first call the server, Cursor will open your browser to approve the connection. After you approve, Cursor is authenticated automatically — no API key to manage.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Web-Based Tab */}
              {activeTab === 'web' && (
                <div className="space-y-6">
                  <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <Globe className="w-6 h-6" />
                      Access SEO Agent from Any Browser
                    </h3>
                    <p className="text-neutral-700 mb-4">
                      No installation required! Use our web-based interface to access all SEO features directly from your browser.
                    </p>
                    <ul className="space-y-2 text-neutral-700">
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Works on any device (Desktop, Mobile, Tablet)</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>No software installation needed</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Automatic updates</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Same powerful features as desktop apps</span>
                      </li>
                    </ul>
                  </div>

                  {/* Quick Start */}
                  <div className="bg-white border-2 border-green-200 rounded-lg p-6">
                    <h4 className="font-bold text-neutral-900 mb-4">Quick Start:</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</span>
                        <div>
                          <p className="font-semibold text-neutral-900">Sign in with Google</p>
                          <p className="text-sm text-neutral-600">One click — we auto-create your workspace and link your Search Console.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</span>
                        <div>
                          <p className="font-semibold text-neutral-900">Import your domains</p>
                          <p className="text-sm text-neutral-600">Pick verified GSC sites from the onboarding screen — no manual setup.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</span>
                        <div>
                          <p className="font-semibold text-neutral-900">Ask AI from the built-in chat</p>
                          <p className="text-sm text-neutral-600">No install, works on any browser — same tools your AI assistant gets via MCP.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="text-center">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Rocket className="w-5 h-5 mr-2" />
                      Go to Dashboard
                      <ExternalLink className="w-5 h-5 ml-2" />
                    </Link>
                  </div>

                  {/* Feature Comparison */}
                  <div className="bg-neutral-50 rounded-lg p-6">
                    <h4 className="font-bold text-neutral-900 mb-4">Web vs Desktop:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-green-700 mb-2">✅ Web-Based Advantages:</p>
                        <ul className="space-y-1 text-neutral-600">
                          <li>• No installation</li>
                          <li>• Works everywhere</li>
                          <li>• Always up-to-date</li>
                          <li>• Easy to share</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-700 mb-2">⚡ Desktop Advantages:</p>
                        <ul className="space-y-1 text-neutral-600">
                          <li>• Offline access</li>
                          <li>• Faster response</li>
                          <li>• More integrations</li>
                          <li>• Advanced features</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Windsurf Tab */}
              {activeTab === 'windsurf' && (
                <div className="space-y-6">
                  <div className="bg-cyan-50 border-l-4 border-cyan-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-neutral-900 mb-4">
                      {t('mcp.autoConnect.windsurfTitle')}
                    </h3>
                    <ol className="space-y-3 text-neutral-700">
                      <li className="flex items-start">
                        <span className="bg-cyan-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">1</span>
                        <span>Open Windsurf → Settings → MCP Servers → <strong>Add Server</strong>.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-cyan-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">2</span>
                        <span>Paste the config below — only the URL matters, no secrets.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-cyan-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">3</span>
                        <span>Save and reload. Windsurf opens your browser for OAuth approval, then connects automatically.</span>
                      </li>
                    </ol>
                  </div>
                  <div className="relative">
                    <div className="bg-neutral-900 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-neutral-400 font-mono">
                          mcp_config.json
                        </span>
                        <button
                          onClick={() => copyToClipboard(claudeConfig, 'windsurf')}
                          className="flex items-center px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm transition-colors duration-200"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          {t('mcp.setup.copy')}
                        </button>
                      </div>
                      <pre className="text-sm text-neutral-100 overflow-x-auto">
                        <code>{claudeConfig}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Zed Tab */}
              {activeTab === 'zed' && (
                <div className="space-y-6">
                  <div className="bg-orange-50 border-l-4 border-orange-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-neutral-900 mb-4">
                      {t('mcp.autoConnect.zedTitle')}
                    </h3>
                    <ol className="space-y-3 text-neutral-700">
                      <li className="flex items-start">
                        <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">1</span>
                        <span>Open Zed → <code>cmd/ctrl + ,</code> → <code>settings.json</code>.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">2</span>
                        <span>Add the snippet below under <code>assistant.mcp_servers</code> and save.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">3</span>
                        <span>Zed will open your browser once to approve — after that it's connected for good.</span>
                      </li>
                    </ol>
                  </div>
                  <div className="relative">
                    <div className="bg-neutral-900 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-neutral-400 font-mono">
                          settings.json
                        </span>
                        <button
                          onClick={() => copyToClipboard(claudeConfig, 'zed')}
                          className="flex items-center px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm transition-colors duration-200"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          {t('mcp.setup.copy')}
                        </button>
                      </div>
                      <pre className="text-sm text-neutral-100 overflow-x-auto">
                        <code>{claudeConfig}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* ChatGPT Tab */}
              {activeTab === 'chatgpt' && (
                <div className="space-y-6">
                  <div className="bg-violet-50 border-l-4 border-violet-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-neutral-900 mb-4">
                      {t('mcp.autoConnect.chatgptTitle')}
                    </h3>
                    <ol className="space-y-3 text-neutral-700">
                      <li className="flex items-start">
                        <span className="bg-violet-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">1</span>
                        <span>Open ChatGPT Settings → Beta Features → MCP Servers</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-violet-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">2</span>
                        <span>Click <strong>Add Server</strong> and paste the URL below — nothing else to fill in.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-violet-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">3</span>
                        <span>ChatGPT will open your browser. Approve the connection on SEO Agent and you'll be sent straight back — already signed in.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-violet-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">4</span>
                        <span>Start asking ChatGPT about your SEO data!</span>
                      </li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-neutral-900 rounded-lg p-6">
                      <div className="text-sm text-neutral-400 mb-2">Name</div>
                      <code className="text-green-400 block mb-4">SEO AI Agent</code>
                      <div className="text-sm text-neutral-400 mb-2">URL</div>
                      <div className="flex items-center gap-2">
                        <code className="text-green-400 block text-xs break-all">https://seo-agent.net/api/mcp</code>
                        <button onClick={() => copyToClipboard('https://seo-agent.net/api/mcp', 'chatgpt-url')} className="text-neutral-500 hover:text-white">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-neutral-900 rounded-lg p-6">
                      <div className="text-sm text-neutral-400 mb-2">Authentication</div>
                      <div className="text-xs text-green-400 font-mono mb-2">OAuth 2.0 (automatic)</div>
                      <div className="text-xs text-neutral-400 leading-relaxed">
                        The first call triggers an OAuth flow in your browser. You approve once, then ChatGPT gets an access token automatically — no API key to manage, no config to edit.
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">How it works:</p>
                        <p>ChatGPT uses standard OAuth 2.0 Authorization Code + PKCE. When you approve the connection on our site, it's bound to your currently-active workspace and the scopes you grant — you can revoke it any time from <Link href="/profile/oauth-apps" className="underline">Connected Apps</Link>.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* API Tab */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div className="bg-neutral-50 border-l-4 border-neutral-600 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">{t('mcp.autoConnect.apiTitle')}</h3>
                    <p className="text-neutral-700">
                      Every MCP tool is available via a single endpoint at <code className="bg-white px-1.5 py-0.5 rounded text-sm">POST /api/mcp</code>.
                      Authenticate with an <strong>OAuth 2.0 access token</strong> obtained through our discovery endpoints (<code>/.well-known/oauth-authorization-server</code>, Dynamic Client Registration via <code>/api/oauth/register</code>, then Authorization Code + PKCE at <code>/api/oauth/authorize</code>). Once you have a token, all tool calls use the same JSON-RPC 2.0 payload shape.
                    </p>
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

              <p className="text-center text-neutral-600 mb-8">
                {mcpFunctions.length} tools across {new Set(mcpFunctions.map((f) => f.category)).size} categories — all workspace-scoped and OAuth-authenticated.
              </p>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">{t('mcp.functions.functionName')}</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">{t('mcp.functions.description')}</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">{t('mcp.functions.exampleQuery')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {mcpFunctions.map((func, index) => (
                      <tr key={index} className="hover:bg-neutral-50">
                        <td className="px-4 py-4">
                          <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-violet-50 text-violet-700 rounded-full border border-violet-100">
                            {(func as any).category || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <code className="text-sm font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
                            {func.name}
                          </code>
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-700">{func.description}</td>
                        <td className="px-4 py-4 text-sm text-neutral-600 italic">"{func.example}"</td>
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
                  href="/profile/oauth-apps"
                  className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                  {t('mcp.autoConnect.heroCta')}
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
      <Footer />
    </div>
  );
};

export const getStaticProps: GetStaticProps<McpSeoProps> = async ({ locale }) => {
  const resolvedLocale = locale || 'en';
  const ssrMessages = loadMessages(resolvedLocale);
  return {
    props: { ssrMessages, ssrLocale: resolvedLocale },
  };
};

export default MCPSEOPage;
