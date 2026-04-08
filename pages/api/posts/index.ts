/**
 * /api/posts
 * -----------
 * GET  ?domain_slug=…&status=…   — list posts in a domain
 * POST { domain_slug, postData } — create or update a post
 * DELETE ?id=…                    — delete a post
 *
 * All mutations automatically run the built-in SEO analyzer and store the
 * resulting score + report with the post, so the frontend always has fresh
 * SEO data without needing a separate API call.
 */
import { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import { getWorkspaceContext } from '../../../utils/workspaceContext';
import Post from '../../../database/models/post';
import Domain from '../../../database/models/domain';
import { analyzeSEO } from '../../../lib/seo/analyzer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = verifyUser(req, res);
    if (!auth.authorized) return res.status(401).json({ error: 'Unauthorized' });

    const ctx = await getWorkspaceContext(req, res);

    const findDomain = async (domain_slug: string) => {
        const where: any = { slug: domain_slug };
        if (ctx) where.workspace_id = ctx.workspaceId;
        else if (auth.userId) where.user_id = auth.userId;
        return Domain.findOne({ where });
    };

    if (req.method === 'GET') {
        try {
            const { domain_slug, status } = req.query;
            if (!domain_slug) return res.status(400).json({ error: 'Missing domain_slug' });
            const domain = await findDomain(domain_slug as string);
            if (!domain) return res.status(404).json({ error: 'Domain not found' });

            const whereClause: any = { domain_id: (domain as any).ID };
            if (status && status !== 'All') whereClause.status = (status as string).toLowerCase();

            const posts = await Post.findAll({ where: whereClause, order: [['updated_at', 'DESC']] });
            return res.status(200).json({ posts });
        } catch (error: any) {
            console.error('Error fetching posts:', error);
            return res.status(500).json({ error: 'Failed to fetch posts' });
        }
    }

    if (req.method === 'POST') {
        try {
            if (ctx && !ctx.can.write) return res.status(403).json({ error: 'No write access' });

            const { domain_slug, postData } = req.body || {};
            if (!domain_slug || !postData) return res.status(400).json({ error: 'Missing domain_slug or postData' });
            if (!postData.title || postData.title.trim() === '') return res.status(400).json({ error: 'Title is required' });
            if (!postData.content || postData.content.trim() === '' || postData.content === '<p><br></p>') {
                return res.status(400).json({ error: 'Content is required' });
            }
            if (postData.focus_keywords && Array.isArray(postData.focus_keywords) && postData.focus_keywords.length > 3) {
                return res.status(400).json({ error: 'Maximum 3 focus keywords allowed' });
            }

            const domain = await findDomain(domain_slug);
            if (!domain) return res.status(404).json({ error: 'Domain not found' });

            // Run SEO analyzer so the frontend never has to — single source of truth.
            const seoReport = analyzeSEO({
                title: postData.title,
                meta_description: postData.meta_description,
                content: postData.content,
                focus_keywords: postData.focus_keywords,
                slug: postData.slug
            });
            const seo_score = seoReport.score;

            let post: any;
            if (postData.id) {
                post = await Post.findOne({ where: { id: postData.id, domain_id: (domain as any).ID } });
            } else if (postData.slug) {
                post = await Post.findOne({ where: { slug: postData.slug, domain_id: (domain as any).ID } });
            }

            if (post) {
                await post.update({
                    title: postData.title,
                    content: postData.content,
                    featured_image: postData.featured_image,
                    meta_description: postData.meta_description,
                    focus_keywords: postData.focus_keywords,
                    status: postData.status || 'draft',
                    wp_post_id: postData.wp_post_id,
                    seo_score
                });
                return res.status(200).json({ message: 'Post updated', post, seo_report: seoReport });
            }

            const slug =
                postData.slug ||
                postData.title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                    .slice(0, 80);
            post = await Post.create({
                domain_id: (domain as any).ID,
                title: postData.title,
                slug,
                content: postData.content,
                featured_image: postData.featured_image,
                meta_description: postData.meta_description,
                focus_keywords: postData.focus_keywords,
                status: postData.status || 'draft',
                wp_post_id: postData.wp_post_id,
                seo_score
            });
            return res.status(201).json({ message: 'Post created', post, seo_report: seoReport });
        } catch (error: any) {
            console.error('Error saving post:', error);
            return res.status(500).json({ error: 'Failed to save post', details: error.message });
        }
    }

    if (req.method === 'DELETE') {
        try {
            if (ctx && !ctx.can.write) return res.status(403).json({ error: 'No write access' });
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'Missing id' });
            const post: any = await Post.findByPk(parseInt(String(id)));
            if (!post) return res.status(404).json({ error: 'Post not found' });
            const p = post.get({ plain: true });
            // Verify domain is in the workspace
            const domainWhere: any = { ID: p.domain_id };
            if (ctx) domainWhere.workspace_id = ctx.workspaceId;
            else if (auth.userId) domainWhere.user_id = auth.userId;
            const d = await Domain.findOne({ where: domainWhere });
            if (!d) return res.status(403).json({ error: 'Forbidden' });
            await post.destroy();
            return res.status(200).json({ ok: true });
        } catch (error: any) {
            console.error('Error deleting post:', error);
            return res.status(500).json({ error: 'Failed to delete post' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
