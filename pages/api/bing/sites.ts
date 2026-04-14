import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import { getBingSites } from '../../../services/bingWebmaster';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const { authorized, userId } = verifyUser(req, res);
  if (!authorized || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sites = await getBingSites(userId);
    return res.status(200).json({ sites });
  } catch (error: any) {
    console.error('[Bing Sites] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
