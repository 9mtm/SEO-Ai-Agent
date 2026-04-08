'use strict';

/**
 * Workspaces — Multi-tenant foundation
 * =====================================
 * Introduces workspaces so a single user can:
 *   - own their personal workspace
 *   - join multiple other workspaces as admin/editor/viewer
 *   - switch the "active" workspace in the UI/API
 *
 * Every resource (domain, keyword, posts, gsc_* tables, etc.) gains a
 * `workspace_id` column. For backward compatibility the `user_id` column
 * stays (it now points to the current owner/creator) — existing queries
 * continue to work until they are migrated.
 *
 * Tables created:
 *   - workspaces                (the tenant)
 *   - workspace_members         (user ↔ workspace with role)
 *   - workspace_invitations     (pending email invites)
 *
 * Columns added:
 *   - users.current_workspace_id          (last selected workspace)
 *   - domain.workspace_id                 (scoped tenant)
 *   - keyword.workspace_id
 *   - posts.workspace_id
 *   - api_keys.workspace_id
 *
 * Backfill:
 *   - Every existing user gets a personal workspace "{name}'s Workspace"
 *   - All their domains/keywords/posts/api_keys are linked to it
 *   - The user is inserted as 'owner' in workspace_members
 *   - users.current_workspace_id = new personal workspace
 */

const crypto = require('crypto');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const t = await queryInterface.sequelize.transaction();
        try {
            // ============================================================
            // 1) workspaces
            // ============================================================
            await queryInterface.createTable(
                'workspaces',
                {
                    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                    name: { type: Sequelize.STRING(191), allowNull: false },
                    slug: { type: Sequelize.STRING(191), allowNull: false, unique: true },
                    owner_user_id: {
                        type: Sequelize.INTEGER,
                        allowNull: false,
                        references: { model: 'users', key: 'id' },
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE'
                    },
                    plan: { type: Sequelize.STRING(50), defaultValue: 'free' },
                    logo_url: { type: Sequelize.STRING(500), allowNull: true },
                    is_personal: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
                    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
                    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
                },
                { transaction: t }
            );
            await queryInterface.addIndex('workspaces', ['owner_user_id'], { name: 'idx_ws_owner', transaction: t });

            // ============================================================
            // 2) workspace_members
            // ============================================================
            await queryInterface.createTable(
                'workspace_members',
                {
                    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                    workspace_id: {
                        type: Sequelize.INTEGER,
                        allowNull: false,
                        references: { model: 'workspaces', key: 'id' },
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE'
                    },
                    user_id: {
                        type: Sequelize.INTEGER,
                        allowNull: false,
                        references: { model: 'users', key: 'id' },
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE'
                    },
                    role: {
                        type: Sequelize.ENUM('owner', 'admin', 'editor', 'viewer'),
                        allowNull: false,
                        defaultValue: 'viewer'
                    },
                    status: {
                        type: Sequelize.ENUM('active', 'suspended'),
                        allowNull: false,
                        defaultValue: 'active'
                    },
                    joined_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
                },
                { transaction: t }
            );
            await queryInterface.addIndex('workspace_members', {
                fields: ['workspace_id', 'user_id'],
                unique: true,
                name: 'uniq_ws_member',
                transaction: t
            });
            await queryInterface.addIndex('workspace_members', ['user_id'], { name: 'idx_wsm_user', transaction: t });

            // ============================================================
            // 3) workspace_invitations
            // ============================================================
            await queryInterface.createTable(
                'workspace_invitations',
                {
                    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                    workspace_id: {
                        type: Sequelize.INTEGER,
                        allowNull: false,
                        references: { model: 'workspaces', key: 'id' },
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE'
                    },
                    invited_by_user_id: {
                        type: Sequelize.INTEGER,
                        allowNull: false,
                        references: { model: 'users', key: 'id' },
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE'
                    },
                    email: { type: Sequelize.STRING(255), allowNull: false },
                    role: {
                        type: Sequelize.ENUM('admin', 'editor', 'viewer'),
                        allowNull: false,
                        defaultValue: 'viewer'
                    },
                    token: { type: Sequelize.STRING(64), allowNull: false, unique: true },
                    status: {
                        type: Sequelize.ENUM('pending', 'accepted', 'revoked', 'expired'),
                        defaultValue: 'pending',
                        allowNull: false
                    },
                    expires_at: { type: Sequelize.DATE, allowNull: false },
                    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
                    accepted_at: { type: Sequelize.DATE, allowNull: true }
                },
                { transaction: t }
            );
            await queryInterface.addIndex('workspace_invitations', ['workspace_id', 'email'], {
                name: 'idx_wi_ws_email',
                transaction: t
            });
            await queryInterface.addIndex('workspace_invitations', ['email', 'status'], {
                name: 'idx_wi_email_status',
                transaction: t
            });

            // ============================================================
            // 4) users.current_workspace_id
            // ============================================================
            const usersCols = await queryInterface.describeTable('users');
            if (!usersCols.current_workspace_id) {
                await queryInterface.addColumn(
                    'users',
                    'current_workspace_id',
                    { type: Sequelize.INTEGER, allowNull: true },
                    { transaction: t }
                );
            }

            // ============================================================
            // 5) Add workspace_id to resource tables
            // ============================================================
            const addWorkspaceIdIfMissing = async (table, keyColName = 'ID') => {
                const cols = await queryInterface.describeTable(table);
                if (!cols.workspace_id) {
                    await queryInterface.addColumn(
                        table,
                        'workspace_id',
                        { type: Sequelize.INTEGER, allowNull: true },
                        { transaction: t }
                    );
                }
                try {
                    await queryInterface.addIndex(table, ['workspace_id'], {
                        name: `idx_${table}_workspace`,
                        transaction: t
                    });
                } catch (e) { /* already exists */ }
            };

            await addWorkspaceIdIfMissing('domain');
            await addWorkspaceIdIfMissing('keyword');
            await addWorkspaceIdIfMissing('posts', 'id');
            await addWorkspaceIdIfMissing('api_keys', 'id');

            // ============================================================
            // 6) Backfill: personal workspace per user
            // ============================================================
            const [users] = await queryInterface.sequelize.query(
                'SELECT id, name, email FROM users',
                { transaction: t }
            );

            const slugify = (s) =>
                String(s || '')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                    .slice(0, 50) || 'user';

            for (const u of users) {
                const base = slugify(u.name || u.email || `user-${u.id}`);
                const slug = `${base}-${u.id}`;
                const wsName = (u.name ? `${u.name}'s Workspace` : 'My Workspace');

                // Insert workspace
                await queryInterface.sequelize.query(
                    `INSERT INTO workspaces (name, slug, owner_user_id, is_personal, createdAt, updatedAt)
                     VALUES (?, ?, ?, 1, NOW(), NOW())`,
                    { replacements: [wsName, slug, u.id], transaction: t }
                );

                // Get its ID
                const [[wsRow]] = await queryInterface.sequelize.query(
                    'SELECT id FROM workspaces WHERE slug = ?',
                    { replacements: [slug], transaction: t }
                );
                const wsId = wsRow.id;

                // Owner member row
                await queryInterface.sequelize.query(
                    `INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at)
                     VALUES (?, ?, 'owner', 'active', NOW())`,
                    { replacements: [wsId, u.id], transaction: t }
                );

                // Set as current workspace
                await queryInterface.sequelize.query(
                    `UPDATE users SET current_workspace_id = ? WHERE id = ?`,
                    { replacements: [wsId, u.id], transaction: t }
                );

                // Backfill resources
                await queryInterface.sequelize.query(
                    `UPDATE domain SET workspace_id = ? WHERE user_id = ? AND workspace_id IS NULL`,
                    { replacements: [wsId, u.id], transaction: t }
                );
                await queryInterface.sequelize.query(
                    `UPDATE keyword SET workspace_id = ? WHERE user_id = ? AND workspace_id IS NULL`,
                    { replacements: [wsId, u.id], transaction: t }
                );
                await queryInterface.sequelize.query(
                    `UPDATE posts p
                     JOIN domain d ON d.ID = p.domain_id
                     SET p.workspace_id = ?
                     WHERE d.user_id = ? AND p.workspace_id IS NULL`,
                    { replacements: [wsId, u.id], transaction: t }
                );
                await queryInterface.sequelize.query(
                    `UPDATE api_keys SET workspace_id = ? WHERE user_id = ? AND workspace_id IS NULL`,
                    { replacements: [wsId, u.id], transaction: t }
                );
            }

            // Add FKs now that the column is populated
            try {
                await queryInterface.addConstraint('domain', {
                    fields: ['workspace_id'],
                    type: 'foreign key',
                    name: 'fk_domain_workspace',
                    references: { table: 'workspaces', field: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE',
                    transaction: t
                });
            } catch (e) { }
            try {
                await queryInterface.addConstraint('keyword', {
                    fields: ['workspace_id'],
                    type: 'foreign key',
                    name: 'fk_keyword_workspace',
                    references: { table: 'workspaces', field: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE',
                    transaction: t
                });
            } catch (e) { }
            try {
                await queryInterface.addConstraint('posts', {
                    fields: ['workspace_id'],
                    type: 'foreign key',
                    name: 'fk_posts_workspace',
                    references: { table: 'workspaces', field: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE',
                    transaction: t
                });
            } catch (e) { }
            try {
                await queryInterface.addConstraint('api_keys', {
                    fields: ['workspace_id'],
                    type: 'foreign key',
                    name: 'fk_api_keys_workspace',
                    references: { table: 'workspaces', field: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE',
                    transaction: t
                });
            } catch (e) { }

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    },

    down: async (queryInterface, Sequelize) => {
        const t = await queryInterface.sequelize.transaction();
        try {
            for (const table of ['domain', 'keyword', 'posts', 'api_keys']) {
                try { await queryInterface.removeConstraint(table, `fk_${table}_workspace`, { transaction: t }); } catch (e) { }
                try { await queryInterface.removeIndex(table, `idx_${table}_workspace`, { transaction: t }); } catch (e) { }
                try { await queryInterface.removeColumn(table, 'workspace_id', { transaction: t }); } catch (e) { }
            }
            try { await queryInterface.removeColumn('users', 'current_workspace_id', { transaction: t }); } catch (e) { }

            await queryInterface.dropTable('workspace_invitations', { transaction: t });
            await queryInterface.dropTable('workspace_members', { transaction: t });
            await queryInterface.dropTable('workspaces', { transaction: t });

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
};
