import { Table, Model, Column, DataType, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from './user';

@Table({
  timestamps: false,
  tableName: 'keyword',
})

class Keyword extends Model {
  @PrimaryKey
  @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
  declare ID: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare user_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare keyword: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'desktop' })
  declare device: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'US' })
  declare country: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: '' })
  declare city: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: '' })
  declare latlong: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: '{}' })
  declare domain: string;

  // @ForeignKey(() => Domain)
  // @Column({ allowNull: false })
  // domainID!: number;

  // @BelongsTo(() => Domain)
  // domain!: Domain;

  @Column({ type: DataType.STRING, allowNull: true })
  declare lastUpdated: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare added: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare position: number;

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: JSON.stringify([]) })
  declare history: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare volume: number;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: JSON.stringify([]) })
  declare url: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: JSON.stringify([]) })
  declare tags: string;

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: JSON.stringify([]) })
  declare lastResult: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: true })
  declare sticky: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare updating: boolean;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'false' })
  declare lastUpdateError: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare settings: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare competitor_positions?: Record<string, number>;

  @BelongsTo(() => User)
  declare user: User;
}

export default Keyword;
