import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import { getAppSettings } from './settings';
import verifyUser from '../../utils/verifyUser';
import parseKeywords from '../../utils/parseKeywords';
import { integrateKeywordSCData, readLocalSCData } from '../../utils/searchConsole';
import refreshAndUpdateKeywords from '../../utils/refresh';
import { getKeywordsVolume, updateKeywordsVolumeData } from '../../utils/adwords';

type KeywordsGetResponse = {
   keywords?: KeywordType[],
   error?: string | null,
}

type KeywordsDeleteRes = {
   domainRemoved?: number,
   keywordsRemoved?: number,
   error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const { authorized, userId, isLegacy } = verifyUser(req, res);
   if (!authorized) {
      return res.status(401).json({ error: 'Not authorized' });
   }

   if (req.method === 'GET') {
      return getKeywords(req, res, userId, isLegacy);
   }
   if (req.method === 'POST') {
      return addKeywords(req, res, userId, isLegacy);
   }
   if (req.method === 'DELETE') {
      return deleteKeywords(req, res, userId, isLegacy);
   }
   if (req.method === 'PUT') {
      return updateKeywords(req, res, userId, isLegacy);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getKeywords = async (
   req: NextApiRequest,
   res: NextApiResponse<KeywordsGetResponse>,
   userId?: number,
   isLegacy?: boolean
) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') {
      return res.status(400).json({ error: 'Domain is Required!' });
   }
   if (!userId && !isLegacy) {
      return res.status(401).json({ error: 'User ID is required' });
   }
   // Use userId 1 for legacy if not provided, otherwise use authenticated userId
   const settingsUserId = userId || 1;
   const settings = await getAppSettings(settingsUserId);
   const domain = (req.query.domain as string);
   const integratedSC = process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL;
   const { search_console_client_email, search_console_private_key } = settings;
   const domainSCData = integratedSC || (search_console_client_email && search_console_private_key) ? await readLocalSCData(domain) : false;

   try {
      // Multi-tenant: Filter by user_id
      const whereClause: any = { domain };
      if (userId && !isLegacy) {
         whereClause.user_id = userId;
      }

      const allKeywords: Keyword[] = await Keyword.findAll({ where: whereClause });
      const keywords: KeywordType[] = parseKeywords(allKeywords.map((e) => e.get({ plain: true })));
      const processedKeywords = keywords.map((keyword) => {
         const historyArray = Object.keys(keyword.history).map((dateKey: string) => ({
            date: new Date(dateKey).getTime(),
            dateRaw: dateKey,
            position: keyword.history[dateKey],
         }));
         const historySorted = historyArray.sort((a, b) => a.date - b.date);
         const lastWeekHistory: KeywordHistory = {};
         historySorted.slice(-7).forEach((x: any) => { lastWeekHistory[x.dateRaw] = x.position; });
         const keywordWithSlimHistory = { ...keyword, lastResult: [], history: lastWeekHistory };
         const finalKeyword = domainSCData ? integrateKeywordSCData(keywordWithSlimHistory, domainSCData) : keywordWithSlimHistory;
         return finalKeyword;
      });
      return res.status(200).json({ keywords: processedKeywords });
   } catch (error) {
      console.log('[ERROR] Getting Domain Keywords for ', domain, error);
      return res.status(400).json({ error: 'Error Loading Keywords for this Domain.' });
   }
};

const addKeywords = async (
   req: NextApiRequest,
   res: NextApiResponse<KeywordsGetResponse>,
   userId?: number,
   isLegacy?: boolean
) => {
   const { keywords } = req.body;
   if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      // Multi-tenant: user_id is required
      if (!isLegacy && !userId) {
         return res.status(401).json({ error: 'User authentication required' });
      }

      const keywordsToAdd: any = []; // QuickFIX for bug: https://github.com/sequelize/sequelize-typescript/issues/936

      keywords.forEach((kwrd: KeywordAddPayload) => {
         const { keyword, device, country, domain, tags, city } = kwrd;
         const tagsArray = tags ? tags.split(',').map((item: string) => item.trim()) : [];
         const newKeyword: any = {
            keyword,
            device,
            domain,
            country,
            city,
            position: 0,
            updating: true,
            history: JSON.stringify({}),
            url: '',
            tags: JSON.stringify(tagsArray),
            sticky: false,
            lastUpdated: new Date().toJSON(),
            added: new Date().toJSON(),
         };

         // Add user_id for multi-tenant mode
         if (userId && !isLegacy) {
            newKeyword.user_id = userId;
         } else {
            // Legacy mode: default to user_id = 1
            newKeyword.user_id = 1;
         }

         keywordsToAdd.push(newKeyword);
      });

      try {
         const newKeywords: Keyword[] = await Keyword.bulkCreate(keywordsToAdd);
         const formattedkeywords = newKeywords.map((el) => el.get({ plain: true }));
         const keywordsParsed: KeywordType[] = parseKeywords(formattedkeywords);

         // Queue the SERP Scraping Process
         // Use the userId from the first added keyword or the authenticated userId
         const settingsUserId = userId || (newKeywords.length > 0 ? newKeywords[0].user_id : 1);
         const settings = await getAppSettings(settingsUserId);
         refreshAndUpdateKeywords(newKeywords, settings);

         // Update the Keyword Volume
         const { adwords_account_id, adwords_client_id, adwords_client_secret, adwords_developer_token } = settings;
         if (adwords_account_id && adwords_client_id && adwords_client_secret && adwords_developer_token) {
            const keywordsVolumeData = await getKeywordsVolume(keywordsParsed);
            if (keywordsVolumeData.volumes !== false) {
               await updateKeywordsVolumeData(keywordsVolumeData.volumes);
            }
         }

         return res.status(201).json({ keywords: keywordsParsed });
      } catch (error) {
         console.log('[ERROR] Adding New Keywords ', error);
         return res.status(400).json({ error: 'Could Not Add New Keyword!' });
      }
   } else {
      return res.status(400).json({ error: 'Necessary Keyword Data Missing' });
   }
};

const deleteKeywords = async (
   req: NextApiRequest,
   res: NextApiResponse<KeywordsDeleteRes>,
   userId?: number,
   isLegacy?: boolean
) => {
   if (!req.query.id && typeof req.query.id !== 'string') {
      return res.status(400).json({ error: 'keyword ID is Required!' });
   }
   console.log('req.query.id: ', req.query.id);

   try {
      const keywordsToRemove = (req.query.id as string).split(',').map((item) => parseInt(item, 10));

      // Multi-tenant: Verify ownership
      const whereClause: any = { ID: { [Op.in]: keywordsToRemove } };
      if (userId && !isLegacy) {
         whereClause.user_id = userId;
      }

      const removeQuery = { where: whereClause };
      const removedKeywordCount: number = await Keyword.destroy(removeQuery);
      return res.status(200).json({ keywordsRemoved: removedKeywordCount });
   } catch (error) {
      console.log('[ERROR] Removing Keyword. ', error);
      return res.status(400).json({ error: 'Could Not Remove Keyword!' });
   }
};

const updateKeywords = async (
   req: NextApiRequest,
   res: NextApiResponse<KeywordsGetResponse>,
   userId?: number,
   isLegacy?: boolean
) => {
   if (!req.query.id && typeof req.query.id !== 'string') {
      return res.status(400).json({ error: 'keyword ID is Required!' });
   }
   if (req.body.sticky === undefined && !req.body.tags === undefined) {
      return res.status(400).json({ error: 'keyword Payload Missing!' });
   }
   const keywordIDs = (req.query.id as string).split(',').map((item) => parseInt(item, 10));
   const { sticky, tags } = req.body;

   try {
      let keywords: KeywordType[] = [];

      // Multi-tenant: Build where clause with user ownership check
      const whereClause: any = { ID: { [Op.in]: keywordIDs } };
      if (userId && !isLegacy) {
         whereClause.user_id = userId;
      }

      if (sticky !== undefined) {
         await Keyword.update({ sticky }, { where: whereClause });
         const updateQuery = { where: whereClause };
         const updatedKeywords: Keyword[] = await Keyword.findAll(updateQuery);
         const formattedKeywords = updatedKeywords.map((el) => el.get({ plain: true }));
         keywords = parseKeywords(formattedKeywords);
         return res.status(200).json({ keywords });
      }
      if (tags) {
         const tagsKeywordIDs = Object.keys(tags);
         const multipleKeywords = tagsKeywordIDs.length > 1;
         for (const keywordID of tagsKeywordIDs) {
            // Multi-tenant: Verify ownership before update
            const keywordWhereClause: any = { ID: keywordID };
            if (userId && !isLegacy) {
               keywordWhereClause.user_id = userId;
            }

            const selectedKeyword = await Keyword.findOne({ where: keywordWhereClause });
            if (selectedKeyword) {
               const currentTags = selectedKeyword && selectedKeyword.tags ? JSON.parse(selectedKeyword.tags) : [];
               const mergedTags = Array.from(new Set([...currentTags, ...tags[keywordID]]));
               await selectedKeyword.update({ tags: JSON.stringify(multipleKeywords ? mergedTags : tags[keywordID]) });
            }
         }
         return res.status(200).json({ keywords });
      }
      return res.status(400).json({ error: 'Invalid Payload!' });
   } catch (error) {
      console.log('[ERROR] Updating Keyword. ', error);
      return res.status(200).json({ error: 'Error Updating keywords!' });
   }
};
