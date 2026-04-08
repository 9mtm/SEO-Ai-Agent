/**
 * ownerOnlyPage
 * --------------
 * getServerSideProps helper that rejects users without management access to
 * the active workspace (anyone who is not `owner` or `admin`) and bounces
 * them to /profile. Use on pages that must only be visible to workspace
 * managers:
 *   - /profile/workspaces
 *   - /profile/team
 *   - /profile/search-console
 *   - /profile/billing
 *   - /profile/scraper
 *
 * Admins have the SAME UI access as owners — their actions are still bounded
 * by the owner's plan limits (domains/keywords count), enforced at the API
 * layer. Billing remains owner-only (admins see it read-only, the checkout
 * APIs reject non-owner attempts automatically via the Stripe metadata).
 *
 * Usage:
 *   export { getServerSideProps } from '../../utils/ownerOnlyPage';
 */
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import db from '../database/database';
import { getWorkspaceContext } from './workspaceContext';

export const getServerSideProps: GetServerSideProps = async (
    ctx: GetServerSidePropsContext
) => {
    // Ensure Sequelize models are attached to the connection before any
    // helper calls User.findByPk / Workspace.findByPk — in getServerSideProps
    // we're in a fresh module context so nothing has triggered db.sync yet.
    try { await db.sync(); } catch { /* ignore */ }

    const { req, res } = ctx;
    const wsCtx = await getWorkspaceContext(req as any, res as any);

    if (!wsCtx) {
        return {
            redirect: { destination: '/login', permanent: false }
        };
    }

    // owner + admin have full management access.
    // editor + viewer cannot reach these pages.
    if (wsCtx.role !== 'owner' && wsCtx.role !== 'admin') {
        return {
            redirect: { destination: '/profile?error=admin_only', permanent: false }
        };
    }

    return { props: {} };
};
