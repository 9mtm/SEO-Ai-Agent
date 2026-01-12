// Migration: Adds user_id foreign key to keyword table for multi-tenant support

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        const keywordTableDefinition = await queryInterface.describeTable('keyword');

        if (keywordTableDefinition && !keywordTableDefinition.user_id) {
          // Add user_id column
          await queryInterface.addColumn('keyword', 'user_id', {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true, // Allow null initially for migration
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          }, { transaction: t });

          // Set default user_id to 1 for existing keywords
          await queryInterface.sequelize.query(
            'UPDATE keyword SET user_id = 1 WHERE user_id IS NULL',
            { transaction: t }
          );

          // Now make it NOT NULL
          await queryInterface.changeColumn('keyword', 'user_id', {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false,
          }, { transaction: t });

          // Add index for performance
          await queryInterface.addIndex('keyword', ['user_id'], { transaction: t });
          await queryInterface.addIndex('keyword', ['user_id', 'domain'], { transaction: t });

          console.log('✓ user_id added to keyword table successfully');
        } else if (keywordTableDefinition && keywordTableDefinition.user_id) {
          console.log('! user_id column already exists in keyword table');
        }
      } catch (error) {
        console.log('Error adding user_id to keyword:', error);
        throw error;
      }
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        const keywordTableDefinition = await queryInterface.describeTable('keyword');

        if (keywordTableDefinition && keywordTableDefinition.user_id) {
          await queryInterface.removeColumn('keyword', 'user_id', { transaction: t });
          console.log('✓ user_id removed from keyword table successfully');
        }
      } catch (error) {
        console.log('Error removing user_id from keyword:', error);
        throw error;
      }
    });
  },
};
