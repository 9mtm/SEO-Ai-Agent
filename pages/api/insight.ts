import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import verifyUser from '../../utils/verifyUser';
import Domain from '../../database/models/domain';
import { ensureDomainSynced, readInsightData } from '../../services/gscStorage';

type SCInsightRes = {
    data: InsightDataType | null;
    error?: string | null;
    sync?: any;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const verifyResult = verifyUser(req, res);
    if (!verifyResult.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.method === 'GET') {
        return getDomainSearchConsoleInsight(req, res, verifyResult);
    }
    return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getDomainSearchConsoleInsight = async (
    req: NextApiRequest,
    res: NextApiResponse<SCInsightRes>,
    verifyResult: any
) => {
    if (!req.query.domain || typeof req.query.domain !== 'string') {
        return res.status(400).json({ data: null, error: 'Domain is Missing.' });
    }

    const domainname = (req.query.domain as string).replaceAll('-', '.').replaceAll('_', '-');
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    try {
        const foundDomain = await Domain.findOne({ where: { domain: domainname } });
        if (!foundDomain) {
            return res.status(404).json({ data: null, error: 'Domain not found' });
        }

        const domainObj: any = foundDomain.get({ plain: true });

        // Check connection: OAuth OR service account
        const { hasGoogleConnection } = await import('../../utils/googleOAuth');
        const scApi = domainObj.search_console ? JSON.parse(domainObj.search_console) : {};
        const isConnected =
            (domainObj.user_id ? await hasGoogleConnection(domainObj.user_id) : false) ||
            !!(scApi.client_email && scApi.private_key);

        // Smart sync: only fetches from GSC if cooldown expired and we're behind
        let sync: any = null;
        if (isConnected) {
            sync = await ensureDomainSynced(domainObj, {
                source: 'web',
                userId: verifyResult.user?.id || verifyResult.userId
            });
        }

        // Read from DB (always, regardless of whether sync ran just now)
        const insight = await readInsightData(domainObj.ID, days);

        // If there's no data and we're not connected, surface a friendlier error
        if (!isConnected && insight.stats.length === 0) {
            return res.status(200).json({ data: null, error: 'Google Search Console is not Integrated.' });
        }

        return res.status(200).json({ data: insight as any, sync });
    } catch (error: any) {
        console.log('[ERROR] Getting Domain Insight: ', domainname, error);
        return res.status(400).json({ data: null, error: 'Error Fetching Stats from Google Search Console.' });
    }
};
