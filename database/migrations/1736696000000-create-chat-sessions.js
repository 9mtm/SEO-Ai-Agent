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

        // 2. Add sessionId to chat_messages (nullable, without references first)
        await queryInterface.addColumn('chat_messages', 'sessionId', {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
        });

        // 3. Add Foreign Key constraint for sessionId separately
        await queryInterface.addConstraint('chat_messages', {
            fields: ['sessionId'],
            type: 'foreign key',
            name: 'chat_messages_sessionId_foreign_idx',
            references: {
                table: 'chat_sessions',
                field: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
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
