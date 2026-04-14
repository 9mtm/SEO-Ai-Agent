import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';
import Domain from '../../../database/models/domain';
import Keyword from '../../../database/models/keyword';
import Post from '../../../database/models/post';
import Workspace from '../../../database/models/workspace';
import WorkspaceMember from '../../../database/models/workspace_member';
import WorkspaceInvitation from '../../../database/models/workspace_invitation';
import InvoiceDetail from '../../../database/models/invoiceDetail';
import ApiKey from '../../../database/models/apiKey';
import NotificationSetting from '../../../database/models/notificationSetting';
import Referral from '../../../database/models/referral';
import ReferralPayout from '../../../database/models/referralPayout';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });
    const admin: any = await User.findByPk(auth.userId);
    if (!admin?.is_super_admin) return res.status(403).json({ error: 'Forbidden' });

    if (req.method === 'GET') {
        const search = req.query.search ? `%${req.query.search}%` : '%';
        const [rows]: any = await db.query(
            `SELECT u.id, u.email, u.name, u.picture, u.subscription_plan, u.is_active, u.is_super_admin,
                    u.last_login, u.createdAt,
                    (SELECT COUNT(*) FROM domain WHERE user_id=u.id) as domain_count,
                    (SELECT COUNT(*) FROM keyword WHERE user_id=u.id) as keyword_count
             FROM users u WHERE u.email LIKE ? OR u.name LIKE ? ORDER BY u.id DESC LIMIT 100`,
            { replacements: [search, search] }
        );
        return res.status(200).json({ users: rows });
    }

    if (req.method === 'PATCH') {
        const { id, subscription_plan, is_active } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        const updates: any = {};
        if (subscription_plan !== undefined) updates.subscription_plan = subscription_plan;
        if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;
        await User.update(updates, { where: { id } });
        return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
        const id = parseInt(req.query.id as string);
        if (!id) return res.status(400).json({ error: 'id required' });

        // Prevent self-deletion
        if (id === auth.userId) return res.status(400).json({ error: 'Cannot delete yourself' });

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Delete everything related to this user
        const t = await db.transaction();
        try {
            // Get all domains owned by user
            const domains = await Domain.findAll({ where: { user_id: id }, transaction: t });
            const domainIds = domains.map((d: any) => d.ID || d.id);

            // Delete keywords for user's domains
            if (domainIds.length > 0) {
                await Keyword.destroy({ where: { domain_id: domainIds }, transaction: t });
                await Post.destroy({ where: { domain_id: domainIds }, transaction: t });
            }

            // Delete domains
            await Domain.destroy({ where: { user_id: id }, transaction: t });

            // Delete search analytics
            await db.query('DELETE FROM search_analytics WHERE domain_id IN (SELECT ID FROM domain WHERE user_id = ?)', { replacements: [id], transaction: t });

            // Delete workspaces owned by user + their members/invitations
            const ownedWorkspaces = await Workspace.findAll({ where: { owner_user_id: id }, transaction: t });
            const wsIds = ownedWorkspaces.map((w: any) => w.id);
            if (wsIds.length > 0) {
                await WorkspaceMember.destroy({ where: { workspace_id: wsIds }, transaction: t });
                await WorkspaceInvitation.destroy({ where: { workspace_id: wsIds }, transaction: t });
                await Workspace.destroy({ where: { owner_user_id: id }, transaction: t });
            }

            // Remove user from other workspaces
            await WorkspaceMember.destroy({ where: { user_id: id }, transaction: t });

            // Delete referrals & payouts
            await Referral.destroy({ where: { referrer_id: id }, transaction: t });
            await Referral.destroy({ where: { referred_id: id }, transaction: t });
            await ReferralPayout.destroy({ where: { user_id: id }, transaction: t });

            // Delete other user data
            await InvoiceDetail.destroy({ where: { user_id: id }, transaction: t });
            await ApiKey.destroy({ where: { user_id: id }, transaction: t });
            await NotificationSetting.destroy({ where: { user_id: id }, transaction: t });

            // Delete invoices
            await db.query('DELETE FROM invoices WHERE user_id = ?', { replacements: [id], transaction: t });

            // Finally delete the user
            await user.destroy({ transaction: t });

            await t.commit();
            console.log(`[Admin] User ${id} (${user.email}) and all data permanently deleted by admin ${auth.userId}`);
            return res.status(200).json({ ok: true, message: `User ${user.email} and all associated data deleted` });
        } catch (err: any) {
            await t.rollback();
            console.error('[Admin] Delete user failed:', err);
            return res.status(500).json({ error: 'Failed to delete user' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
