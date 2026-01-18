'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('users');
        if (!tableInfo.language) {
            await queryInterface.addColumn('users', 'language', {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'en'
            });
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'language');
    }
};
