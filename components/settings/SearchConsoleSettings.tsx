import React, { useState } from 'react';
import InputField from '../common/InputField';
import Icon from '../common/Icon';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';

type SearchConsoleSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
}

const SearchConsoleSettings = ({ settings, settingsError, updateSettings }: SearchConsoleSettingsProps) => {
   const [loadingSites, setLoadingSites] = useState(false);
   const [sites, setSites] = useState<{ siteUrl: string, permissionLevel: string }[]>([]);
   const [showSitesModal, setShowSitesModal] = useState(false);
   const router = useRouter();

   const connectGoogle = () => {
      // Redirect to the connection endpoint
      window.location.href = '/api/auth/google/connect';
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
      // Logic to add site. Since we don't have a direct 'add domain' prop here, 
      // we can call the API directly or redirect to dashboard with param.
      // Easiest is to call the API to add domain.
      try {
         const res = await fetch('/api/domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains: [siteUrl] })
         });
         if (res.ok) {
            toast.success(`Imported ${siteUrl}`);
            // Optional: Remove from list or show success
            window.location.href = '/domains';
         } else {
            toast.error('Failed to import site');
         }
      } catch (e) {
         toast.error('Error importing site');
      }
   };

   return (
      <div>
         <div className="mb-8 border-b border-gray-200 pb-8">
            <h3 className="font-bold text-gray-700 mb-4">Google Account Connection (Recommended)</h3>
            {settings.google_connected ? (
               <div className="bg-green-50 border border-green-200 rounded p-4">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center text-green-700 font-semibold">
                        <Icon type="check" size={18} classes="mr-2" />
                        Connected to Google
                     </div>
                     <button
                        onClick={disconnectGoogle}
                        className="text-red-600 text-sm hover:underline">
                        Disconnect
                     </button>
                  </div>
                  <div className="flex gap-3">
                     <button
                        onClick={fetchSites}
                        disabled={loadingSites}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm font-medium flex items-center">
                        {loadingSites ? <Icon type="loading" size={16} classes="mr-2" /> : <Icon type="search" size={16} classes="mr-2" />}
                        Import Verified Sites from Google
                     </button>
                  </div>
               </div>
            ) : (
               <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                  <p className="text-gray-600 mb-4 text-sm">Connect your Google Account to automatically import your verified sites and access Search Console data without handling raw keys.</p>
                  <button
                     onClick={connectGoogle}
                     className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 flex items-center mx-auto transition-colors">
                     <Icon type="google" size={18} classes="mr-2" />
                     Connect Google Account
                  </button>
               </div>
            )}
         </div>

         {/* Sites Modal - Simplified inline for now */}
         {showSitesModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
               <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold">Import Sites</h3>
                     <button onClick={() => setShowSitesModal(false)}><Icon type="close" size={20} /></button>
                  </div>
                  <div className="space-y-2">
                     {sites.length === 0 ? (
                        <p>No verified sites found.</p>
                     ) : (
                        sites.map((site) => (
                           <div key={site.siteUrl} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                              <span className="font-medium truncate flex-1 mr-2">{site.siteUrl}</span>
                              <button
                                 onClick={() => importSite(site.siteUrl)}
                                 className="text-blue-600 hover:text-blue-800 text-sm font-semibold border border-blue-200 px-3 py-1 rounded hover:bg-blue-50">
                                 Import
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
      </div>
   );
};

export default SearchConsoleSettings;
