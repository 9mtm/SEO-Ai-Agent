import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({
    timestamps: true,
    tableName: 'failed_jobs',
})
class FailedJob extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare id: number;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare payload: string; // The keyword or data that failed
}

export default FailedJob;
