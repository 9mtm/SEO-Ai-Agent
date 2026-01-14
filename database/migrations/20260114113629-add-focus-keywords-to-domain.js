'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('domain', 'focus_keywords', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null // Dictionary: { high: [], medium: [], low: [] }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('domain', 'focus_keywords');
  }
};
