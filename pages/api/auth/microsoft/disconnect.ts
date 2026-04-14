import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../../utils/verifyUser';
import { revokeMicrosoftToken } from '../../../../utils/microsoftOAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { authorized, userId } = verifyUser(req, res);

  if (!authorized || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const success = await revokeMicrosoftToken(userId);

    if (success) {
      return res.status(200).json({ success: true, message: 'Bing account disconnected' });
    } else {
      return res.status(400).json({ error: 'Failed to disconnect Bing account' });
    }
  } catch (error: any) {
    console.error('[Microsoft Disconnect] Error:', error);
    return res.status(500).json({ error: 'An error occurred' });
  }
}
