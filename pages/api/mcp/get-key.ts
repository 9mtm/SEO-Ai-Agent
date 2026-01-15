import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import ApiKey from '../../../database/models/apiKey';
import { decrypt } from '../../../utils/encryption';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const auth = await verifyUser(req, res);
        if (!auth.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { keyId } = req.query;

        if (!keyId) {
            return res.status(400).json({ error: 'Missing keyId' });
        }

        // Find the API key
        const apiKey = await ApiKey.findOne({
            where: { id: keyId, user_id: auth.userId }
        });

        if (!apiKey) {
            return res.status(404).json({ error: 'API key not found' });
        }

        // Decrypt the key
        const decryptedKey = decrypt(apiKey.key_encrypted);

        return res.status(200).json({ apiKey: decryptedKey });

    } catch (error: any) {
        console.error('Get API Key error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
