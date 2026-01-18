import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import jwt from 'jsonwebtoken';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { token } = req.body;

    if (!token || !process.env.SECRET) {
        return res.status(400).json({ success: false, error: 'Token or Secret missing' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.SECRET);

        // Set Cookie
        const cookies = new Cookies(req, res);
        const expireDate = new Date();
        const sessDuration = process.env.SESSION_DURATION;
        expireDate.setHours(expireDate.getHours() + (sessDuration ? parseInt(sessDuration, 10) : 24));

        // Determine secure settings
        // For iframe embedding to work, SameSite must be None and Secure must be true.
        // In development (HTTP), this might be tricky. 
        // We'll check if we are in production or if explicit config says so.
        const isProduction = process.env.NODE_ENV === 'production';
        // Force secure false for local HTTP dev to allow cookie setting at all
        // But for cross-site iframe, we REALLY need https.
        // For now, let's try 'lax' which might work if not strictly cross-site, or just allow the token to be returned for localStorage.
        const isSecure = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https');

        cookies.set('token', token, {
            httpOnly: true,
            sameSite: isSecure ? 'none' : 'lax',
            secure: isSecure,
            expires: expireDate
        });

        return res.status(200).json({ success: true, user: decoded });

    } catch (error) {
        console.error('Set-Token Error:', error);
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}
