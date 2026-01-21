import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.status(200).json({
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL || 'false',
        VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
    });
}
