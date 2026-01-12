'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Create chat_sessions table
        await queryInterface.createTable('chat_sessions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            domain: {
                type: Sequelize.STRING,
                allowNull: false
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // 2. Add sessionId to chat_messages
        await queryInterface.addColumn('chat_messages', 'sessionId', {
            type: Sequelize.INTEGER,
            allowNull: true, // Allow null for existing messages, we'll migrate them or handle nulls
            references: {
                model: 'chat_sessions',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        // Add index for sessions
        await queryInterface.addIndex('chat_sessions', ['domain', 'userId']);
        await queryInterface.addIndex('chat_messages', ['sessionId']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('chat_messages', 'sessionId');
        await queryInterface.dropTable('chat_sessions');
    }
};
