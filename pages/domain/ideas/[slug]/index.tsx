import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import { AlertCircle } from 'lucide-react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import DomainHeader from '../../../../components/domains/DomainHeader';
import AddDomain from '../../../../components/domains/AddDomain';
import DomainSettings from '../../../../components/domains/DomainSettings';
import { exportKeywordIdeas } from '../../../../utils/client/exportcsv';
import { useFetchDomains } from '../../../../services/domains';
import { useFetchSettings } from '../../../../services/settings';
import KeywordIdeasTable from '../../../../components/ideas/KeywordIdeasTable';
import { useFetchKeywordIdeas } from '../../../../services/adwords';
import KeywordIdeasUpdater from '../../../../components/ideas/KeywordIdeasUpdater';
import Modal from '../../../../components/common/Modal';

const DiscoverPage: NextPage = () => {
   const router = useRouter();
   const [showDomainSettings, setShowDomainSettings] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [showUpdateModal, setShowUpdateModal] = useState(false);
   const [showFavorites, setShowFavorites] = useState(false);

   const { data: appSettings } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router);
   const adwordsConnected = !!(appSettings && (appSettings?.settings?.adwords_refresh_token || appSettings?.settings?.google_connected)
      && (appSettings?.settings?.adwords_developer_token || appSettings?.settings?.google_connected) || appSettings?.settings?.google_connected);
   const searchConsoleConnected = !!(appSettings && (appSettings?.settings?.search_console_integrated || appSettings?.settings?.google_connected));
   const { data: keywordIdeasData, isPending: isLoadingIdeas, isError: errorLoadingIdeas } = useFetchKeywordIdeas(router, adwordsConnected);
   const theDomains: DomainType[] = (domainsData && domainsData.domains) || [];
   const keywordIdeas: IdeaKeyword[] = keywordIdeasData?.data?.keywords || [];
   const favorites: IdeaKeyword[] = keywordIdeasData?.data?.favorites || [];
   const keywordIdeasSettings = keywordIdeasData?.data?.settings || undefined;

   const activDomain: DomainType | null = useMemo(() => {
      let active: DomainType | null = null;
      if (domainsData?.domains && router.query?.slug) {
         active = domainsData.domains.find((x: DomainType) => x.slug === router.query.slug) || null;
      }
      return active;
   }, [router.query.slug, domainsData]);

   return (
      <DashboardLayout
         domains={theDomains}
         showAddModal={() => setShowAddDomain(true)}
      >
         {activDomain && activDomain.domain && (
            <Head>
               <title>{`${activDomain.domain} - Keyword Ideas - SEO AI Agent`}</title>
            </Head>
         )}

         <div className="domain_keywords">
            {activDomain && activDomain.domain ? (
               <DomainHeader
                  domain={activDomain}
                  domains={theDomains}
                  showAddModal={() => console.log('XXXXX')}
                  showSettingsModal={setShowDomainSettings}
                  exportCsv={() => exportKeywordIdeas(showFavorites ? favorites : keywordIdeas, activDomain.domain)}
                  showIdeaUpdateModal={() => setShowUpdateModal(true)}
               />
            ) : <div className='w-full lg:h-[100px]'></div>}
            <KeywordIdeasTable
               isPending={isLoadingIdeas}
               noIdeasDatabase={errorLoadingIdeas}
               domain={activDomain}
               keywords={keywordIdeas}
               favorites={favorites}
               isAdwordsIntegrated={adwordsConnected}
               showFavorites={showFavorites}
               setShowFavorites={setShowFavorites}
            />
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

         {showUpdateModal && activDomain?.domain && (
            <Modal closeModal={() => setShowUpdateModal(false)} title={'Load Keyword Ideas from Google Ads'} verticalCenter={true}>
               <KeywordIdeasUpdater
                  domain={activDomain}
                  onUpdate={() => setShowUpdateModal(false)}
                  settings={keywordIdeasSettings}
                  searchConsoleConnected={searchConsoleConnected}
                  adwordsConnected={adwordsConnected}
               />
            </Modal>
         )}
      </DashboardLayout>
   );
};

export default DiscoverPage;
