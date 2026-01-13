'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('keyword', 'competitor_positions', {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('keyword', 'competitor_positions');
    }
};
