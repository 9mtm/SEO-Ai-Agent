import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import Domain from '../../../database/models/domain';
import { getWorkspaceContext } from '../../../utils/workspaceContext';
import { ensureBingDomainSynced, readBingInsightData } from '../../../services/bingStorage';
import db from '../../../database/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const { authorized, userId } = verifyUser(req, res);
  if (!authorized || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const siteUrl = req.query.siteUrl as string;
  const days = parseInt(req.query.days as string) || 30;
  if (!siteUrl) {
    return res.status(400).json({ error: 'siteUrl query parameter is required' });
  }

  try {
    await db.sync();

    // Find the domain
    const ctx = await getWorkspaceContext(req, res);
    const domainName = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const domain: any = await Domain.findOne({
      where: ctx ? { workspace_id: ctx.workspaceId, domain: domainName } : { domain: domainName },
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Sync Bing data (smart: cooldown + incremental)
    await ensureBingDomainSynced(domain.get({ plain: true }), userId, { source: 'web' });

    // Read cached data
    const data = await readBingInsightData(domain.ID, days);

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[Bing Stats] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
