import { Table, Model, Column, DataType, PrimaryKey, Unique, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import User from './user';

@Table({
    timestamps: true,
    tableName: 'api_keys',
})

class ApiKey extends Model {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
    declare id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare user_id: number;

    @BelongsTo(() => User)
    declare user: User;

    @Unique
    @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
    declare key_hash: string; // Hashed API key for security

    @Column({ type: DataType.TEXT, allowNull: false })
    declare key_encrypted: string; // Encrypted API key for display

    @Column({ type: DataType.STRING(100), allowNull: false })
    declare name: string; // e.g., "Claude Desktop - MacBook"

    @Column({ type: DataType.JSON, allowNull: false, defaultValue: '[]' })
    declare permissions: string[]; // ["read:domains", "write:posts", etc.]

    @Column({ type: DataType.DATE, allowNull: true })
    declare last_used_at: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare expires_at: Date;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare revoked: boolean;

    @Column({ type: DataType.STRING(50), allowNull: true })
    declare last_ip: string;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare last_user_agent: string;

    @CreatedAt
    declare created_at: Date;

    @UpdatedAt
    declare updated_at: Date;
}

export default ApiKey;
