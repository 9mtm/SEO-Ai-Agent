import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import PlatformIntegration from '../../../database/models/platformIntegration';
import PlatformIntegrationLog from '../../../database/models/platformIntegrationLog';
import verifyUser from '../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { integration_id } = req.query;
    if (!integration_id) return res.status(400).json({ error: 'Missing integration_id' });

    await db.sync();

    // Verify ownership
    const integration = await PlatformIntegration.findOne({
        where: { id: integration_id, user_id: auth.userId }
    });

    if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
    }

    // Fetch logs
    const logs = await PlatformIntegrationLog.findAll({
        where: { integration_id },
        order: [['created_at', 'DESC']],
        limit: 50
    });

    return res.status(200).json({ success: true, logs });
}
