import {
  Table, Model, Column, DataType, PrimaryKey, AutoIncrement,
  ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import BlogPost from './blogPost';

@Table({ timestamps: true, tableName: 'blog_post_translations' })
class BlogPostTranslation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare id: number;

  @ForeignKey(() => BlogPost)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare blog_post_id: number;

  @Column({ type: DataType.STRING(5), allowNull: false })
  declare locale: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare slug: string;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  declare content?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare excerpt?: string;

  @Column({ type: DataType.STRING(70), allowNull: true })
  declare meta_title?: string;

  @Column({ type: DataType.STRING(160), allowNull: true })
  declare meta_description?: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare reading_time: number;

  @BelongsTo(() => BlogPost, 'blog_post_id')
  declare post: BlogPost;
}

export default BlogPostTranslation;
