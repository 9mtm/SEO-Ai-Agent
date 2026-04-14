'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add referral columns to users table
    const userColumns = await queryInterface.describeTable('users');

    if (!userColumns.referral_code) {
      await queryInterface.addColumn('users', 'referral_code', {
        type: Sequelize.STRING(8),
        allowNull: true,
        unique: true,
      });
    }

    if (!userColumns.referral_payout_settings) {
      await queryInterface.addColumn('users', 'referral_payout_settings', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    // 2. Create referrals table
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('referrals')) {
      await queryInterface.createTable('referrals', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        referrer_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        referred_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        plan: {
          type: Sequelize.ENUM('basic', 'pro', 'premium'),
          allowNull: true,
        },
        commission_eur: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        status: {
          type: Sequelize.ENUM('pending', 'active', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending',
        },
        activated_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('referrals', ['referrer_id']);
      await queryInterface.addIndex('referrals', ['status']);
    }

    // 3. Create referral_payouts table
    if (!tables.includes('referral_payouts')) {
      await queryInterface.createTable('referral_payouts', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        amount_eur: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 60.00,
        },
        status: {
          type: Sequelize.ENUM('pending', 'requested', 'approved', 'paid', 'rejected'),
          allowNull: false,
          defaultValue: 'pending',
        },
        paypal_email: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        payout_name: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        payout_address: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        payout_city: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        payout_zip: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        payout_country: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        payout_company: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        payout_vat_id: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        is_business: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        admin_note: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        requested_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        processed_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('referral_payouts', ['user_id']);
      await queryInterface.addIndex('referral_payouts', ['status']);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('referral_payouts');
    await queryInterface.dropTable('referrals');

    const userColumns = await queryInterface.describeTable('users');
    if (userColumns.referral_code) {
      await queryInterface.removeColumn('users', 'referral_code');
    }
    if (userColumns.referral_payout_settings) {
      await queryInterface.removeColumn('users', 'referral_payout_settings');
    }
  },
};
