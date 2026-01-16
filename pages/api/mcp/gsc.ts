import type { NextApiResponse } from 'next';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Domain from '../../../database/models/domain';
import { fetchDomainSCData, getSearchConsoleApiInfo } from '../../../utils/searchConsole';
import connection from '../../../database/database';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    // Initialize database connection
    await connection.sync();
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
            where: { ID: domain_id, user_id: auth.userId }
        });

        if (!domain) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        // Get domain object as plain object
        const domainObj: DomainType = domain.get({ plain: true });

        // Get Search Console API info (supports both OAuth and Service Account)
        const scDomainAPI = await getSearchConsoleApiInfo(domainObj);

        // Check for OAuth connection (same as frontend)
        const { hasGoogleConnection } = await import('../../../utils/googleOAuth');
        const isConnected = domainObj.user_id ? await hasGoogleConnection(domainObj.user_id) : false;

        if (!isConnected && !(scDomainAPI.client_email && scDomainAPI.private_key)) {
            return res.status(400).json({
                error: 'Google Search Console not connected',
                message: 'Please connect your Google account in settings or configure service account credentials'
            });
        }

        // Fetch GSC data using the same method as frontend
        const gscData = await fetchDomainSCData(domainObj, scDomainAPI);

        await logApiAction(
            auth.apiKeyId,
            'get_gsc_data',
            `domain_${domain_id}`,
            true,
            { domain_id },
            undefined,
            req
        );

        return res.status(200).json({
            domain: {
                ID: domainObj.ID,
                domain: domainObj.domain,
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
