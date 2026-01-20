import { Model, DataTypes } from 'sequelize';
import connection from '../database';

class SearchAnalytics extends Model {
    public id!: number;
    public domain_id!: number;
    public date!: string;
    public keyword!: string;
    public country!: string;
    public device!: string;
    public page!: string;
    public clicks!: number;
    public impressions!: number;
    public ctr!: number;
    public position!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

SearchAnalytics.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        domain_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        keyword: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        country: {
            type: DataTypes.STRING,
            defaultValue: 'ALL',
        },
        device: {
            type: DataTypes.STRING,
            defaultValue: 'ALL',
        },
        page: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        clicks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        impressions: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        ctr: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        position: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
    },
    {
        sequelize: connection,
        tableName: 'search_analytics',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['domain_id', 'date', 'keyword', 'country', 'device'],
                name: 'unique_analytics_entry',
            },
            {
                fields: ['domain_id', 'date'],
            },
            {
                fields: ['keyword'],
            },
        ],
    }
);

export default SearchAnalytics;
