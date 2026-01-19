import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import Domain from '../../../database/models/domain';
import User from '../../../database/models/user';
import NotificationSetting from '../../../database/models/notificationSetting';
import verifyUser from '../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync(); // Ensure tables exist
    const auth = verifyUser(req, res);
    if (!auth.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // GET: Fetch current settings
    if (req.method === 'GET') {
        try {
            const settings = await NotificationSetting.findOne({ where: { user_id: auth.userId } });
            const user = await User.findByPk(auth.userId, { attributes: ['email'] });

            return res.status(200).json({
                success: true,
                settings,
                userEmail: user?.email
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            return res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }

    // POST: Update settings
    if (req.method === 'POST') {
        try {
            const {
                emailAlerts,
                weeklyReport,
                marketingEmails,
                securityAlerts,
                notificationEmail,
                domainNotifications
            } = req.body;

            // 1. Update Global Settings
            // Use upsert to handle potential race conditions where checking for existence
            // might return false but a parallel request creates the record.
            await NotificationSetting.upsert({
                user_id: auth.userId,
                email_alerts: emailAlerts,
                weekly_report: weeklyReport,
                marketing_emails: marketingEmails,
                security_alerts: securityAlerts,
                notification_email: notificationEmail
            });

            // 2. Update Domain Notifications
            if (domainNotifications) {
                const updates = Object.keys(domainNotifications).map(slug => {
                    return Domain.update(
                        { notification: domainNotifications[slug] },
                        { where: { slug: slug, user_id: auth.userId } }
                    );
                });
                await Promise.all(updates);
            }

            return res.status(200).json({ success: true, message: 'Notifications updated' });

        } catch (error: any) {
            console.error('Update notifications error:', error);
            return res.status(500).json({ error: 'Failed to update notifications' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
