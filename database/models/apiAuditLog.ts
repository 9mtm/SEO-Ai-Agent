import { Table, Model, Column, DataType, PrimaryKey, ForeignKey, BelongsTo, CreatedAt } from 'sequelize-typescript';
import ApiKey from './apiKey';

@Table({
    timestamps: true,
    tableName: 'api_audit_logs',
    updatedAt: false, // Only createdAt needed for logs
})

class ApiAuditLog extends Model {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
    declare id: number;

    @ForeignKey(() => ApiKey)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare api_key_id: number;

    @BelongsTo(() => ApiKey)
    declare apiKey: ApiKey;

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare action: string; // e.g., "create_post", "list_domains"

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare resource: string; // e.g., "post_123", "domain_example-com"

    @Column({ type: DataType.JSON, allowNull: true })
    declare metadata: any; // Additional context about the action

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare ip_address: string;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare user_agent: string;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    declare success: boolean;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare error_message: string;

    @CreatedAt
    declare created_at: Date;
}

export default ApiAuditLog;
