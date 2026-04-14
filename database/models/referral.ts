import {
  Table, Model, Column, DataType, PrimaryKey, AutoIncrement,
  ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import User from './user';

@Table({ timestamps: true, tableName: 'referrals' })
class Referral extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare referrer_id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  declare referred_id: number;

  @Column({ type: DataType.ENUM('basic', 'pro', 'premium'), allowNull: true })
  declare plan?: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare commission_eur: number;

  @Column({ type: DataType.ENUM('pending', 'active', 'cancelled'), allowNull: false, defaultValue: 'pending' })
  declare status: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare activated_at?: Date;

  @BelongsTo(() => User, 'referrer_id')
  declare referrer: User;

  @BelongsTo(() => User, 'referred_id')
  declare referred: User;
}

export default Referral;
