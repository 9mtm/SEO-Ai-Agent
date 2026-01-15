import type { NextApiResponse } from 'next';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Domain from '../../../database/models/domain';
import { getGSCData } from '../../../utils/gsc';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    // Validate API Key
    const auth = await validateMcpApiKey(req, res);
    if (!auth.valid || !auth.userId || !auth.apiKeyId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check permission
        if (!hasPermission(auth.permissions || [], 'read:gsc')) {
            await logApiAction(auth.apiKeyId, 'get_gsc_data', 'gsc', false, null, 'Insufficient permissions', req);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { domain_id, start_date, end_date } = req.query;

        if (!domain_id) {
            return res.status(400).json({ error: 'Missing required parameter: domain_id' });
        }

        // Verify domain belongs to user
        const domain = await Domain.findOne({
            where: { id: domain_id, user_id: auth.userId }
        });

        if (!domain) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        // Check if GSC is connected
        if (!domain.gsc_site_url || !domain.gsc_refresh_token) {
            return res.status(400).json({
                error: 'Google Search Console not connected for this domain',
                message: 'Please connect GSC in domain settings first'
            });
        }

        // Calculate date range (default: last 30 days)
        const endDate = end_date ? new Date(end_date as string) : new Date();
        const startDate = start_date
            ? new Date(start_date as string)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Get GSC data
        const gscData = await getGSCData(
            domain.gsc_site_url,
            domain.gsc_refresh_token,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );

        await logApiAction(
            auth.apiKeyId,
            'get_gsc_data',
            `domain_${domain_id}`,
            true,
            { domain_id, start_date: startDate, end_date: endDate },
            undefined,
            req
        );

        return res.status(200).json({
            domain: {
                id: domain.id,
                domain: domain.domain,
                gsc_site_url: domain.gsc_site_url,
            },
            date_range: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
            },
            data: gscData,
        });

    } catch (error: any) {
        console.error('MCP GSC error:', error);
        await logApiAction(auth.apiKeyId, 'get_gsc_data', 'gsc', false, null, error.message, req);
        return res.status(500).json({
            error: 'Failed to fetch GSC data',
            message: error.message
        });
    }
}
