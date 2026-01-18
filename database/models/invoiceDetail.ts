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
    declare email?: string;
}

export default InvoiceDetail;
