import type { NextApiRequest, NextApiResponse } from 'next';
import { getValidGoogleToken } from '../../../utils/googleOAuth';
import verifyUser from '../../../utils/verifyUser';
import db from '../../../database/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const { authorized, userId } = verifyUser(req, res);

    if (!authorized || !userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const accessToken = await getValidGoogleToken(userId);

        if (!accessToken) {
            return res.status(400).json({ error: 'Google account not connected. Please connect in settings.' });
        }

        const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('GSC API Error:', response.status, response.statusText, errorText);
            throw new Error(`Failed to fetch sites from Google Search Console: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const sites = data.siteEntry || [];

        console.log('[GSC Sites] Total sites from Google:', sites.length);
        console.log('[GSC Sites] All sites with permissions:', JSON.stringify(sites, null, 2));

        // Filter to only sites where user has full permissions
        // Include Owner, Full User, and Unverified User
        const ownerSites = sites.filter((site: any) =>
            site.permissionLevel === 'siteOwner' ||
            site.permissionLevel === 'siteFullUser' ||
            site.permissionLevel === 'siteUnverifiedUser'
        );

        console.log('[GSC Sites] Owner sites after filter:', ownerSites.length);

        const formattedSites = ownerSites.map((site: any) => ({
            siteUrl: site.siteUrl,
            permissionLevel: site.permissionLevel
        }));

        return res.status(200).json({
            sites: formattedSites,
            totalSites: sites.length,
            ownerSites: ownerSites.length
        });

    } catch (error) {
        console.error('Error fetching GSC sites:', error);
        return res.status(500).json({ error: 'Failed to fetch sites.' });
    }
}
