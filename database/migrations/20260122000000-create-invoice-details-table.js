module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async (t) => {
            try {
                // 1. Remove invoice_details column from users if it exists
                const tableInfo = await queryInterface.describeTable('users');
                if (tableInfo.invoice_details) {
                    await queryInterface.removeColumn('users', 'invoice_details', { transaction: t });
                    console.log('✓ Column users.invoice_details removed');
                }

                // 2. Create invoice_details table
                const tables = await queryInterface.showAllTables();
                if (!tables.includes('invoice_details')) {
                    await queryInterface.createTable('invoice_details', {
                        id: {
                            type: Sequelize.DataTypes.INTEGER,
                            primaryKey: true,
                            autoIncrement: true,
                            allowNull: false,
                        },
                        user_id: {
                            type: Sequelize.DataTypes.INTEGER,
                            allowNull: false,
                            references: {
                                model: 'users',
                                key: 'id',
                            },
                            onUpdate: 'CASCADE',
                            onDelete: 'CASCADE',
                        },
                        type: {
                            type: Sequelize.DataTypes.ENUM('company', 'individual'),
                            defaultValue: 'company',
                            allowNull: false,
                        },
                        name: {
                            type: Sequelize.DataTypes.STRING,
                            allowNull: true,
                        },
                        vat_id: {
                            type: Sequelize.DataTypes.STRING,
                            allowNull: true,
                        },
                        address: {
                            type: Sequelize.DataTypes.TEXT,
                            allowNull: true,
                        },
                        email: {
                            type: Sequelize.DataTypes.STRING,
                            allowNull: true,
                        },
                        createdAt: {
                            type: Sequelize.DataTypes.DATE,
                            allowNull: false,
                        },
                        updatedAt: {
                            type: Sequelize.DataTypes.DATE,
                            allowNull: false,
                        },
                    }, { transaction: t });

                    await queryInterface.addIndex('invoice_details', ['user_id'], { transaction: t });
                    console.log('✓ Invoice_details table created');
                }
            } catch (error) {
                console.error('Error in migration:', error);
                throw error;
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async (t) => {
            // Logic to reverse the changes
            await queryInterface.dropTable('invoice_details', { transaction: t });
            await queryInterface.addColumn('users', 'invoice_details', {
                type: Sequelize.DataTypes.JSON,
                allowNull: true,
            }, { transaction: t });
        });
    },
};
