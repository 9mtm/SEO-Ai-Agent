'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Check if column exists first to avoid errors if run multiple times or manually added
        const tableInfo = await queryInterface.describeTable('users');
        if (!tableInfo.picture) {
            await queryInterface.addColumn('users', 'picture', {
                type: Sequelize.STRING,
                allowNull: true,
                after: 'company' // Optional: place it after company column
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('users');
        if (tableInfo.picture) {
            await queryInterface.removeColumn('users', 'picture');
        }
    }
};
