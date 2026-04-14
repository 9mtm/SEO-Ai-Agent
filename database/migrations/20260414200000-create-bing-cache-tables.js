'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. bwt_daily_stats — daily traffic rollups
    await queryInterface.createTable('bwt_daily_stats', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      domain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'domain', key: 'ID' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      clicks: { type: Sequelize.INTEGER, defaultValue: 0 },
      impressions: { type: Sequelize.INTEGER, defaultValue: 0 },
      ctr: { type: Sequelize.FLOAT, defaultValue: 0 },
      position: { type: Sequelize.FLOAT, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('bwt_daily_stats', ['domain_id', 'date'], {
      unique: true,
      name: 'unique_bwt_daily_domain_date',
    });

    // 2. bwt_query_stats — keyword dimension breakdown
    await queryInterface.createTable('bwt_query_stats', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      domain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'domain', key: 'ID' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      keyword: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
      page: { type: Sequelize.STRING, allowNull: true },
      clicks: { type: Sequelize.INTEGER, defaultValue: 0 },
      impressions: { type: Sequelize.INTEGER, defaultValue: 0 },
      ctr: { type: Sequelize.FLOAT, defaultValue: 0 },
      position: { type: Sequelize.FLOAT, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('bwt_query_stats', ['domain_id', 'date', 'keyword'], {
      unique: true,
      name: 'unique_bwt_query_entry',
    });
    await queryInterface.addIndex('bwt_query_stats', ['keyword'], { name: 'idx_bwt_keyword' });

    // 3. bwt_sync_log — audit trail
    await queryInterface.createTable('bwt_sync_log', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      domain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'domain', key: 'ID' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      trigger_source: {
        type: Sequelize.ENUM('web', 'api', 'mcp', 'manual', 'system'),
        defaultValue: 'web',
      },
      date_from: { type: Sequelize.DATEONLY, allowNull: true },
      date_to: { type: Sequelize.DATEONLY, allowNull: true },
      rows_inserted: { type: Sequelize.INTEGER, defaultValue: 0 },
      rows_updated: { type: Sequelize.INTEGER, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('running', 'success', 'failed', 'skipped'),
        defaultValue: 'running',
      },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      duration_ms: { type: Sequelize.INTEGER, allowNull: true },
      started_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      finished_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('bwt_sync_log', ['domain_id', 'started_at']);
    await queryInterface.addIndex('bwt_sync_log', ['status']);

    // 4. Domain table — sync tracking columns
    await queryInterface.addColumn('domain', 'bwt_last_sync', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('domain', 'bwt_last_synced_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('domain', 'bwt_sync_in_progress', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('domain', 'bwt_sync_in_progress');
    await queryInterface.removeColumn('domain', 'bwt_last_synced_date');
    await queryInterface.removeColumn('domain', 'bwt_last_sync');
    await queryInterface.dropTable('bwt_sync_log');
    await queryInterface.dropTable('bwt_query_stats');
    await queryInterface.dropTable('bwt_daily_stats');
  },
};
