import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';
import BlogPost from '../../../database/models/blogPost';
import BlogPostTranslation from '../../../database/models/blogPostTranslation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });
    const admin: any = await User.findByPk(auth.userId);
    if (!admin?.is_super_admin) return res.status(403).json({ error: 'Forbidden' });

    if (req.method === 'GET') {
        const posts = await BlogPost.findAll({
            include: [{ model: BlogPostTranslation, as: 'translations' }],
            order: [['createdAt', 'DESC']],
        });
        return res.status(200).json({ posts: posts.map((p: any) => p.get({ plain: true })) });
    }

    if (req.method === 'POST') {
        const { title, content, excerpt, featured_image, category, tags, status, meta_title, meta_description, locale } = req.body;
        const lang = locale || 'en';

        if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

        const slug = (req.body.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
        const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
        const readingTime = Math.max(1, Math.round(wordCount / 200));
        const autoExcerpt = excerpt || content.replace(/<[^>]+>/g, ' ').slice(0, 160).trim();

        // Create the main blog post (shared fields)
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
            author_user_id: auth.userId,
        } as any);

        // Create translation for the initial language
        await BlogPostTranslation.create({
            blog_post_id: post.id,
            locale: lang,
            title,
            slug,
            content,
            excerpt: autoExcerpt,
            meta_title: meta_title || title.slice(0, 70),
            meta_description: meta_description || autoExcerpt.slice(0, 160),
            reading_time: readingTime,
        });

        const result = await BlogPost.findByPk(post.id, { include: [{ model: BlogPostTranslation, as: 'translations' }] });
        return res.status(201).json({ post: result?.get({ plain: true }) });
    }

    if (req.method === 'PATCH') {
        const { id, locale, ...updates } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });

        const post: any = await BlogPost.findByPk(id);
        if (!post) return res.status(404).json({ error: 'Not found' });

        const lang = locale || 'en';

        // Update shared fields on the main post
        const sharedUpdates: any = {};
        if (updates.featured_image !== undefined) sharedUpdates.featured_image = updates.featured_image;
        if (updates.category !== undefined) sharedUpdates.category = updates.category;
        if (updates.tags !== undefined) sharedUpdates.tags = updates.tags;
        if (updates.status !== undefined) {
            sharedUpdates.status = updates.status;
            if (updates.status === 'published' && !post.published_at) sharedUpdates.published_at = new Date();
        }
        if (Object.keys(sharedUpdates).length > 0) {
            await post.update(sharedUpdates);
        }

        // Update or create translation for this locale
        if (updates.title || updates.content || updates.excerpt || updates.meta_title || updates.meta_description || updates.slug) {
            const slug = (updates.slug || updates.title || post.slug).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
            const content = updates.content || '';
            const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
            const readingTime = Math.max(1, Math.round(wordCount / 200));
            const autoExcerpt = updates.excerpt || content.replace(/<[^>]+>/g, ' ').slice(0, 160).trim();

            const translationData = {
                title: updates.title || post.title,
                slug,
                content,
                excerpt: autoExcerpt,
                meta_title: updates.meta_title || (updates.title || post.title).slice(0, 70),
                meta_description: updates.meta_description || autoExcerpt.slice(0, 160),
                reading_time: readingTime,
            };

            const [translation, created] = await BlogPostTranslation.findOrCreate({
                where: { blog_post_id: id, locale: lang },
                defaults: { blog_post_id: id, locale: lang, ...translationData },
            });

            if (!created) {
                await translation.update(translationData);
            }

            // Also update main post title/slug/content with the primary language (en) for backwards compat
            if (lang === 'en') {
                await post.update({
                    title: translationData.title,
                    slug: translationData.slug,
                    content: translationData.content,
                    excerpt: translationData.excerpt,
                    meta_title: translationData.meta_title,
                    meta_description: translationData.meta_description,
                    reading_time: translationData.reading_time,
                });
            }
        }

        const result = await BlogPost.findByPk(id, { include: [{ model: BlogPostTranslation, as: 'translations' }] });
        return res.status(200).json({ post: result?.get({ plain: true }) });
    }

    if (req.method === 'DELETE') {
        const id = parseInt(String(req.query.id || ''));
        if (!id) return res.status(400).json({ error: 'id required' });
        // Translations cascade-delete via FK
        await BlogPost.destroy({ where: { id } });
        return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
