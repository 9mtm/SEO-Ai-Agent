import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, Toaster } from 'react-hot-toast';
import { Settings as SettingsIcon, Bell, Plug, Save, Loader2 } from 'lucide-react';
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
   const { data: appSettings, isPending } = useFetchSettings();
   const { mutate: updateMutate, isPending: isUpdating } = useUpdateSettings(() => {
      toast.success('Settings updated successfully!');
   });

   useEffect(() => {
      if (appSettings && appSettings.settings) {
         setSettings(appSettings.settings);
      }
   }, [appSettings]);

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
         title: 'Settings',
         description: 'Manage your application settings and preferences',
         scraper: 'Scraper',
         notifications: 'Notifications',
         integrations: 'Integrations',
         save: 'Save Changes',
         saving: 'Saving...'
      },
      de: {
         title: 'Einstellungen',
         description: 'Verwalten Sie Ihre Anwendungseinstellungen',
         scraper: 'Scraper',
         notifications: 'Benachrichtigungen',
         integrations: 'Integrationen',
         save: 'Änderungen speichern',
         saving: 'Wird gespeichert...'
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
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                           <p className="text-sm text-blue-800">
                              You can connect your Google account or use a service account for Google Search Console integration.
                           </p>
                        </div>

                        <div>
                           <Button
                              onClick={() => window.location.href = '/api/auth/google/authorize'}
                              variant="outline"
                              className="w-full"
                           >
                              <Plug className="mr-2 h-4 w-4" />
                              Connect Google Account
                           </Button>
                        </div>

                        <div className="relative">
                           <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                           </div>
                           <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white px-2 text-muted-foreground">Or use service account</span>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <Label htmlFor="search_console_client_email">Client Email</Label>
                           <Input
                              id="search_console_client_email"
                              type="email"
                              value={settings.search_console_client_email}
                              onChange={(e) => updateSettings('search_console_client_email', e.target.value)}
                              placeholder="service-account@project.iam.gserviceaccount.com"
                           />
                        </div>

                        <div className="space-y-2">
                           <Label htmlFor="search_console_private_key">Private Key</Label>
                           <Textarea
                              id="search_console_private_key"
                              value={settings.search_console_private_key}
                              onChange={(e) => updateSettings('search_console_private_key', e.target.value)}
                              placeholder="-----BEGIN PRIVATE KEY-----"
                              rows={5}
                           />
                        </div>
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
