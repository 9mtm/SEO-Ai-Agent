'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Convert blog tables to utf8mb4 so Arabic, Chinese, emoji etc. are preserved
    await queryInterface.sequelize.query(
      `ALTER TABLE blog_posts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE blog_post_translations CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  },

  async down(queryInterface) {
    // No going back to latin1 — that would corrupt non-Latin data we now store correctly.
    // Down intentionally a no-op.
  },
};
