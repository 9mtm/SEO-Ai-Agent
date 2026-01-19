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
    tableName: 'invoice_details',
})
class InvoiceDetail extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare user_id: number;

    @BelongsTo(() => User)
    declare user: User;

    @Column({ type: DataType.ENUM('company', 'individual'), allowNull: false, defaultValue: 'company' })
    declare type: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare name: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare vat_id?: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare address?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare city?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare zip?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare country?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare email?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare stripe_billing_interval?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare stripe_subscription_id?: string;

    @Column({ type: DataType.DATE, allowNull: true })
    declare stripe_current_period_end?: Date;

    @Column({ type: DataType.STRING, allowNull: true })
    declare stripe_customer_id?: string;
}

export default InvoiceDetail;
