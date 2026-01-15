'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('users');
        if (!tableInfo.ai_api_keys) {
            await queryInterface.addColumn('users', 'ai_api_keys', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null
            });
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'ai_api_keys');
    }
};
