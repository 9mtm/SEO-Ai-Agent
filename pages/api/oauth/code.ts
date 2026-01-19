import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthCodes } from '../../../lib/mcp-store';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') { return res.status(405).end(); }

    const authHeader = req.headers.authorization;
    if (!authHeader) { return res.status(401).end('Unauthorized'); }
    const token = authHeader.replace('Bearer ', '');

    const code = crypto.randomUUID();
    const codes = getAuthCodes();
    codes.set(code, { token, expires: Date.now() + 300000 }); // 5 min

    res.status(200).json({ code });
}
