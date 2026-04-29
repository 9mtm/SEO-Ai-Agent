'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Expand the status ENUM to include 'scheduled'
    await queryInterface.sequelize.query(
      `ALTER TABLE blog_posts MODIFY COLUMN status ENUM('draft','published','scheduled') NOT NULL DEFAULT 'draft'`
    );

    // Add scheduled_for column if it doesn't exist
    const table = await queryInterface.describeTable('blog_posts');
    if (!table.scheduled_for) {
      await queryInterface.addColumn('blog_posts', 'scheduled_for', {
        type: Sequelize.DATE,
        allowNull: true,
      });
      await queryInterface.addIndex('blog_posts', ['status', 'scheduled_for'], {
        name: 'idx_blog_posts_status_scheduled',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('blog_posts');
    if (table.scheduled_for) {
      try { await queryInterface.removeIndex('blog_posts', 'idx_blog_posts_status_scheduled'); } catch (e) {}
      await queryInterface.removeColumn('blog_posts', 'scheduled_for');
    }
    await queryInterface.sequelize.query(
      `UPDATE blog_posts SET status = 'draft' WHERE status = 'scheduled'`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE blog_posts MODIFY COLUMN status ENUM('draft','published') NOT NULL DEFAULT 'draft'`
    );
  },
};
