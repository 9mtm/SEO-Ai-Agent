'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('settings', {
            key: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
                unique: true
            },
            value: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Seed default settings to avoid empty startup
        await queryInterface.bulkInsert('settings', [{
            key: 'app_config',
            value: JSON.stringify({
                scraper_type: 'none',
                notification_interval: 'never',
                keywordsColumns: ['Best', 'History', 'Volume', 'Search Console']
            }),
            createdAt: new Date(),
            updatedAt: new Date()
        }]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('settings');
    }
};
