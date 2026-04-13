module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('invoices')) {
            await queryInterface.createTable('invoices', {
                id: {
                    type: Sequelize.DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                user_id: {
                    type: Sequelize.DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                workspace_id: {
                    type: Sequelize.DataTypes.INTEGER,
                    allowNull: true,
                },
                invoice_number: {
                    type: Sequelize.DataTypes.STRING(20),
                    allowNull: false,
                    unique: true,
                },
                // Stripe references
                stripe_invoice_id: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                stripe_payment_intent_id: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                stripe_subscription_id: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                // Amounts
                amount_net: {
                    type: Sequelize.DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
                tax_rate: {
                    type: Sequelize.DataTypes.DECIMAL(5, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
                tax_amount: {
                    type: Sequelize.DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
                amount_gross: {
                    type: Sequelize.DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
                currency: {
                    type: Sequelize.DataTypes.STRING(3),
                    allowNull: false,
                    defaultValue: 'EUR',
                },
                // Plan info
                plan_name: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                billing_interval: {
                    type: Sequelize.DataTypes.STRING(20),
                    allowNull: true,
                },
                // Customer snapshot (frozen at invoice time)
                customer_type: {
                    type: Sequelize.DataTypes.ENUM('company', 'individual'),
                    allowNull: false,
                    defaultValue: 'company',
                },
                customer_name: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                customer_email: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                customer_address: {
                    type: Sequelize.DataTypes.TEXT,
                    allowNull: true,
                },
                customer_city: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                customer_zip: {
                    type: Sequelize.DataTypes.STRING(20),
                    allowNull: true,
                },
                customer_country: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                customer_vat_id: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                // Tax text
                tax_text: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                // Status & dates
                status: {
                    type: Sequelize.DataTypes.ENUM('draft', 'issued', 'paid', 'cancelled'),
                    allowNull: false,
                    defaultValue: 'paid',
                },
                invoice_date: {
                    type: Sequelize.DataTypes.DATEONLY,
                    allowNull: false,
                },
                pdf_path: {
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
            });

            await queryInterface.addIndex('invoices', ['user_id']);
            await queryInterface.addIndex('invoices', ['invoice_number'], { unique: true });
            await queryInterface.addIndex('invoices', ['stripe_invoice_id']);
            console.log('✓ Invoices table created');
        }
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('invoices');
    },
};
