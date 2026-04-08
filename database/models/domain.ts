import { Table, Model, Column, DataType, PrimaryKey, Unique, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from './user';

@Table({
  timestamps: false,
  tableName: 'domain',
})

class Domain extends Model {
  @PrimaryKey
  @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
  declare ID: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare user_id: number;

  @Unique
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: true, unique: true })
  declare domain: string;

  @Unique
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: true, unique: true })
  declare slug: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare keywordCount: number;

  @Column({ type: DataType.STRING, allowNull: true })
  declare lastUpdated: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare added: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: JSON.stringify([]) })
  declare tags: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: true })
  declare notification: boolean;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'daily' })
  declare notification_interval: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: '' })
  declare notification_emails: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare search_console: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare search_console_data?: any;

  @Column({ type: DataType.STRING, allowNull: true })
  declare business_name?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare niche?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description?: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'en-US' })
  declare language?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare blog_url?: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare competitors?: string[];

  @Column({ type: DataType.JSON, allowNull: true })
  declare integration_settings?: any;

  @Column({ type: DataType.JSON, allowNull: true })
  declare focus_keywords?: {
    high: string[];
    medium: string[];
    low: string[];
  };

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'US' })
  declare target_country?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare gsc_site_url?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare gsc_refresh_token?: string;

  // New encrypted WordPress fields
  @Column({ type: DataType.STRING(255), allowNull: true })
  declare wordpress_url?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare wordpress_username?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare wordpress_app_password_encrypted?: string;

  // New encrypted GSC fields
  @Column({ type: DataType.TEXT, allowNull: true })
  declare gsc_refresh_token_encrypted?: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare gsc_scope?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare gsc_last_sync?: Date;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare gsc_last_synced_date?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare gsc_sync_in_progress?: boolean;

  @BelongsTo(() => User)
  declare user: User;

  // Encryption/Decryption helpers (similar to ApiKey model)
  static encryptValue(value: string): string {
    if (!value) return '';
    const crypto = require('crypto');
    const ENCRYPTION_KEY = process.env.SECRET || 'default-secret-key-change-in-production';
    const ALGORITHM = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
      iv
    );
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  static decryptValue(encryptedValue: string): string {
    if (!encryptedValue) return '';
    try {
      const crypto = require('crypto');
      const ENCRYPTION_KEY = process.env.SECRET || 'default-secret-key-change-in-production';
      const ALGORITHM = 'aes-256-cbc';
      const parts = encryptedValue.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
        iv
      );
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }

  // Helper methods for WordPress credentials
  setWordPressPassword(password: string) {
    this.wordpress_app_password_encrypted = Domain.encryptValue(password);
  }

  getWordPressPassword(): string {
    return this.wordpress_app_password_encrypted
      ? Domain.decryptValue(this.wordpress_app_password_encrypted)
      : '';
  }

  // Helper methods for GSC token
  setGSCRefreshToken(token: string) {
    this.gsc_refresh_token_encrypted = Domain.encryptValue(token);
  }

  getGSCRefreshToken(): string {
    return this.gsc_refresh_token_encrypted
      ? Domain.decryptValue(this.gsc_refresh_token_encrypted)
      : '';
  }
}

export default Domain;
