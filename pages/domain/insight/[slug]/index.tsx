import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import { AlertCircle } from 'lucide-react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import DomainHeader from '../../../../components/domains/DomainHeader';


import exportCSV from '../../../../utils/client/exportcsv';
import { useFetchDomains } from '../../../../services/domains';
import { useFetchSCInsight } from '../../../../services/searchConsole';
import SCInsight from '../../../../components/insight/Insight';
import BingInsight from '../../../../components/insight/BingInsight';
import { useFetchSettings } from '../../../../services/settings';

const InsightPage: NextPage = () => {
   const router = useRouter();


   const [scDateFilter, setSCDateFilter] = useState('thirtyDays');
   const [daysFilter, setDaysFilter] = useState(30); // Default to 30 days
   const [dataSource, setDataSource] = useState<'google' | 'bing'>('google');
   const { data: appSettings } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router);

   const scConnected = !!(appSettings && (appSettings?.settings?.search_console_integrated || appSettings?.settings?.google_connected));
   const bingConnected = !!(appSettings?.settings?.bing_connected);
   const { data: insightData, isLoading, isFetching } = useFetchSCInsight(router, !!(domainsData?.domains?.length) && scConnected, daysFilter);

   const theDomains: DomainType[] = (domainsData && domainsData.domains) || [];
   const theInsight: InsightDataType = insightData && insightData.data ? insightData.data : {};

   const activDomain: DomainType | null = useMemo(() => {
      let active: DomainType | null = null;
      if (domainsData?.domains && router.query?.slug) {
         active = domainsData.domains.find((x: DomainType) => x.slug === router.query.slug) || null;
      }
      return active;
   }, [router.query.slug, domainsData]);

   const domainHasScAPI = useMemo(() => {
      const doaminSc = activDomain?.search_console ? JSON.parse(activDomain.search_console) : {};
      return !!(doaminSc?.client_email && doaminSc?.private_key);
   }, [activDomain]);



   return (
      <DashboardLayout
         domains={theDomains}

      >
         {activDomain && activDomain.domain && (
            <Head>
               <title>{`${activDomain.domain} - Insight - SEO AI Agent`}</title>
            </Head>
         )}

         <div className="domain_keywords">
            {activDomain && activDomain.domain ? (
               <DomainHeader
                  domain={activDomain}
                  domains={theDomains}


                  exportCsv={() => exportCSV([], activDomain.domain, scDateFilter)}
                  scFilter={scDateFilter}
                  setScFilter={(item: string) => setSCDateFilter(item)}

               />
            ) : (
               <div className='w-full lg:h-[100px]'></div>
            )}
            {/* Source Toggle: Google / Bing */}
            <div className="flex gap-1 mb-4 bg-neutral-100 rounded-lg p-1 w-fit">
               <button
                  onClick={() => setDataSource('google')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                     dataSource === 'google'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                  }`}
               >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.43l3.66-2.84z" fill="#FBBC05"/>
                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
               </button>
               <button
                  onClick={() => setDataSource('bing')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                     dataSource === 'bing'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                  }`}
               >
                  <svg className="w-4 h-4" viewBox="0 0 35 50" fill="currentColor">
                     <path d="M35 24.25l-22.177-7.761 4.338 10.82 6.923 3.225H35V24.25z" opacity=".7"/>
                     <path d="M10 38.642V3.5L0 0v44.4L10 50l25-14.382V24.25z"/>
                  </svg>
                  Bing
               </button>
            </div>

            {dataSource === 'google' ? (
               <SCInsight
                  isPending={isLoading || isFetching}
                  domain={activDomain}
                  insight={theInsight}
                  isConsoleIntegrated={scConnected || domainHasScAPI}
                  daysFilter={daysFilter}
                  setDaysFilter={setDaysFilter}
               />
            ) : (
               <BingInsight
                  domain={activDomain}
                  isBingConnected={bingConnected}
                  daysFilter={daysFilter}
                  setDaysFilter={setDaysFilter}
               />
            )}
         </div>




      </DashboardLayout>
   );
};

export default InsightPage;
