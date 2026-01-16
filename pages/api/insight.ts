import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import { getCountryInsight, getKeywordsInsight, getPagesInsight } from '../../utils/insight';
import { fetchDomainSCData, getSearchConsoleApiInfo, readLocalSCData } from '../../utils/searchConsole';
import verifyUser from '../../utils/verifyUser';
import Domain from '../../database/models/domain';

type SCInsightRes = {
   data: InsightDataType | null,
   error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const verifyResult = verifyUser(req, res);
   if (!verifyResult.authorized) {
      return res.status(401).json({ error: 'Unauthorized' });
   }
   if (req.method === 'GET') {
      return getDomainSearchConsoleInsight(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getDomainSearchConsoleInsight = async (req: NextApiRequest, res: NextApiResponse<SCInsightRes>) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') return res.status(400).json({ data: null, error: 'Domain is Missing.' });
   const domainname = (req.query.domain as string).replaceAll('-', '.').replaceAll('_', '-');
   const days = req.query.days ? parseInt(req.query.days as string) : 30;

   const getInsightFromSCData = (localSCData: SCDomainDataType, daysFilter: number): InsightDataType => {
      const { stats = [] } = localSCData;

      // Filter stats by days
      const filteredStats = stats.slice(-daysFilter);

      const countries = getCountryInsight(localSCData);
      const keywords = getKeywordsInsight(localSCData);
      const pages = getPagesInsight(localSCData);
      return { pages, keywords, countries, stats: filteredStats };
   };

   // First try and read the  Local SC Domain Data file.
   const localSCData = await readLocalSCData(domainname);

   if (localSCData) {
      const oldFetchedDate = localSCData.lastFetched;
      const fetchTimeDiff = new Date().getTime() - (oldFetchedDate ? new Date(oldFetchedDate as string).getTime() : 0);
      if (localSCData.stats && localSCData.stats.length && fetchTimeDiff <= 86400000) {
         const response = getInsightFromSCData(localSCData, days);
         return res.status(200).json({ data: response });
      }
   }

   // If the Local SC Domain Data file does not exist, fetch from Googel Search Console.
   try {
      const query = { domain: domainname };
      const foundDomain: Domain | null = await Domain.findOne({ where: query });

      if (!foundDomain) {
         return res.status(404).json({ data: null, error: 'Domain not found' });
      }

      const domainObj: DomainType = foundDomain.get({ plain: true });
      const scDomainAPI = await getSearchConsoleApiInfo(domainObj);

      // Check for OAuth connection
      const { hasGoogleConnection } = await import('../../utils/googleOAuth');
      const isConnected = domainObj.user_id ? await hasGoogleConnection(domainObj.user_id) : false;

      if (!isConnected && !(scDomainAPI.client_email && scDomainAPI.private_key)) {
         return res.status(200).json({ data: null, error: 'Google Search Console is not Integrated.' });
      }
      const scData = await fetchDomainSCData(domainObj, scDomainAPI, days);
      const response = getInsightFromSCData(scData, days);
      return res.status(200).json({ data: response });
   } catch (error) {
      console.log('[ERROR] Getting Domain Insight: ', domainname, error);
      return res.status(400).json({ data: null, error: 'Error Fetching Stats from Google Search Console.' });
   }
};
