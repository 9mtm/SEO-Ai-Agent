import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import verifyUser from '../../../../utils/verifyUser';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { authorized, userId } = verifyUser(req, res);

    if (!authorized || !userId) {
        // Must be logged in to connect account
        // But if they are just logging in, they use login.ts
        return res.status(401).redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: 'Google Client ID is missing.' });
    }

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    // Connect Scopes (Search Console, Ads)
    const scopes = [
        'https://www.googleapis.com/auth/webmasters', // Full access (not readonly)
        'https://www.googleapis.com/auth/adwords',
        // We also need email usually to verify it matches (optional, but good practice)
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    // Save userId in cookie to know who is connecting when callback returns
    const cookies = new Cookies(req, res);
    cookies.set('oauth_connecting_user', userId.toString(), {
        httpOnly: true,
        maxAge: 10 * 60 * 1000 // 10 minutes 
    });

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes.join(' '),
        access_type: 'offline', // Crucial for Refresh Token
        prompt: 'consent', // Crucial for getting Refresh Token every time
        state: 'connect_flow'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    res.redirect(authUrl);
}
