import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getPlatformAdapter } from '../../../utils/platformAdapters';
import verifyUser from '../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { token } = req.body;
    const platformType = req.headers['x-platform-type'] as string;
    const adapter = getPlatformAdapter(platformType);

    // Allow verification via Platform Secret (Server-to-Server)
    if (adapter && await adapter.validateRequest(req)) {
        if (!token) return res.status(400).json({ valid: false, error: 'Token missing' });

        try {
            jwt.verify(token, process.env.SECRET || '');
            return res.status(200).json({ valid: true });
        } catch (err) {
            return res.status(200).json({ valid: false, error: 'Token invalid or expired' });
        }
    }

    // Allow verification via Cookie (Client-side check)
    const auth = verifyUser(req, res);
    if (auth.authorized) {
        return res.status(200).json({ valid: true, user_id: auth.userId });
    }

    return res.status(401).json({ valid: false, error: 'Unauthorized' });
}
