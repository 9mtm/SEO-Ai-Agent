import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../../utils/verifyUser';
import { revokeGoogleToken } from '../../../../utils/googleOAuth';

/**
 * Google OAuth Disconnect Endpoint
 * Revokes and removes Google connection
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { authorized, userId } = verifyUser(req, res);

  if (!authorized || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const success = await revokeGoogleToken(userId);

    if (success) {
      return res.status(200).json({ success: true, message: 'Google account disconnected' });
    } else {
      return res.status(400).json({ error: 'Failed to disconnect Google account' });
    }
  } catch (error) {
    console.error('[Google Disconnect] Error:', error);
    return res.status(500).json({ error: 'An error occurred' });
  }
}
