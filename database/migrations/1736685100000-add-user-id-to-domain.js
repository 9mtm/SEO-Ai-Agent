// Migration: Adds user_id foreign key to domain table for multi-tenant support

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        const domainTableDefinition = await queryInterface.describeTable('domain');

        if (domainTableDefinition && !domainTableDefinition.user_id) {
          // Add user_id column (first without references to avoid TiDB combined SQL errors)
          await queryInterface.addColumn('domain', 'user_id', {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
          }, { transaction: t });

          // Add Foreign Key constraint separately
          await queryInterface.addConstraint('domain', {
            fields: ['user_id'],
            type: 'foreign key',
            name: 'domain_user_id_foreign_idx',
            references: {
              table: 'users',
              field: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            transaction: t
          });

          // Set default user_id to 1 for existing domains (will be created in seeder)
          await queryInterface.sequelize.query(
            'UPDATE domain SET user_id = 1 WHERE user_id IS NULL',
            { transaction: t }
          );

          // Now make it NOT NULL
          await queryInterface.changeColumn('domain', 'user_id', {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false,
          }, { transaction: t });

          // Add index for performance
          await queryInterface.addIndex('domain', ['user_id'], { transaction: t });

          console.log('✓ user_id added to domain table successfully');
        } else if (domainTableDefinition && domainTableDefinition.user_id) {
          console.log('! user_id column already exists in domain table');
        }
      } catch (error) {
        console.log('Error adding user_id to domain:', error);
        throw error;
      }
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        const domainTableDefinition = await queryInterface.describeTable('domain');

        if (domainTableDefinition && domainTableDefinition.user_id) {
          await queryInterface.removeColumn('domain', 'user_id', { transaction: t });
          console.log('✓ user_id removed from domain table successfully');
        }
      } catch (error) {
        console.log('Error removing user_id from domain:', error);
        throw error;
      }
    });
  },
};
