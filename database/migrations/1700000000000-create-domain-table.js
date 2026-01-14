
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('domain', {
            ID: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            domain: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            slug: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            keywordCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            lastUpdated: {
                type: Sequelize.STRING,
                allowNull: true
            },
            added: {
                type: Sequelize.STRING,
                allowNull: true
            },
            tags: {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: JSON.stringify([])
            },
            notification: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: true
            },
            notification_interval: {
                type: Sequelize.STRING,
                allowNull: true
                , defaultValue: 'daily'
            },
            notification_emails: {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: ''
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('domain');
    }
};
