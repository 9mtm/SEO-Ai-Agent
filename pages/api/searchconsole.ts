import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import verifyUser from '../../utils/verifyUser';
import { ensureDomainSynced, readSCKeywordsData } from '../../services/gscStorage';

type searchConsoleRes = {
    data: any;
    error?: string | null;
    sync?: any;
};

type searchConsoleCRONRes = {
    status: string;
    error?: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const verifyResult = verifyUser(req, res);
    if (!verifyResult.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.method === 'GET') {
        return getDomainSearchConsoleData(req, res, verifyResult);
    }
    if (req.method === 'POST') {
        return manualRefresh(req, res, verifyResult);
    }
    return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getDomainSearchConsoleData = async (
    req: NextApiRequest,
    res: NextApiResponse<searchConsoleRes>,
    verifyResult: any
) => {
    if (!req.query.domain || typeof req.query.domain !== 'string') {
        return res.status(400).json({ data: null, error: 'Domain is Missing.' });
    }
    const domainname = (req.query.domain as string).replaceAll('-', '.').replaceAll('_', '-');

    try {
        const foundDomain: Domain | null = await Domain.findOne({ where: { domain: domainname } });
        if (!foundDomain) {
            return res.status(404).json({ data: null, error: 'Domain not found' });
        }
        const domainObj: any = foundDomain.get({ plain: true });

        const { hasGoogleConnection } = await import('../../utils/googleOAuth');
        const scApi = domainObj.search_console ? JSON.parse(domainObj.search_console) : {};
        const isConnected =
            (domainObj.user_id ? await hasGoogleConnection(domainObj.user_id) : false) ||
            !!(scApi.client_email && scApi.private_key);

        let sync: any = null;
        if (isConnected) {
            sync = await ensureDomainSynced(domainObj, {
                source: 'web',
                userId: verifyResult.user?.id || verifyResult.userId
            });
        }

        const data = await readSCKeywordsData(domainObj.ID, 30);
        if (!isConnected && (!data.thirtyDays || data.thirtyDays.length === 0)) {
            return res.status(200).json({ data: null, error: 'Google Search Console is not Integrated.' });
        }
        return res.status(200).json({ data, sync });
    } catch (error: any) {
        console.error('[ERROR] Getting Search Console Data for: ', domainname, error?.message || error);
        return res.status(400).json({ data: null, error: error?.message || 'Error Fetching Data from Google Search Console.' });
    }
};

/**
 * POST: manual force-refresh for the currently selected domain.
 * Replaces the old CRON-based refresh of ALL domains (which wasted API quota
 * on inactive users). Now sync is driven by user activity only.
 */
const manualRefresh = async (
    req: NextApiRequest,
    res: NextApiResponse<searchConsoleCRONRes>,
    verifyResult: any
) => {
    try {
        const domainname = (req.body?.domain || req.query?.domain || '').toString();
        if (!domainname) return res.status(400).json({ status: 'failed', error: 'Domain required' });

        const foundDomain = await Domain.findOne({ where: { domain: domainname } });
        if (!foundDomain) return res.status(404).json({ status: 'failed', error: 'Domain not found' });

        const domainObj: any = foundDomain.get({ plain: true });
        const result = await ensureDomainSynced(domainObj, {
            source: 'manual',
            userId: verifyResult.user?.id || verifyResult.userId,
            force: true
        });
        return res.status(200).json({ status: result.ok ? 'completed' : 'failed', error: result.error || null });
    } catch (error: any) {
        console.log('[ERROR] Manual Search Console refresh. ', error);
        return res.status(400).json({ status: 'failed', error: error?.message || 'Unknown error' });
    }
};
