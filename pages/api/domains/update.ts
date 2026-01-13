import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import Domain from '../../../database/models/domain';
import verifyUser from '../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const verifyResult = verifyUser(req, res);

    if (!verifyResult.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
        const { domain: domainName, competitors } = req.body;
        const userId = verifyResult.userId;

        try {
            const domain = await Domain.findOne({
                where: { domain: domainName, user_id: userId }
            });

            if (!domain) {
                return res.status(404).json({ error: 'Domain not found' });
            }

            await domain.update({ competitors });

            return res.status(200).json({ success: true, domain });
        } catch (error) {
            console.error('Update Domain Error:', error);
            return res.status(500).json({ error: 'Database Error' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
