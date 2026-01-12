import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import jwt from 'jsonwebtoken';
import User from '../../../../database/models/user';
import connection from '../../../../database/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state, error } = req.query;

  if (error) {
    console.error('Google Auth Error:', error);
    return res.redirect('/login?error=google_auth_failed');
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    await connection.sync();

    // 1. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to retrieve access token from Google');
    }

    // ---------------------------------------------------------
    // FLOW A: CONNECT ACCOUNT (Authenticated User adding GSC)
    // ---------------------------------------------------------
    if (state === 'connect_flow') {
      const cookies = new Cookies(req, res);
      const connectingUserId = cookies.get('oauth_connecting_user');

      if (!connectingUserId) {
        return res.redirect('/login?error=session_expired');
      }

      const user = await User.findByPk(parseInt(connectingUserId));
      if (!user) {
        return res.redirect('/login?error=user_not_found');
      }

      // Calculate expiry
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + (tokens.expires_in || 3599));

      // Update User with GSC Tokens
      await user.update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token, // Only strictly present if prompt=consent was used
        google_token_expiry: expiryDate,
      });

      // Clean up cookie
      cookies.set('oauth_connecting_user', '', { maxAge: 0 });

      // Redirect to Settings page
      return res.redirect('/settings?success=google_connected');
    }

    // ---------------------------------------------------------
    // FLOW B: LOGIN / REGISTER (New or Existing User)
    // ---------------------------------------------------------
    if (state === 'login_flow') {
      // Get User Info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const googleUser = await userResponse.json();

      if (!googleUser.email) {
        throw new Error('Google User Email not found');
      }

      // Find or Create User
      let user = await User.findOne({ where: { email: googleUser.email } });

      if (!user) {
        // Register new user
        user = await User.create({
          email: googleUser.email,
          name: googleUser.name || 'Google User',
          password: '', // No password for Google users
          subscription_plan: 'free',
          is_active: true,
          scraper_type: 'scrapingrobot', // Default
        });
      }

      // Login the user (Create JWT)
      if (process.env.SECRET) {
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            name: user.name,
          },
          process.env.SECRET,
          { expiresIn: '24h' }
        );

        const cookies = new Cookies(req, res);
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 24);
        cookies.set('token', token, {
          httpOnly: true,
          sameSite: 'lax',
          expires: expireDate
        });

        await user.update({ last_login: new Date() });

        return res.redirect('/domains');
      }
    }

    return res.redirect('/login?error=unknown_state');

  } catch (err) {
    console.error('Callback Error:', err);
    return res.redirect('/login?error=callback_failed');
  }
}
