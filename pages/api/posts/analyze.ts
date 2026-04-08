/**
 * POST /api/posts/analyze
 * ------------------------
 * Run the SEO analyzer on ad-hoc content WITHOUT persisting a post.
 * Used by the editor to show real-time SEO feedback while the author is typing.
 *
 * Body: { title, meta_description, content, focus_keywords, slug }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import { analyzeSEO } from '../../../lib/seo/analyzer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const auth = verifyUser(req, res);
    if (!auth.authorized) return res.status(401).json({ error: 'Unauthorized' });

    const { title, meta_description, content, focus_keywords, slug, language } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: 'title and content are required' });

    const report = analyzeSEO({ title, meta_description, content, focus_keywords, slug, language });
    return res.status(200).json({ report });
}
