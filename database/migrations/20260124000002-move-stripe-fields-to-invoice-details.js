'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Add columns to invoice_details
        await queryInterface.addColumn('invoice_details', 'stripe_customer_id', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('invoice_details', 'stripe_subscription_id', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('invoice_details', 'stripe_current_period_end', {
            type: Sequelize.DATE,
            allowNull: true
        });

        // 2. Data Migration: No easy way to do this in a single migration reliably without raw SQL or a script,
        // but for now we focus on the schema.
        // Ideally: UPDATE invoice_details id JOIN users u ON id.user_id = u.id SET id.stripe_customer_id = u.stripe_customer_id ...

        // 3. Remove columns from users
        await queryInterface.removeColumn('users', 'stripe_customer_id');
        await queryInterface.removeColumn('users', 'stripe_subscription_id');
        await queryInterface.removeColumn('users', 'stripe_current_period_end');
    },

    down: async (queryInterface, Sequelize) => {
        // 1. Add back to users
        await queryInterface.addColumn('users', 'stripe_customer_id', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('users', 'stripe_subscription_id', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('users', 'stripe_current_period_end', {
            type: Sequelize.DATE,
            allowNull: true
        });

        // 2. Remove from invoice_details
        await queryInterface.removeColumn('invoice_details', 'stripe_customer_id');
        await queryInterface.removeColumn('invoice_details', 'stripe_subscription_id');
        await queryInterface.removeColumn('invoice_details', 'stripe_current_period_end');
    }
};
