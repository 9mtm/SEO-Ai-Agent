import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import User from '../../../../database/models/user';
import connection from '../../../../database/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('[Bing Callback] Auth Error:', error, error_description);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile/search-console?error=bing_auth_failed`
    );
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const redirectUri = process.env.MICROSOFT_REDIRECT_URI
    || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`;

  try {
    await connection.sync();

    // 1. Exchange code for tokens at Bing Webmaster OAuth endpoint
    const tokenResponse = await fetch(
      'https://www.bing.com/webmasters/oauth/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.BING_OAUTH_CLIENT_ID || '',
          client_secret: process.env.BING_OAUTH_CLIENT_SECRET || '',
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      }
    );

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error('[Bing Callback] Token exchange failed:', tokens);
      throw new Error('Failed to retrieve access token from Bing');
    }

    // 2. Get connecting user from cookie
    const cookies = new Cookies(req, res);
    const connectingUserId = cookies.get('oauth_connecting_microsoft');

    if (!connectingUserId) {
      return res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/search-console?error=session_expired`
      );
    }

    const user = await User.findByPk(parseInt(connectingUserId));
    if (!user) {
      return res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/search-console?error=user_not_found`
      );
    }

    // 3. Save tokens to user
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + (tokens.expires_in || 3599));

    await user.update({
      microsoft_access_token: tokens.access_token,
      microsoft_refresh_token: tokens.refresh_token,
      microsoft_token_expiry: expiryDate,
    });

    // 4. Clean up cookie and redirect
    cookies.set('oauth_connecting_microsoft', '', { maxAge: 0 });

    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile/search-console?success=bing_connected`
    );
  } catch (err) {
    console.error('[Bing Callback] Error:', err);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile/search-console?error=bing_callback_failed`
    );
  }
}
