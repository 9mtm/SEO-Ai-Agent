/**
 * Shared SMTP transport + send helper
 * ------------------------------------
 * Single place that reads SMTP settings from env (same variables the
 * existing notify/batch-notify APIs already use) and returns a ready
 * nodemailer transport. All system-generated emails should use this
 * so we don't re-implement SMTP boilerplate in every API route.
 */
import nodeMailer from 'nodemailer';

export interface MailAttachment {
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
}

export interface SendMailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    attachments?: MailAttachment[];
}

export async function sendMail(opts: SendMailOptions) {
    const host = process.env.SMTP_HOST || '';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USERNAME || '';
    const pass = process.env.SMTP_PASSWORD || '';
    const fromEmail = process.env.SMTP_FROM_EMAIL || user;
    const fromName = process.env.SMTP_FROM_NAME || 'SEO AI Agent';
    const encryption = (process.env.SMTP_ENCRYPTION || 'tls').toLowerCase();

    if (!host || !user || !pass) {
        throw new Error('SMTP not configured (missing SMTP_HOST / SMTP_USERNAME / SMTP_PASSWORD)');
    }

    const transporter = nodeMailer.createTransport({
        host,
        port,
        secure: encryption === 'ssl' || port === 465,
        auth: { user, pass }
    } as any);

    const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        replyTo: opts.replyTo,
        attachments: opts.attachments,
    });

    return info;
}
