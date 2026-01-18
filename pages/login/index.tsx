import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useLanguage } from '../../context/LanguageContext';

const Login: NextPage = () => {
   const { t, locale, setLocale } = useLanguage();
   const router = useRouter();

   const redirectUrl = router.query.redirect ? String(router.query.redirect) : null;
   const googleLoginUrl = redirectUrl
      ? `/api/auth/google/login?returnUrl=${encodeURIComponent(redirectUrl)}`
      : `/api/auth/google/login`;

   return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center p-4">
         <Head>
            <title>{t('meta.login.title')}</title>
            <meta name="description" content={t('meta.login.description')} />
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
               <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t('auth.login.welcome')}</h1>
               <p className="text-neutral-600">{t('auth.login.description')}</p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
               {/* Google Login */}
               <a
                  href={googleLoginUrl}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-neutral-200 rounded-xl font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm hover:shadow-md group"
               >
                  <Image src="/icon/google-logo.svg" alt="Google" width={20} height={20} className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  {t('auth.login.googleBtn')}
               </a>


               {/* Back to Home */}
               <div className="mt-6 text-center">
                  <Link
                     href="/"
                     className="text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                  >
                     ← {t('auth.login.backToHome')}
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Login;
