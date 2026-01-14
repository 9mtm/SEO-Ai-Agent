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

  @BelongsTo(() => User)
  declare user: User;
}

export default Domain;
