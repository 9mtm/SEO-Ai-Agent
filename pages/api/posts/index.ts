import { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import Post from '../../../database/models/post';
import Domain from '../../../database/models/domain';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = verifyUser(req, res);
    if (!auth.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = auth.user;

    // Since verifyUser returns an object, we need to adapt usage.
    // Using user.userId for multi-tenant.

    if (req.method === 'POST') {
        try {
            const { domain_slug, postData } = req.body;

            if (!domain_slug || !postData) {
                return res.status(400).json({ error: 'Missing domain_slug or postData' });
            }

            // Validate required fields
            if (!postData.title || postData.title.trim() === '') {
                return res.status(400).json({ error: 'Title is required' });
            }

            if (!postData.content || postData.content.trim() === '' || postData.content === '<p><br></p>') {
                return res.status(400).json({ error: 'Content is required' });
            }

            // Validate focus keywords (max 3)
            if (postData.focus_keywords && Array.isArray(postData.focus_keywords)) {
                if (postData.focus_keywords.length > 3) {
                    return res.status(400).json({ error: 'Maximum 3 focus keywords allowed' });
                }
            }

            const domain = await Domain.findOne({ where: { slug: domain_slug, user_id: auth.userId } });
            if (!domain) {
                return res.status(404).json({ error: 'Domain not found' });
            }

            // Check if post exists (by slug or ID if provided)
            let post;
            if (postData.id) {
                post = await Post.findOne({ where: { id: postData.id, domain_id: domain.ID } });
            } else if (postData.slug) {
                post = await Post.findOne({ where: { slug: postData.slug, domain_id: domain.ID } });
            }

            if (post) {
                await post.update({
                    title: postData.title,
                    content: postData.content,
                    featured_image: postData.featured_image,
                    meta_description: postData.meta_description,
                    focus_keywords: postData.focus_keywords,
                    status: postData.status || 'draft',
                    wp_post_id: postData.wp_post_id
                });
                return res.status(200).json({ message: 'Post updated', post });
            } else {
                const slug = postData.slug || postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                post = await Post.create({
                    domain_id: domain.ID,
                    title: postData.title,
                    slug: slug,
                    content: postData.content,
                    featured_image: postData.featured_image,
                    meta_description: postData.meta_description,
                    focus_keywords: postData.focus_keywords,
                    status: postData.status || 'draft',
                    wp_post_id: postData.wp_post_id
                });
                return res.status(201).json({ message: 'Post created', post });
            }

        } catch (error: any) {
            console.error('Error saving post:', error);
            return res.status(500).json({ error: 'Failed to save post', details: error.message });
        }
    } else if (req.method === 'GET') {
        try {
            const { domain_slug, status } = req.query;

            if (!domain_slug) {
                return res.status(400).json({ error: 'Missing domain_slug' });
            }

            const domain = await Domain.findOne({ where: { slug: domain_slug, user_id: auth.userId } });
            if (!domain) {
                return res.status(404).json({ error: 'Domain not found' });
            }

            const whereClause: any = { domain_id: domain.ID };
            if (status && status !== 'All') {
                whereClause.status = (status as string).toLowerCase();
            }

            const posts = await Post.findAll({
                where: whereClause,
                order: [['updated_at', 'DESC']]
            });

            return res.status(200).json({ posts });

        } catch (error: any) {
            console.error('Error fetching posts:', error);
            return res.status(500).json({ error: 'Failed to fetch posts' });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
