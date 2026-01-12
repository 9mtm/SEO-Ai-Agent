import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, Toaster } from 'react-hot-toast';
import { Settings as SettingsIcon, Bell, Plug, Save, Loader2, CheckCircle, Download, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useFetchSettings, useUpdateSettings } from '../../services/settings';
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
   notification_interval: 'daily',
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
   const [showSitesModal, setShowSitesModal] = useState(false);
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
            setShowSitesModal(true);
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
               <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                  <TabsTrigger value="scraper" className="gap-2">
                     <SettingsIcon className="h-4 w-4" />
                     {t.scraper}
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-2">
                     <Bell className="h-4 w-4" />
                     {t.notifications}
                  </TabsTrigger>
                  <TabsTrigger value="integrations" className="gap-2">
                     <Plug className="h-4 w-4" />
                     {t.integrations}
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
                                 <SelectItem value="proxy">Proxy</SelectItem>
                                 <SelectItem value="scrapingant">ScrapingAnt</SelectItem>
                                 <SelectItem value="scrapingrobot">ScrapingRobot</SelectItem>
                              </SelectContent>
                           </Select>
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

               {/* Notification Settings */}
               <TabsContent value="notifications" className="space-y-4">
                  <Card>
                     <CardHeader>
                        <CardTitle>Email Notifications</CardTitle>
                        <CardDescription>Configure email notifications for ranking changes</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-6">
                        <div className="space-y-2">
                           <Label htmlFor="notification_interval">Notification Frequency</Label>
                           <Select
                              value={settings.notification_interval}
                              onValueChange={(value) => updateSettings('notification_interval', value)}
                           >
                              <SelectTrigger id="notification_interval">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="never">Never</SelectItem>
                                 <SelectItem value="daily">Daily</SelectItem>
                                 <SelectItem value="weekly">Weekly</SelectItem>
                                 <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>

                        {settings.notification_interval !== 'never' && (
                           <>
                              <div className="space-y-2">
                                 <Label htmlFor="notification_email">Notification Email</Label>
                                 <Input
                                    id="notification_email"
                                    type="email"
                                    value={settings.notification_email}
                                    onChange={(e) => updateSettings('notification_email', e.target.value)}
                                    placeholder="your@email.com"
                                 />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <Label htmlFor="smtp_server">SMTP Server</Label>
                                    <Input
                                       id="smtp_server"
                                       type="text"
                                       value={settings.smtp_server}
                                       onChange={(e) => updateSettings('smtp_server', e.target.value)}
                                       placeholder="smtp.example.com"
                                    />
                                 </div>

                                 <div className="space-y-2">
                                    <Label htmlFor="smtp_port">SMTP Port</Label>
                                    <Input
                                       id="smtp_port"
                                       type="text"
                                       value={settings.smtp_port}
                                       onChange={(e) => updateSettings('smtp_port', e.target.value)}
                                       placeholder="587"
                                    />
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <Label htmlFor="smtp_username">SMTP Username</Label>
                                    <Input
                                       id="smtp_username"
                                       type="text"
                                       value={settings.smtp_username}
                                       onChange={(e) => updateSettings('smtp_username', e.target.value)}
                                    />
                                 </div>

                                 <div className="space-y-2">
                                    <Label htmlFor="smtp_password">SMTP Password</Label>
                                    <Input
                                       id="smtp_password"
                                       type="password"
                                       value={settings.smtp_password}
                                       onChange={(e) => updateSettings('smtp_password', e.target.value)}
                                    />
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <Label htmlFor="notification_email_from">From Email</Label>
                                    <Input
                                       id="notification_email_from"
                                       type="email"
                                       value={settings.notification_email_from}
                                       onChange={(e) => updateSettings('notification_email_from', e.target.value)}
                                       placeholder="noreply@example.com"
                                    />
                                 </div>

                                 <div className="space-y-2">
                                    <Label htmlFor="notification_email_from_name">From Name</Label>
                                    <Input
                                       id="notification_email_from_name"
                                       type="text"
                                       value={settings.notification_email_from_name}
                                       onChange={(e) => updateSettings('notification_email_from_name', e.target.value)}
                                    />
                                 </div>
                              </div>
                           </>
                        )}
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
                                 <div className="flex items-center justify-between mb-4">
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
                                 <Button
                                    onClick={fetchSites}
                                    disabled={loadingSites}
                                    className="w-full gap-2"
                                 >
                                    {loadingSites ? (
                                       <>
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          {t.importingSites}
                                       </>
                                    ) : (
                                       <>
                                          <Download className="h-4 w-4" />
                                          {t.importSites}
                                       </>
                                    )}
                                 </Button>
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
                           <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                              <p className="text-sm text-blue-800 mb-4">
                                 Connect your Google account to automatically import your verified sites and access Search Console data.
                              </p>
                              <Button
                                 onClick={() => window.location.href = '/api/auth/google/authorize'}
                                 variant="outline"
                                 className="gap-2"
                              >
                                 <Plug className="h-4 w-4" />
                                 {t.connectGoogle}
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

         {/* Sites Import Dialog */}
         <Dialog open={showSitesModal} onOpenChange={setShowSitesModal}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                     <Download className="h-5 w-5" />
                     {t.sitesModalTitle}
                  </DialogTitle>
                  <DialogDescription>
                     Select sites to import into your dashboard
                  </DialogDescription>
               </DialogHeader>
               <div className="space-y-2 mt-4">
                  {sites.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                        {t.noSites}
                     </div>
                  ) : (
                     sites.map((site) => (
                        <div
                           key={site.siteUrl}
                           className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                           <div className="flex-1 mr-4">
                              <p className="font-medium text-sm truncate">{site.siteUrl}</p>
                              <p className="text-xs text-muted-foreground">{site.permissionLevel}</p>
                           </div>
                           <Button
                              onClick={() => importSite(site.siteUrl)}
                              size="sm"
                              className="gap-2"
                           >
                              <Download className="h-3 w-3" />
                              {t.import}
                           </Button>
                        </div>
                     ))
                  )}
               </div>
            </DialogContent>
         </Dialog>

         <Toaster position='bottom-center' />
      </DashboardLayout>
   );
};

export default SettingsPage;
