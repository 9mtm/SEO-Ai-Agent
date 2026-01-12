'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Check if column exists first to avoid errors
        const tableInfo = await queryInterface.describeTable('domain');
        if (!tableInfo.search_console_data) {
            await queryInterface.addColumn('domain', 'search_console_data', {
                type: Sequelize.JSON,
                allowNull: true
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('domain');
        if (tableInfo.search_console_data) {
            await queryInterface.removeColumn('domain', 'search_console_data');
        }
    }
};
