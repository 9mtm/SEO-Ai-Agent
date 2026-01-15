import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { toast, Toaster } from 'react-hot-toast';
import { Settings as SettingsIcon, Plug, Save, Loader2, CheckCircle, Download, X, Search, Plus } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useFetchSettings, useUpdateSettings } from '../../services/settings';
import { useFetchDomains } from '../../services/domains';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const defaultSettings: SettingsType = {
   scraper_type: 'none',
   scrape_delay: 'none',
   scrape_retry: false,
   notification_interval: 'monthly',
   notification_email: '',
   smtp_server: '',
   smtp_port: '',
   smtp_username: '',
   smtp_password: '',
   notification_email_from: '',
   notification_email_from_name: 'SEO AI Agent',
   search_console: true,
   search_console_client_email: '',
   search_console_private_key: '',
   keywordsColumns: ['Best', 'History', 'Volume', 'Search Console'],
};

const ScraperPage: NextPage = () => {
   const router = useRouter();
   const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
   const [settings, setSettings] = useState<SettingsType>(defaultSettings);
   const { data: domainsData } = useFetchDomains(router);
   const { data: appSettings, isPending } = useFetchSettings();
   const { mutate: updateMutate, isPending: isUpdating } = useUpdateSettings(() => {
      toast.success('Settings updated successfully!');
   });

   useEffect(() => {
      if (appSettings && appSettings.settings) {
         setSettings(appSettings.settings);
      }
   }, [appSettings]);

   useEffect(() => {
      if (router.query.success === 'google_connected') {
         toast.success('Google Account Connected Successfully!');
         // Remove params
         const { pathname, query } = router;
         delete query.success;
         router.replace({ pathname, query }, undefined, { shallow: true });
      }
   }, [router.query]);



   const updateSettings = (key: string, value: string | number | boolean) => {
      setSettings({ ...settings, [key]: value });
   };

   const performUpdate = () => {
      const { notification_interval, notification_email, notification_email_from, scraper_type, smtp_port, smtp_server, scaping_api } = settings;

      if (notification_interval !== 'never') {
         if (!notification_email) {
            toast.error('Please insert a valid email address');
            return;
         }
         if (notification_email && (!smtp_port || !smtp_server || !notification_email_from)) {
            toast.error('Please insert SMTP Server details');
            return;
         }
      }

      if (scraper_type !== 'proxy' && scraper_type !== 'none' && !scaping_api) {
         toast.error('Please insert a valid API Key');
         return;
      }

      updateMutate(settings);

      if (appSettings?.settings?.scraper_type === 'none' && scraper_type !== 'none') {
         setTimeout(() => window.location.reload(), 1500);
      }
   };



   const translations = {
      en: {
         title: 'Scraper Configuration',
         description: 'Manage your scraping settings and integrations',
         scraper: 'Scraper',
         notifications: 'Notifications',
         integrations: 'Integrations',
         save: 'Save Changes',
         saving: 'Saving...',
         googleConnected: 'Connected to Google',
         disconnect: 'Disconnect',
         importSites: 'Import Verified Sites',
         importingSites: 'Loading Sites...',
         connectGoogle: 'Connect Google Account',
         sitesModalTitle: 'Import Sites from Google Search Console',
         noSites: 'No verified sites found',
         import: 'Import',
         close: 'Close'
      },
      de: {
         title: 'Einstellungen',
         description: 'Verwalten Sie Ihre Anwendungseinstellungen',
         scraper: 'Scraper',
         notifications: 'Benachrichtigungen',
         integrations: 'Integrationen',
         save: 'Änderungen speichern',
         saving: 'Wird gespeichert...',
         googleConnected: 'Mit Google verbunden',
         disconnect: 'Trennen',
         importSites: 'Verifizierte Websites importieren',
         importingSites: 'Websites werden geladen...',
         connectGoogle: 'Google-Konto verbinden',
         sitesModalTitle: 'Websites aus Google Search Console importieren',
         noSites: 'Keine verifizierten Websites gefunden',
         import: 'Importieren',
         close: 'Schließen'
      }
   };

   const t = translations[selectedLang];

   return (
      <DashboardLayout selectedLang={selectedLang} onLanguageChange={setSelectedLang}>
         <Head>
            <title>{t.title} - SEO AI Agent</title>
         </Head>

         <div className="max-w-5xl">
            <div className="mb-8">
               <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t.title}</h1>
               <p className="text-neutral-600">{t.description}</p>
            </div>

            {/* Scraper Settings */}
            <div className="space-y-4">
               <Card>
                  <CardHeader>
                     <CardTitle>Scraper Configuration</CardTitle>
                     <CardDescription>Configure your scraper settings and proxy options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="scraper_type">Scraper Type</Label>
                        <Select
                           value={settings.scraper_type}
                           onValueChange={(value) => updateSettings('scraper_type', value)}
                        >
                           <SelectTrigger id="scraper_type">
                              <SelectValue placeholder="Select scraper type" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {settings.available_scapers?.map((scraper) => (
                                 <SelectItem key={scraper.value} value={scraper.value}>
                                    {scraper.label}
                                    {scraper.value === 'scrapingrobot' && (
                                       <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                          Recommended
                                       </span>
                                    )}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>

                        {settings.scraper_type !== 'none' && settings.scraper_type !== 'proxy' && (
                           <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                              <p className="text-sm text-green-800">
                                 Don't have an API key? {' '}
                                 <a
                                    href={
                                       settings.scraper_type === 'scrapingrobot'
                                          ? 'https://scrapingrobot.com/?ref=seo-agent.net'
                                          : settings.scraper_type === 'scrapingant'
                                             ? 'https://scrapingant.com/?ref=seo-agent.net'
                                             : settings.scraper_type === 'serpapi'
                                                ? 'https://serpapi.com?ref=seo-agent.net' // SerpApi usually tracks via account
                                                : settings.scraper_type === 'serply'
                                                   ? 'https://serply.io/?ref=seo-agent.net'
                                                   : settings.scraper_type === 'spaceserp'
                                                      ? 'https://spaceserp.com/?ref=seo-agent.net'
                                                      : settings.scraper_type === 'searchapi'
                                                         ? 'https://www.searchapi.io/?ref=seo-agent.net'
                                                         : settings.scraper_type === 'valueserp'
                                                            ? 'https://valueserp.com/?ref=seo-agent.net'
                                                            : settings.scraper_type === 'serper'
                                                               ? 'https://serper.dev/?ref=seo-agent.net'
                                                               : settings.scraper_type === 'hasdata'
                                                                  ? 'https://hasdata.com/?ref=seo-agent.net'
                                                                  : '#'
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-green-700 hover:text-green-900 underline"
                                 >
                                    Sign up for {settings.available_scapers?.find(s => s.value === settings.scraper_type)?.label || 'this service'}
                                 </a>
                              </p>
                           </div>
                        )}
                     </div>

                     {settings.scraper_type !== 'none' && settings.scraper_type !== 'proxy' && (
                        <div className="space-y-2">
                           <Label htmlFor="scaping_api">API Key</Label>
                           <Input
                              id="scaping_api"
                              type="text"
                              value={settings.scaping_api || ''}
                              onChange={(e) => updateSettings('scaping_api', e.target.value)}
                              placeholder="Enter your API key"
                           />
                        </div>
                     )}

                     <div className="space-y-2">
                        <Label htmlFor="scrape_delay">Scrape Delay</Label>
                        <Select
                           value={settings.scrape_delay}
                           onValueChange={(value) => updateSettings('scrape_delay', value)}
                        >
                           <SelectTrigger id="scrape_delay">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="5">5 seconds</SelectItem>
                              <SelectItem value="10">10 seconds</SelectItem>
                              <SelectItem value="30">30 seconds</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="flex items-center space-x-2">
                        <Switch
                           id="scrape_retry"
                           checked={settings.scrape_retry}
                           onCheckedChange={(checked) => updateSettings('scrape_retry', checked)}
                        />
                        <Label htmlFor="scrape_retry" className="font-normal cursor-pointer">
                           Enable retry on failure
                        </Label>
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-6">
               <Button
                  onClick={performUpdate}
                  disabled={isUpdating}
                  size="lg"
                  className="gap-2"
               >
                  {isUpdating ? (
                     <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.saving}
                     </>
                  ) : (
                     <>
                        <Save className="h-4 w-4" />
                        {t.save}
                     </>
                  )}
               </Button>
            </div>
         </div>


         <Toaster position='bottom-center' />
      </DashboardLayout>
   );
};

export default ScraperPage;
