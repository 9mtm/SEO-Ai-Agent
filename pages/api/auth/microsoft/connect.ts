import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import verifyUser from '../../../../utils/verifyUser';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { authorized, userId } = verifyUser(req, res);

  if (!authorized || !userId) {
    return res.status(401).redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
  }

  if (!process.env.BING_OAUTH_CLIENT_ID) {
    return res.status(500).json({ error: 'Bing OAuth Client ID is missing.' });
  }

  const redirectUri = process.env.MICROSOFT_REDIRECT_URI
    || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`;

  // Save userId in cookie to know who is connecting when callback returns
  const cookies = new Cookies(req, res);
  cookies.set('oauth_connecting_microsoft', userId.toString(), {
    httpOnly: true,
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: process.env.BING_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'Webmaster.read',
    state: 'connect_flow',
  });

  const authUrl = `https://www.bing.com/webmasters/oauth/authorize?${params.toString()}`;

  res.redirect(authUrl);
}
