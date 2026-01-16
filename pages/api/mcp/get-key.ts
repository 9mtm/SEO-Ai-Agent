import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';

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

        // SECURITY: API keys cannot be retrieved after creation
        // This endpoint has been disabled for security reasons
        // Users should create a new API key if they lose access to their existing one
        return res.status(403).json({
            error: 'API keys cannot be retrieved after creation',
            message: 'For security reasons, API keys are only shown once during creation. If you lost your API key, please create a new one and revoke the old one.',
            suggestion: 'Use POST /api/mcp/keys to create a new API key'
        });

    } catch (error: any) {
        console.error('Get API Key error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
