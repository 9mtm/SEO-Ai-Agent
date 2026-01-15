'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('posts', 'seo_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      after: 'wp_post_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('posts', 'seo_score');
  }
};
