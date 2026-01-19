'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('invoice_details', 'city', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('invoice_details', 'zip', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('invoice_details', 'country', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('invoice_details', 'city');
        await queryInterface.removeColumn('invoice_details', 'zip');
        await queryInterface.removeColumn('invoice_details', 'country');
    }
};
