import type { NextApiRequest, NextApiResponse } from 'next';
import { sendMail } from '../../utils/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, email, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required.' });
    if (message.length > 500) return res.status(400).json({ error: 'Message too long (max 500 chars).' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email address.' });

    try {
        await sendMail({
            to: process.env.SMTP_FROM_EMAIL || 'no-reply@seo-agent.net',
            subject: `[Contact] ${name} — ${email}`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;">
                    <h2 style="color:#1e293b;">New Contact Message</h2>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr><td style="padding:8px;font-weight:bold;color:#475569;">Name</td><td style="padding:8px;">${name}</td></tr>
                        <tr><td style="padding:8px;font-weight:bold;color:#475569;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
                    </table>
                    <div style="margin-top:16px;padding:16px;background:#f1f5f9;border-radius:8px;">
                        <p style="white-space:pre-wrap;color:#334155;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                    </div>
                    <p style="margin-top:16px;font-size:12px;color:#94a3b8;">Sent from seo-agent.net contact form</p>
                </div>
            `,
            text: `Contact from ${name} (${email}):\n\n${message}`,
            replyTo: email
        });
        return res.status(200).json({ ok: true });
    } catch (err: any) {
        console.error('[Contact] Email failed:', err?.message);
        return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
    }
}
