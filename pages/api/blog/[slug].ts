import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import BlogPost from '../../../database/models/blogPost';
import BlogPostTranslation from '../../../database/models/blogPostTranslation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const slug = String(req.query.slug || '');
    const locale = req.query.locale ? String(req.query.locale) : 'en';

    // First try to find by translation slug
    const translation = await BlogPostTranslation.findOne({
        where: { slug, locale },
        include: [{ model: BlogPost, as: 'post', where: { status: 'published' } }],
    });

    let post: any;
    let matchedTranslation: any;

    if (translation) {
        post = (translation as any).post;
        matchedTranslation = translation;
    } else {
        // Fallback: find by main post slug, then get translation
        post = await BlogPost.findOne({
            where: { slug, status: 'published' },
            include: [{ model: BlogPostTranslation, as: 'translations', where: { locale }, required: false }],
        });
        if (post) {
            matchedTranslation = (post as any).translations?.[0];
        }
    }

    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Increment views (non-blocking)
    BlogPost.update({ views_count: (post.views_count || 0) + 1 }, { where: { id: post.id } }).catch(() => {});

    const plain = post.get({ plain: true });
    const t = matchedTranslation ? (matchedTranslation.get ? matchedTranslation.get({ plain: true }) : matchedTranslation) : null;

    return res.status(200).json({
        post: {
            ...plain,
            title: t?.title || plain.title,
            slug: t?.slug || plain.slug,
            content: t?.content || plain.content,
            excerpt: t?.excerpt || plain.excerpt,
            meta_title: t?.meta_title || plain.meta_title,
            meta_description: t?.meta_description || plain.meta_description,
            reading_time: t?.reading_time || plain.reading_time,
            locale: t?.locale || 'en',
            translations: undefined, // Don't expose raw translations array
        },
    });
}
