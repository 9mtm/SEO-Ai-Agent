import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import User from '../../database/models/user';
import NotificationSetting from '../../database/models/notificationSetting';
import Keyword from '../../database/models/keyword';
import NotificationLog from '../../database/models/notificationLog';
import nodeMailer from 'nodemailer';
import generateEmail from '../../utils/generateEmail';
import parseKeywords from '../../utils/parseKeywords';
import { getAppSettings } from './settings';

type BatchNotifyResponse = {
    success?: boolean;
    sent?: number;
    failed?: number;
    remaining?: number;
    error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        await db.sync();
        return batchNotify(req, res);
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
}

const batchNotify = async (req: NextApiRequest, res: NextApiResponse<BatchNotifyResponse>) => {
    try {
        // Configuration from environment or request
        const BATCH_SIZE = parseInt(process.env.NOTIFICATION_BATCH_SIZE || '10', 10);
        const NOTIFICATION_INTERVAL_DAYS = 30; // Monthly = 30 days

        const settings = await getAppSettings();
        const { smtp_server = '', smtp_port = '' } = settings;

        if (!smtp_server || !smtp_port) {
            return res.status(400).json({ success: false, error: 'SMTP not configured' });
        }

        // Get all domains that need notifications
        const allDomains = await Domain.findAll({
            where: {
                notification: true, // Only domains with notifications enabled
            },
        });

        if (!allDomains || allDomains.length === 0) {
            return res.status(200).json({
                success: true,
                sent: 0,
                failed: 0,
                remaining: 0
            });
        }

        // Calculate cutoff date (30 days ago for monthly)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - NOTIFICATION_INTERVAL_DAYS);

        // Find domains that haven't received notification in the last 30 days
        const domainsNeedingNotification = [];

        for (const domain of allDomains) {
            const lastNotification = await NotificationLog.findOne({
                where: {
                    domain: domain.domain,
                    status: 'success',
                    sent_at: {
                        [Op.gte]: cutoffDate,
                    },
                },
                order: [['sent_at', 'DESC']],
            });

            // If no notification in last 30 days, add to queue
            if (!lastNotification) {
                domainsNeedingNotification.push(domain);
            }
        }

        // Take only BATCH_SIZE domains for this run
        const domainsToProcess = domainsNeedingNotification.slice(0, BATCH_SIZE);
        const remaining = domainsNeedingNotification.length - domainsToProcess.length;

        let sentCount = 0;
        let failedCount = 0;

        // Process batch
        for (const domain of domainsToProcess) {
            try {
                await sendNotificationEmail(domain, settings);
                sentCount++;

                // Small delay between emails to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 20000));
            } catch (error) {
                console.error(`[ERROR] Failed to send notification for ${domain.domain}:`, error);
                failedCount++;
            }
        }

        console.log(`[BATCH NOTIFY] Sent: ${sentCount}, Failed: ${failedCount}, Remaining: ${remaining}`);

        return res.status(200).json({
            success: true,
            sent: sentCount,
            failed: failedCount,
            remaining,
        });

    } catch (error) {
        console.error('[ERROR] Batch notification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error processing batch notifications'
        });
    }
};

const sendNotificationEmail = async (domain: Domain, settings: SettingsType) => {
    // Prioritize environment variables for SMTP settings
    const smtp_server = process.env.SMTP_HOST || settings.smtp_server || '';
    const smtp_port = process.env.SMTP_PORT || settings.smtp_port || '';
    const smtp_username = process.env.SMTP_USERNAME || settings.smtp_username || '';
    const smtp_password = process.env.SMTP_PASSWORD || settings.smtp_password || '';
    const notification_email_from = process.env.SMTP_FROM_EMAIL || settings.notification_email_from || '';
    const notification_email_from_name = process.env.SMTP_FROM_NAME || settings.notification_email_from_name || 'SEO AI Agent';
    const smtp_encryption = process.env.SMTP_ENCRYPTION || 'tls';

    const { notification_email = '', notification_interval = 'monthly' } = settings;

    // Ensure notification type is valid for DB enum (daily, weekly, monthly)
    const validTypes = ['daily', 'weekly', 'monthly'];
    const logType = validTypes.includes(notification_interval) ? notification_interval : 'monthly';

    const fromEmail = `${notification_email_from_name} <${notification_email_from || 'no-reply@seo-ai-agent.com'}>`;
    const mailerSettings: any = {
        host: smtp_server,
        port: parseInt(smtp_port, 10),
        secure: smtp_encryption === 'ssl',
    };

    if (smtp_username || smtp_password) {
        mailerSettings.auth = {};
        if (smtp_username) mailerSettings.auth.user = smtp_username;
        if (smtp_password) mailerSettings.auth.pass = smtp_password;
    }

    const transporter = nodeMailer.createTransport(mailerSettings);
    const domainName = domain.domain;
    const query = { where: { domain: domainName } };
    const domainKeywords: Keyword[] = await Keyword.findAll(query);
    const keywordsArray = domainKeywords.map((el) => el.get({ plain: true }));
    const keywords: KeywordType[] = parseKeywords(keywordsArray);

    const userId = domain.user_id || null;

    // Default to 'en' for now, pass userId for unsubscribe link
    const emailHTML = await generateEmail(domainName, keywords, settings, 'en', userId);

    let recipientEmail = domain.notification_emails || notification_email;

    // Fetch user specific notification email if not set on domain level
    if (!domain.notification_emails && userId) {
        try {
            const notifSettings = await NotificationSetting.findOne({ where: { user_id: userId } });
            if (notifSettings?.notification_email) {
                recipientEmail = notifSettings.notification_email;
            } else {
                const user = await User.findByPk(userId);
                if (user?.email) {
                    recipientEmail = user.email;
                }
            }
        } catch (err) {
            console.error('Error fetching user notification settings', err);
        }
    }

    try {
        // Send email
        await transporter.sendMail({
            from: fromEmail,
            to: recipientEmail,
            subject: `[${domainName}] Monthly Keyword Positions Update`,
            html: emailHTML,
        });

        // Log successful notification
        await NotificationLog.create({
            user_id: userId,
            domain: domainName,
            notification_email: recipientEmail,
            notification_type: logType as 'daily' | 'weekly' | 'monthly',
            sent_at: new Date(),
            status: 'success',
            keywords_count: keywords.length,
            error_message: null,
        });

        console.log(`[SUCCESS] Notification sent for ${domainName} to ${recipientEmail}`);
    } catch (err: any) {
        // Log failed notification
        await NotificationLog.create({
            user_id: userId,
            domain: domainName,
            notification_email: recipientEmail,
            notification_type: logType as 'daily' | 'weekly' | 'monthly',
            sent_at: new Date(),
            status: 'failed',
            keywords_count: keywords.length,
            error_message: err?.message || err?.response || JSON.stringify(err),
        });

        throw err; // Re-throw to be caught by batch processor
    }
};
