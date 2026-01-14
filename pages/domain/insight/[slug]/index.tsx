import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
// import { useQuery } from 'react-query';
// import toast from 'react-hot-toast';
import { CSSTransition } from 'react-transition-group';
import TopBar from '../../../../components/common/TopBar';
import DomainHeader from '../../../../components/domains/DomainHeader';
import AddDomain from '../../../../components/domains/AddDomain';
import DomainSettings from '../../../../components/domains/DomainSettings';
import exportCSV from '../../../../utils/client/exportcsv';
import { useFetchDomains, useDeleteDomain } from '../../../../services/domains';
import { useFetchSCInsight } from '../../../../services/searchConsole';
import SCInsight from '../../../../components/insight/Insight';
import { useFetchSettings } from '../../../../services/settings';
import Footer from '../../../../components/common/Footer';

const InsightPage: NextPage = () => {
   const router = useRouter();
   const [showDomainSettings, setShowDomainSettings] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [scDateFilter, setSCDateFilter] = useState('thirtyDays');
   const { data: appSettings } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router);
   const { mutate: deleteDomainMutate } = useDeleteDomain(() => {
      router.push('/');
   });
   const scConnected = !!(appSettings && (appSettings?.settings?.search_console_integrated || appSettings?.settings?.google_connected));
   const { data: insightData } = useFetchSCInsight(router, !!(domainsData?.domains?.length) && scConnected);

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

   const handleDeleteDomain = () => {
      if (activDomain && window.confirm(`Are you sure you want to delete ${activDomain.domain}?`)) {
         deleteDomainMutate(activDomain);
      }
   };

   return (
      <div className="Domain ">
         {activDomain && activDomain.domain
            && <Head>
               <title>{`${activDomain.domain} - Dpro`} </title>
            </Head>
         }
         <TopBar
            showAddModal={() => setShowAddDomain(true)}
            domains={theDomains}
            currentDomain={activDomain}
         />
         <div className="w-full max-w-7xl mx-auto">
            <div className="domain_kewywords px-5 pt-10 lg:px-8 lg:pt-8 w-full">
               {activDomain && activDomain.domain
                  ? <DomainHeader
                     domain={activDomain}
                     domains={theDomains}
                     showAddModal={() => console.log('XXXXX')}
                     showSettingsModal={setShowDomainSettings}
                     exportCsv={() => exportCSV([], activDomain.domain, scDateFilter)}
                     scFilter={scDateFilter}
                     setScFilter={(item: string) => setSCDateFilter(item)}
                     onDeleteDomain={handleDeleteDomain}
                  />
                  : <div className='w-full lg:h-[100px]'></div>
               }
               <SCInsight
                  isPending={false}
                  domain={activDomain}
                  insight={theInsight}
                  isConsoleIntegrated={scConnected || domainHasScAPI}
               />
            </div>
         </div>

         <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddDomain closeModal={() => setShowAddDomain(false)} domains={domainsData?.domains || []} />
         </CSSTransition>

         <CSSTransition in={showDomainSettings} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <DomainSettings
               domain={showDomainSettings && theDomains && activDomain && activDomain.domain ? activDomain : false}
               closeModal={setShowDomainSettings}
            />
         </CSSTransition>

         <Footer currentVersion={appSettings?.settings?.version ? appSettings.settings.version : ''} />
      </div>
   );
};

export default InsightPage;
