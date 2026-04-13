import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import BlogPost from '../../../database/models/blogPost';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const category = req.query.category ? String(req.query.category) : undefined;
    const where: any = { status: 'published' };
    if (category) where.category = category;

    const posts = await BlogPost.findAll({
        where,
        order: [['published_at', 'DESC']],
        attributes: ['id', 'title', 'slug', 'excerpt', 'featured_image', 'author_name', 'author_avatar', 'category', 'tags', 'published_at', 'reading_time', 'views_count', 'meta_title', 'meta_description']
    });

    return res.status(200).json({ posts: posts.map((p: any) => p.get({ plain: true })) });
}
