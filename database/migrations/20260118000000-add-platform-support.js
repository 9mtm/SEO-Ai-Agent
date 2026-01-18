'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Add columns to users table
        await queryInterface.addColumn('users', 'platform_user_id', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        // Check if ENUM type exists before adding column to avoid errors in some dialects, 
        // but for Sequelize usually it handles it.
        await queryInterface.addColumn('users', 'platform_type', {
            type: Sequelize.ENUM('direct', 'wordpress', 'shopify', 'wix'),
            defaultValue: 'direct',
            allowNull: false,
        });

        await queryInterface.addColumn('users', 'platform_metadata', {
            type: Sequelize.JSON,
            allowNull: true,
        });

        // Add index
        await queryInterface.addIndex('users', ['platform_user_id', 'platform_type'], {
            name: 'idx_platform_user_lookup'
        });

        // 2. Create platform_integrations table
        await queryInterface.createTable('platform_integrations', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            platform_type: {
                type: Sequelize.ENUM('wordpress', 'shopify', 'wix'),
                allowNull: false
            },
            platform_domain: {
                type: Sequelize.STRING,
                allowNull: false
            },
            platform_user_id: {
                type: Sequelize.STRING,
                allowNull: false
            },
            shared_secret: {
                type: Sequelize.STRING,
                allowNull: false
            },
            platform_metadata: {
                type: Sequelize.JSON,
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            last_login: {
                type: Sequelize.DATE,
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

        // Add unique constraint for (user_id, platform_type, platform_domain)
        await queryInterface.addConstraint('platform_integrations', {
            fields: ['user_id', 'platform_type', 'platform_domain'],
            type: 'unique',
            name: 'unique_user_platform_domain'
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove table first
        await queryInterface.dropTable('platform_integrations');

        // Remove columns from users
        await queryInterface.removeColumn('users', 'platform_metadata');
        await queryInterface.removeColumn('users', 'platform_type'); // Note: Removing ENUM column might need special care in some DBs
        await queryInterface.removeColumn('users', 'platform_user_id');
    }
};
