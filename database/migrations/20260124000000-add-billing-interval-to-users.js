'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('users', 'stripe_billing_interval', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'stripe_current_period_end'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('users', 'stripe_billing_interval');
    }
};
