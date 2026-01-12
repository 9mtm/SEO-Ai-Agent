import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import ChatMessage from '../../database/models/chatMessage'; // Import ChatMessage
import { getAppSettings } from './settings';
import verifyUser from '../../utils/verifyUser';
import refreshAndUpdateKeywords from '../../utils/refresh';
import { Op } from 'sequelize'; // Import Op

type CRONRefreshRes = {
   started: boolean
   error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const verifyResult = verifyUser(req, res);
   if (!verifyResult.authorized) {
      return res.status(401).json({ error: 'Unauthorized' });
   }
   if (req.method === 'POST') {
      return cronRefreshkeywords(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const cronRefreshkeywords = async (req: NextApiRequest, res: NextApiResponse<CRONRefreshRes>) => {
   try {
      // 1. Retention Policy: Clean up old chats (older than 60 days)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const deletedCount = await ChatMessage.destroy({
         where: {
            createdAt: {
               [Op.lt]: sixtyDaysAgo
            }
         }
      });
      if (deletedCount > 0) {
         console.log(`[CRON] Retention Policy: Deleted ${deletedCount} old chat messages.`);
      }

      // 2. Keyword Refresh Logic
      // Mark all keywords as updating - simplest approach to lock them roughly speaking, 
      // though typically we should only pick those due for update. 
      // Existing logic updated ALL. We retain this behavior for now.
      await Keyword.update({ updating: true }, { where: {} });

      const allKeywords = await Keyword.findAll();

      // Group keywords by User ID
      const keywordsByUser: { [key: number]: Keyword[] } = {};

      allKeywords.forEach(k => {
         const uid = k.user_id || 1; // Default to Admin if null
         if (!keywordsByUser[uid]) keywordsByUser[uid] = [];
         keywordsByUser[uid].push(k);
      });

      const userIds = Object.keys(keywordsByUser).map(Number);

      console.log(`[CRON] Starting scrape for ${userIds.length} users...`);

      // Process each user's keywords with their own settings
      for (const userId of userIds) {
         const userKeywords = keywordsByUser[userId];
         const settings = await getAppSettings(userId);

         if (settings && settings.scraper_type !== 'never') {
            console.log(`[CRON] Scraping ${userKeywords.length} keywords for User ${userId} using ${settings.scraper_type}`);
            refreshAndUpdateKeywords(userKeywords, settings);
         } else {
            console.log(`[CRON] Skipping User ${userId} - No Scraper Configured.`);
         }
      }

      return res.status(200).json({ started: true });
   } catch (error) {
      console.log('[ERROR] CRON Refreshing Keywords: ', error);
      return res.status(400).json({ started: false, error: 'CRON Error refreshing keywords!' });
   }
};

