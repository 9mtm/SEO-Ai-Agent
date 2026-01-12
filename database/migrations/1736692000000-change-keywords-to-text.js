'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('keyword', 'lastResult', {
            type: Sequelize.TEXT('long'),
            allowNull: true,
        });
        await queryInterface.changeColumn('keyword', 'history', {
            type: Sequelize.TEXT('long'),
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('keyword', 'lastResult', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.changeColumn('keyword', 'history', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    }
};
