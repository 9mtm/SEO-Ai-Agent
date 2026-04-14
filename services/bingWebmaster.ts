import { getValidMicrosoftToken } from '../utils/microsoftOAuth';

const BING_API_BASE = 'https://www.bing.com/webmaster/api.svc/json';

interface BingSite {
  Url: string;
  IsVerified: boolean;
}

interface BingQueryStat {
  Query: string;
  Impressions: number;
  Clicks: number;
  AvgClickPosition: number;
  AvgImpressionPosition: number;
}

interface BingPageStat {
  Url: string;
  Impressions: number;
  Clicks: number;
  AvgClickPosition: number;
  AvgImpressionPosition: number;
}

interface BingTrafficStat {
  Date: string;
  Impressions: number;
  Clicks: number;
}

async function bingFetch(userId: number, endpoint: string, params?: Record<string, string>) {
  const token = await getValidMicrosoftToken(userId);
  if (!token) {
    throw new Error('No valid Bing token. Please connect Bing Webmaster Tools.');
  }

  const url = new URL(`${BING_API_BASE}/${endpoint}`);
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      url.searchParams.set(key, val);
    }
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[BingWebmaster] ${endpoint} failed (${response.status}):`, text.substring(0, 200));
    throw new Error(`Bing API error: ${response.status}`);
  }

  return response.json();
}

/**
 * List user's verified Bing Webmaster sites.
 */
export async function getBingSites(userId: number): Promise<BingSite[]> {
  const data = await bingFetch(userId, 'GetUserSites');
  return data?.d ?? data ?? [];
}

/**
 * Get keyword/query traffic stats for a site.
 */
export async function getBingQueryStats(userId: number, siteUrl: string): Promise<BingQueryStat[]> {
  const data = await bingFetch(userId, 'GetQueryStats', { siteUrl });
  return data?.d ?? data ?? [];
}

/**
 * Get page-level traffic stats for a site.
 */
export async function getBingPageStats(userId: number, siteUrl: string): Promise<BingPageStat[]> {
  const data = await bingFetch(userId, 'GetPageStats', { siteUrl });
  return data?.d ?? data ?? [];
}

/**
 * Get daily rank and traffic stats for a site.
 */
export async function getBingTrafficStats(userId: number, siteUrl: string): Promise<BingTrafficStat[]> {
  const data = await bingFetch(userId, 'GetRankAndTrafficStats', { siteUrl });
  return data?.d ?? data ?? [];
}
