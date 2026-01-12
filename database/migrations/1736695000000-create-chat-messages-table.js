'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('chat_messages', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            role: {
                type: Sequelize.ENUM('user', 'assistant', 'system'),
                allowNull: false
            },
            domain: {
                type: Sequelize.STRING,
                allowNull: false
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: true,
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

        // Add index for faster lookups by domain and userId
        await queryInterface.addIndex('chat_messages', ['domain', 'userId']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('chat_messages');
    }
};
