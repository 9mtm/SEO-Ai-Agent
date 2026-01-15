import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';
import { Globe, Search, Plus, Loader2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useCheckMigrationStatus, useFetchSettings } from '../../services/settings';
import { fetchDomainScreenshot, useFetchDomains } from '../../services/domains';
import DomainItem from '../../components/domains/DomainItem';

const Domains: NextPage = () => {
   const router = useRouter();
   const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
   const [searchTerm, setSearchTerm] = useState('');
   const { data: domainsData, isPending: isLoadingDomains } = useFetchDomains(router);
   const [domainThumbs, setDomainThumbs] = useState<{ [key: string]: string }>({});

   // Calculate domains
   const domains = useMemo(() => domainsData?.domains || [], [domainsData]);

   // Auto redirect to onboarding if new=true
   useEffect(() => {
      if (router.query.new === 'true') {
         router.push('/onboarding');
      }
   }, [router.query]);

   // Fetch screenshots
   useEffect(() => {
      if (domains && domains.length > 0) {
         domains.forEach(async (domain: DomainType) => {
            if (domain.domain) {
               const domainThumb = await fetchDomainScreenshot(domain.domain);
               if (domainThumb) {
                  setDomainThumbs((currentThumbs) => ({ ...currentThumbs, [domain.domain]: domainThumb }));
               }
            }
         });
      }
   }, [domains]);

   const manuallyUpdateThumb = async (domain: string) => {
      if (domain) {
         const domainThumb = await fetchDomainScreenshot(domain, true);
         if (domainThumb) {
            setDomainThumbs((currentThumbs) => ({ ...currentThumbs, [domain]: domainThumb }));
            toast.success('Screenshot updated');
         } else {
            toast.error('Failed to update screenshot');
         }
      }
   };

   const translations = {
      en: {
         title: 'Domains',
         addDomain: 'Add Domain',
         searchPlaceholder: 'Search domains...',
         noDomains: 'No domains found',
         tryAdding: 'Try adding a new domain to get started',
         loading: 'Loading domains...',
         stats: {
            total: 'Total Domains',
            keywords: 'Tracked Keywords'
         }
      },
      de: {
         title: 'Domänen',
         addDomain: 'Domäne hinzufügen',
         searchPlaceholder: 'Domänen suchen...',
         noDomains: 'Keine Domänen gefunden',
         tryAdding: 'Versuchen Sie, eine neue Domäne hinzuzufügen',
         loading: 'Lade Domänen...',
         stats: {
            total: 'Gesamt Domänen',
            keywords: 'Verfolgte Keywords'
         }
      }
   };

   const t = translations[selectedLang];

   const filteredDomains = domains.filter((d: DomainType) =>
      d.domain.toLowerCase().includes(searchTerm.toLowerCase())
   );

   return (
      <DashboardLayout selectedLang={selectedLang} onLanguageChange={setSelectedLang} domains={domains}>
         <Head>
            <title>{t.title} - SEO AI Agent</title>
         </Head>

         <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                  <h1 className="text-3xl font-bold text-neutral-900">{t.title}</h1>
                  <p className="text-neutral-500 mt-1">Manage and track all your websites in one place</p>
               </div>
               <button
                  onClick={() => router.push('/onboarding')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
               >
                  <Plus className="h-5 w-5" />
                  <span>{t.addDomain}</span>
               </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-50 rounded-lg">
                        <Globe className="h-6 w-6 text-blue-600" />
                     </div>
                     <div>
                        <p className="text-sm font-medium text-neutral-500">{t.stats.total}</p>
                        <p className="text-2xl font-bold text-neutral-900">{domains.length}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
               <Search className="h-5 w-5 text-neutral-400" />
               <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:ring-0 text-neutral-900 placeholder-neutral-400"
               />
            </div>

            {/* Domains Grid */}
            {isLoadingDomains ? (
               <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
               </div>
            ) : filteredDomains.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDomains.map((domain: DomainType) => (
                     <DomainItem
                        key={domain.ID}
                        domain={domain}
                        selected={false}
                        isConsoleIntegrated={!!(domain.search_console && JSON.parse(domain.search_console).client_email)}
                        thumb={domainThumbs[domain.domain]}
                        updateThumb={manuallyUpdateThumb}
                     />
                  ))}
               </div>
            ) : (
               <div className="text-center py-12 bg-white rounded-xl border border-dashed border-neutral-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
                     <Globe className="h-8 w-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">{t.noDomains}</h3>
                  <p className="text-neutral-500 mb-6">{t.tryAdding}</p>
                  <button
                     onClick={() => router.push('/onboarding')}
                     className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                     <Plus className="h-5 w-5" />
                     <span>{t.addDomain}</span>
                  </button>
               </div>
            )}
         </div>

         <Toaster position="bottom-right" />
      </DashboardLayout>
   );
};

export default Domains;
