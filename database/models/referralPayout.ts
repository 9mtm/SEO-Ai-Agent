import {
  Table, Model, Column, DataType, PrimaryKey, AutoIncrement,
  ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import User from './user';

@Table({ timestamps: true, tableName: 'referral_payouts' })
class ReferralPayout extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare user_id: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 60.00 })
  declare amount_eur: number;

  @Column({ type: DataType.ENUM('pending', 'requested', 'approved', 'paid', 'rejected'), allowNull: false, defaultValue: 'pending' })
  declare status: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare paypal_email?: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare payout_name?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare payout_address?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare payout_city?: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare payout_zip?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare payout_country?: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare payout_company?: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  declare payout_vat_id?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare is_business: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare admin_note?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare requested_at?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare processed_at?: Date;

  @BelongsTo(() => User, 'user_id')
  declare user: User;
}

export default ReferralPayout;
