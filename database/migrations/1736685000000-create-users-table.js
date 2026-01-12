// Migration: Creates users table for multi-tenant support

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check if users table exists
        const tables = await queryInterface.showAllTables();
        const usersTableExists = tables.includes('users');

        if (!usersTableExists) {
          await queryInterface.createTable('users', {
            id: {
              type: Sequelize.DataTypes.INTEGER,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false,
            },
            email: {
              type: Sequelize.DataTypes.STRING,
              unique: true,
              allowNull: false,
            },
            password: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            name: {
              type: Sequelize.DataTypes.STRING,
              allowNull: false,
            },
            company: {
              type: Sequelize.DataTypes.STRING,
              allowNull: true,
            },
            subscription_plan: {
              type: Sequelize.DataTypes.ENUM('free', 'pro', 'enterprise'),
              defaultValue: 'free',
              allowNull: false,
            },
            google_access_token: {
              type: Sequelize.DataTypes.TEXT,
              allowNull: true,
            },
            google_refresh_token: {
              type: Sequelize.DataTypes.TEXT,
              allowNull: true,
            },
            google_token_expiry: {
              type: Sequelize.DataTypes.DATE,
              allowNull: true,
            },
            google_ads_account_id: {
              type: Sequelize.DataTypes.STRING,
              allowNull: true,
            },
            google_ads_customer_id: {
              type: Sequelize.DataTypes.STRING,
              allowNull: true,
            },
            is_active: {
              type: Sequelize.DataTypes.BOOLEAN,
              defaultValue: true,
              allowNull: false,
            },
            last_login: {
              type: Sequelize.DataTypes.DATE,
              allowNull: true,
            },
            createdAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
            updatedAt: {
              type: Sequelize.DataTypes.DATE,
              allowNull: false,
            },
          }, { transaction: t });

          // Add indexes
          await queryInterface.addIndex('users', ['email'], { transaction: t });
          await queryInterface.addIndex('users', ['is_active'], { transaction: t });

          console.log('✓ Users table created successfully');
        } else {
          console.log('! Users table already exists');
        }
      } catch (error) {
        console.log('Error creating users table:', error);
        throw error;
      }
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        const tables = await queryInterface.showAllTables();
        if (tables.includes('users')) {
          await queryInterface.dropTable('users', { transaction: t });
          console.log('✓ Users table dropped successfully');
        }
      } catch (error) {
        console.log('Error dropping users table:', error);
        throw error;
      }
    });
  },
};
