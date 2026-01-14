import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

interface NotificationLogAttributes {
    id: number;
    user_id: number | null;
    domain: string;
    notification_email: string;
    notification_type: 'daily' | 'weekly' | 'monthly';
    sent_at: Date;
    status: 'success' | 'failed' | 'pending';
    error_message: string | null;
    keywords_count: number | null;
    created_at?: Date;
    updated_at?: Date;
}

interface NotificationLogCreationAttributes extends Optional<NotificationLogAttributes, 'id' | 'user_id' | 'error_message' | 'keywords_count' | 'created_at' | 'updated_at'> { }

class NotificationLog extends Model<NotificationLogAttributes, NotificationLogCreationAttributes> implements NotificationLogAttributes {
    public id!: number;
    public user_id!: number | null;
    public domain!: string;
    public notification_email!: string;
    public notification_type!: 'daily' | 'weekly' | 'monthly';
    public sent_at!: Date;
    public status!: 'success' | 'failed' | 'pending';
    public error_message!: string | null;
    public keywords_count!: number | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

NotificationLog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        domain: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        notification_email: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        notification_type: {
            type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
            allowNull: false,
            defaultValue: 'monthly',
        },
        sent_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        status: {
            type: DataTypes.ENUM('success', 'failed', 'pending'),
            allowNull: false,
            defaultValue: 'success',
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        keywords_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'notification_logs',
        timestamps: true,
        underscored: true,
    }
);

export default NotificationLog;
