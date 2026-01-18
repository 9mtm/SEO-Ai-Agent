'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Remove from users
        await queryInterface.removeColumn('users', 'stripe_billing_interval');

        // Add to invoice_details
        await queryInterface.addColumn('invoice_details', 'stripe_billing_interval', {
            type: Sequelize.STRING,
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Remove from invoice_details
        await queryInterface.removeColumn('invoice_details', 'stripe_billing_interval');

        // Add back to users
        await queryInterface.addColumn('users', 'stripe_billing_interval', {
            type: Sequelize.STRING,
            allowNull: true
        });
    }
};
