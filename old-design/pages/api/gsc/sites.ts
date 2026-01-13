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

        // Filter to only Verified sites (permissionLevel: 'siteOwner' or similar usually implies verification)
        // or just return all and let frontend decide.
        // Usually users want to see sites they have access to.

        const formattedSites = sites.map((site: any) => ({
            siteUrl: site.siteUrl,
            permissionLevel: site.permissionLevel
        }));

        return res.status(200).json({ sites: formattedSites });

    } catch (error) {
        console.error('Error fetching GSC sites:', error);
        return res.status(500).json({ error: 'Failed to fetch sites.' });
    }
}
