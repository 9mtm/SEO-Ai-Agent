'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('notification_settings', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            notification_email: {
                type: Sequelize.STRING,
                allowNull: true
            },
            email_alerts: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            weekly_report: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            marketing_emails: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            security_alerts: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('notification_settings');
    }
};
