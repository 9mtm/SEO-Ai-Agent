
import '../styles/globals.css';
import React from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LanguageProvider } from '../context/LanguageContext';
import { Toaster } from 'react-hot-toast';

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
  return <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <Component {...pageProps} />
      <Toaster position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </LanguageProvider>
  </QueryClientProvider>;
}

export default MyApp;

