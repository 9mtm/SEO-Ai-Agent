'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('domain', 'target_country', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: 'US'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('domain', 'target_country');
    }
};
