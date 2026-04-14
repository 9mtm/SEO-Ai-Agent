import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import {
  getBingQueryStats,
  getBingPageStats,
  getBingCountryStats,
} from '../../../services/bingWebmaster';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const { authorized, userId } = verifyUser(req, res);
  if (!authorized || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const siteUrl = req.query.siteUrl as string;
  if (!siteUrl) {
    return res.status(400).json({ error: 'siteUrl query parameter is required' });
  }

  try {
    const [keywords, pages, countries] = await Promise.all([
      getBingQueryStats(userId, siteUrl),
      getBingPageStats(userId, siteUrl),
      getBingCountryStats(userId, siteUrl),
    ]);

    // Calculate aggregated totals
    const totalClicks = keywords.reduce((sum, k) => sum + (k.Clicks || 0), 0);
    const totalImpressions = keywords.reduce((sum, k) => sum + (k.Impressions || 0), 0);
    const avgPosition = keywords.length > 0
      ? keywords.reduce((sum, k) => sum + (k.AvgImpressionPosition || 0), 0) / keywords.length
      : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return res.status(200).json({
      stats: {
        totalClicks,
        totalImpressions,
        ctr: Math.round(ctr * 100) / 100,
        avgPosition: Math.round(avgPosition * 10) / 10,
      },
      keywords: keywords.map((k) => ({
        keyword: k.Query,
        clicks: k.Clicks,
        impressions: k.Impressions,
        position: k.AvgImpressionPosition,
        ctr: k.Impressions > 0
          ? Math.round((k.Clicks / k.Impressions) * 10000) / 100
          : 0,
      })),
      pages: pages.map((p) => ({
        page: p.Url,
        clicks: p.Clicks,
        impressions: p.Impressions,
        position: p.AvgImpressionPosition,
      })),
      countries: countries.map((c) => ({
        country: c.Country,
        clicks: c.Clicks,
        impressions: c.Impressions,
      })),
    });
  } catch (error: any) {
    console.error('[Bing Stats] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
