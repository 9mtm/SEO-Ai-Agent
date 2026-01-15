'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('api_keys', 'key_encrypted', {
            type: Sequelize.TEXT,
            allowNull: false,
            defaultValue: '' // Temporary default for existing rows
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('api_keys', 'key_encrypted');
    }
};
