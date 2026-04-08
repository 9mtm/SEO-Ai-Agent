import type { NextApiRequest, NextApiResponse } from 'next';
import Cryptr from 'cryptr';
import verifyUser from '../../utils/verifyUser';
import allScrapers from '../../scrapers/index';
import User from '../../database/models/user';
import FailedJob from '../../database/models/failedJob';
import Workspace from '../../database/models/workspace';
import db from '../../database/database';
import { getWorkspaceContext } from '../../utils/workspaceContext';

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
      return getSettings(req, res, verifyResult.userId);
   }
   if (req.method === 'PUT') {
      return updateSettings(req, res, verifyResult.userId);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getSettings = async (req: NextApiRequest, res: NextApiResponse<SettingsGetResponse>, userId?: number) => {
   const settings = await getAppSettings(userId);
   if (settings) {
      // Team-member GSC inheritance: if the current user is NOT the owner of
      // their active workspace, expose the owner's Google Search Console
      // connection status instead of the member's (members don't connect
      // their own Google account — they inherit the workspace's).
      try {
         const ctx = await getWorkspaceContext(req, res);
         if (ctx && ctx.role !== 'owner') {
            const ws: any = await Workspace.findByPk(ctx.workspaceId);
            if (ws?.owner_user_id && ws.owner_user_id !== userId) {
               const owner: any = await User.findByPk(ws.owner_user_id);
               const ownerHasGsc = !!(owner?.google_refresh_token || owner?.google_access_token);
               (settings as any).google_connected = ownerHasGsc;
               (settings as any).search_console_integrated = ownerHasGsc;
               (settings as any).is_team_member = true;
               (settings as any).workspace_owner_id = ws.owner_user_id;
            }
         }
      } catch (e) {
         console.error('[settings] team-member GSC inheritance failed:', e);
      }
      const version = process.env.APP_VERSION;
      return res.status(200).json({ settings: { ...settings, version } });
   }
   return res.status(400).json({ error: 'Error Loading Settings!' });
};

const updateSettings = async (req: NextApiRequest, res: NextApiResponse<SettingsGetResponse>, userId?: number) => {
   const { settings } = req.body || {};
   if (!settings) {
      return res.status(200).json({ error: 'Settings Data not Provided!' });
   }

   if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
   }

   try {
      const cryptr = new Cryptr(process.env.SECRET as string);

      // Encrypt sensitive data
      const scraper_api_key = settings.scaping_api ? cryptr.encrypt(settings.scaping_api.trim()) : null;
      const adwords_client_id = settings.adwords_client_id ? cryptr.encrypt(settings.adwords_client_id.trim()) : null;
      const adwords_client_secret = settings.adwords_client_secret ? cryptr.encrypt(settings.adwords_client_secret.trim()) : null;
      const adwords_developer_token = settings.adwords_developer_token ? cryptr.encrypt(settings.adwords_developer_token.trim()) : null;
      const adwords_account_id = settings.adwords_account_id ? cryptr.encrypt(settings.adwords_account_id.trim()) : null;

      // Update user settings
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

      console.log(`[INFO] Updated settings for user ${userId}`);
      return res.status(200).json({ settings });
   } catch (error) {
      console.log('[ERROR] Updating App Settings. ', error);
      return res.status(500).json({ error: 'Error Updating Settings!' });
   }
};

export const getAppSettings = async (userId?: number): Promise<SettingsType> => {
   // Default settings object
   const defaultSettings: SettingsType = {
      scraper_type: 'none',
      scaping_api: '',
      proxy: '',
      scrape_delay: 'none',
      scrape_retry: false,
      notification_interval: 'never',
      notification_email: '',
      notification_email_from: '',
      notification_email_from_name: 'SEO Ai Agent',
      smtp_server: process.env.SMTP_HOST || '',
      smtp_port: process.env.SMTP_PORT || '',
      smtp_username: process.env.SMTP_USERNAME || '',
      smtp_password: process.env.SMTP_PASSWORD || '',
      smtp_from_env: !!(process.env.SMTP_HOST && process.env.SMTP_PORT),
      screenshot_key: '',
      google_connected: false,
      search_console: true,
      search_console_integrated: false,
      search_console_client_email: '',
      search_console_private_key: '',
      available_scapers: allScrapers.map((scraper) => ({ label: scraper.name, value: scraper.id, allowsCity: !!scraper.allowsCity })),
      failed_queue: [],
      adwords_client_id: '',
      adwords_client_secret: '',
      adwords_developer_token: '',
      adwords_account_id: '',
      keywordsColumns: ['Best', 'History', 'Volume', 'Search Console'],
   };

   try {
      if (!userId) {
         // If no user ID provided (e.g. system batch process), return defaults
         return defaultSettings;
      }

      const user = await User.findByPk(userId);
      if (!user) {
         throw new Error('User not found');
      }

      const cryptr = new Cryptr(process.env.SECRET as string);
      const failedJobs = await FailedJob.findAll();
      const failedQueue: string[] = failedJobs.map(job => job.payload);

      // Decrypt user settings
      const scaping_api = user.scraper_api_key ? cryptr.decrypt(user.scraper_api_key) : '';
      const scraper_type = user.scraper_type || 'none';
      const proxy = user.proxy_list || '';
      const scrape_delay = user.scrape_delay || 'none';
      const scrape_retry = user.scrape_retry || false;

      const adwords_client_id = user.adwords_client_id ? cryptr.decrypt(user.adwords_client_id) : '';
      const adwords_client_secret = user.adwords_client_secret ? cryptr.decrypt(user.adwords_client_secret) : '';
      const adwords_developer_token = user.adwords_developer_token ? cryptr.decrypt(user.adwords_developer_token) : '';
      const adwords_account_id = user.adwords_account_id ? cryptr.decrypt(user.adwords_account_id) : '';

      const google_connected = !!(user.google_refresh_token || user.google_access_token);

      const settings: SettingsType = {
         scraper_type,
         scaping_api,
         proxy,
         scrape_delay,
         scrape_retry,
         // SMTP Settings from Environment Variables
         smtp_server: process.env.SMTP_HOST || '',
         smtp_port: process.env.SMTP_PORT || '',
         smtp_username: process.env.SMTP_USERNAME || '',
         smtp_password: process.env.SMTP_PASSWORD || '',
         notification_email: user.email,
         notification_email_from: process.env.SMTP_FROM_EMAIL || '',
         notification_email_from_name: process.env.SMTP_FROM_NAME || 'SEO AI Agent',
         notification_interval: 'monthly',
         smtp_from_env: !!(process.env.SMTP_HOST && process.env.SMTP_PORT),
         // Google Search Console (OAuth-based, no service account needed)
         google_connected,
         search_console_integrated: google_connected,
         search_console_client_email: '',
         search_console_private_key: '',
         // Available scrapers
         available_scapers: allScrapers.map((scraper) => ({
            label: scraper.name,
            value: scraper.id,
            allowsCity: !!scraper.allowsCity
         })),
         failed_queue: failedQueue,
         screenshot_key: '',
         // Google Ads settings
         adwords_client_id,
         adwords_client_secret,
         adwords_developer_token,
         adwords_account_id,
         search_console: true,
         keywordsColumns: ['Best', 'History', 'Volume', 'Search Console'],
      };

      return settings;
   } catch (error) {
      console.log('[ERROR] Getting App Settings. ', error);
      return defaultSettings;
   }
};
