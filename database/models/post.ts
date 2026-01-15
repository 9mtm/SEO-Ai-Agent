import { Table, Model, Column, DataType, PrimaryKey, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import Domain from './domain';

@Table({
    timestamps: true,
    tableName: 'posts',
})

class Post extends Model {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
    declare id: number;

    @ForeignKey(() => Domain)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare domain_id: number;

    @Column({ type: DataType.STRING, allowNull: false })
    declare title: string;

    @Column({ type: DataType.STRING, allowNull: false })
    declare slug: string;

    @Column({ type: DataType.TEXT('long'), allowNull: true })
    declare content: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare featured_image: string;

    @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'draft' })
    declare status: string; // 'draft', 'published'

    @Column({ type: DataType.TEXT, allowNull: true })
    declare meta_description: string;

    @Column({ type: DataType.JSON, allowNull: true })
    declare focus_keywords: string[];

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare wp_post_id: number;

    @CreatedAt
    declare created_at: Date;

    @UpdatedAt
    declare updated_at: Date;

    @BelongsTo(() => Domain)
    declare domain: Domain;
}

export default Post;
