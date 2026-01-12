import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import verifyUser from '../../../../utils/verifyUser';

/**
 * Google OAuth Authorization Endpoint
 * Redirects user to Google's OAuth consent screen
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { authorized, userId } = verifyUser(req, res);

  if (!authorized || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Save userId in temporary cookie for callback
  const cookies = new Cookies(req, res);
  cookies.set('oauth_connecting_user', userId.toString(), {
    httpOnly: true,
    maxAge: 600000, // 10 minutes
    sameSite: 'lax',
  });

  // Build Google OAuth URL
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/webmasters', // Search Console (Full Access)
      'https://www.googleapis.com/auth/adwords', // Google Ads
    ].join(' '),
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent to get refresh token
    state: 'connect_flow', // Indicate this is a connection flow, not login
  })}`;

  res.redirect(authUrl);
}
