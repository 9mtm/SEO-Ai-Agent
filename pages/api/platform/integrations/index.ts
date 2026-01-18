
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../database/database';
import PlatformIntegration from '../../../../database/models/platformIntegration';
import PlatformIntegrationLog from '../../../../database/models/platformIntegrationLog';
import verifyUser from '../../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = auth.userId;
    await db.sync();

    if (req.method === 'GET') {
        try {
            const integrations = await PlatformIntegration.findAll({
                where: { user_id: userId },
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json({ success: true, integrations });
        } catch (error) {
            console.error('Error fetching integrations:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, message: 'ID required' });

        try {
            const integration = await PlatformIntegration.findOne({
                where: { id, user_id: userId }
            });

            if (!integration) {
                return res.status(404).json({ success: false, message: 'Integration not found' });
            }

            // Revoke by setting is_active to false
            // Note: If you want to allow re-connection, you might want a 'revoked_at' field in future phase.
            // For now, is_active=false is sufficient as per Model.
            integration.is_active = false;
            await integration.save();

            // Log revocation
            try {
                await PlatformIntegrationLog.create({
                    integration_id: integration.id,
                    action: 'revoke',
                    status: 'success',
                    ip_address: req.socket.remoteAddress || 'unknown',
                    details: { revoked_by: userId }
                });
            } catch (logError) {
                console.error('Failed to create audit log:', logError);
                // Non-blocking error
            }

            return res.status(200).json({ success: true, message: 'Integration revoked' });
        } catch (error) {
            console.error('Error revoking integration:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
