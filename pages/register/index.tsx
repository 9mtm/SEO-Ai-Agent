
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const Register: NextPage = () => {
  const { t, locale, setLocale } = useLanguage();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);

  const handleGoogleSignUp = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!acceptTerms) {
      e.preventDefault();
      toast.error(t('auth.register.termsRequired'));
    }
    // If newsletter is checked, store preference
    if (subscribeNewsletter) {
      localStorage.setItem('newsletter_subscription', 'true');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center p-4">
      <Head>
        <title>{t('meta.register.title')}</title>
        <meta name="description" content={t('meta.register.description')} />

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

      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as 'en' | 'de' | 'fr')}
          className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
        </select>
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6 group">
            <Image src="/dpro_logo.png" alt="Dpro" width={40} height={40} className="h-10 w-10 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold text-neutral-900">SEO AI Agent</span>
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t('auth.register.welcome')}</h1>
          <p className="text-neutral-600">{t('auth.register.description')}</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
          {/* Terms and Conditions Checkbox */}
          <div className="mb-4">
            <label className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-2 text-sm text-neutral-700">
                {t('auth.register.termsLabel')}{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
                  {t('auth.register.termsLink')}
                </a>
                {' '}{t('auth.register.and')}{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
                  {t('auth.register.privacyLink')}
                </a>
              </span>
            </label>
          </div>

          {/* Newsletter Subscription Checkbox */}
          <div className="mb-6">
            <label className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                checked={subscribeNewsletter}
                onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-2 text-sm text-neutral-600">
                {t('auth.register.newsletterLabel')}
              </span>
            </label>
          </div>

          {/* Google Sign Up */}
          <a
            href="/api/auth/google/login?returnUrl=/onboarding"
            onClick={handleGoogleSignUp}
            className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 rounded-xl font-medium transition-all shadow-sm ${acceptTerms
              ? 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 hover:shadow-md cursor-pointer'
              : 'border-neutral-200 text-neutral-400 cursor-not-allowed opacity-60'
              }`}
          >
            <Image src="/icon/google-logo.svg" alt="Google" width={20} height={20} className={`h-5 w-5 ${acceptTerms ? 'group-hover:scale-110' : ''} transition-transform`} />
            {t('auth.register.googleBtn')}
          </a>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              {t('auth.register.haveAccount')}{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                {t('auth.register.signIn')}
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
            >
              ← {t('auth.register.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
