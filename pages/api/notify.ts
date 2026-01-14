import type { NextApiRequest, NextApiResponse } from 'next';
import nodeMailer from 'nodemailer';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import NotificationLog from '../../database/models/notificationLog';
import generateEmail from '../../utils/generateEmail';
import parseKeywords from '../../utils/parseKeywords';
import { getAppSettings } from './settings';

type NotifyResponse = {
   success?: boolean
   error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method === 'POST') {
      await db.sync();
      return notify(req, res);
   }
   return res.status(401).json({ success: false, error: 'Invalid Method' });
}

const notify = async (req: NextApiRequest, res: NextApiResponse<NotifyResponse>) => {
   const reqDomain = req?.query?.domain as string || '';
   try {
      const settings = await getAppSettings();
      const { smtp_server = '', smtp_port = '', notification_email = '' } = settings;

      if (!smtp_server || !smtp_port || !notification_email) {
         return res.status(401).json({ success: false, error: 'SMTP has not been setup properly!' });
      }

      if (reqDomain) {
         const theDomain = await Domain.findOne({ where: { domain: reqDomain } });
         if (theDomain) {
            await sendNotificationEmail(theDomain, settings);
         }
      } else {
         const allDomains: Domain[] = await Domain.findAll();
         if (allDomains && allDomains.length > 0) {
            const domains = allDomains.map((el) => el.get({ plain: true }));
            for (const domain of domains) {
               if (domain.notification !== false) {
                  await sendNotificationEmail(domain, settings);
               }
            }
         }
      }

      return res.status(200).json({ success: true, error: null });
   } catch (error) {
      console.log(error);
      return res.status(401).json({ success: false, error: 'Error Sending Notification Email.' });
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

   const fromEmail = `${notification_email_from_name} <${notification_email_from || 'no-reply@seo-ai-agent.com'}>`;
   const mailerSettings: any = {
      host: smtp_server,
      port: parseInt(smtp_port, 10),
      secure: smtp_encryption === 'ssl', // true for SSL (port 465), false for TLS
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
   const emailHTML = await generateEmail(domainName, keywords, settings);

   const recipientEmail = domain.notification_emails || notification_email;
   const userId = domain.user_id || null;

   try {
      // Send email
      await transporter.sendMail({
         from: fromEmail,
         to: recipientEmail,
         subject: `[${domainName}] Keyword Positions Update`,
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
         error_message: null,
      });

      console.log(`[SUCCESS] Notification sent for ${domainName} to ${recipientEmail}`);
   } catch (err: any) {
      // Log failed notification
      await NotificationLog.create({
         user_id: userId,
         domain: domainName,
         notification_email: recipientEmail,
         notification_type: notification_interval as 'daily' | 'weekly' | 'monthly',
         sent_at: new Date(),
         status: 'failed',
         keywords_count: keywords.length,
         error_message: err?.message || err?.response || JSON.stringify(err),
      });

      console.log('[ERROR] Sending Notification Email for', domainName, err?.response || err);
   }
};
