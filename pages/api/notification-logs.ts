import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import NotificationLog from '../../database/models/notificationLog';
import verifyUser from '../../utils/verifyUser';

type NotificationLogsResponse = {
    logs?: any[];
    stats?: {
        total: number;
        success: number;
        failed: number;
        pending: number;
        lastSent?: Date;
    };
    error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();

    const verifyResult = verifyUser(req, res);
    if (!verifyResult.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        return getNotificationLogs(req, res, verifyResult.userId);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

const getNotificationLogs = async (
    req: NextApiRequest,
    res: NextApiResponse<NotificationLogsResponse>,
    userId?: number
) => {
    try {
        const { domain, limit = '50', status, type } = req.query;

        // Build query filters
        const where: any = {};

        if (userId) {
            where.user_id = userId;
        }

        if (domain) {
            where.domain = domain;
        }

        if (status) {
            where.status = status;
        }

        if (type) {
            where.notification_type = type;
        }

        // Get logs
        const logs = await NotificationLog.findAll({
            where,
            limit: parseInt(limit as string, 10),
            order: [['sent_at', 'DESC']],
        });

        // Get statistics
        const statsWhere = userId ? { user_id: userId } : {};

        const [total, success, failed, pending] = await Promise.all([
            NotificationLog.count({ where: statsWhere }),
            NotificationLog.count({ where: { ...statsWhere, status: 'success' } }),
            NotificationLog.count({ where: { ...statsWhere, status: 'failed' } }),
            NotificationLog.count({ where: { ...statsWhere, status: 'pending' } }),
        ]);

        const lastLog = await NotificationLog.findOne({
            where: { ...statsWhere, status: 'success' },
            order: [['sent_at', 'DESC']],
        });

        return res.status(200).json({
            logs: logs.map(log => log.get({ plain: true })),
            stats: {
                total,
                success,
                failed,
                pending,
                lastSent: lastLog?.sent_at,
            },
        });
    } catch (error) {
        console.error('[ERROR] Getting notification logs:', error);
        return res.status(500).json({ error: 'Error fetching notification logs' });
    }
};
