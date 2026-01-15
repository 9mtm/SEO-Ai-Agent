'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('posts', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            domain_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'domain',
                    key: 'ID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            slug: {
                type: Sequelize.STRING,
                allowNull: false
            },
            content: {
                type: Sequelize.TEXT('long'),
                allowNull: true
            },
            featured_image: {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'draft'
            },
            meta_description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            focus_keywords: {
                type: Sequelize.JSON,
                allowNull: true
            },
            wp_post_id: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add unique index for slug per domain
        await queryInterface.addIndex('posts', ['domain_id', 'slug'], {
            unique: true,
            name: 'posts_domain_slug_unique'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('posts');
    }
};
