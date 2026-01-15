'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create api_keys table
        await queryInterface.createTable('api_keys', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'ID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            key_hash: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            permissions: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: '[]'
            },
            last_used_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            revoked: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            last_ip: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            last_user_agent: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Create api_audit_logs table
        await queryInterface.createTable('api_audit_logs', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            api_key_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'api_keys',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            action: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            resource: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true
            },
            ip_address: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            user_agent: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            success: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            error_message: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add indexes for better performance
        await queryInterface.addIndex('api_keys', ['user_id']);
        await queryInterface.addIndex('api_keys', ['key_hash']);
        await queryInterface.addIndex('api_audit_logs', ['api_key_id']);
        await queryInterface.addIndex('api_audit_logs', ['created_at']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('api_audit_logs');
        await queryInterface.dropTable('api_keys');
    }
};
