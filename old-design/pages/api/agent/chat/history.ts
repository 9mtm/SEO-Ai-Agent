import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../database/database';
import ChatMessage from '../../../../database/models/chatMessage';
import verifyUser from '../../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = verifyUser(req, res);
    if (!auth.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = auth;
    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
    }

    try {
        const messages = await ChatMessage.findAll({
            where: {
                userId,
                sessionId: parseInt(sessionId as string)
            },
            order: [['createdAt', 'ASC']],
        });

        const formattedMessages = messages.map(msg => ({
            id: msg.id.toString(),
            role: msg.role,
            content: msg.content
        }));

        return res.status(200).json(formattedMessages);
    } catch (error) {
        console.error('[History API] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch history' });
    }
}
