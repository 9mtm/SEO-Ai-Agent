import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BarChart3, TrendingUp, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LandingHeader from '../components/common/LandingHeader';

// Import new landing page components
import Stats from '../components/landing/Stats';

import EnhancedFeatures from '../components/landing/EnhancedFeatures';
import AIIntegrationsShowcase from '../components/landing/AIIntegrationsShowcase';
import Testimonials from '../components/landing/Testimonials';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/common/Footer';

const Home: NextPage = () => {
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();

  // Organization Schema for SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SEO Agent',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    image: 'https://seo-agent.net/logo.png',
    brand: {
      '@type': 'Brand',
      name: 'SEO Agent',
    },
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
      reviewCount: '3',
    },
    review: [
      {
        '@type': 'Review',
        itemReviewed: {
          '@type': 'SoftwareApplication',
          name: 'SEO Agent',
        },
        author: {
          '@type': 'Person',
          name: 'Sarah Ahmed',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        reviewBody: 'An amazing tool that helped us improve our website ranking by 150% in just 3 months. The multi-country tracking feature is a game-changer!',
      },
      {
        '@type': 'Review',
        itemReviewed: {
          '@type': 'SoftwareApplication',
          name: 'SEO Agent',
        },
        author: {
          '@type': 'Person',
          name: 'Michael Schmidt',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        reviewBody: 'The detailed reports and daily tracking made my job so much easier. The AI content generation is incredibly accurate and saves hours of work.',
      },
      {
        '@type': 'Review',
        itemReviewed: {
          '@type': 'SoftwareApplication',
          name: 'SEO Agent',
        },
        author: {
          '@type': 'Person',
          name: 'Lisa Chen',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        reviewBody: 'Best SEO tool I\'ve ever used. The interface is simple and the results are accurate. The WordPress integration is seamless!',
      },
    ],
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
        <title>{t('meta.home.title')}</title>
        <meta name="description" content={t('meta.home.description')} />
        <meta name="keywords" content={t('meta.home.keywords')} />
        <link rel="canonical" href={`https://seo-agent.net${router.locale === 'en' ? '' : '/' + router.locale}/`} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="Dpro GmbH" />

        {/* Hreflang Tags for Multi-language Support */}
        <link rel="alternate" hrefLang="en" href="https://seo-agent.net/" />
        <link rel="alternate" hrefLang="de" href="https://seo-agent.net/de/" />
        <link rel="alternate" hrefLang="fr" href="https://seo-agent.net/fr/" />
        <link rel="alternate" hrefLang="x-default" href="https://seo-agent.net/" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://seo-agent.net${router.locale === 'en' ? '' : '/' + router.locale}/`} />
        <meta property="og:title" content={t('meta.home.ogTitle')} />
        <meta property="og:description" content={t('meta.home.ogDescription')} />
        <meta property="og:image" content="https://seo-agent.net/ogImage.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="SEO Agent" />
        <meta property="og:locale" content={router.locale === 'de' ? 'de_DE' : 'en_US'} />
        <meta property="og:locale:alternate" content={router.locale === 'de' ? 'en_US' : 'de_DE'} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://seo-agent.net${router.locale === 'de' ? '/de' : ''}/`} />
        <meta name="twitter:title" content={t('seo.home.twitterTitle')} />
        <meta name="twitter:description" content={t('seo.home.twitterDescription')} />
        <meta name="twitter:image" content="https://seo-agent.net/twitter-image.png" />
        <meta name="twitter:creator" content="@DproGmbH" />
        <meta name="twitter:site" content="@SEOAgent" />

        {/* Additional SEO Tags */}
        <meta name="geo.region" content="AT-9" />
        <meta name="geo.placename" content="Vienna" />
        <meta name="geo.position" content="48.208176;16.373819" />
        <meta name="ICBM" content="48.208176, 16.373819" />
        <meta name="language" content={router.locale} />
        <meta httpEquiv="content-language" content={router.locale} />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
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

export default Home;
