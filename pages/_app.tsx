
import '../styles/globals.css';
import React from 'react';
import dynamic from 'next/dynamic';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../context/LanguageContext';
import { Toaster } from 'react-hot-toast';

// Only load devtools in development — keeps them out of the production bundle
// and avoids needing the package on the server.
const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
      },
    },
  }));
  const isDev = process.env.NODE_ENV === 'development';
  return <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <Component {...pageProps} />
      <Toaster position="bottom-center" containerClassName="react_toaster" />
      {isDev && <ReactQueryDevtools initialIsOpen={false} />}
    </LanguageProvider>
  </QueryClientProvider>;
}

export default MyApp;

