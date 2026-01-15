'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('domain', 'gsc_site_url', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await queryInterface.addColumn('domain', 'gsc_refresh_token', {
            type: Sequelize.TEXT,
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('domain', 'gsc_site_url');
        await queryInterface.removeColumn('domain', 'gsc_refresh_token');
    }
};
