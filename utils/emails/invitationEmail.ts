/**
 * Workspace invitation email
 * ---------------------------
 * Reuses the same HTML shell as the main notification email (email/email.html)
 * — we just swap the placeholders. This keeps branding, logos, fonts,
 * footer and unsubscribe links 100% consistent across every system email.
 */
import { readFile } from 'fs/promises';
import path from 'path';
import dayjs from 'dayjs';

const LOGO_URL = 'https://cdn.flowxtra.net/landingpage/logo_assest/dpro_logo.png';

export interface InvitationEmailInput {
    inviteeEmail: string;
    inviterName: string;
    workspaceName: string;
    role: 'admin' | 'editor' | 'viewer';
    acceptUrl: string;
    locale?: string;
}

export async function buildInvitationEmail(input: InvitationEmailInput): Promise<{ subject: string; html: string; text: string }> {
    const template = await readFile(path.join(process.cwd(), 'email', 'email.html'), 'utf-8');
    const currentDate = dayjs().format('MMMM D, YYYY');

    const bodyHtml = `
      <div style="padding: 24px 0;">
        <h2 style="font-size: 20px; color: #0f172a; margin: 0 0 12px 0;">
          You're invited to join <strong>${escapeHtml(input.workspaceName)}</strong>
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          <strong>${escapeHtml(input.inviterName)}</strong> has invited you to collaborate on SEO AI Agent as a
          <span style="display:inline-block; background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; padding:2px 8px; border-radius:999px; font-weight:600; text-transform:capitalize; font-size:12px;">${input.role}</span>.
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          Click the button below to accept the invitation and start working together.
        </p>
        <div style="text-align:center; margin: 24px 0;">
          <a href="${input.acceptUrl}" target="_blank"
             style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-weight:600; padding:14px 28px; border-radius:8px; font-size:14px;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0; text-align:center;">
          Or copy this link into your browser:<br />
          <a href="${input.acceptUrl}" style="color:#2563eb; word-break:break-all;">${input.acceptUrl}</a>
        </p>
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 24px 0 0 0; text-align:center;">
          This invitation will expire in 7 days. If you weren't expecting it, you can safely ignore this email.
        </p>
      </div>
    `;

    const logoTag = `<img src="${LOGO_URL}" alt="SEO AI Agent" width="28" height="28" style="vertical-align: middle; border-radius: 6px;" />`;

    // Replace the placeholders from the shared shell. Sections we don't need
    // (keywords table, SC stats, stats badges) are hidden by emptying them.
    const html = template
        .replace(/\{\{preheader\}\}/g, `You've been invited to join ${input.workspaceName} on SEO AI Agent`)
        .replace(/\{\{logo\}\}/g, logoTag)
        .replace(/\{\{currentDate\}\}/g, currentDate)
        .replace(/\{\{domainName\}\}/g, input.workspaceName)
        .replace(/\{\{keywordsCount\}\}/g, '')
        .replace(/\{\{keywordsSuffix\}\}/g, '')
        .replace(/\{\{stat\}\}/g, '')
        .replace(/\{\{TrafficSummary\}\}/g, bodyHtml)
        .replace(/\{\{tableTitle\}\}/g, '')
        .replace(/\{\{colKeyword\}\}/g, '')
        .replace(/\{\{colPosition\}\}/g, '')
        .replace(/\{\{colBest\}\}/g, '')
        .replace(/\{\{colUpdated\}\}/g, '')
        .replace(/\{\{keywordsTable\}\}/g, '')
        .replace(/\{\{SCStatsTable\}\}/g, '')
        .replace(/\{\{dashboardUrl\}\}/g, input.acceptUrl)
        .replace(/\{\{btnConsole\}\}/g, 'Accept Invitation')
        .replace(/\{\{linkPrivacy\}\}/g, 'Privacy Policy')
        .replace(/\{\{linkTerms\}\}/g, 'Terms')
        .replace(/\{\{footerUnsub\}\}/g, 'Did not expect this?')
        .replace(/\{\{unsubscribeUrl\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'https://seo-agent.net'}/login`)
        .replace(/\{\{linkUnsub\}\}/g, 'Ignore');

    const text = `You've been invited to join ${input.workspaceName} on SEO AI Agent.\n\n` +
        `${input.inviterName} has invited you as ${input.role}.\n\n` +
        `Accept the invitation: ${input.acceptUrl}\n\n` +
        `This invitation expires in 7 days.`;

    return {
        subject: `${input.inviterName} invited you to ${input.workspaceName}`,
        html,
        text
    };
}

function escapeHtml(s: string): string {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
