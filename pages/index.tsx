import type { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BarChart3, TrendingUp, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LandingHeader from '../components/common/LandingHeader';
import { tStatic, buildHreflangs, OG_LOCALE_MAP, SUPPORTED_LOCALES } from '../utils/i18nHelpers';
import { loadMessages } from '../utils/serverTranslate';

// Import new landing page components
import Stats from '../components/landing/Stats';

import EnhancedFeatures from '../components/landing/EnhancedFeatures';
import AIIntegrationsShowcase from '../components/landing/AIIntegrationsShowcase';
import Testimonials from '../components/landing/Testimonials';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/common/Footer';

type HomeProps = {
  ssrMessages: Record<string, any>;
  ssrLocale: string;
};

const Home: NextPage<HomeProps> = ({ ssrMessages, ssrLocale }) => {
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();
  const tSSR = (key: string, vars?: Record<string, any>) => tStatic(ssrMessages, key, vars);
  const canonicalPath = ssrLocale === 'en' ? '/' : `/${ssrLocale}/`;
  const canonicalUrl = `https://seo-agent.net${canonicalPath}`;
  const hreflangs = buildHreflangs('/');
  const ogLocale = OG_LOCALE_MAP[ssrLocale] || 'en_US';
  const ogLocaleAlternates = SUPPORTED_LOCALES.filter(l => l !== ssrLocale).map(l => OG_LOCALE_MAP[l]);

  // SoftwareApplication Schema (no fake reviews — add only when real verifiable reviews exist)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SEO Agent',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: canonicalUrl,
    image: 'https://seo-agent.net/logo.png',
    description: tSSR('meta.home.description'),
    brand: { '@type': 'Brand', name: 'SEO Agent' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '0',
      highPrice: '99',
      offerCount: '3',
    },
    author: {
      '@type': 'Organization',
      name: 'Dpro GmbH',
      url: 'https://seo-agent.net',
    },
  };

  // FAQPage schema built from 10 FAQ entries in landing.faq.q1..q10
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: Array.from({ length: 10 }, (_, i) => i + 1).map(n => ({
      '@type': 'Question',
      name: tSSR(`landing.faq.q${n}.question`),
      acceptedAnswer: {
        '@type': 'Answer',
        text: tSSR(`landing.faq.q${n}.answer`),
      },
    })),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        {/* Primary Meta Tags */}
        <title>{tSSR('meta.home.title')}</title>
        <meta name="description" content={tSSR('meta.home.description')} />
        <meta name="keywords" content={tSSR('meta.home.keywords')} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="Dpro GmbH" />

        {/* Hreflang Tags for Multi-language Support (11 locales + x-default) */}
        {hreflangs.map(h => (
          <link key={h.hrefLang} rel="alternate" hrefLang={h.hrefLang} href={h.href} />
        ))}

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={tSSR('meta.home.ogTitle')} />
        <meta property="og:description" content={tSSR('meta.home.ogDescription')} />
        <meta property="og:image" content="https://seo-agent.net/ogImage.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="SEO Agent" />
        <meta property="og:locale" content={ogLocale} />
        {ogLocaleAlternates.map(alt => (
          <meta key={alt} property="og:locale:alternate" content={alt} />
        ))}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={tSSR('seo.home.twitterTitle')} />
        <meta name="twitter:description" content={tSSR('seo.home.twitterDescription')} />
        <meta name="twitter:image" content="https://seo-agent.net/twitter-image.png" />
        <meta name="twitter:creator" content="@DproGmbH" />
        <meta name="twitter:site" content="@SEOAgent" />

        {/* Additional SEO Tags */}
        <meta name="geo.region" content="AT-9" />
        <meta name="geo.placename" content="Vienna" />
        <meta name="geo.position" content="48.208176;16.373819" />
        <meta name="ICBM" content="48.208176, 16.373819" />
        <meta name="language" content={ssrLocale} />
        <meta httpEquiv="content-language" content={ssrLocale} />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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

      <LandingHeader activePage="home" />

      {/* Hero Section - Enhanced */}
      <main className="pt-24">
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 via-white to-neutral-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-2 leading-tight">
                {t('hero.headline')}
              </h1>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 mb-6 leading-tight">
                {t('hero.subheadline')}
              </h2>
              <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                {t('hero.description')}
              </p>

              {/* USP Bullets */}
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 max-w-4xl mx-auto">
                <div className="flex items-center justify-start sm:justify-center text-left gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-neutral-700 font-medium">{t('hero.bullet1')}</span>
                </div>
                <div className="flex items-center justify-start sm:justify-center text-left gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-neutral-700 font-medium">{t('hero.bullet2')}</span>
                </div>
                <div className="flex items-center justify-start sm:justify-center text-left gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-neutral-700 font-medium">{t('hero.bullet3')}</span>

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
                <p className="text-sm text-neutral-500 mb-4">{t('hero.trustedBy')}</p>
                <div className="flex space-x-3 mb-4 items-center justify-center">
                  <img src="/icon/google-logo.svg" alt="Google" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                  <img src="/icon/bing-logo.svg" alt="Bing" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                  <img src="/icon/chatgpt-logo.svg" alt="ChatGPT" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                  <img src="/icon/claude-logo.svg" alt="Claude" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                  <img src="/icon/gemini-logo.svg" alt="Gemini" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                  <img src="/icon/perplexity-logo.svg" alt="Perplexity" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* How It Works Section */}


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
      <Footer />
    </div>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async ({ locale }) => {
  const resolvedLocale = locale || 'en';
  const ssrMessages = loadMessages(resolvedLocale);
  return {
    props: { ssrMessages, ssrLocale: resolvedLocale },
  };
};

export default Home;
