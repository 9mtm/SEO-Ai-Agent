import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthCodes } from '../../../lib/mcp-store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') { return res.status(405).end(); }

    // Support JSON or Form body
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'invalid_request', error_description: 'Missing code' });
    }

    const codes = getAuthCodes();
    const access = codes.get(code);

    if (!access) {
        return res.status(400).json({ error: 'invalid_grant' });
    }
    if (Date.now() > access.expires) {
        codes.delete(code);
        return res.status(400).json({ error: 'expired_grant' });
    }

    codes.delete(code); // Consume code

    res.status(200).json({
        access_token: access.token,
        token_type: 'Bearer',
        expires_in: 3600
    });
}
