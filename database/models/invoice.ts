import {
    Table,
    Model,
    Column,
    DataType,
    ForeignKey,
    BelongsTo,
    PrimaryKey,
    AutoIncrement,
} from 'sequelize-typescript';
import User from './user';

@Table({
    timestamps: true,
    tableName: 'invoices',
})
class Invoice extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare user_id: number;

    @BelongsTo(() => User)
    declare user: User;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare workspace_id: number | null;

    @Column({ type: DataType.STRING(20), allowNull: false, unique: true })
    declare invoice_number: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare stripe_invoice_id: string | null;

    @Column({ type: DataType.STRING, allowNull: true })
    declare stripe_payment_intent_id: string | null;

    @Column({ type: DataType.STRING, allowNull: true })
    declare stripe_subscription_id: string | null;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
    declare amount_net: number;

    @Column({ type: DataType.DECIMAL(5, 2), allowNull: false, defaultValue: 0 })
    declare tax_rate: number;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
    declare tax_amount: number;

    @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
    declare amount_gross: number;

    @Column({ type: DataType.STRING(3), allowNull: false, defaultValue: 'EUR' })
    declare currency: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare plan_name: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare billing_interval: string | null;

    @Column({ type: DataType.ENUM('company', 'individual'), allowNull: false, defaultValue: 'company' })
    declare customer_type: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare customer_name: string | null;

    @Column({ type: DataType.STRING, allowNull: true })
    declare customer_email: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare customer_address: string | null;

    @Column({ type: DataType.STRING, allowNull: true })
    declare customer_city: string | null;

    @Column({ type: DataType.STRING(20), allowNull: true })
    declare customer_zip: string | null;

    @Column({ type: DataType.STRING, allowNull: true })
    declare customer_country: string | null;

    @Column({ type: DataType.STRING, allowNull: true })
    declare customer_vat_id: string | null;

    @Column({ type: DataType.STRING, allowNull: true })
    declare tax_text: string | null;

    @Column({ type: DataType.ENUM('draft', 'issued', 'paid', 'cancelled'), allowNull: false, defaultValue: 'paid' })
    declare status: string;

    @Column({ type: DataType.DATEONLY, allowNull: false })
    declare invoice_date: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare pdf_path: string | null;
}

export default Invoice;
