import { Table, Model, Column, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'blog_posts', timestamps: true })
class BlogPost extends Model {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    declare id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare title: string;

    @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
    declare slug: string;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare content: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare excerpt?: string;

    @Column({ type: DataType.STRING(500), allowNull: true })
    declare featured_image?: string;

    @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: 'SEO AI Agent' })
    declare author_name: string;

    @Column({ type: DataType.STRING(500), allowNull: true })
    declare author_avatar?: string;

    @Column({ type: DataType.STRING(100), allowNull: true })
    declare category?: string;

    @Column({ type: DataType.JSON, allowNull: true })
    declare tags?: string[];

    @Column({ type: DataType.ENUM('draft', 'published'), allowNull: false, defaultValue: 'draft' })
    declare status: 'draft' | 'published';

    @Column({ type: DataType.DATE, allowNull: true })
    declare published_at?: Date;

    @Column({ type: DataType.STRING(70), allowNull: true })
    declare meta_title?: string;

    @Column({ type: DataType.STRING(160), allowNull: true })
    declare meta_description?: string;

    @Column({ type: DataType.STRING(500), allowNull: true })
    declare canonical_url?: string;

    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    declare views_count: number;

    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    declare reading_time: number;

    @Column({ type: DataType.INTEGER, allowNull: true })
    declare author_user_id?: number;
}

export default BlogPost;
