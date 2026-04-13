import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import Invoice from '../database/models/invoice';
import InvoiceDetail from '../database/models/invoiceDetail';
import User from '../database/models/user';
import { sendInvoiceEmail } from '../utils/emails/invoiceEmail';

// --- Company Info ---
const COMPANY = {
    name: 'Dpro GmbH',
    addressLine: 'Wipplingerstraße 20/18',
    zip: '1010',
    city: 'Wien',
    country: 'Österreich',
    vatId: 'ATU79aborad', // Update with real USt-IdNr if different
    email: 'rechnung@dpro.at',
    website: 'www.dpro.at',
    contactPerson: 'Mohamed Alarade',
};

// EU country codes (excluding AT which gets 20% VAT)
const EU_COUNTRIES = [
    'germany', 'de', 'france', 'fr', 'italy', 'it', 'spain', 'es',
    'netherlands', 'nl', 'belgium', 'be', 'luxembourg', 'lu', 'ireland', 'ie',
    'portugal', 'pt', 'greece', 'gr', 'finland', 'fi', 'sweden', 'se',
    'denmark', 'dk', 'poland', 'pl', 'czech republic', 'cz', 'czechia',
    'romania', 'ro', 'hungary', 'hu', 'bulgaria', 'bg', 'croatia', 'hr',
    'slovakia', 'sk', 'slovenia', 'si', 'lithuania', 'lt', 'latvia', 'lv',
    'estonia', 'ee', 'cyprus', 'cy', 'malta', 'mt',
];

const AUSTRIA_KEYS = ['austria', 'at', 'österreich', 'osterreich'];

/**
 * Determine tax rate based on customer country and VAT ID.
 * - Austria => 20% USt.
 * - EU + valid VAT ID => 0% Reverse Charge
 * - Non-EU => 0% tax-free export
 */
export function determineTax(country?: string | null, vatId?: string | null): { rate: number; text: string } {
    const c = (country || '').trim().toLowerCase();

    if (!c || AUSTRIA_KEYS.includes(c)) {
        return { rate: 20, text: 'zzgl. Umsatzsteuer 20%' };
    }

    if (EU_COUNTRIES.includes(c)) {
        if (vatId && vatId.trim().length > 4) {
            return { rate: 0, text: 'Reverse Charge §13b UStG' };
        }
        // EU individual without VAT => still 20% (simplified, B2C)
        return { rate: 20, text: 'zzgl. Umsatzsteuer 20%' };
    }

    // Non-EU
    return { rate: 0, text: 'Steuerfreie Ausfuhrlieferung' };
}

/**
 * Generate the next sequential invoice number: SEO{YY}-{NNNN}
 */
export async function getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2); // e.g. "26"
    const prefix = `SEO${year}-`;

    const latest = await Invoice.findOne({
        where: {},
        order: [['id', 'DESC']],
    });

    let seq = 1;
    if (latest?.invoice_number?.startsWith(prefix)) {
        const numPart = parseInt(latest.invoice_number.replace(prefix, ''), 10);
        if (!isNaN(numPart)) seq = numPart + 1;
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
}

// Plan display names
const PLAN_LABELS: Record<string, string> = {
    basic: 'SEO AI Agent — Basic Plan (Yearly)',
    pro: 'SEO AI Agent — Pro Plan (Yearly)',
    premium: 'SEO AI Agent — Premium Plan (Yearly)',
};

interface CreateInvoiceParams {
    userId: number;
    workspaceId?: number | null;
    amountNet: number;
    currency?: string;
    planId: string;
    billingInterval?: string;
    stripeInvoiceId?: string | null;
    stripePaymentIntentId?: string | null;
    stripeSubscriptionId?: string | null;
}

/**
 * Create an invoice record and generate the PDF.
 */
export async function createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
    const user = await User.findByPk(params.userId, { include: [InvoiceDetail] });
    if (!user) throw new Error(`User ${params.userId} not found`);

    const details = (user as any).invoice_profile || (user as any).InvoiceDetail;

    const tax = determineTax(details?.country, details?.vat_id);
    const amountNet = params.amountNet;
    const taxAmount = Math.round(amountNet * tax.rate) / 100;
    const amountGross = amountNet + taxAmount;
    const invoiceNumber = await getNextInvoiceNumber();

    const invoice = await Invoice.create({
        user_id: params.userId,
        workspace_id: params.workspaceId || null,
        invoice_number: invoiceNumber,
        stripe_invoice_id: params.stripeInvoiceId || null,
        stripe_payment_intent_id: params.stripePaymentIntentId || null,
        stripe_subscription_id: params.stripeSubscriptionId || null,
        amount_net: amountNet,
        tax_rate: tax.rate,
        tax_amount: taxAmount,
        amount_gross: amountGross,
        currency: params.currency || 'EUR',
        plan_name: params.planId,
        billing_interval: params.billingInterval || 'year',
        customer_type: details?.type || 'company',
        customer_name: details?.name || user.name,
        customer_email: details?.email || user.email,
        customer_address: details?.address || null,
        customer_city: details?.city || null,
        customer_zip: details?.zip || null,
        customer_country: details?.country || null,
        customer_vat_id: details?.vat_id || null,
        tax_text: tax.text,
        status: 'paid',
        invoice_date: new Date().toISOString().split('T')[0],
    });

    // Generate PDF
    const pdfRelPath = await generateInvoicePdf(invoice);
    invoice.pdf_path = pdfRelPath;
    await invoice.save();

    // Send invoice email with PDF attachment
    try {
        await sendInvoiceEmail(invoice);
    } catch (emailErr) {
        console.error(`Failed to send invoice email for ${invoice.invoice_number}:`, emailErr);
    }

    return invoice;
}

/**
 * Generate a PDF invoice matching the Dpro GmbH design.
 */
export async function generateInvoicePdf(invoice: Invoice): Promise<string> {
    const invoicesDir = path.join(process.cwd(), 'public', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const fileName = `${invoice.invoice_number}.pdf`;
    const filePath = path.join(invoicesDir, fileName);
    const relativePath = `/invoices/${fileName}`;

    const logoPath = path.join(process.cwd(), 'public', 'dpro_logo.png');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const marginLeft = 50;
    const marginRight = 50;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // --- Header: Logo top-right ---
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, pageWidth - marginRight - 80, 30, { width: 80 });
    }

    // Company name next to logo
    doc.fontSize(16).font('Helvetica-Bold')
        .fillColor('#333333')
        .text('Dpro', pageWidth - marginRight - 80 - 60, 55, { width: 60, align: 'right' });

    // --- Sender line (small, above recipient) ---
    doc.fontSize(7).font('Helvetica')
        .fillColor('#666666')
        .text(`${COMPANY.name} · ${COMPANY.addressLine} · ${COMPANY.zip} ${COMPANY.city}`, marginLeft, 120);

    // --- Recipient address block ---
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    let recipientY = 140;

    if (invoice.customer_name) {
        doc.text(invoice.customer_name, marginLeft, recipientY);
        recipientY += 14;
    }
    if (invoice.customer_address) {
        doc.text(invoice.customer_address, marginLeft, recipientY);
        recipientY += 14;
    }
    if (invoice.customer_zip || invoice.customer_city) {
        doc.text(`${invoice.customer_zip || ''} ${invoice.customer_city || ''}`.trim(), marginLeft, recipientY);
        recipientY += 14;
    }
    if (invoice.customer_country) {
        doc.text(invoice.customer_country, marginLeft, recipientY);
        recipientY += 14;
    }

    // --- Invoice info block (right side) ---
    const infoX = 350;
    const labelX = infoX;
    const valueX = pageWidth - marginRight;
    let infoY = 140;

    const drawInfoRow = (label: string, value: string) => {
        doc.fontSize(9).font('Helvetica').fillColor('#666666')
            .text(label, labelX, infoY, { width: 100 });
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
            .text(value, labelX + 100, infoY, { width: valueX - labelX - 100, align: 'right' });
        infoY += 16;
    };

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
        .text('Rechnungs-Nr.', labelX, infoY, { width: 100 });
    doc.fontSize(12).font('Helvetica-Bold')
        .text(invoice.invoice_number, labelX + 100, infoY, { width: valueX - labelX - 100, align: 'right' });
    infoY += 20;

    drawInfoRow('Rechnungsdatum', formatDate(invoice.invoice_date));
    drawInfoRow('Lieferdatum', formatDate(invoice.invoice_date));

    if (invoice.customer_vat_id) {
        drawInfoRow('Ihre USt-Id.', invoice.customer_vat_id);
    }
    drawInfoRow('Ihr Ansprechpartner', COMPANY.contactPerson);

    // --- Invoice title ---
    const titleY = Math.max(recipientY + 30, infoY + 20);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
        .text(`Invoice no. ${invoice.invoice_number}`, marginLeft, titleY);

    // --- Greeting ---
    doc.fontSize(10).font('Helvetica').fillColor('#333333')
        .text('Sehr geehrte Damen und Herren,', marginLeft, titleY + 25);
    doc.text('vielen Dank für Ihren Auftrag und das damit verbundene Vertrauen!', marginLeft, titleY + 40);
    doc.text('Hiermit stelle ich Ihnen die folgenden Leistungen in Rechnung:', marginLeft, titleY + 54);

    // --- Items table ---
    const tableY = titleY + 80;
    const colPos = marginLeft;
    const colDesc = marginLeft + 35;
    const colQty = marginLeft + contentWidth * 0.55;
    const colUnit = marginLeft + contentWidth * 0.70;
    const colTotal = marginLeft + contentWidth * 0.85;

    // Table header
    doc.rect(marginLeft, tableY, contentWidth, 22).fill('#f5f5f5');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
    doc.text('Pos.', colPos + 5, tableY + 6);
    doc.text('Beschreibung', colDesc, tableY + 6);
    doc.text('Menge', colQty, tableY + 6, { width: 50, align: 'right' });
    doc.text('Einzelpreis', colUnit, tableY + 6, { width: 60, align: 'right' });
    doc.text('Gesamtpreis', colTotal, tableY + 6, { width: 65, align: 'right' });

    // Table row
    const rowY = tableY + 26;
    const planLabel = PLAN_LABELS[invoice.plan_name || ''] || `SEO AI Agent — ${invoice.plan_name || 'Subscription'} (${invoice.billing_interval === 'month' ? 'Monthly' : 'Yearly'})`;
    const currency = invoice.currency === 'EUR' ? 'EUR' : invoice.currency;

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    doc.text('1.', colPos + 5, rowY);
    doc.font('Helvetica-Bold').text(planLabel, colDesc, rowY, { width: colQty - colDesc - 10 });

    const descEndY = rowY + 14;
    doc.font('Helvetica').fontSize(8).fillColor('#555555');

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    doc.text('1,00 Stk', colQty, rowY, { width: 50, align: 'right' });
    doc.text(`${formatMoney(invoice.amount_net)} ${currency}`, colUnit, rowY, { width: 60, align: 'right' });
    doc.text(`${formatMoney(invoice.amount_net)} ${currency}`, colTotal, rowY, { width: 65, align: 'right' });

    // --- Totals ---
    const totalsY = descEndY + 25;
    const totalsLabelX = marginLeft;
    const totalsValueX = colTotal;

    // Net
    doc.rect(marginLeft, totalsY, contentWidth, 20).fill('#f0f7ff');
    doc.fontSize(9).font('Helvetica').fillColor('#333333')
        .text('Gesamtbetrag netto', totalsLabelX + 5, totalsY + 5, { width: contentWidth * 0.7 });
    doc.font('Helvetica-Bold')
        .text(`${formatMoney(invoice.amount_net)} ${currency}`, totalsValueX, totalsY + 5, { width: 65, align: 'right' });

    // Tax
    const taxRowY = totalsY + 22;
    doc.fontSize(9).font('Helvetica').fillColor('#333333')
        .text(invoice.tax_text || `zzgl. Umsatzsteuer ${invoice.tax_rate}%`, totalsLabelX + 5, taxRowY + 3, { width: contentWidth * 0.7 });
    doc.text(`${formatMoney(invoice.tax_amount)} ${currency}`, totalsValueX, taxRowY + 3, { width: 65, align: 'right' });

    // Gross (bold)
    const grossRowY = taxRowY + 22;
    doc.rect(marginLeft, grossRowY, contentWidth, 22).fill('#e8f0fe');
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
        .text('Gesamtbetrag brutto', totalsLabelX + 5, grossRowY + 5, { width: contentWidth * 0.7 });
    doc.text(`${formatMoney(invoice.amount_gross)} ${currency}`, totalsValueX, grossRowY + 5, { width: 65, align: 'right' });

    // --- Payment note ---
    const noteY = grossRowY + 45;
    doc.fontSize(9).font('Helvetica').fillColor('#cc6600')
        .text(
            `Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer ${invoice.invoice_number} auf das unten angegebene Konto. Der Rechnungsbetrag ist innerhalb von 14 Tagen fällig.`,
            marginLeft, noteY, { width: contentWidth }
        );

    // --- Closing ---
    const closeY = noteY + 40;
    doc.fontSize(10).font('Helvetica').fillColor('#333333')
        .text('Mit freundlichen Grüßen,', marginLeft, closeY);
    doc.text(COMPANY.contactPerson, marginLeft, closeY + 14);

    // --- Footer ---
    const footerY = doc.page.height - 70;
    doc.fontSize(7).font('Helvetica').fillColor('#999999');
    doc.text(
        `${COMPANY.name} | ${COMPANY.addressLine}, ${COMPANY.zip} ${COMPANY.city} | ${COMPANY.email} | ${COMPANY.website}`,
        marginLeft, footerY, { width: contentWidth, align: 'center' }
    );

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(relativePath));
        stream.on('error', reject);
    });
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatMoney(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2).replace('.', ',');
}
