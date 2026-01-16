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
import { useFetchSettings } from '../../../../services/settings';

const InsightPage: NextPage = () => {
   const router = useRouter();


   const [scDateFilter, setSCDateFilter] = useState('thirtyDays');
   const [daysFilter, setDaysFilter] = useState(30); // Default to 30 days
   const { data: appSettings } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router);

   const scConnected = !!(appSettings && (appSettings?.settings?.search_console_integrated || appSettings?.settings?.google_connected));
   const { data: insightData, isLoading } = useFetchSCInsight(router, !!(domainsData?.domains?.length) && scConnected, daysFilter);

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
            <SCInsight
               isPending={isLoading}
               domain={activDomain}
               insight={theInsight}
               isConsoleIntegrated={scConnected || domainHasScAPI}
               daysFilter={daysFilter}
               setDaysFilter={setDaysFilter}
            />
         </div>




      </DashboardLayout>
   );
};

export default InsightPage;
