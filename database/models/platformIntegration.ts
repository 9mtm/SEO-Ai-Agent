import {
    Table,
    Model,
    Column,
    DataType,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import User from './user';

@Table({
    tableName: 'platform_integrations',
    timestamps: true,
})
class PlatformIntegration extends Model {
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare user_id: number;

    @BelongsTo(() => User)
    declare user: User;

    @Column({
        type: DataType.ENUM('wordpress', 'shopify', 'wix'),
        allowNull: false,
    })
    declare platform_type: string;

    @Column({ type: DataType.STRING, allowNull: false })
    declare platform_domain: string;

    @Column({ type: DataType.STRING, allowNull: false })
    declare platform_user_id: string;

    @Column({ type: DataType.STRING, allowNull: false })
    declare shared_secret: string;

    @Column({ type: DataType.JSON, allowNull: true })
    declare platform_metadata?: any;

    @Column({ type: DataType.BOOLEAN, defaultValue: true })
    declare is_active: boolean;

    @Column({ type: DataType.DATE, allowNull: true })
    declare last_login?: Date;
}

export default PlatformIntegration;
