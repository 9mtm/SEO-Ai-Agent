import { Table, Model, Column, DataType, PrimaryKey, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Workspace from './workspace';
import User from './user';

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

@Table({ tableName: 'workspace_members', timestamps: false })
class WorkspaceMember extends Model {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    declare id: number;

    @ForeignKey(() => Workspace)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare workspace_id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare user_id: number;

    @Column({ type: DataType.ENUM('owner', 'admin', 'editor', 'viewer'), allowNull: false, defaultValue: 'viewer' })
    declare role: WorkspaceRole;

    @Column({ type: DataType.ENUM('active', 'suspended'), allowNull: false, defaultValue: 'active' })
    declare status: 'active' | 'suspended';

    @Column({ type: DataType.DATE, allowNull: false })
    declare joined_at: Date;

    @BelongsTo(() => Workspace)
    declare workspace: Workspace;

    @BelongsTo(() => User)
    declare user: User;
}

export default WorkspaceMember;
