import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Building2, Mail, Phone, MapPin, Menu, X, Globe } from 'lucide-react';

const ImpressumPage: React.FC = () => {
  const { t, locale, setLocale } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Schema.org for organization
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dpro GmbH',
    legalName: 'Dpro GmbH',
    url: 'https://seo-agent.net',
    logo: 'https://seo-agent.net/logo.png',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Wipplingerstraße 20/18',
      addressLocality: 'Wien',
      postalCode: '1010',
      addressCountry: 'AT',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+43-676-905-4441',
      contactType: 'customer support',
      email: 'office@dpro.at',
      availableLanguage: ['German', 'English'],
    },
    vatID: 'ATU81090445',
    taxID: 'ATU81090445',
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{t('meta.impressum.title')}</title>
        <meta name="description" content={t('meta.impressum.description')} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://seo-agent.net${locale === 'en' ? '' : '/' + locale}/impressum`} />

        {/* Hreflang Tags for Multi-language Support */}
        <link rel="alternate" hrefLang="en" href="https://seo-agent.net/impressum" />
        <link rel="alternate" hrefLang="de" href="https://seo-agent.net/de/impressum" />
        <link rel="alternate" hrefLang="fr" href="https://seo-agent.net/fr/impressum" />
        <link rel="alternate" hrefLang="x-default" href="https://seo-agent.net/impressum" />

        {/* Schema.org */}
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
              <Link href="/#features" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                Pricing
              </Link>
              <Link href="/mcp-seo" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                MCP Integration
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900">
                  <Globe className="h-4 w-4" />
                  {locale === 'de' ? 'DE' : 'EN'}
                </button>
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 hidden group-hover:block">
                  <button onClick={() => setLocale('en')} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">English</button>
                  <button onClick={() => setLocale('de')} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Deutsch</button>
                </div>
              </div>
              <Link href="/login" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
                Get Started
              </Link>
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
              <Link href="/#features" className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Features
              </Link>
              <Link href="/#pricing" className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              <Link href="/mcp-seo" className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
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
              <Link href="/login" className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
              <Link href="/auth/register" className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-semibold hover:bg-blue-700 transition-all active:scale-[0.98]" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-16">
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
                  {t('impressum.heading')}
                </h1>
                <p className="text-lg text-neutral-600">
                  {t('impressum.subtitle')}
                </p>
              </div>

              {/* Main Content */}
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 sm:p-12">
                {/* Company Information */}
                <section className="mb-10">
                  <div className="flex items-center mb-6">
                    <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-neutral-900">
                      {t('impressum.companyInfo')}
                    </h2>
                  </div>
                  <div className="space-y-3 text-neutral-700 text-lg">
                    <p className="font-semibold text-neutral-900">Dpro GmbH</p>
                    <p itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                      <span itemProp="streetAddress">Wipplingerstraße 20/18</span>
                      <br />
                      <span itemProp="postalCode">1010</span>{' '}
                      <span itemProp="addressLocality">Wien</span>
                      <br />
                      <span itemProp="addressCountry">Österreich (Austria)</span>
                    </p>
                  </div>
                </section>

                {/* Contact Information */}
                <section className="mb-10 pb-10 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    {t('impressum.contactInfo')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center text-neutral-700">
                      <Phone className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                      <a
                        href="tel:+436769054441"
                        className="hover:text-blue-600 transition-colors duration-200"
                        itemProp="telephone"
                      >
                        +43 676 905 4441
                      </a>
                    </div>
                    <div className="flex items-center text-neutral-700">
                      <Mail className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                      <a
                        href="mailto:office@dpro.at"
                        className="hover:text-blue-600 transition-colors duration-200"
                        itemProp="email"
                      >
                        office@dpro.at
                      </a>
                    </div>
                    <div className="flex items-start text-neutral-700">
                      <MapPin className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span>
                        Wipplingerstraße 20/18
                        <br />
                        1010 Wien, Austria
                      </span>
                    </div>
                  </div>
                </section>

                {/* Legal Information */}
                <section className="mb-10 pb-10 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    {t('impressum.legalInfo')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-neutral-700">
                    <div>
                      <p className="font-semibold text-neutral-900 mb-1">
                        {t('impressum.uid')}:
                      </p>
                      <p itemProp="vatID">ATU81090445</p>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 mb-1">
                        {t('impressum.fn')}:
                      </p>
                      <p>631492s</p>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 mb-1">
                        {t('impressum.gericht')}:
                      </p>
                      <p>Handelsgericht Wien</p>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 mb-1">
                        {t('impressum.kur')}:
                      </p>
                      <p>R150S0606</p>
                    </div>
                  </div>
                </section>

                {/* Business Activities */}
                <section className="mb-10 pb-10 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    {t('impressum.businessActivities')}
                  </h3>
                  <p className="text-neutral-700 leading-relaxed">
                    {t('impressum.businessDescription')}
                  </p>
                </section>

                {/* Responsible for Content */}
                <section className="mb-10 pb-10 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    {t('impressum.responsibleContent')}
                  </h3>
                  <p className="text-neutral-700">
                    <span className="font-semibold">
                      {t('impressum.managingDirector')}:
                    </span>{' '}
                    Dpro GmbH Geschäftsführung
                  </p>
                </section>

                {/* Dispute Resolution */}
                <section className="mb-10 pb-10 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    {t('impressum.disputeResolution')}
                  </h3>
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    {t('impressum.disputeText')}
                  </p>
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline transition-colors duration-200"
                  >
                    https://ec.europa.eu/consumers/odr
                  </a>
                </section>

                {/* Disclaimer */}
                <section>
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    {t('impressum.disclaimer')}
                  </h3>
                  <div className="space-y-4 text-neutral-700 leading-relaxed">
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-2">
                        {t('impressum.disclaimerContent')}:
                      </h4>
                      <p>{t('impressum.disclaimerContentText')}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-2">
                        {t('impressum.disclaimerLinks')}:
                      </h4>
                      <p>{t('impressum.disclaimerLinksText')}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-2">
                        {t('impressum.disclaimerCopyright')}:
                      </h4>
                      <p>{t('impressum.disclaimerCopyrightText')}</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer Note */}
              <div className="mt-8 text-center">
                <p className="text-sm text-neutral-500">
                  {t('impressum.lastUpdated')}: Januar 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/mcp-seo" className="hover:text-white transition-colors">MCP Integration</Link></li>
                <li><Link href="/profile/api-keys" className="hover:text-white transition-colors">API & Webhooks</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-neutral-400">Documentation</span></li>
                <li><a href="/#faq" className="hover:text-white transition-colors">FAQ</a></li>
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
            <p>© 2026 SEO Agent by Dpro GmbH. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ImpressumPage;
