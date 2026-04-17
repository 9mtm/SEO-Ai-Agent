import React, { useState } from 'react';
import InputField from '../common/InputField';
import Icon from '../common/Icon';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useLanguage } from '../../context/LanguageContext';

type SearchConsoleSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
}

const SearchConsoleSettings = ({ settings, settingsError, updateSettings }: SearchConsoleSettingsProps) => {
   const { t } = useLanguage();
   const [loadingSites, setLoadingSites] = useState(false);
   const [sites, setSites] = useState<{ siteUrl: string, permissionLevel: string }[]>([]);
   const [showSitesModal, setShowSitesModal] = useState(false);
   const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
   const router = useRouter();

   const connectGoogle = () => {
      // Redirect to the connection endpoint
      window.location.href = '/api/auth/google/connect';
   };

   const disconnectGoogle = () => {
      setShowDisconnectDialog(true);
   };

   const confirmDisconnect = async () => {
      try {
         await fetch('/api/auth/google/disconnect', { method: 'POST' });
         window.location.reload();
      } catch (e) {
         toast.error(t('searchConsoleSettings.errDisconnect'));
      } finally {
         setShowDisconnectDialog(false);
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
            toast.error(t('searchConsoleSettings.errNoSites'));
         }
      } catch (e) {
         toast.error(t('searchConsoleSettings.errFetchSites'));
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
            toast.success(t('searchConsoleSettings.imported', { site: siteUrl }));
            window.location.href = '/domains';
         } else {
            toast.error(t('searchConsoleSettings.errImport'));
         }
      } catch (e) {
         toast.error(t('searchConsoleSettings.errImportGeneric'));
      }
   };

   return (
      <div>
         <div className="mb-8 border-b border-gray-200 pb-8">
            <h3 className="font-bold text-gray-700 mb-4">{t('searchConsoleSettings.googleConnectionTitle')}</h3>
            {settings.google_connected ? (
               <div className="bg-green-50 border border-green-200 rounded p-4">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center text-green-700 font-semibold">
                        <Icon type="check" size={18} classes="mr-2" />
                        {t('searchConsoleSettings.connectedToGoogle')}
                     </div>
                     <button
                        onClick={disconnectGoogle}
                        className="text-red-600 text-sm hover:underline">
                        {t('searchConsoleSettings.disconnect')}
                     </button>
                  </div>
                  <div className="flex gap-3">
                     <button
                        onClick={fetchSites}
                        disabled={loadingSites}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm font-medium flex items-center">
                        {loadingSites ? <Icon type="loading" size={16} classes="mr-2" /> : <Icon type="search" size={16} classes="mr-2" />}
                        {t('searchConsoleSettings.importSites')}
                     </button>
                  </div>
               </div>
            ) : (
               <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                  <p className="text-gray-600 mb-4 text-sm">{t('searchConsoleSettings.connectDesc')}</p>
                  <button
                     onClick={connectGoogle}
                     className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 flex items-center mx-auto transition-colors">
                     <Icon type="google" size={18} classes="mr-2" />
                     {t('searchConsoleSettings.connectBtn')}
                  </button>
               </div>
            )}
         </div>

         {showSitesModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
               <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold">{t('searchConsoleSettings.importSitesTitle')}</h3>
                     <button onClick={() => setShowSitesModal(false)}><Icon type="close" size={20} /></button>
                  </div>
                  <div className="space-y-2">
                     {sites.length === 0 ? (
                        <p>{t('searchConsoleSettings.noSitesFound')}</p>
                     ) : (
                        sites.map((site) => (
                           <div key={site.siteUrl} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                              <span className="font-medium truncate flex-1 mr-2">{site.siteUrl}</span>
                              <button
                                 onClick={() => importSite(site.siteUrl)}
                                 className="text-blue-600 hover:text-blue-800 text-sm font-semibold border border-blue-200 px-3 py-1 rounded hover:bg-blue-50">
                                 {t('searchConsoleSettings.importBtn')}
                              </button>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* <div>
            <h3 className="font-bold text-gray-700 mb-4 mt-4">Service Account (Legacy / Advanced)</h3>
            <p className="text-xs text-gray-500 mb-4">Only use this if you want to use a specific Service Account instead of your own Google Account.</p>
            <div className="settings__section__input mb-4 flex justify-between items-center w-full">
               <InputField
                  label='Search Console Client Email'
                  onChange={(client_email: string) => updateSettings('search_console_client_email', client_email)}
                  value={settings.search_console_client_email}
                  placeholder='myapp@appspot.gserviceaccount.com'
               />
            </div>
            <div className="settings__section__input mb-4 flex flex-col justify-between items-center w-full">
               <label className='mb-2 font-semibold block text-sm text-gray-700 capitalize w-full'>Search Console Private Key</label>
               <textarea
                  className={`w-full p-2 border border-gray-200 rounded mb-3 text-xs 
                   focus:outline-none h-[100px] focus:border-blue-200`}
                  value={settings.search_console_private_key}
                  placeholder={'-----BEGIN PRIVATE KEY-----/ssssaswdkihad....'}
                  onChange={(event) => updateSettings('search_console_private_key', event.target.value)}
               />
            </div>
         </div> */}
         {/* Disconnect Confirmation Dialog */}
         <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>{t('searchConsoleSettings.disconnectDialogTitle')}</DialogTitle>
                  <DialogDescription>
                     {t('searchConsoleSettings.disconnectDialogDesc')}
                  </DialogDescription>
               </DialogHeader>
               <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>{t('searchConsoleSettings.cancel')}</Button>
                  <Button variant="destructive" onClick={confirmDisconnect}>{t('searchConsoleSettings.disconnect')}</Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
};

export default SearchConsoleSettings;
