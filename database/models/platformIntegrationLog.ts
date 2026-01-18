import { Table, Model, Column, DataType, PrimaryKey, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import PlatformIntegration from './platformIntegration';

@Table({
    timestamps: true,
    tableName: 'platform_integration_logs',
})
class PlatformIntegrationLog extends Model {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
    declare id: number;

    @ForeignKey(() => PlatformIntegration)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare integration_id: number;

    @BelongsTo(() => PlatformIntegration)
    declare integration: PlatformIntegration;

    @Column({ type: DataType.STRING, allowNull: false })
    declare action: string;

    @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: 'info' })
    declare status: string;

    @Column({ type: DataType.JSON, allowNull: true })
    declare details: any;

    @Column({ type: DataType.STRING(45), allowNull: true })
    declare ip_address: string;

    @CreatedAt
    declare created_at: Date;

    @UpdatedAt
    declare updated_at: Date;
}

export default PlatformIntegrationLog;
