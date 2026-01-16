import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from './user';

@Table({
    timestamps: true,
    tableName: 'notification_settings',
})
class NotificationSetting extends Model {
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
    declare user_id: number;

    @Column({ type: DataType.STRING, allowNull: true })
    declare notification_email: string;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    declare email_alerts: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    declare weekly_report: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    declare marketing_emails: boolean;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    declare security_alerts: boolean;

    @BelongsTo(() => User)
    declare user: User;
}

export default NotificationSetting;
