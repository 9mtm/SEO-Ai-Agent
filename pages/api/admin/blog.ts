import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';
import BlogPost from '../../../database/models/blogPost';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });
    const admin: any = await User.findByPk(auth.userId);
    if (!admin?.is_super_admin) return res.status(403).json({ error: 'Forbidden' });

    if (req.method === 'GET') {
        const posts = await BlogPost.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json({ posts: posts.map((p: any) => p.get({ plain: true })) });
    }

    if (req.method === 'POST') {
        const { title, content, excerpt, featured_image, category, tags, status, meta_title, meta_description } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

        const slug = (req.body.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
        const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
        const readingTime = Math.max(1, Math.round(wordCount / 200));
        const autoExcerpt = excerpt || content.replace(/<[^>]+>/g, ' ').slice(0, 160).trim();

        const post = await BlogPost.create({
            title, slug, content,
            excerpt: autoExcerpt,
            featured_image, category,
            tags: tags || [],
            status: status || 'draft',
            published_at: status === 'published' ? new Date() : null,
            meta_title: meta_title || title.slice(0, 70),
            meta_description: meta_description || autoExcerpt.slice(0, 160),
            reading_time: readingTime,
            author_name: admin.name || 'Admin',
            author_avatar: admin.picture || null,
            author_user_id: auth.userId
        } as any);

        return res.status(201).json({ post: post.get({ plain: true }) });
    }

    if (req.method === 'PATCH') {
        const { id, ...updates } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        const post: any = await BlogPost.findByPk(id);
        if (!post) return res.status(404).json({ error: 'Not found' });

        if (updates.status === 'published' && !post.published_at) {
            updates.published_at = new Date();
        }
        if (updates.content) {
            const wc = updates.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
            updates.reading_time = Math.max(1, Math.round(wc / 200));
        }
        if (updates.title && !updates.meta_title) {
            updates.meta_title = updates.title.slice(0, 70);
        }

        await post.update(updates);
        return res.status(200).json({ post: post.get({ plain: true }) });
    }

    if (req.method === 'DELETE') {
        const id = parseInt(String(req.query.id || ''));
        if (!id) return res.status(400).json({ error: 'id required' });
        await BlogPost.destroy({ where: { id } });
        return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
