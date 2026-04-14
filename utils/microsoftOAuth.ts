import User from '../database/models/user';

// Bing Webmaster Tools has its own OAuth token endpoint
const BING_TOKEN_URL = 'https://www.bing.com/webmasters/oauth/token';

/**
 * Refreshes the Bing Access Token using the Refresh Token.
 * IMPORTANT: Bing refresh tokens are single-use and rotated.
 * After each refresh, we must store the NEW refresh_token.
 */
export const refreshMicrosoftToken = async (userId: number): Promise<string> => {
  const user = await User.findByPk(userId);

  if (!user || !user.microsoft_refresh_token) {
    throw new Error('No Bing refresh token found for this user.');
  }

  const params = new URLSearchParams();
  params.append('client_id', process.env.BING_OAUTH_CLIENT_ID || '');
  params.append('client_secret', process.env.BING_OAUTH_CLIENT_SECRET || '');
  params.append('refresh_token', user.microsoft_refresh_token);
  params.append('grant_type', 'refresh_token');

  const response = await fetch(BING_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const tokens = await response.json();

  if (!response.ok || !tokens.access_token) {
    await user.update({
      microsoft_access_token: null,
      microsoft_refresh_token: null,
      microsoft_token_expiry: null,
    });
    throw new Error('Bing token refresh failed. Please reconnect your account.');
  }

  const expiryDate = new Date();
  expiryDate.setSeconds(expiryDate.getSeconds() + (tokens.expires_in || 3599));

  // MUST store the new refresh_token — Bing rotates them (single-use)
  await user.update({
    microsoft_access_token: tokens.access_token,
    microsoft_refresh_token: tokens.refresh_token,
    microsoft_token_expiry: expiryDate,
  });

  return tokens.access_token;
};

/**
 * Retrieves a valid Bing Access Token for the user.
 * Automatically refreshes it if expired.
 */
export const getValidMicrosoftToken = async (userId: number): Promise<string | null> => {
  const user = await User.findByPk(userId);

  if (!user || !user.microsoft_access_token) {
    return null;
  }

  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  const expiryTime = user.microsoft_token_expiry ? new Date(user.microsoft_token_expiry).getTime() : 0;

  if (now.getTime() + bufferTime >= expiryTime) {
    try {
      return await refreshMicrosoftToken(userId);
    } catch (error) {
      console.error('[BingOAuth] Failed to refresh token:', error);
      return null;
    }
  }

  return user.microsoft_access_token;
};

/**
 * Clears Bing tokens from user record.
 */
export const revokeMicrosoftToken = async (userId: number): Promise<boolean> => {
  const user = await User.findByPk(userId);

  if (!user || !user.microsoft_access_token) {
    return false;
  }

  await user.update({
    microsoft_access_token: null,
    microsoft_refresh_token: null,
    microsoft_token_expiry: null,
  });

  return true;
};

/**
 * Checks if the user has a linked Bing account.
 */
export const hasMicrosoftConnection = async (userId: number): Promise<boolean> => {
  const user = await User.findByPk(userId);
  return !!(user && user.microsoft_access_token);
};
