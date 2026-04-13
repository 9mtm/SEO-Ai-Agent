import path from 'path';
import Invoice from '../../database/models/invoice';
import { sendMail } from '../mailer';

const LOGO_URL = 'https://cdn.flowxtra.net/landingpage/logo_assest/dpro_logo.png';

function formatMoney(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2).replace('.', ',');
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

/**
 * Build the invoice email HTML.
 */
function buildInvoiceEmailHtml(invoice: Invoice): string {
    const currency = invoice.currency || 'EUR';
    const planLabel = invoice.plan_name
        ? `SEO AI Agent — ${invoice.plan_name.charAt(0).toUpperCase() + invoice.plan_name.slice(1)} Plan`
        : 'SEO AI Agent Subscription';

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 40px 20px; border-bottom: 2px solid #f0f0f0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <img src="${LOGO_URL}" alt="Dpro" width="40" height="40" style="display: block;" />
                                        <span style="font-size: 20px; font-weight: 700; color: #1a1a2e; display: block; margin-top: 8px;">Dpro GmbH</span>
                                    </td>
                                    <td align="right" style="vertical-align: top;">
                                        <span style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Invoice</span><br/>
                                        <span style="font-size: 18px; font-weight: 700; color: #1a1a2e;">${invoice.invoice_number}</span><br/>
                                        <span style="font-size: 13px; color: #666;">${formatDate(invoice.invoice_date)}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 30px 40px 10px;">
                            <p style="margin: 0; font-size: 15px; color: #333;">
                                Sehr geehrte Damen und Herren,
                            </p>
                            <p style="margin: 12px 0 0; font-size: 14px; color: #555; line-height: 1.6;">
                                vielen Dank f&uuml;r Ihren Auftrag! Anbei finden Sie Ihre Rechnung <strong>${invoice.invoice_number}</strong> als PDF-Datei.
                            </p>
                        </td>
                    </tr>

                    <!-- Invoice Summary -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fb; border-radius: 8px; border: 1px solid #e8eaed;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="font-size: 13px; color: #666; padding: 4px 0;">Beschreibung</td>
                                                <td align="right" style="font-size: 13px; font-weight: 600; color: #333;">${planLabel}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; color: #666; padding: 4px 0;">Nettobetrag</td>
                                                <td align="right" style="font-size: 13px; color: #333;">${formatMoney(invoice.amount_net)} ${currency}</td>
                                            </tr>
                                            ${Number(invoice.tax_rate) > 0 ? `
                                            <tr>
                                                <td style="font-size: 13px; color: #666; padding: 4px 0;">${invoice.tax_text || 'USt. ' + invoice.tax_rate + '%'}</td>
                                                <td align="right" style="font-size: 13px; color: #333;">${formatMoney(invoice.tax_amount)} ${currency}</td>
                                            </tr>
                                            ` : `
                                            <tr>
                                                <td style="font-size: 13px; color: #666; padding: 4px 0;">${invoice.tax_text || 'Steuer'}</td>
                                                <td align="right" style="font-size: 13px; color: #999;">0,00 ${currency}</td>
                                            </tr>
                                            `}
                                            <tr>
                                                <td colspan="2" style="border-top: 1px solid #ddd; padding-top: 8px; margin-top: 4px;"></td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 15px; font-weight: 700; color: #1a1a2e; padding: 4px 0;">Gesamtbetrag</td>
                                                <td align="right" style="font-size: 15px; font-weight: 700; color: #1a1a2e;">${formatMoney(invoice.amount_gross)} ${currency}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Note -->
                    <tr>
                        <td style="padding: 10px 40px 30px;">
                            <p style="margin: 0; font-size: 13px; color: #888; line-height: 1.5;">
                                Die Rechnung ist als PDF-Datei an diese E-Mail angeh&auml;ngt. Sie k&ouml;nnen Ihre Rechnungen auch jederzeit in Ihrem
                                <a href="https://seo-agent.net/profile/billing" style="color: #2563eb; text-decoration: none;">Kundenportal</a> einsehen und herunterladen.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px; background: #f8f9fb; border-top: 1px solid #e8eaed;">
                            <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
                                Mit freundlichen Gr&uuml;&szlig;en,<br/>
                                <strong style="color: #666;">Dpro GmbH</strong> &middot; Wipplingerstra&szlig;e 20/18 &middot; 1010 Wien<br/>
                                rechnung@dpro.at &middot; www.dpro.at
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Send the invoice email with PDF attachment.
 */
export async function sendInvoiceEmail(invoice: Invoice): Promise<void> {
    const recipientEmail = invoice.customer_email;
    if (!recipientEmail) {
        console.warn(`No email for invoice ${invoice.invoice_number}, skipping email send.`);
        return;
    }

    const html = buildInvoiceEmailHtml(invoice);
    const subject = `Rechnung ${invoice.invoice_number} — SEO AI Agent`;

    const textContent = [
        `Rechnung ${invoice.invoice_number}`,
        `Datum: ${formatDate(invoice.invoice_date)}`,
        `Betrag: ${formatMoney(invoice.amount_gross)} ${invoice.currency}`,
        '',
        'Die Rechnung ist als PDF-Datei an diese E-Mail angehängt.',
        '',
        'Mit freundlichen Grüßen,',
        'Dpro GmbH',
    ].join('\n');

    // Build attachments
    const attachments: { filename: string; path?: string }[] = [];
    if (invoice.pdf_path) {
        const pdfAbsPath = path.join(process.cwd(), 'public', invoice.pdf_path);
        attachments.push({
            filename: `${invoice.invoice_number}.pdf`,
            path: pdfAbsPath,
        });
    }

    await sendMail({
        to: recipientEmail,
        subject,
        html,
        text: textContent,
        attachments,
    });

    console.log(`Invoice email sent to ${recipientEmail} for ${invoice.invoice_number}`);
}
