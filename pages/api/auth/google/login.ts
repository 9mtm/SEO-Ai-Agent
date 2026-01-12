import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
        return res.status(500).json({ error: 'Google Client ID or Redirect URI is missing in environment variables.' });
    }

    // Login Scopes (Email, Profile)
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
    ];

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '', // Make sure this matches env
        response_type: 'code',
        scope: scopes.join(' '),
        access_type: 'online', // No need for refresh token for just login, unless we want to keep user info updated
        prompt: 'select_account',
        state: 'login_flow' // To distinguish from 'connect_flow' in callback
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    res.redirect(authUrl);
}
