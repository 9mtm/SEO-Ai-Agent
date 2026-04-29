import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../../database/database';
import BlogPost from '../../../database/models/blogPost';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader.substring('Bearer '.length) !== process.env.APIKEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    await db.sync();

    const due = await BlogPost.findAll({
        where: {
            status: 'scheduled',
            scheduled_for: { [Op.lte]: new Date() },
        } as any,
    });

    const results: { id: number; slug: string }[] = [];
    for (const post of due as any[]) {
        await post.update({
            status: 'published',
            published_at: new Date(),
            scheduled_for: null,
        });
        results.push({ id: post.id, slug: post.slug });
    }

    return res.status(200).json({ ok: true, published: results.length, posts: results });
}
