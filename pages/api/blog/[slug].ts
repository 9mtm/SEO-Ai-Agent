import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import BlogPost from '../../../database/models/blogPost';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const slug = String(req.query.slug || '');
    const post: any = await BlogPost.findOne({ where: { slug, status: 'published' } });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Increment views (non-blocking)
    BlogPost.update({ views_count: (post.views_count || 0) + 1 }, { where: { id: post.id } }).catch(() => {});

    return res.status(200).json({ post: post.get({ plain: true }) });
}
