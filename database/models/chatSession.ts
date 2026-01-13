import { Table, Model, Column, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import User from './user';
import ChatMessage from './chatMessage';

@Table({
    timestamps: true,
    tableName: 'chat_sessions',
})
class ChatSession extends Model {
    @Column({ type: DataType.STRING, allowNull: false })
    declare title: string;

    @Column({ type: DataType.STRING, allowNull: false })
    declare domain: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare userId: number;

    @BelongsTo(() => User)
    user?: User;

    @HasMany(() => ChatMessage)
    messages?: ChatMessage[];
}

export default ChatSession;
