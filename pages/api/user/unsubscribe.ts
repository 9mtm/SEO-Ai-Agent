import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import db from '../../../database/database';
import NotificationSetting from '../../../database/models/notificationSetting';
import User from '../../../database/models/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const secret = process.env.SECRET;
        if (!secret) {
            console.error('SERVER ERROR: SECRET env variable not set');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Verify token
        let decoded: any;
        try {
            decoded = jwt.verify(token, secret);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const { userId, email } = decoded;

        if (!userId) {
            return res.status(400).json({ error: 'Invalid token payload' });
        }

        await db.sync();

        // Find settings
        let settings = await NotificationSetting.findOne({ where: { user_id: userId } });

        if (!settings) {
            // Create default settings if not exists (though user should exist)
            // Or verify user exists first
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            settings = await NotificationSetting.create({
                user_id: userId,
                notification_email: email || user.email,
                email_alerts: false,
                weekly_report: false,
                marketing_emails: false,
                security_alerts: true // Keep security alerts on
            });
        } else {
            // Update settings to unsubscribe
            await settings.update({
                marketing_emails: false,
                weekly_report: false,
                email_alerts: false // Assuming 'Unsubscribe' means stop all optional emails
            });
        }

        return res.status(200).json({ success: true, message: 'Unsubscribed successfully' });

    } catch (error) {
        console.error('Unsubscribe API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
