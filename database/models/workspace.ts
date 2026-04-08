import { Table, Model, Column, DataType, PrimaryKey, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import User from './user';

@Table({ tableName: 'workspaces', timestamps: true })
class Workspace extends Model {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    declare id: number;

    @Column({ type: DataType.STRING(191), allowNull: false })
    declare name: string;

    @Column({ type: DataType.STRING(191), allowNull: false, unique: true })
    declare slug: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare owner_user_id: number;

    @Column({ type: DataType.STRING(50), defaultValue: 'free' })
    declare plan: string;

    @Column({ type: DataType.STRING(500), allowNull: true })
    declare logo_url?: string;

    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    declare is_personal: boolean;

    @BelongsTo(() => User, 'owner_user_id')
    declare owner: User;
}

export default Workspace;
