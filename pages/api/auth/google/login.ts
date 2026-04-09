import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: 'Google Client ID is missing in environment variables.' });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    // Debug log (remove after testing)
    console.log('🔍 Login Redirect URI:', redirectUri);
    console.log('🔍 NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

    // Login Scopes (Email, Profile + Search Console read access)
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
        'https://www.googleapis.com/auth/webmasters.readonly'
    ];

    const { returnUrl } = req.query;

    const stateObj = {
        flow: 'login_flow',
        returnUrl: returnUrl ? String(returnUrl) : undefined
    };

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes.join(' '),
        access_type: 'offline', // Need refresh token to keep GSC access
        prompt: 'consent',
        state: JSON.stringify(stateObj) // To distinguish from 'connect_flow' in callback and carry returnUrl
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    res.redirect(authUrl);
}
