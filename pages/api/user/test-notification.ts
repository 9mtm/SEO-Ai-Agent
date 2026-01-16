import { NextApiRequest, NextApiResponse } from 'next';
import Domain from '../../../database/models/domain';
import User from '../../../database/models/user';
import NotificationSetting from '../../../database/models/notificationSetting';
import Keyword from '../../../database/models/keyword';
import NotificationLog from '../../../database/models/notificationLog';
import nodeMailer from 'nodemailer';
import generateEmail from '../../../utils/generateEmail';
import parseKeywords from '../../../utils/parseKeywords';
import { getAppSettings } from '../settings';
import verifyUser from '../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = verifyUser(req, res);
    if (!auth.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { slug } = req.body;

    if (!slug) {
        return res.status(400).json({ error: 'Slug is required' });
    }

    try {
        const domain = await Domain.findOne({ where: { slug: slug, user_id: auth.userId } });
        if (!domain) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        const settings = await getAppSettings(auth.userId);
        await sendNotificationEmail(domain, settings);

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Test notification error:', error);
        return res.status(500).json({ error: error.message || 'Failed to send test email' });
    }
}

const sendNotificationEmail = async (domain: Domain, settings: any) => {
    // Prioritize environment variables for SMTP settings
    const smtp_server = process.env.SMTP_HOST || settings.smtp_server || '';
    const smtp_port = process.env.SMTP_PORT || settings.smtp_port || '';
    const smtp_username = process.env.SMTP_USERNAME || settings.smtp_username || '';
    const smtp_password = process.env.SMTP_PASSWORD || settings.smtp_password || '';
    const notification_email_from = process.env.SMTP_FROM_EMAIL || settings.notification_email_from || '';
    const notification_email_from_name = process.env.SMTP_FROM_NAME || settings.notification_email_from_name || 'SEO AI Agent';
    const smtp_encryption = process.env.SMTP_ENCRYPTION || 'tls';

    const { notification_email = '', notification_interval = 'monthly' } = settings;

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
    const domainKeywords = await Keyword.findAll(query);
    const keywordsArray = domainKeywords.map((el) => el.get({ plain: true }));
    const keywords = parseKeywords(keywordsArray);
    // Default to 'en' for now, can be fetched from user settings later
    const emailHTML = await generateEmail(domainName, keywords, settings, 'en');

    const userId = domain.user_id || null;
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

    console.log(`[TEST EMAIL] Domain: ${domainName}`);
    console.log(`[TEST EMAIL] Sending to Recipient: ${recipientEmail}`);

    // Send email
    await transporter.sendMail({
        from: fromEmail,
        to: recipientEmail,
        subject: `${domainName} Keyword Positions Update`,
        html: emailHTML,
    });

    // Log successful notification
    await NotificationLog.create({
        user_id: userId,
        domain: domainName,
        notification_email: recipientEmail,
        notification_type: notification_interval as 'daily' | 'weekly' | 'monthly',
        sent_at: new Date(),
        status: 'success',
        keywords_count: keywords.length,
        error_message: 'TEST_MANUAL_SEND',
    });

    console.log(`[TEST EMAIL] SUCCESS! Email sent to ${recipientEmail}`);
};
