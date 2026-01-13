'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('keyword', 'updating_competitors', {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('keyword', 'updating_competitors');
    }
};
