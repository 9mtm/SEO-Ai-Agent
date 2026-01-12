import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
  HasMany,
} from 'sequelize-typescript';
import Domain from './domain';

@Table({
  timestamps: true,
  tableName: 'users',
})
class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare id: number;

  @Unique
  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  company?: string;

  @Column({ type: DataType.ENUM('free', 'pro', 'enterprise'), allowNull: false, defaultValue: 'free' })
  declare subscription_plan: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  google_access_token?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  google_refresh_token?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  google_token_expiry?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  google_ads_account_id?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  google_ads_customer_id?: string;

  // Scraper Settings (Per-User)
  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'none' })
  scraper_type?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  scraper_api_key?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  proxy_list?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare is_active: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  last_login?: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;

  @HasMany(() => Domain)
  declare domains: Domain[];
}

export default User;
