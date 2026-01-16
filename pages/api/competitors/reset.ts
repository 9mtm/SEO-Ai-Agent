import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import Keyword from '../../../database/models/keyword';
import verifyUser from '../../../utils/verifyUser';

type ResetResponse = {
    success?: boolean;
    count?: number;
    error?: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResetResponse>) {
    await db.sync();
    const verifyResult = verifyUser(req, res);

    if (!verifyResult.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Reset all keywords with updating_competitors = true to false
        const [count] = await Keyword.update(
            { updating_competitors: false },
            { where: { updating_competitors: true } }
        );

        console.log(`✅ Reset updating_competitors flag for ${count} keywords.`);

        return res.status(200).json({ success: true, count });
    } catch (error) {
        console.error('Reset Competitors Flag Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
