'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const cols = await queryInterface.describeTable('users');
        if (!cols.is_super_admin) {
            await queryInterface.addColumn('users', 'is_super_admin', {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false
            });
        }
    },
    down: async (queryInterface) => {
        try { await queryInterface.removeColumn('users', 'is_super_admin'); } catch (e) { }
    }
};
