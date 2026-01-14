import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import refreshAndUpdateKeywords from '../../utils/refresh';
import { getAppSettings } from './settings';
import verifyUser from '../../utils/verifyUser';
import parseKeywords from '../../utils/parseKeywords';
import { scrapeKeywordFromGoogle } from '../../utils/scraper';

type KeywordsRefreshRes = {
   keywords?: KeywordType[]
   error?: string | null,
}

type KeywordSearchResultRes = {
   searchResult?: {
      results: { title: string, url: string, position: number }[],
      keyword: string,
      position: number,
      country: string,
   },
   error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const verifyResult = verifyUser(req, res);
   if (!verifyResult.authorized) {
      return res.status(401).json({ error: 'Unauthorized' });
   }
   if (req.method === 'GET') {
      return getKeywordSearchResults(req, res);
   }
   if (req.method === 'POST') {
      return refresTheKeywords(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const refresTheKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsRefreshRes>) => {
   if (!req.query.id && typeof req.query.id !== 'string') {
      return res.status(400).json({ error: 'keyword ID is Required!' });
   }
   if (req.query.id === 'all' && !req.query.domain) {
      return res.status(400).json({ error: 'When Refreshing all Keywords of a domian, the Domain name Must be provided.' });
   }
   const keywordIDs = req.query.id !== 'all' && (req.query.id as string).split(',').map((item) => parseInt(item, 10));
   const { domain } = req.query || {};
   console.log('keywordIDs: ', keywordIDs);

   try {
      const query = req.query.id === 'all' && domain ? { domain } : { ID: { [Op.in]: keywordIDs } };
      await Keyword.update({ updating: true }, { where: query });
      const keywordQueries: Keyword[] = await Keyword.findAll({ where: query });

      if (keywordQueries.length === 0) {
         return res.status(200).json({ keywords: [] });
      }

      // Check User ID from the first keyword (assuming batch belongs to same user, which is true for 'all' domain or single ID)
      // For mixed IDs, we should ideally group, but typically frontend sends IDs from one view.
      const userId = keywordQueries[0].user_id || 1;

      // Get User's Settings
      const settings = await getAppSettings(userId);

      if (!settings || (settings && settings.scraper_type === 'never')) {
         // If User hasn't set up scraper, check if ADMIN (Legacy) has global settings? 
         // But strict multi-tenant means we rely on User. 
         // However, for "Free" users, maybe we use a system default? 
         // For now, enforce user settings or fallback to system default if we want to be generous.
         // Let's stick to the error message but maybe more descriptive.
         return res.status(400).json({ error: 'Scraper settings not configured for this user.' });
      }

      let keywords = [];

      // If Single Keyword wait for the scraping process,
      // else, Process the task in background. Do not wait.
      if (keywordIDs && keywordIDs.length === 0) {
         const refreshed: KeywordType[] = await refreshAndUpdateKeywords(keywordQueries, settings);
         keywords = refreshed;
      } else {
         refreshAndUpdateKeywords(keywordQueries, settings);
         keywords = parseKeywords(keywordQueries.map((el) => el.get({ plain: true })));
      }

      return res.status(200).json({ keywords });
   } catch (error) {
      console.log('ERROR refresThehKeywords: ', error);
      return res.status(400).json({ error: 'Error refreshing keywords!' });
   }
};

const getKeywordSearchResults = async (req: NextApiRequest, res: NextApiResponse<KeywordSearchResultRes>) => {
   if (!req.query.keyword || !req.query.country || !req.query.device) {
      return res.status(400).json({ error: 'A Valid keyword, Country Code, and device is Required!' });
   }
   try {
      // Re-verify user to get userId as it's not passed to this function directly
      const verifyResult = verifyUser(req, res);
      const userId = verifyResult.userId || 1; // Default to 1 if legacy/not found (though authorized check passed)

      console.log('Fetching keyword search results for User ID:', userId);
      const settings = await getAppSettings(userId);
      if (!settings || (settings && settings.scraper_type === 'never')) {
         return res.status(400).json({ error: 'Scraper has not been set up yet.' });
      }
      const dummyKeyword: KeywordType = {
         ID: 99999999999999,
         keyword: req.query.keyword as string,
         device: 'desktop',
         country: req.query.country as string,
         domain: '',
         lastUpdated: '',
         volume: 0,
         added: '',
         position: 111,
         sticky: false,
         history: {},
         lastResult: [],
         url: '',
         tags: [],
         updating: false,
         lastUpdateError: false,
      };
      const scrapeResult = await scrapeKeywordFromGoogle(dummyKeyword, settings);
      if (scrapeResult && !scrapeResult.error) {
         const searchResult = {
            results: scrapeResult.result,
            keyword: scrapeResult.keyword,
            position: scrapeResult.position !== 111 ? scrapeResult.position : 0,
            country: req.query.country as string,
         };
         return res.status(200).json({ error: '', searchResult });
      }
      return res.status(400).json({ error: 'Error Scraping Search Results for the given keyword!' });
   } catch (error) {
      console.log('ERROR refresThehKeywords: ', error);
      return res.status(400).json({ error: 'Error refreshing keywords!' });
   }
};
