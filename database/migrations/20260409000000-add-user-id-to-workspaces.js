'use strict';

/**
 * Adds a `user_id` column to the `workspaces` table.
 *
 * Sequelize-typescript auto-generates a `user_id` attribute on the Workspace
 * model because of the BelongsTo(User) association registered via the models
 * array in database.ts. Even though the logical FK is `owner_user_id`, the
 * ORM insists on SELECTing `user_id` as well.  Adding the column prevents
 * "Unknown column 'user_id'" errors at runtime.
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const cols = await queryInterface.describeTable('workspaces');
        if (!cols.user_id) {
            await queryInterface.addColumn('workspaces', 'user_id', {
                type: Sequelize.INTEGER,
                allowNull: true
            });
        }
    },
    down: async (queryInterface) => {
        try {
            await queryInterface.removeColumn('workspaces', 'user_id');
        } catch (e) { }
    }
};
