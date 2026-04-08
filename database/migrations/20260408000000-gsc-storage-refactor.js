'use strict';

/**
 * GSC Storage Refactor
 * ---------------------
 * 1. gsc_daily_stats    — per-domain daily totals (for Insight > Stats chart)
 * 2. gsc_sync_log       — audit of every GSC sync (success/failure, rows, duration)
 * 3. keyword_history    — replaces keyword.history longtext JSON (time-series ranks)
 * 4. competitor_history — per-keyword per-competitor daily rank
 * 5. keyword_search_results — last full SERP (top 100) per keyword
 * 6. user_gsc_sites     — cached list of verified GSC sites for each user
 * 7. Add domain_id FK to keyword (backfill from domain varchar)
 * 8. Add sync tracking columns to domain table
 *
 * NOTE: Non-destructive. Existing `keyword.history` and `domain.search_console_data`
 * columns are KEPT during the transition — new code reads/writes the new tables,
 * old data stays available for rollback. A later migration can drop them once verified.
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const t = await queryInterface.sequelize.transaction();
        try {
            // =====================================================
            // 1) gsc_daily_stats — daily totals per domain
            // =====================================================
            await queryInterface.createTable('gsc_daily_stats', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                domain_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'domain', key: 'ID' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                date: { type: Sequelize.DATEONLY, allowNull: false },
                clicks: { type: Sequelize.INTEGER, defaultValue: 0 },
                impressions: { type: Sequelize.INTEGER, defaultValue: 0 },
                ctr: { type: Sequelize.FLOAT, defaultValue: 0 },
                position: { type: Sequelize.FLOAT, defaultValue: 0 },
                createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
                updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
            }, { transaction: t });

            await queryInterface.addIndex('gsc_daily_stats', {
                fields: ['domain_id', 'date'],
                unique: true,
                name: 'uniq_gsc_daily_domain_date',
                transaction: t
            });

            // =====================================================
            // 2) gsc_sync_log — audit trail
            // =====================================================
            await queryInterface.createTable('gsc_sync_log', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                domain_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'domain', key: 'ID' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'users', key: 'id' },
                    onDelete: 'SET NULL',
                    onUpdate: 'CASCADE'
                },
                trigger_source: {
                    type: Sequelize.ENUM('web', 'api', 'mcp', 'manual', 'system'),
                    allowNull: false,
                    defaultValue: 'web'
                },
                date_from: { type: Sequelize.DATEONLY, allowNull: true },
                date_to: { type: Sequelize.DATEONLY, allowNull: true },
                rows_inserted: { type: Sequelize.INTEGER, defaultValue: 0 },
                rows_updated: { type: Sequelize.INTEGER, defaultValue: 0 },
                status: { type: Sequelize.ENUM('running', 'success', 'failed', 'skipped'), defaultValue: 'running' },
                error_message: { type: Sequelize.TEXT, allowNull: true },
                duration_ms: { type: Sequelize.INTEGER, allowNull: true },
                started_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
                finished_at: { type: Sequelize.DATE, allowNull: true }
            }, { transaction: t });

            await queryInterface.addIndex('gsc_sync_log', {
                fields: ['domain_id', 'started_at'],
                name: 'idx_gsc_sync_domain_time',
                transaction: t
            });
            await queryInterface.addIndex('gsc_sync_log', {
                fields: ['status'],
                name: 'idx_gsc_sync_status',
                transaction: t
            });

            // =====================================================
            // 3) keyword_history — time series ranks
            // =====================================================
            await queryInterface.createTable('keyword_history', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                keyword_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'keyword', key: 'ID' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                date: { type: Sequelize.DATEONLY, allowNull: false },
                position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                url: { type: Sequelize.STRING(500), allowNull: true },
                createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
            }, { transaction: t });

            await queryInterface.addIndex('keyword_history', {
                fields: ['keyword_id', 'date'],
                unique: true,
                name: 'uniq_keyword_history_kw_date',
                transaction: t
            });

            // =====================================================
            // 4) competitor_history
            // =====================================================
            await queryInterface.createTable('competitor_history', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                keyword_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'keyword', key: 'ID' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                competitor_domain: { type: Sequelize.STRING(255), allowNull: false },
                date: { type: Sequelize.DATEONLY, allowNull: false },
                position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                url: { type: Sequelize.STRING(500), allowNull: true },
                createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
            }, { transaction: t });

            await queryInterface.addIndex('competitor_history', {
                fields: ['keyword_id', 'competitor_domain', 'date'],
                unique: true,
                name: 'uniq_competitor_history',
                transaction: t
            });

            // =====================================================
            // 5) keyword_search_results — last full SERP snapshot
            // =====================================================
            await queryInterface.createTable('keyword_search_results', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                keyword_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'keyword', key: 'ID' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                checked_at: { type: Sequelize.DATE, allowNull: false },
                results: { type: Sequelize.JSON, allowNull: false },
                total_results: { type: Sequelize.INTEGER, defaultValue: 0 }
            }, { transaction: t });

            await queryInterface.addIndex('keyword_search_results', {
                fields: ['keyword_id', 'checked_at'],
                name: 'idx_kw_serp_time',
                transaction: t
            });

            // =====================================================
            // 6) user_gsc_sites — cached list of GSC-verified sites
            // =====================================================
            await queryInterface.createTable('user_gsc_sites', {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                site_url: { type: Sequelize.STRING(500), allowNull: false },
                permission_level: { type: Sequelize.STRING(50), allowNull: true },
                verified: { type: Sequelize.BOOLEAN, defaultValue: true },
                last_refreshed: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
            }, { transaction: t });

            await queryInterface.addIndex('user_gsc_sites', {
                fields: ['user_id', 'site_url'],
                unique: true,
                name: 'uniq_user_gsc_site',
                transaction: t
            });

            // =====================================================
            // 7) keyword.domain_id FK
            // =====================================================
            const keywordCols = await queryInterface.describeTable('keyword');
            if (!keywordCols.domain_id) {
                await queryInterface.addColumn('keyword', 'domain_id', {
                    type: Sequelize.INTEGER,
                    allowNull: true
                }, { transaction: t });
            }

            // Backfill keyword.domain_id from keyword.domain varchar
            await queryInterface.sequelize.query(`
                UPDATE keyword k
                JOIN domain d ON d.domain = k.domain AND d.user_id = k.user_id
                SET k.domain_id = d.ID
                WHERE k.domain_id IS NULL
            `, { transaction: t });

            // Add FK + index (skip if already present)
            try {
                await queryInterface.addConstraint('keyword', {
                    fields: ['domain_id'],
                    type: 'foreign key',
                    name: 'fk_keyword_domain_id',
                    references: { table: 'domain', field: 'ID' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE',
                    transaction: t
                });
            } catch (e) { /* already exists */ }

            try {
                await queryInterface.addIndex('keyword', {
                    fields: ['domain_id'],
                    name: 'idx_keyword_domain_id',
                    transaction: t
                });
            } catch (e) { /* already exists */ }

            // =====================================================
            // 8) domain — add sync tracking columns (if missing)
            // =====================================================
            const domainCols = await queryInterface.describeTable('domain');
            if (!domainCols.gsc_last_sync) {
                await queryInterface.addColumn('domain', 'gsc_last_sync', {
                    type: Sequelize.DATE,
                    allowNull: true
                }, { transaction: t });
            }
            if (!domainCols.gsc_sync_in_progress) {
                await queryInterface.addColumn('domain', 'gsc_sync_in_progress', {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                }, { transaction: t });
            }
            if (!domainCols.gsc_last_synced_date) {
                // last date for which we have GSC data (not same as last_sync which is when we ran the job)
                await queryInterface.addColumn('domain', 'gsc_last_synced_date', {
                    type: Sequelize.DATEONLY,
                    allowNull: true
                }, { transaction: t });
            }

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    },

    down: async (queryInterface, Sequelize) => {
        const t = await queryInterface.sequelize.transaction();
        try {
            try { await queryInterface.removeConstraint('keyword', 'fk_keyword_domain_id', { transaction: t }); } catch (e) { }
            try { await queryInterface.removeIndex('keyword', 'idx_keyword_domain_id', { transaction: t }); } catch (e) { }
            try { await queryInterface.removeColumn('keyword', 'domain_id', { transaction: t }); } catch (e) { }

            try { await queryInterface.removeColumn('domain', 'gsc_last_sync', { transaction: t }); } catch (e) { }
            try { await queryInterface.removeColumn('domain', 'gsc_sync_in_progress', { transaction: t }); } catch (e) { }
            try { await queryInterface.removeColumn('domain', 'gsc_last_synced_date', { transaction: t }); } catch (e) { }

            await queryInterface.dropTable('user_gsc_sites', { transaction: t });
            await queryInterface.dropTable('keyword_search_results', { transaction: t });
            await queryInterface.dropTable('competitor_history', { transaction: t });
            await queryInterface.dropTable('keyword_history', { transaction: t });
            await queryInterface.dropTable('gsc_sync_log', { transaction: t });
            await queryInterface.dropTable('gsc_daily_stats', { transaction: t });

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
};
