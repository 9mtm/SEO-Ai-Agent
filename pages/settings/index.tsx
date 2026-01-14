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

const SettingsPage: NextPage = () => {
   const router = useRouter();
   const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
   const [settings, setSettings] = useState<SettingsType>(defaultSettings);
   const [loadingSites, setLoadingSites] = useState(false);
   const [sites, setSites] = useState<{ siteUrl: string; permissionLevel: string }[]>([]);
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

   // Auto-fetch sites when Google is connected
   useEffect(() => {
      if (settings.google_connected && sites.length === 0 && !loadingSites) {
         fetchSites();
      }
   }, [settings.google_connected]);

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

   const disconnectGoogle = async () => {
      if (confirm('Are you sure you want to disconnect your Google Account?')) {
         try {
            await fetch('/api/auth/google/disconnect', { method: 'POST' });
            window.location.reload();
         } catch (e) {
            toast.error('Failed to disconnect');
         }
      }
   };

   const fetchSites = async () => {
      setLoadingSites(true);
      try {
         const res = await fetch('/api/gsc/sites');
         const data = await res.json();
         if (data.sites) {
            setSites(data.sites);
         } else {
            toast.error('No sites found or error fetching sites.');
         }
      } catch (e) {
         toast.error('Error fetching sites');
      } finally {
         setLoadingSites(false);
      }
   };

   const importSite = async (siteUrl: string) => {
      try {
         const res = await fetch('/api/domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains: [siteUrl] })
         });
         if (res.ok) {
            toast.success(`Imported ${siteUrl}`);
            router.push('/domains');
         } else {
            toast.error('Failed to import site');
         }
      } catch (e) {
         toast.error('Error importing site');
      }
   };

   const translations = {
      en: {
         title: 'Settings',
         description: 'Manage your application settings and preferences',
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

            <Tabs defaultValue="scraper" className="space-y-6">
               <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                  <TabsTrigger value="scraper" className="gap-2">
                     <SettingsIcon className="h-4 w-4" />
                     {t.scraper}
                  </TabsTrigger>
                  <TabsTrigger value="integrations" className="gap-2">
                     <Image src="/icon/google-logo.svg" alt="Google" width={16} height={16} className="h-4 w-4" />
                     Google Search Console
                  </TabsTrigger>
               </TabsList>

               {/* Scraper Settings */}
               <TabsContent value="scraper" className="space-y-4">
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
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                           <p className="text-xs text-muted-foreground mt-1">
                              Choose a scraping service to fetch keyword rankings. Each service requires an API key.
                           </p>
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
               </TabsContent>



               {/* Integration Settings */}
               <TabsContent value="integrations" className="space-y-4">
                  <Card>
                     <CardHeader>
                        <CardTitle>Google Search Console</CardTitle>
                        <CardDescription>Connect your Google Search Console account</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-6">
                        {settings.google_connected ? (
                           <>
                              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center text-green-700 font-semibold gap-2">
                                       <CheckCircle className="h-5 w-5" />
                                       {t.googleConnected}
                                    </div>
                                    <Button
                                       onClick={disconnectGoogle}
                                       variant="destructive"
                                       size="sm"
                                    >
                                       {t.disconnect}
                                    </Button>
                                 </div>
                              </div>

                              {/* Sites List */}
                              <div className="space-y-3">
                                 <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900">Verified Sites</h3>
                                    <Button
                                       onClick={fetchSites}
                                       disabled={loadingSites}
                                       variant="outline"
                                       size="sm"
                                       className="gap-2"
                                    >
                                       {loadingSites ? (
                                          <>
                                             <Loader2 className="h-3 w-3 animate-spin" />
                                             Loading...
                                          </>
                                       ) : (
                                          <>
                                             <Download className="h-3 w-3" />
                                             Refresh Sites
                                          </>
                                       )}
                                    </Button>
                                 </div>

                                 {loadingSites ? (
                                    <div className="text-center py-8">
                                       <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                       <p className="text-sm text-gray-500 mt-2">Loading your sites...</p>
                                    </div>
                                 ) : sites.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                       <p className="text-sm text-gray-500">No verified sites found</p>
                                       <p className="text-xs text-gray-400 mt-1">Click "Refresh Sites" to load your sites</p>
                                    </div>
                                 ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                       {sites.map((site) => {
                                          const getPermissionBadge = (level: string) => {
                                             switch (level) {
                                                case 'siteOwner':
                                                   return (
                                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                         ✓ Owner
                                                      </span>
                                                   );
                                                case 'siteFullUser':
                                                   return (
                                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                         Full Access
                                                      </span>
                                                   );
                                                case 'siteRestrictedUser':
                                                   return (
                                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                         Restricted
                                                      </span>
                                                   );
                                                case 'siteUnverifiedUser':
                                                   return (
                                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                         ⚠ Unverified
                                                      </span>
                                                   );
                                                default:
                                                   return (
                                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                         {level}
                                                      </span>
                                                   );
                                             }
                                          };

                                          const isImported = domainsData?.domains?.some(d => {
                                             const cleanSiteUrl = site.siteUrl.replace('sc-domain:', '').replace(/\/$/, '');
                                             const cleanDomain = d.domain.replace(/\/$/, '');
                                             return cleanDomain.includes(cleanSiteUrl) || cleanSiteUrl.includes(cleanDomain);
                                          });

                                          const formatSiteUrl = (url: string) => {
                                             return url
                                                .replace(/^https?:\/\//, '') // Remove http:// or https://
                                                .replace(/^sc-domain:/, '')  // Remove sc-domain:
                                                .replace(/\/$/, '');         // Remove trailing slash
                                          };

                                          return (
                                             <div
                                                key={site.siteUrl}
                                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                             >
                                                <div className="flex-1 mr-4">
                                                   <p className="font-medium text-sm truncate mb-1">{formatSiteUrl(site.siteUrl)}</p>
                                                   {getPermissionBadge(site.permissionLevel)}
                                                </div>
                                                {isImported ? (
                                                   <Button
                                                      disabled
                                                      variant="secondary"
                                                      size="sm"
                                                      className="gap-2 bg-green-100 text-green-700 hover:bg-green-100 opacity-100"
                                                   >
                                                      <CheckCircle className="h-3 w-3" />
                                                      Imported
                                                   </Button>
                                                ) : (
                                                   <Button
                                                      onClick={() => importSite(site.siteUrl)}
                                                      size="sm"
                                                      className="gap-2"
                                                   >
                                                      <Plus className="h-3 w-3" />
                                                      Add
                                                   </Button>
                                                )}
                                             </div>
                                          );
                                       })}
                                    </div>
                                 )}
                              </div>

                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                 <p className="text-sm text-yellow-800 mb-2">
                                    <strong>Important Notes:</strong>
                                 </p>
                                 <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                                    <li>Only sites where you are the <strong>Owner</strong> in Google Search Console will appear and work properly.</li>
                                    <li>If a site has permission errors, check that you have Owner access (not just User) in Google Search Console.</li>
                                    <li>If you recently changed permissions, try disconnecting and reconnecting your Google account.</li>
                                 </ul>
                              </div>
                           </>
                        ) : (
                           <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                 <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z" />
                                 </svg>
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Google Search Console</h3>
                              <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                                 Link your Google account to automatically verify sites and fetch performance data directly into your dashboard.
                              </p>
                              <Button
                                 onClick={() => window.location.href = '/api/auth/google/authorize'}
                                 size="lg"
                                 className="gap-2 bg-black text-white hover:bg-gray-800"
                              >
                                 <Plug className="h-4 w-4" />
                                 Connect Google Account
                              </Button>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </TabsContent>
            </Tabs>

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

export default SettingsPage;
