
module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.addColumn('users', 'scrape_delay', {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: 'none'
            }, { transaction: t });

            await queryInterface.addColumn('users', 'scrape_retry', {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false
            }, { transaction: t });
        });
    },

    down: async (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.removeColumn('users', 'scrape_delay', { transaction: t });
            await queryInterface.removeColumn('users', 'scrape_retry', { transaction: t });
        });
    }
};
