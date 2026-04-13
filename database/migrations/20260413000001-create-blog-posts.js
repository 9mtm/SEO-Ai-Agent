'use strict';

/**
 * Blog Posts table — public-facing articles on /blog.
 * Separate from the domain-scoped `posts` table (which is for user content).
 * Optimized for SEO: meta_title, meta_description, canonical_url,
 * structured data fields, and reading_time for rich snippets.
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('blog_posts', {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
            title: { type: Sequelize.STRING(255), allowNull: false },
            slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
            content: { type: Sequelize.TEXT('long'), allowNull: false },
            excerpt: { type: Sequelize.TEXT, allowNull: true },
            featured_image: { type: Sequelize.STRING(500), allowNull: true },
            author_name: { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'SEO AI Agent' },
            author_avatar: { type: Sequelize.STRING(500), allowNull: true },
            category: { type: Sequelize.STRING(100), allowNull: true },
            tags: { type: Sequelize.JSON, allowNull: true },
            status: { type: Sequelize.ENUM('draft', 'published'), allowNull: false, defaultValue: 'draft' },
            published_at: { type: Sequelize.DATE, allowNull: true },
            // SEO fields
            meta_title: { type: Sequelize.STRING(70), allowNull: true },
            meta_description: { type: Sequelize.STRING(160), allowNull: true },
            canonical_url: { type: Sequelize.STRING(500), allowNull: true },
            // Engagement
            views_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            reading_time: { type: Sequelize.INTEGER, defaultValue: 0 },
            // Author user (super admin who wrote it)
            author_user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE'
            },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.addIndex('blog_posts', ['status', 'published_at'], { name: 'idx_blog_status_date' });
        await queryInterface.addIndex('blog_posts', ['category'], { name: 'idx_blog_category' });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('blog_posts');
    }
};
