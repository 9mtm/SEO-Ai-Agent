import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import ChatSession from '../../../database/models/chatSession';
import ChatMessage from '../../../database/models/chatMessage';
import verifyUser from '../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = verifyUser(req, res);
    if (!auth.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = auth;
    const { domain } = req.query;

    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain is required' });
    }

    if (req.method === 'GET') {
        try {
            const sessions = await ChatSession.findAll({
                where: { userId, domain },
                order: [['updatedAt', 'DESC']],
            });
            return res.status(200).json(sessions);
        } catch (error) {
            console.error('[Sessions API] GET Error:', error);
            return res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { title } = req.body;
            const session = await ChatSession.create({
                userId,
                domain,
                title: title || 'New Chat',
            });
            return res.status(201).json(session);
        } catch (error) {
            console.error('[Sessions API] POST Error:', error);
            return res.status(500).json({ error: 'Failed to create session' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'Session ID is required' });

            await ChatSession.destroy({ where: { id, userId, domain } });
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('[Sessions API] DELETE Error:', error);
            return res.status(500).json({ error: 'Failed to delete session' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
