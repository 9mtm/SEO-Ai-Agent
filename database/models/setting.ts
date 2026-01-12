import { Table, Model, Column, DataType, PrimaryKey, Unique } from 'sequelize-typescript';

@Table({
    timestamps: true,
    tableName: 'settings',
})
class Setting extends Model {
    @PrimaryKey
    @Unique
    @Column({ type: DataType.STRING, allowNull: false })
    declare key: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    value?: string;
}

export default Setting;
