
module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.addColumn('users', 'adwords_client_id', {
                type: Sequelize.STRING,
                allowNull: true
            }, { transaction: t });

            await queryInterface.addColumn('users', 'adwords_client_secret', {
                type: Sequelize.STRING,
                allowNull: true
            }, { transaction: t });

            await queryInterface.addColumn('users', 'adwords_developer_token', {
                type: Sequelize.STRING,
                allowNull: true
            }, { transaction: t });

            await queryInterface.addColumn('users', 'adwords_account_id', {
                type: Sequelize.STRING,
                allowNull: true
            }, { transaction: t });
        });
    },

    down: async (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.removeColumn('users', 'adwords_client_id', { transaction: t });
            await queryInterface.removeColumn('users', 'adwords_client_secret', { transaction: t });
            await queryInterface.removeColumn('users', 'adwords_developer_token', { transaction: t });
            await queryInterface.removeColumn('users', 'adwords_account_id', { transaction: t });
        });
    }
};
