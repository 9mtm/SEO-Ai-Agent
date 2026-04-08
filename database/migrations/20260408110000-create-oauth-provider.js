'use strict';

/**
 * OAuth 2.0 Provider Tables
 * ==========================
 * Lets external companies "Sign in with SEO AI Agent" using the standard
 * Authorization Code Flow with PKCE.
 *
 * Tables:
 *   - oauth_clients               (registered third-party apps)
 *   - oauth_authorization_codes   (short-lived codes from /authorize)
 *   - oauth_access_tokens         (bearer tokens — sha256 hashed)
 *   - oauth_refresh_tokens        (long-lived refresh tokens — sha256 hashed)
 *   - oauth_consents              (user-granted scopes per client, for "skip prompt")
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const t = await queryInterface.sequelize.transaction();
        try {
            // ============================================================
            // 1) oauth_clients
            // ============================================================
            await queryInterface.createTable('oauth_clients', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                client_id: { type: Sequelize.STRING(64), allowNull: false, unique: true },
                client_secret_hash: { type: Sequelize.STRING(128), allowNull: false },
                name: { type: Sequelize.STRING(191), allowNull: false },
                description: { type: Sequelize.TEXT, allowNull: true },
                logo_url: { type: Sequelize.STRING(500), allowNull: true },
                website_url: { type: Sequelize.STRING(500), allowNull: true },
                redirect_uris: { type: Sequelize.TEXT, allowNull: false }, // JSON array of allowed URIs
                allowed_scopes: { type: Sequelize.TEXT, allowNull: false }, // JSON array
                /** owner: who registered this client (a user in our system) */
                owner_user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                /** Confidential clients can use client_secret; public ones must use PKCE */
                client_type: {
                    type: Sequelize.ENUM('confidential', 'public'),
                    allowNull: false,
                    defaultValue: 'confidential'
                },
                is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
                createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
                updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
            }, { transaction: t });

            await queryInterface.addIndex('oauth_clients', ['owner_user_id'], { name: 'idx_oc_owner', transaction: t });

            // ============================================================
            // 2) oauth_authorization_codes
            // ============================================================
            await queryInterface.createTable('oauth_authorization_codes', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                code_hash: { type: Sequelize.STRING(128), allowNull: false, unique: true },
                client_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'oauth_clients', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                workspace_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'workspaces', key: 'id' },
                    onDelete: 'SET NULL',
                    onUpdate: 'CASCADE'
                },
                redirect_uri: { type: Sequelize.STRING(500), allowNull: false },
                scopes: { type: Sequelize.TEXT, allowNull: false }, // JSON array
                code_challenge: { type: Sequelize.STRING(255), allowNull: true },
                code_challenge_method: { type: Sequelize.STRING(10), allowNull: true },
                expires_at: { type: Sequelize.DATE, allowNull: false },
                used_at: { type: Sequelize.DATE, allowNull: true },
                createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
            }, { transaction: t });

            // ============================================================
            // 3) oauth_access_tokens
            // ============================================================
            await queryInterface.createTable('oauth_access_tokens', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                token_hash: { type: Sequelize.STRING(128), allowNull: false, unique: true },
                client_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'oauth_clients', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                workspace_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'workspaces', key: 'id' },
                    onDelete: 'SET NULL',
                    onUpdate: 'CASCADE'
                },
                scopes: { type: Sequelize.TEXT, allowNull: false }, // JSON array
                expires_at: { type: Sequelize.DATE, allowNull: false },
                revoked: { type: Sequelize.BOOLEAN, defaultValue: false },
                last_used_at: { type: Sequelize.DATE, allowNull: true },
                createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
            }, { transaction: t });

            await queryInterface.addIndex('oauth_access_tokens', ['user_id'], { name: 'idx_oat_user', transaction: t });
            await queryInterface.addIndex('oauth_access_tokens', ['client_id'], { name: 'idx_oat_client', transaction: t });

            // ============================================================
            // 4) oauth_refresh_tokens
            // ============================================================
            await queryInterface.createTable('oauth_refresh_tokens', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                token_hash: { type: Sequelize.STRING(128), allowNull: false, unique: true },
                access_token_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'oauth_access_tokens', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                client_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'oauth_clients', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                expires_at: { type: Sequelize.DATE, allowNull: false },
                revoked: { type: Sequelize.BOOLEAN, defaultValue: false },
                createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
            }, { transaction: t });

            // ============================================================
            // 5) oauth_consents
            // ============================================================
            await queryInterface.createTable('oauth_consents', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                client_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'oauth_clients', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                scopes: { type: Sequelize.TEXT, allowNull: false },
                granted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
            }, { transaction: t });

            await queryInterface.addIndex('oauth_consents', {
                fields: ['user_id', 'client_id'],
                unique: true,
                name: 'uniq_consent_user_client',
                transaction: t
            });

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    },

    down: async (queryInterface) => {
        const t = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.dropTable('oauth_consents', { transaction: t });
            await queryInterface.dropTable('oauth_refresh_tokens', { transaction: t });
            await queryInterface.dropTable('oauth_access_tokens', { transaction: t });
            await queryInterface.dropTable('oauth_authorization_codes', { transaction: t });
            await queryInterface.dropTable('oauth_clients', { transaction: t });
            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
};
