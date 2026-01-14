import type { NextApiRequest, NextApiResponse } from 'next';
import Cryptr from 'cryptr';
import verifyUser from '../../utils/verifyUser';
import allScrapers from '../../scrapers/index';
import User from '../../database/models/user';
import Setting from '../../database/models/setting';
import FailedJob from '../../database/models/failedJob';
import db from '../../database/database';

type SettingsGetResponse = {
   settings?: object | null,
   error?: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const verifyResult = verifyUser(req, res);
   if (!verifyResult.authorized) {
      return res.status(401).json({ error: 'Unauthorized' });
   }
   if (req.method === 'GET') {
      return getSettings(req, res, verifyResult.userId, verifyResult.isLegacy);
   }
   if (req.method === 'PUT') {
      return updateSettings(req, res, verifyResult.userId, verifyResult.isLegacy);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getSettings = async (req: NextApiRequest, res: NextApiResponse<SettingsGetResponse>, userId?: number, isLegacy?: boolean) => {
   const settings = await getAppSettings(userId, isLegacy);
   if (settings) {
      const version = process.env.APP_VERSION;
      return res.status(200).json({ settings: { ...settings, version } });
   }
   return res.status(400).json({ error: 'Error Loading Settings!' });
};

const updateSettings = async (req: NextApiRequest, res: NextApiResponse<SettingsGetResponse>, userId?: number, isLegacy?: boolean) => {
   const { settings } = req.body || {};
   if (!settings) {
      return res.status(200).json({ error: 'Settings Data not Provided!' });
   }
   try {
      const cryptr = new Cryptr(process.env.SECRET as string);

      // Multi-Tenant: Save scraper settings to user's record
      if (userId && !isLegacy) {
         const scraper_api_key = settings.scaping_api ? cryptr.encrypt(settings.scaping_api.trim()) : null;
         const adwords_client_id = settings.adwords_client_id ? cryptr.encrypt(settings.adwords_client_id.trim()) : null;
         const adwords_client_secret = settings.adwords_client_secret ? cryptr.encrypt(settings.adwords_client_secret.trim()) : null;
         const adwords_developer_token = settings.adwords_developer_token ? cryptr.encrypt(settings.adwords_developer_token.trim()) : null;
         const adwords_account_id = settings.adwords_account_id ? cryptr.encrypt(settings.adwords_account_id.trim()) : null;

         await User.update({
            scraper_type: settings.scraper_type || 'none',
            scraper_api_key,
            proxy_list: settings.proxy || null,
            scrape_delay: settings.scrape_delay || 'none',
            scrape_retry: settings.scrape_retry || false,
            adwords_client_id,
            adwords_client_secret,
            adwords_developer_token,
            adwords_account_id
         }, {
            where: { id: userId }
         });

         console.log(`[INFO] Updated scraper & ads settings for user ${userId}`);
      }

      // Helper to update specific setting in DB
      const saveSetting = async (key: string, val: any) => {
         const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
         await Setting.upsert({ key, value: stringVal });
      };

      // Save other global settings to Database
      const smtp_password = settings.smtp_password ? cryptr.encrypt(settings.smtp_password.trim()) : '';
      const search_console_client_email = settings.search_console_client_email ? cryptr.encrypt(settings.search_console_client_email.trim()) : '';
      const search_console_private_key = settings.search_console_private_key ? cryptr.encrypt(settings.search_console_private_key.trim()) : '';
      const adwords_client_id = settings.adwords_client_id ? cryptr.encrypt(settings.adwords_client_id.trim()) : '';
      const adwords_client_secret = settings.adwords_client_secret ? cryptr.encrypt(settings.adwords_client_secret.trim()) : '';
      const adwords_developer_token = settings.adwords_developer_token ? cryptr.encrypt(settings.adwords_developer_token.trim()) : '';
      const adwords_account_id = settings.adwords_account_id ? cryptr.encrypt(settings.adwords_account_id.trim()) : '';

      // Prepare object for saving (similar to previous file structure but flattening for DB if needed, or storing as one JSON blob)
      // To maintain compatibility with the 'getAppSettings' reading logic below, we can store the main config as one JSON 
      // OR split them. Given the previous structure was one JSON file, storing the "app_config" as one JSON is easiest migration.
      // However, separating keys is better for MySQL. Let's stick to the migration seed's key 'app_config' for the main blob
      // and separate secured keys if we want, OR just overwrite 'app_config' with everything except the per-user stuff.

      // Let's create a securedSettings object like before and save it as 'app_config' in the DB.
      const securedSettings = {
         ...settings,
         scaping_api: '', // Remove from global settings (now per-user)
         scraper_type: isLegacy ? settings.scraper_type : 'none', // Legacy mode keeps it in file
         smtp_password,
         search_console_client_email,
         search_console_private_key,
         adwords_client_id,
         adwords_client_secret,
         adwords_developer_token,
         adwords_account_id,
      };

      await saveSetting('app_config', securedSettings);
      return res.status(200).json({ settings });
   } catch (error) {
      console.log('[ERROR] Updating App Settings. ', error);
      return res.status(200).json({ error: 'Error Updating Settings!' });
   }
};

export const getAppSettings = async (userId?: number, isLegacy?: boolean): Promise<SettingsType> => {

   try {
      const settingsRow = await Setting.findByPk('app_config');
      console.log('[DEBUG DB] Raw settings row:', settingsRow?.toJSON());
      const settingsRaw = settingsRow ? settingsRow.value : null;
      if (settingsRaw) console.log('[DEBUG DB] Raw JSON value:', settingsRaw);

      const failedQueueCount = await FailedJob.count();
      // For backward compatibility, the frontend might expect an array. 
      // If we just need the count or list, let's just return an empty array or fetch *all* if needed.
      // The original code returned: failedQueue: string[]
      // We can fetch all payloads.
      const failedJobs = await FailedJob.findAll();
      const failedQueue: string[] = failedJobs.map(job => job.payload);

      const settings: SettingsType = settingsRaw ? JSON.parse(settingsRaw) : {};
      let decryptedSettings = settings;

      try {
         const cryptr = new Cryptr(process.env.SECRET as string);

         // 1. Initialize with Global Defaults (Decrypted)
         let scaping_api = settings.scaping_api ? cryptr.decrypt(settings.scaping_api) : '';
         let scraper_type = settings.scraper_type || 'none';
         let proxy = settings.proxy || '';
         let scrape_delay = settings.scrape_delay || 'none';
         let scrape_retry = settings.scrape_retry || false;

         const smtp_password = settings.smtp_password ? cryptr.decrypt(settings.smtp_password) : '';
         const search_console_client_email = settings.search_console_client_email ? cryptr.decrypt(settings.search_console_client_email) : '';
         const search_console_private_key = settings.search_console_private_key ? cryptr.decrypt(settings.search_console_private_key) : '';

         let adwords_client_id = settings.adwords_client_id ? cryptr.decrypt(settings.adwords_client_id) : '';
         let adwords_client_secret = settings.adwords_client_secret ? cryptr.decrypt(settings.adwords_client_secret) : '';
         let adwords_developer_token = settings.adwords_developer_token ? cryptr.decrypt(settings.adwords_developer_token) : '';
         let adwords_account_id = settings.adwords_account_id ? cryptr.decrypt(settings.adwords_account_id) : '';

         let google_connected = false;

         // 2. Override with User Settings
         if (userId && !isLegacy) {
            const user = await User.findByPk(userId);
            if (user) {
               scraper_type = user.scraper_type || scraper_type;
               scaping_api = user.scraper_api_key ? cryptr.decrypt(user.scraper_api_key) : scaping_api;
               proxy = user.proxy_list || proxy;
               scrape_delay = user.scrape_delay || scrape_delay;
               scrape_retry = user.scrape_retry !== undefined ? user.scrape_retry : scrape_retry;

               // Adwords Overrides
               if (user.adwords_client_id) adwords_client_id = cryptr.decrypt(user.adwords_client_id);
               if (user.adwords_client_secret) adwords_client_secret = cryptr.decrypt(user.adwords_client_secret);
               if (user.adwords_developer_token) adwords_developer_token = cryptr.decrypt(user.adwords_developer_token);
               if (user.adwords_account_id) adwords_account_id = cryptr.decrypt(user.adwords_account_id);

               google_connected = !!(user.google_refresh_token || user.google_access_token);
            }
         } else if (isLegacy) {
            // Revert scraping api logic for Legacy if needed, but the init above covers it for 'settings.scaping_api'
         }

         decryptedSettings = {
            ...settings,
            scraper_type,
            scaping_api,
            proxy,
            smtp_password,
            search_console_client_email,
            search_console_private_key,
            google_connected,
            search_console_integrated: !!(process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL)
               || !!(search_console_client_email && search_console_private_key),
            available_scapers: allScrapers.map((scraper) => ({ label: scraper.name, value: scraper.id, allowsCity: !!scraper.allowsCity })),
            failed_queue: failedQueue, // Now populated from FailedJob table
            screenshot_key: '',
            adwords_client_id,
            adwords_client_secret,
            adwords_developer_token,
            adwords_account_id,
            scrape_delay,
            scrape_retry,
         };
      } catch (error) {
         console.log('Error Decrypting Settings API Keys!', error);
      }

      return decryptedSettings;
   } catch (error) {
      console.log('[ERROR] Getting App Settings. ', error);
      const settings: SettingsType = {
         scraper_type: 'none',
         notification_interval: 'never',
         notification_email: '',
         notification_email_from: '',
         notification_email_from_name: 'SEO Ai Agent',
         smtp_server: '',
         smtp_port: '',
         smtp_username: '',
         smtp_password: '',
         scrape_retry: false,
         screenshot_key: '',
         search_console: true,
         search_console_client_email: '',
         search_console_private_key: '',
         keywordsColumns: ['Best', 'History', 'Volume', 'Search Console'],
      };
      const otherSettings = {
         available_scapers: allScrapers.map((scraper) => ({ label: scraper.name, value: scraper.id })),
         failed_queue: [],
      };
      // Save default settings to DB if fetching failed (likely "not found" or similar)
      const stringVal = JSON.stringify(settings);
      await Setting.upsert({ key: 'app_config', value: stringVal });

      return { ...settings, ...otherSettings };
   }
};
