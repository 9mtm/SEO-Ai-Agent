import type { NextApiRequest, NextApiResponse } from 'next';

// GDPR Article 7 — log consent proof (no auth required — visitors too)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { consentId, preferences, timestamp, version, userAgent, language, consentMethod } = req.body;
        // In production, store this in a database table or logging service
        // For now, log to stdout (captured by PM2 logs)
        console.log('[Consent Log]', JSON.stringify({
            consentId, preferences, timestamp, version, consentMethod,
            ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
            userAgent: userAgent?.slice(0, 200),
            language,
        }));
        return res.status(200).json({ ok: true });
    } catch {
        return res.status(500).json({ error: 'Failed' });
    }
}
