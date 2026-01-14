module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('notification_logs', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'User ID who received the notification (null for legacy/global notifications)',
            },
            domain: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Domain name for which notification was sent',
            },
            notification_email: {
                type: Sequelize.STRING(500),
                allowNull: false,
                comment: 'Email address(es) where notification was sent',
            },
            notification_type: {
                type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
                allowNull: false,
                defaultValue: 'monthly',
                comment: 'Type of notification sent',
            },
            sent_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                comment: 'Timestamp when notification was sent',
            },
            status: {
                type: Sequelize.ENUM('success', 'failed', 'pending'),
                allowNull: false,
                defaultValue: 'success',
                comment: 'Status of the notification',
            },
            error_message: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Error message if notification failed',
            },
            keywords_count: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Number of keywords included in the notification',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('notification_logs', ['user_id']);
        await queryInterface.addIndex('notification_logs', ['domain']);
        await queryInterface.addIndex('notification_logs', ['sent_at']);
        await queryInterface.addIndex('notification_logs', ['notification_type']);
        await queryInterface.addIndex('notification_logs', ['status']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('notification_logs');
    },
};
