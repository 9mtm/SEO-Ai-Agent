'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('blog_post_translations')) {
      await queryInterface.createTable('blog_post_translations', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        blog_post_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'blog_posts', key: 'id' },
          onDelete: 'CASCADE',
        },
        locale: {
          type: Sequelize.STRING(5),
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        slug: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT('long'),
          allowNull: true,
        },
        excerpt: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        meta_title: {
          type: Sequelize.STRING(70),
          allowNull: true,
        },
        meta_description: {
          type: Sequelize.STRING(160),
          allowNull: true,
        },
        reading_time: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('blog_post_translations', ['blog_post_id', 'locale'], { unique: true, name: 'idx_bpt_post_locale' });
      await queryInterface.addIndex('blog_post_translations', ['slug', 'locale'], { unique: true, name: 'idx_bpt_slug_locale' });
      await queryInterface.addIndex('blog_post_translations', ['locale']);
    }

    // Migrate existing blog posts to translations table (as 'en')
    try {
      await queryInterface.sequelize.query(`
        INSERT IGNORE INTO blog_post_translations (blog_post_id, locale, title, slug, content, excerpt, meta_title, meta_description, reading_time, createdAt, updatedAt)
        SELECT id, 'en', title, slug, content, excerpt, meta_title, meta_description, reading_time, createdAt, updatedAt
        FROM blog_posts
        WHERE id NOT IN (SELECT blog_post_id FROM blog_post_translations WHERE locale = 'en')
      `);
    } catch (e) {
      console.log('Migration: No existing posts to migrate or already migrated');
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('blog_post_translations');
  },
};
