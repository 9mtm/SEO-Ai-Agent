'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('domain', 'business_name', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('domain', 'niche', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('domain', 'description', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        await queryInterface.addColumn('domain', 'language', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: 'en-US',
        });

        await queryInterface.addColumn('domain', 'blog_url', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('domain', 'business_name');
        await queryInterface.removeColumn('domain', 'niche');
        await queryInterface.removeColumn('domain', 'description');
        await queryInterface.removeColumn('domain', 'language');
        await queryInterface.removeColumn('domain', 'blog_url');
    }
};
