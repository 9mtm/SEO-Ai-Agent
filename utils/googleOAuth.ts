import User from '../database/models/user';

/**
 * Refreshes the Google Access Token using the Refresh Token.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<string>} - The new access token.
 */
export const refreshGoogleToken = async (userId: number): Promise<string> => {
  const user = await User.findByPk(userId);

  if (!user || !user.google_refresh_token) {
    throw new Error('No refresh token found for this user.');
  }

  const params = new URLSearchParams();
  params.append('client_id', process.env.GOOGLE_CLIENT_ID || '');
  params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET || '');
  params.append('refresh_token', user.google_refresh_token);
  params.append('grant_type', 'refresh_token');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const tokens = await response.json();

  if (!response.ok) {
    if (tokens.error === 'invalid_grant') {
      // Token revoked or expired permanently
      await user.update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expiry: null
      });
      throw new Error('Google access has been revoked. Please reconnect your account.');
    }
    throw new Error(`Failed to refresh token: ${tokens.error_description || tokens.error}`);
  }

  const expiryDate = new Date();
  expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

  await user.update({
    google_access_token: tokens.access_token,
    google_token_expiry: expiryDate,
  });

  return tokens.access_token;
};

/**
 * Retrieves a valid Google Access Token for the user. 
 * Automatically refreshes it if expired.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<string|null>} - The valid access token or null if not connected.
 */
export const getValidGoogleToken = async (userId: number): Promise<string | null> => {
  const user = await User.findByPk(userId);

  if (!user || !user.google_access_token) {
    return null;
  }

  const now = new Date();
  // Add 5 minutes buffer
  const bufferTime = 5 * 60 * 1000;
  const expiryTime = user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : 0;

  if (now.getTime() + bufferTime >= expiryTime) {
    try {
      return await refreshGoogleToken(userId);
    } catch (error) {
      console.error('[GoogleOAuth] Failed to refresh token:', error);
      return null;
    }
  }

  return user.google_access_token;
};

/**
 * Revokes the Google Access Token and cleans up user record.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<boolean>} - True if successful.
 */
export const revokeGoogleToken = async (userId: number): Promise<boolean> => {
  const user = await User.findByPk(userId);

  if (!user || !user.google_access_token) {
    return false;
  }

  // Revoke token with Google
  await fetch(`https://oauth2.googleapis.com/revoke?token=${user.google_access_token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  await user.update({
    google_access_token: null,
    google_refresh_token: null,
    google_token_expiry: null,
    google_ads_account_id: null,
    google_ads_customer_id: null,
  });

  return true;
};

/**
 * Checks if the user has a linked Google Account.
 * @param {number} userId 
 * @returns {Promise<boolean>}
 */
export const hasGoogleConnection = async (userId: number): Promise<boolean> => {
  const user = await User.findByPk(userId);
  return !!(user && user.google_access_token);
};
