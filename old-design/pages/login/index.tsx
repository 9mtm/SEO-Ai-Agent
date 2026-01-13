/* eslint-disable @next/next/no-img-element */
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Icon from '../../components/common/Icon';

type LoginError = {
   type: string,
   msg: string,
}

const Login: NextPage = () => {
   const [error, setError] = useState<LoginError | null>(null);
   const [username, setUsername] = useState<string>('');
   const [password, setPassword] = useState<string>('');
   const router = useRouter();

   const loginuser = async () => {
      let loginError: LoginError | null = null;
      if (!username || !password) {
         if (!username && !password) {
            loginError = { type: 'empty_username_password', msg: 'Please Insert Your App Username & Password to login.' };
         }
         if (!username && password) {
            loginError = { type: 'empty_username', msg: 'Please Insert Your App Username' };
         }
         if (!password && username) {
            loginError = { type: 'empty_password', msg: 'Please Insert Your App Password' };
         }
         setError(loginError);
         setTimeout(() => { setError(null); }, 3000);
      } else {
         try {
            const header = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
            const fetchOpts = { method: 'POST', headers: header, body: JSON.stringify({ username, password }) };
            const fetchRoute = `${window.location.origin}/api/login`;
            const res = await fetch(fetchRoute, fetchOpts).then((result) => result.json());
            // console.log(res);
            if (!res.success) {
               let errorType = '';
               if (res.error && res.error.toLowerCase().includes('username')) {
                  errorType = 'incorrect_username';
               }
               if (res.error && res.error.toLowerCase().includes('password')) {
                  errorType = 'incorrect_password';
               }
               setError({ type: errorType, msg: res.error });
               setTimeout(() => { setError(null); }, 3000);
            } else {
               router.push('/');
            }
         } catch (fetchError) {
            setError({ type: 'unknown', msg: 'Could not login, Ther Server is not responsive.' });
            setTimeout(() => { setError(null); }, 3000);
         }
      }
   };

   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700';
   // eslint-disable-next-line max-len
   const inputStyle = 'w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none focus:border-blue-200';
   const errorBorderStyle = 'border-red-400 focus:border-red-400';
   return (
      <div className={'Login'}>
         <Head>
            <title>Login - Dpro</title>
         </Head>
         <div className='flex items-center justify-center w-full h-screen'>
            <div className='w-80 mt-[-300px]'>
               <h3 className="py-7 text-2xl font-bold text-blue-700 text-center">
                  <img src="/dpro_logo.png" alt="Dpro" className="inline-block h-8 mr-2" />
                  <span className="text-blue-700">Dpro</span>
               </h3>
               <div className='relative bg-[white] rounded-md text-sm border p-5'>
                  <div className="settings__section__input mb-5">
                     <label className={labelStyle}>Username</label>
                     <input
                        className={`
                           ${inputStyle} 
                           ${error && error.type.includes('username') ? errorBorderStyle : ''} 
                        `}
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                     />
                  </div>
                  <div className="settings__section__input mb-5">
                     <label className={labelStyle}>Password</label>
                     <input
                        className={`
                           ${inputStyle} 
                           ${error && error.type.includes('password') ? errorBorderStyle : ''} 
                        `}
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                     />
                  </div>
                  <button
                     onClick={() => loginuser()}
                     className={'py-3 px-5 w-full rounded cursor-pointer bg-blue-700 text-white font-semibold text-sm'}>
                     Login
                  </button>
                  <div className="flex items-center my-4">
                     <div className="flex-grow border-t border-gray-200"></div>
                     <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR</span>
                     <div className="flex-grow border-t border-gray-200"></div>
                  </div>
                  <a
                     href="/api/auth/google/login"
                     className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 mb-3"
                  >
                     <Icon type="google" size={18} />
                     <span className="ml-2">Sign in with Google</span>
                  </a>
                  {error && error.msg
                     && <div
                        className={'absolute w-full bottom-[-100px] ml-[-20px] rounded text-center '
                           + 'p-3 bg-red-100 text-red-600 text-sm font-semibold'}>
                        {error.msg}
                     </div>
                  }
               </div>
            </div>
         </div>

      </div>
   );
};

export default Login;
