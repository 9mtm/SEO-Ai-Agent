'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');

    // Add scraper_type column
    if (!tableDescription.scraper_type) {
      await queryInterface.addColumn('users', 'scraper_type', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'none',
        after: 'google_ads_customer_id'
      });
      console.log('✓ Added scraper_type column to users table');
    } else {
      console.log('! scraper_type column already exists in users table');
    }

    // Add scraper_api_key column
    if (!tableDescription.scraper_api_key) {
      await queryInterface.addColumn('users', 'scraper_api_key', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'scraper_type'
      });
      console.log('✓ Added scraper_api_key column to users table');
    } else {
      console.log('! scraper_api_key column already exists in users table');
    }

    // Add proxy_list column
    if (!tableDescription.proxy_list) {
      await queryInterface.addColumn('users', 'proxy_list', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'scraper_api_key'
      });
      console.log('✓ Added proxy_list column to users table');
    } else {
      console.log('! proxy_list column already exists in users table');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'scraper_type');
    await queryInterface.removeColumn('users', 'scraper_api_key');
    await queryInterface.removeColumn('users', 'proxy_list');
  }
};
