'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('platform_integration_logs', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            integration_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'platform_integrations',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            action: {
                type: Sequelize.STRING,
                allowNull: false
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'info'
            },
            details: {
                type: Sequelize.JSON,
                allowNull: true
            },
            ip_address: {
                type: Sequelize.STRING(45),
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        // Add index for faster lookups
        await queryInterface.addIndex('platform_integration_logs', ['integration_id']);
        await queryInterface.addIndex('platform_integration_logs', ['created_at']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('platform_integration_logs');
    }
};
