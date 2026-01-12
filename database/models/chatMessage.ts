import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from './user';
import ChatSession from './chatSession';

@Table({
    timestamps: true,
    tableName: 'chat_messages',
})
class ChatMessage extends Model {
    @Column({ type: DataType.TEXT, allowNull: false })
    content!: string;

    @Column({ type: DataType.ENUM('user', 'assistant', 'system'), allowNull: false })
    role!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    domain!: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: true })
    userId?: number;

    @BelongsTo(() => User)
    user?: User;

    @ForeignKey(() => ChatSession)
    @Column({ type: DataType.INTEGER, allowNull: true })
    sessionId?: number;

    @BelongsTo(() => ChatSession)
    session?: ChatSession;
}

export default ChatMessage;
