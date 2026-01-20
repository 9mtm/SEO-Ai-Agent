'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('search_analytics', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            domain_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'domain',
                    key: 'ID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            keyword: {
                type: Sequelize.STRING,
                allowNull: false
            },
            country: {
                type: Sequelize.STRING,
                defaultValue: 'ALL'
            },
            device: {
                type: Sequelize.STRING,
                defaultValue: 'ALL'
            },
            page: {
                type: Sequelize.STRING,
                allowNull: true
            },
            clicks: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            impressions: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            ctr: {
                type: Sequelize.FLOAT,
                defaultValue: 0
            },
            position: {
                type: Sequelize.FLOAT,
                defaultValue: 0
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

        // Add indexes for efficient querying and uniqueness
        await queryInterface.addIndex('search_analytics', ['domain_id', 'date', 'keyword', 'country', 'device'], {
            unique: true,
            name: 'unique_analytics_entry'
        });

        await queryInterface.addIndex('search_analytics', ['domain_id', 'date']);
        await queryInterface.addIndex('search_analytics', ['keyword']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('search_analytics');
    }
};
