import type { NextApiRequest, NextApiResponse } from 'next';
import { getTransports } from '../../../lib/mcp-store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).end();
        return;
    }

    const { sessionId } = req.query;
    if (!sessionId || typeof sessionId !== 'string') {
        res.status(400).end('Missing sessionId');
        return;
    }

    const transports = getTransports();
    const transport = transports.get(sessionId);

    if (!transport) {
        console.log(`[MCP MESSAGE] Session not found: ${sessionId}`);
        res.status(404).end('Session not found');
        return;
    }

    try {
        await transport.handlePostMessage(req, res);
    } catch (err) {
        console.error('[MCP MESSAGE] Error processing message:', err);
        res.status(500).end('Internal Error');
    }
}
