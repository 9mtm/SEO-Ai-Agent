import type { NextApiResponse } from 'next';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Post from '../../../database/models/post';
import Domain from '../../../database/models/domain';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    // Validate API Key
    const auth = await validateMcpApiKey(req, res);
    if (!auth.valid || !auth.userId || !auth.apiKeyId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // GET - List posts
        if (req.method === 'GET') {
            if (!hasPermission(auth.permissions || [], 'read:posts')) {
                await logApiAction(auth.apiKeyId, 'list_posts', 'posts', false, null, 'Insufficient permissions', req);
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { domain_id } = req.query;

            let whereClause: any = {};

            if (domain_id) {
                // Verify domain belongs to user
                const domain = await Domain.findOne({
                    where: { id: domain_id, user_id: auth.userId }
                });
                if (!domain) {
                    return res.status(404).json({ error: 'Domain not found' });
                }
                whereClause.domain_id = domain_id;
            } else {
                // Get all domains for user
                const userDomains = await Domain.findAll({
                    where: { user_id: auth.userId },
                    attributes: ['id']
                });
                const domainIds = userDomains.map(d => d.id);
                whereClause.domain_id = domainIds;
            }

            const posts = await Post.findAll({
                where: whereClause,
                attributes: ['id', 'title', 'slug', 'content', 'meta_description', 'focus_keyword', 'status', 'domain_id', 'created_at'],
                order: [['created_at', 'DESC']],
                limit: 50,
            });

            await logApiAction(auth.apiKeyId, 'list_posts', 'posts', true, { count: posts.length }, undefined, req);
            return res.status(200).json({ posts });
        }

        // POST - Create post
        if (req.method === 'POST') {
            if (!hasPermission(auth.permissions || [], 'write:posts')) {
                await logApiAction(auth.apiKeyId, 'create_post', 'posts', false, null, 'Insufficient permissions', req);
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { domain_id, title, content, meta_description, focus_keyword } = req.body;

            if (!domain_id || !title || !content) {
                return res.status(400).json({ error: 'Missing required fields: domain_id, title, content' });
            }

            // Verify domain belongs to user
            const domain = await Domain.findOne({
                where: { id: domain_id, user_id: auth.userId }
            });

            if (!domain) {
                return res.status(404).json({ error: 'Domain not found' });
            }

            // Generate slug from title
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            // Create post
            const newPost = await Post.create({
                title,
                slug,
                content,
                meta_description: meta_description || '',
                focus_keyword: focus_keyword || '',
                status: 'draft',
                domain_id,
            });

            await logApiAction(
                auth.apiKeyId,
                'create_post',
                `post_${newPost.id}`,
                true,
                { title, domain_id },
                undefined,
                req
            );

            return res.status(201).json({
                message: 'Post created successfully',
                post: newPost,
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('MCP Posts error:', error);
        await logApiAction(auth.apiKeyId, req.method === 'POST' ? 'create_post' : 'list_posts', 'posts', false, null, error.message, req);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
