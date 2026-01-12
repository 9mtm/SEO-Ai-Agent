import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import toast, { Toaster } from 'react-hot-toast';
import { Globe, Search, TrendingUp, Plus, Loader2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AddDomain from '../../components/domains/AddDomain';
import { useCheckMigrationStatus, useFetchSettings } from '../../services/settings';
import { fetchDomainScreenshot, useFetchDomains } from '../../services/domains';
import DomainItem from '../../components/domains/DomainItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type thumbImages = { [domain: string]: string }

const Domains: NextPage = () => {
   const router = useRouter();
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [domainThumbs, setDomainThumbs] = useState<thumbImages>({});
   const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
   const { data: appSettingsData, isPending: isAppSettingsLoading } = useFetchSettings();
   const { data: domainsData, isPending } = useFetchDomains(router, true);
   const { data: migrationStatus } = useCheckMigrationStatus();

   const appSettings: SettingsType = appSettingsData?.settings || {};
   const { scraper_type = '' } = appSettings;

   const totalKeywords = useMemo(() => {
      let keywords = 0;
      if (domainsData?.domains) {
         domainsData.domains.forEach(async (domain: DomainType) => {
            keywords += domain?.keywordCount || 0;
         });
      }
      return keywords;
   }, [domainsData]);

   const domainSCAPiObj = useMemo(() => {
      const domainsSCAPI: { [ID: string]: boolean } = {};
      if (domainsData?.domains) {
         domainsData.domains.forEach(async (domain: DomainType) => {
            const doaminSc = domain?.search_console ? JSON.parse(domain.search_console) : {};
            domainsSCAPI[domain.ID] = doaminSc.client_email && doaminSc.private_key;
         });
      }
      return domainsSCAPI;
   }, [domainsData]);

   useEffect(() => {
      if (domainsData?.domains && domainsData.domains.length > 0) {
         domainsData.domains.forEach(async (domain: DomainType) => {
            if (domain.domain) {
               const domainThumb = await fetchDomainScreenshot(domain.domain);
               if (domainThumb) {
                  setDomainThumbs((currentThumbs) => ({ ...currentThumbs, [domain.domain]: domainThumb }));
               }
            }
         });
      }
   }, [domainsData]);

   useEffect(() => {
      if (router.query.success === 'google_connected') {
         toast.success('Google Account Connected Successfully!');
         // Remove params
         const { pathname, query } = router;
         delete query.success;
         router.replace({ pathname, query }, undefined, { shallow: true });
      }
   }, [router.query]);

   const manuallyUpdateThumb = async (domain: string) => {
      if (domain) {
         const domainThumb = await fetchDomainScreenshot(domain, true);
         if (domainThumb) {
            toast(`${domain} Screenshot Updated Successfully!`, { icon: '✔️' });
            setDomainThumbs((currentThumbs) => ({ ...currentThumbs, [domain]: domainThumb }));
         } else {
            toast(`Failed to Fetch ${domain} Screenshot!`, { icon: '⚠️' });
         }
      }
   };

   const translations = {
      en: {
         title: 'Domains',
         totalDomains: 'Total Domains',
         totalKeywords: 'Total Keywords',
         avgPosition: 'Avg. Position',
         addDomain: 'Add Domain',
         noDomains: 'No Domains Found',
         noDomainsDesc: 'Add a domain to get started with SEO tracking',
         loading: 'Loading Domains...',
         scraperWarning: 'A Scrapper/Proxy has not been set up yet. Open Settings to set it up.',
         dbMigration: 'You need to update your database. Stop SEO AI Agent and run:',
      },
      de: {
         title: 'Domains',
         totalDomains: 'Domains insgesamt',
         totalKeywords: 'Keywords insgesamt',
         avgPosition: 'Ø Position',
         addDomain: 'Domain hinzufügen',
         noDomains: 'Keine Domains gefunden',
         noDomainsDesc: 'Fügen Sie eine Domain hinzu, um mit dem SEO-Tracking zu beginnen',
         loading: 'Domains werden geladen...',
         scraperWarning: 'Ein Scrapper/Proxy wurde noch nicht eingerichtet. Öffnen Sie die Einstellungen.',
         dbMigration: 'Sie müssen Ihre Datenbank aktualisieren. Stoppen Sie SEO AI Agent und führen Sie aus:',
      }
   };

   const t = translations[selectedLang];

   return (
      <DashboardLayout selectedLang={selectedLang} onLanguageChange={setSelectedLang}>
         <Head>
            <title>{t.title} - SEO AI Agent</title>
         </Head>

         {/* Warnings */}
         {((!scraper_type || (scraper_type === 'none')) && !isAppSettingsLoading) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
               <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
               <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">{t.scraperWarning}</p>
               </div>
            </div>
         )}

         {migrationStatus?.hasMigrations && (
            <div className="mb-6 p-4 bg-neutral-900 text-white rounded-lg">
               <p className="text-sm mb-2">{t.dbMigration}</p>
               <code className="bg-neutral-800 px-3 py-1.5 rounded text-sm">npm run db:migrate</code>
            </div>
         )}

         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.totalDomains}</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold">{domainsData?.domains?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Active domains tracked</p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.totalKeywords}</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold">{totalKeywords}</div>
                  <p className="text-xs text-muted-foreground mt-1">Keywords monitored</p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.avgPosition}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground mt-1">Overall ranking</p>
               </CardContent>
            </Card>
         </div>

         {/* Header */}
         <div className="flex items-center justify-between mb-6">
            <div>
               <h1 className="text-2xl font-bold text-neutral-900">Your Domains</h1>
               <p className="text-sm text-neutral-600 mt-1">
                  Manage and track your domains performance
               </p>
            </div>
            <Button onClick={() => setShowAddDomain(true)} className="gap-2">
               <Plus className="h-4 w-4" />
               {t.addDomain}
            </Button>
         </div>

         {/* Domains List */}
         <div className="space-y-4">
            {domainsData?.domains && domainsData.domains.map((domain: DomainType) => (
               <DomainItem
                  key={domain.ID}
                  domain={domain}
                  selected={false}
                  isConsoleIntegrated={!!(appSettings && appSettings.search_console_integrated) || !!domainSCAPiObj[domain.ID]}
                  thumb={domainThumbs[domain.domain]}
                  updateThumb={manuallyUpdateThumb}
               />
            ))}

            {isPending && (
               <Card>
                  <CardContent className="flex items-center justify-center py-12">
                     <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                     <span className="text-sm text-neutral-600">{t.loading}</span>
                  </CardContent>
               </Card>
            )}

            {!isPending && domainsData && domainsData.domains && domainsData.domains.length === 0 && (
               <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                     <Globe className="h-12 w-12 text-neutral-300 mb-4" />
                     <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t.noDomains}</h3>
                     <p className="text-sm text-neutral-600 mb-6">{t.noDomainsDesc}</p>
                     <Button onClick={() => setShowAddDomain(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t.addDomain}
                     </Button>
                  </CardContent>
               </Card>
            )}
         </div>

         {/* Modals */}
         <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddDomain closeModal={() => setShowAddDomain(false)} domains={domainsData?.domains || []} />
         </CSSTransition>

         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </DashboardLayout>
   );
};

export default Domains;
