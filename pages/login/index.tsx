import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { BarChart3, Mail, Lock, AlertCircle, Loader2, Chrome } from 'lucide-react';

type LoginError = {
   type: string;
   msg: string;
};

const Login: NextPage = () => {
   const [error, setError] = useState<LoginError | null>(null);
   const [username, setUsername] = useState<string>('');
   const [password, setPassword] = useState<string>('');
   const [isLoading, setIsLoading] = useState(false);
   const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
   const router = useRouter();

   const translations = {
      en: {
         title: 'Sign In',
         welcome: 'Welcome back!',
         description: 'Sign in to access your dashboard',
         username: 'Username',
         password: 'Password',
         loginBtn: 'Sign In',
         googleBtn: 'Continue with Google',
         or: 'OR',
         backToHome: 'Back to Home',
         errors: {
            emptyFields: 'Please enter your username and password',
            emptyUsername: 'Please enter your username',
            emptyPassword: 'Please enter your password',
            serverError: 'Could not login, the server is not responsive'
         }
      },
      de: {
         title: 'Anmelden',
         welcome: 'Willkommen zurück!',
         description: 'Melden Sie sich an, um auf Ihr Dashboard zuzugreifen',
         username: 'Benutzername',
         password: 'Passwort',
         loginBtn: 'Anmelden',
         googleBtn: 'Mit Google fortfahren',
         or: 'ODER',
         backToHome: 'Zurück zur Startseite',
         errors: {
            emptyFields: 'Bitte geben Sie Ihren Benutzernamen und Ihr Passwort ein',
            emptyUsername: 'Bitte geben Sie Ihren Benutzernamen ein',
            emptyPassword: 'Bitte geben Sie Ihr Passwort ein',
            serverError: 'Anmeldung nicht möglich, der Server antwortet nicht'
         }
      }
   };

   const t = translations[selectedLang];

   const loginuser = async () => {
      setIsLoading(true);
      let loginError: LoginError | null = null;

      if (!username || !password) {
         if (!username && !password) {
            loginError = { type: 'empty_username_password', msg: t.errors.emptyFields };
         }
         if (!username && password) {
            loginError = { type: 'empty_username', msg: t.errors.emptyUsername };
         }
         if (!password && username) {
            loginError = { type: 'empty_password', msg: t.errors.emptyPassword };
         }
         setError(loginError);
         setIsLoading(false);
         setTimeout(() => { setError(null); }, 3000);
      } else {
         try {
            const header = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
            const fetchOpts = { method: 'POST', headers: header, body: JSON.stringify({ username, password }) };
            const fetchRoute = `${window.location.origin}/api/login`;
            const res = await fetch(fetchRoute, fetchOpts).then((result) => result.json());

            if (!res.success) {
               let errorType = '';
               if (res.error && res.error.toLowerCase().includes('username')) {
                  errorType = 'incorrect_username';
               }
               if (res.error && res.error.toLowerCase().includes('password')) {
                  errorType = 'incorrect_password';
               }
               setError({ type: errorType, msg: res.error });
               setIsLoading(false);
               setTimeout(() => { setError(null); }, 3000);
            } else {
               router.push('/domains');
            }
         } catch (fetchError) {
            setError({ type: 'unknown', msg: t.errors.serverError });
            setIsLoading(false);
            setTimeout(() => { setError(null); }, 3000);
         }
      }
   };

   const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
         loginuser();
      }
   };

   return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center p-4">
         <Head>
            <title>{t.title} - SEO AI Agent</title>
            <meta name="description" content="Sign in to SEO AI Agent" />
         </Head>

         {/* Language Selector */}
         <div className="absolute top-4 right-4">
            <select
               value={selectedLang}
               onChange={(e) => setSelectedLang(e.target.value as 'en' | 'de')}
               className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
               <option value="en">English</option>
               <option value="de">Deutsch</option>
            </select>
         </div>

         <div className="w-full max-w-md">
            {/* Logo and Title */}
            <div className="text-center mb-8">
               <Link href="/" className="inline-flex items-center space-x-2 mb-6 group">
                  <BarChart3 className="h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold text-neutral-900">SEO AI Agent</span>
               </Link>
               <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t.welcome}</h1>
               <p className="text-neutral-600">{t.description}</p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
               {/* Google Login */}
               <a
                  href="/api/auth/google/login"
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-neutral-200 rounded-xl font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm hover:shadow-md group"
               >
                  <Chrome className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  {t.googleBtn}
               </a>

               {/* Divider */}
               <div className="flex items-center my-6">
                  <div className="flex-grow border-t border-neutral-200"></div>
                  <span className="flex-shrink-0 mx-4 text-neutral-400 text-sm font-medium">{t.or}</span>
                  <div className="flex-grow border-t border-neutral-200"></div>
               </div>

               {/* Username Input */}
               <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                     {t.username}
                  </label>
                  <div className="relative">
                     <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                     <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                           error && error.type.includes('username')
                              ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
                              : 'border-neutral-200 focus:ring-blue-200 focus:border-blue-400'
                        }`}
                        placeholder={t.username}
                     />
                  </div>
               </div>

               {/* Password Input */}
               <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                     {t.password}
                  </label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                     <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                           error && error.type.includes('password')
                              ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
                              : 'border-neutral-200 focus:ring-blue-200 focus:border-blue-400'
                        }`}
                        placeholder={t.password}
                     />
                  </div>
               </div>

               {/* Error Message */}
               {error && error.msg && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                     <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                     <p className="text-sm text-red-700">{error.msg}</p>
                  </div>
               )}

               {/* Login Button */}
               <button
                  onClick={loginuser}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                  {isLoading ? (
                     <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading...</span>
                     </>
                  ) : (
                     t.loginBtn
                  )}
               </button>

               {/* Back to Home */}
               <div className="mt-6 text-center">
                  <Link
                     href="/"
                     className="text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                  >
                     ← {t.backToHome}
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Login;
