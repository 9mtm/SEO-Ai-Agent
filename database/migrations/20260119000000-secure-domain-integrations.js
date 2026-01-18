'use strict';

const crypto = require('crypto');

// Encryption helper (same as ApiKey model uses)
const ENCRYPTION_KEY = process.env.SECRET || 'default-secret-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Add new encrypted fields
        await queryInterface.addColumn('domain', 'wordpress_url', {
            type: Sequelize.STRING(255),
            allowNull: true,
        });

        await queryInterface.addColumn('domain', 'wordpress_username', {
            type: Sequelize.STRING(100),
            allowNull: true,
        });

        await queryInterface.addColumn('domain', 'wordpress_app_password_encrypted', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        await queryInterface.addColumn('domain', 'gsc_refresh_token_encrypted', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        await queryInterface.addColumn('domain', 'gsc_scope', {
            type: Sequelize.STRING(255),
            allowNull: true,
        });

        await queryInterface.addColumn('domain', 'gsc_last_sync', {
            type: Sequelize.DATE,
            allowNull: true,
        });

        // 2. Migrate existing data from JSON to structured fields
        const [domains] = await queryInterface.sequelize.query(
            'SELECT ID, integration_settings, gsc_refresh_token FROM domain WHERE integration_settings IS NOT NULL OR gsc_refresh_token IS NOT NULL'
        );

        for (const domain of domains) {
            const updates = {};

            // Migrate WordPress settings from JSON
            if (domain.integration_settings) {
                try {
                    const settings = typeof domain.integration_settings === 'string'
                        ? JSON.parse(domain.integration_settings)
                        : domain.integration_settings;

                    if (settings && settings.type === 'wordpress') {
                        updates.wordpress_url = settings.url || null;
                        updates.wordpress_username = settings.username || null;

                        // Encrypt app_password
                        if (settings.app_password) {
                            updates.wordpress_app_password_encrypted = encrypt(settings.app_password);
                        }
                    }
                } catch (e) {
                    console.error(`Error migrating integration_settings for domain ${domain.ID}:`, e.message);
                }
            }

            // Migrate GSC refresh token (encrypt it)
            if (domain.gsc_refresh_token) {
                updates.gsc_refresh_token_encrypted = encrypt(domain.gsc_refresh_token);
                updates.gsc_scope = 'https://www.googleapis.com/auth/webmasters.readonly'; // Default scope
            }

            // Update the domain if we have any updates
            if (Object.keys(updates).length > 0) {
                const setClause = Object.keys(updates)
                    .map(key => `${key} = ?`)
                    .join(', ');
                const values = [...Object.values(updates), domain.ID];

                await queryInterface.sequelize.query(
                    `UPDATE domain SET ${setClause} WHERE ID = ?`,
                    { replacements: values }
                );
            }
        }

        console.log(`✓ Migrated ${domains.length} domains with integration settings`);

        // 3. Remove old plaintext columns (commented out for safety - uncomment after verification)
        // await queryInterface.removeColumn('domain', 'integration_settings');
        // await queryInterface.removeColumn('domain', 'gsc_refresh_token');

        console.log('⚠️  Old columns NOT removed yet. Verify migration first, then uncomment removal in migration file.');
    },

    async down(queryInterface, Sequelize) {
        // Restore old columns
        await queryInterface.addColumn('domain', 'integration_settings', {
            type: Sequelize.JSON,
            allowNull: true,
        });

        await queryInterface.addColumn('domain', 'gsc_refresh_token', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        // Remove new columns
        await queryInterface.removeColumn('domain', 'wordpress_url');
        await queryInterface.removeColumn('domain', 'wordpress_username');
        await queryInterface.removeColumn('domain', 'wordpress_app_password_encrypted');
        await queryInterface.removeColumn('domain', 'gsc_refresh_token_encrypted');
        await queryInterface.removeColumn('domain', 'gsc_scope');
        await queryInterface.removeColumn('domain', 'gsc_last_sync');
    }
};
