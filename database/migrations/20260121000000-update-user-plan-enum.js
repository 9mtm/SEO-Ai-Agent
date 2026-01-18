'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            // Update ENUM definition to include 'basic' and 'premium'
            // Targeted for MySQL provided by MAMP
            await queryInterface.sequelize.query(
                "ALTER TABLE users MODIFY COLUMN subscription_plan ENUM('free', 'basic', 'pro', 'premium', 'enterprise') NOT NULL DEFAULT 'free'"
            );
        } catch (error) {
            console.error('Migration Error (Update Enum):', error);
            // Fallback for SQLite (if used locally for testing) or other SQL dialects
            // SQLite doesn't support modifying columns easily with ENUMs, usually they are TEXT with check constraints.
            // Check if dialect is sqlite
            if (queryInterface.sequelize.getDialect() === 'sqlite') {
                console.log('Skipping ENUM update for SQLite (not fully supported via ALTER)');
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Reverting ENUM modification is unsafe if rows contain new values.
        // We leave it as is.
    }
};
