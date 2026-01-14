import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { BarChart3, TrendingUp, Globe, ChevronRight, Menu, X } from 'lucide-react';

const Home: NextPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');

  const translations = {
    en: {
      title: 'SEO AI Agent',
      subtitle: 'Your Professional SEO Tracking Solution',
      description: 'Track your keywords, monitor rankings, and grow your business with our powerful SEO tools.',
      cta: 'Get Started',
      login: 'Sign In',
      features: {
        tracking: {
          title: 'Keyword Tracking',
          desc: 'Monitor your keyword positions in real-time across multiple search engines'
        },
        analytics: {
          title: 'Advanced Analytics',
          desc: 'Get detailed insights into your SEO performance with comprehensive reports'
        },
        reports: {
          title: 'Detailed Reports',
          desc: 'Generate professional reports to track your progress and share with clients'
        }
      }
    },
    de: {
      title: 'SEO AI Agent',
      subtitle: 'Ihre professionelle SEO-Tracking-Lösung',
      description: 'Verfolgen Sie Ihre Keywords, überwachen Sie Rankings und lassen Sie Ihr Geschäft wachsen.',
      cta: 'Jetzt starten',
      login: 'Anmelden',
      features: {
        tracking: {
          title: 'Keyword-Tracking',
          desc: 'Überwachen Sie Ihre Keyword-Positionen in Echtzeit über mehrere Suchmaschinen'
        },
        analytics: {
          title: 'Erweiterte Analytik',
          desc: 'Erhalten Sie detaillierte Einblicke in Ihre SEO-Performance mit umfassenden Berichten'
        },
        reports: {
          title: 'Detaillierte Berichte',
          desc: 'Erstellen Sie professionelle Berichte, um Ihren Fortschritt zu verfolgen'
        }
      }
    }
  };

  const t = translations[selectedLang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-neutral-900">{t.title}</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as 'en' | 'de')}
                className="px-3 py-1.5 bg-neutral-100 rounded-lg text-sm font-medium text-neutral-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
              <Link
                href="/login"
                className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
              >
                {t.login}
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                {t.cta}
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as 'en' | 'de')}
                className="w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm font-medium text-neutral-700"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
              <Link
                href="/login"
                className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
              >
                {t.login}
              </Link>
              <Link
                href="/login"
                className="block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-center font-semibold hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                {t.cta}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
              {t.subtitle}
            </h1>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              {t.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group active:scale-[0.98]"
              >
                {t.cta}
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                {t.features.tracking.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {t.features.tracking.desc}
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                {t.features.analytics.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {t.features.analytics.desc}
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                {t.features.reports.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {t.features.reports.desc}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-neutral-600 text-sm">
            © 2026 {t.title}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
