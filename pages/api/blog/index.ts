import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import BlogPost from '../../../database/models/blogPost';
import BlogPostTranslation from '../../../database/models/blogPostTranslation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const category = req.query.category ? String(req.query.category) : undefined;
    const locale = req.query.locale ? String(req.query.locale) : 'en';

    const where: any = { status: 'published' };
    if (category) where.category = category;

    const posts = await BlogPost.findAll({
        where,
        include: [{
            model: BlogPostTranslation,
            as: 'translations',
            where: { locale },
            required: false, // LEFT JOIN — fallback to main post fields if no translation
        }],
        order: [['published_at', 'DESC']],
    });

    const result = posts.map((p: any) => {
        const plain = p.get({ plain: true });
        const t = plain.translations?.[0]; // The matching locale translation

        return {
            id: plain.id,
            title: t?.title || plain.title,
            slug: t?.slug || plain.slug,
            excerpt: t?.excerpt || plain.excerpt,
            featured_image: plain.featured_image,
            author_name: plain.author_name,
            author_avatar: plain.author_avatar,
            category: plain.category,
            tags: plain.tags,
            published_at: plain.published_at,
            reading_time: t?.reading_time || plain.reading_time,
            views_count: plain.views_count,
            meta_title: t?.meta_title || plain.meta_title,
            meta_description: t?.meta_description || plain.meta_description,
            locale: t?.locale || 'en',
        };
    });

    return res.status(200).json({ posts: result });
}
