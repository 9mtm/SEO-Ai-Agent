import { Table, Model, Column, DataType, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Workspace from './workspace';
import User from './user';

@Table({ tableName: 'workspace_invitations', timestamps: true, updatedAt: false })
class WorkspaceInvitation extends Model {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    declare id: number;

    @ForeignKey(() => Workspace)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare workspace_id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare invited_by_user_id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare email: string;

    @Column({ type: DataType.ENUM('admin', 'editor', 'viewer'), allowNull: false, defaultValue: 'viewer' })
    declare role: 'admin' | 'editor' | 'viewer';

    @Column({ type: DataType.STRING(64), allowNull: false, unique: true })
    declare token: string;

    @Column({ type: DataType.ENUM('pending', 'accepted', 'revoked', 'expired'), allowNull: false, defaultValue: 'pending' })
    declare status: 'pending' | 'accepted' | 'revoked' | 'expired';

    @Column({ type: DataType.DATE, allowNull: false })
    declare expires_at: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare accepted_at?: Date;

    @BelongsTo(() => Workspace)
    declare workspace: Workspace;
}

export default WorkspaceInvitation;
