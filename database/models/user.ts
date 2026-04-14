import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import Domain from './domain';
import PlatformIntegration from './platformIntegration';
import InvoiceDetail from './invoiceDetail';

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
  declare company?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare picture?: string;

  @Column({ type: DataType.ENUM('free', 'basic', 'pro', 'premium', 'enterprise'), allowNull: false, defaultValue: 'free' })
  declare subscription_plan: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare google_access_token?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare google_refresh_token?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare google_token_expiry?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  declare google_ads_account_id?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare google_ads_customer_id?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare adwords_client_id?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare adwords_client_secret?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare adwords_developer_token?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare adwords_account_id?: string;

  // Scraper Settings (Per-User)
  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'none' })
  declare scraper_type?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare scraper_api_key?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare proxy_list?: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'none' })
  declare scrape_delay?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare scrape_retry?: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare is_active: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare onboarding_step: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare last_login?: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;

  @HasMany(() => Domain)
  declare domains: Domain[];

  @Column({ type: DataType.JSON, allowNull: true })
  declare ai_api_keys?: any;

  // Platform Integration Fields
  @Column({ type: DataType.STRING, allowNull: true })
  declare platform_user_id?: string;

  @Column({
    type: DataType.ENUM('direct', 'wordpress', 'shopify', 'wix'),
    allowNull: false,
    defaultValue: 'direct',
  })
  declare platform_type: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'en' })
  declare language: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare platform_metadata?: any;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare current_workspace_id?: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare is_super_admin: boolean;

  @Column({ type: DataType.STRING(8), allowNull: true, unique: true })
  declare referral_code?: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare referral_payout_settings?: any;

  @HasOne(() => InvoiceDetail)
  declare invoice_profile: InvoiceDetail;

  @HasMany(() => PlatformIntegration)
  declare platform_integrations: PlatformIntegration[];
}

export default User;
