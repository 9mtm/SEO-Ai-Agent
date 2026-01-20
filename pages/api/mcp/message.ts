import type { NextApiRequest, NextApiResponse } from 'next';
import { getTransports } from '../../../lib/mcp-store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).end();
        return;
    }

    const { sessionId } = req.query;
    if (!sessionId || typeof sessionId !== 'string') {
        console.error('[MCP MESSAGE] Bad request: Missing sessionId');
        res.status(400).end('Missing sessionId');
        return;
    }

    const transports = getTransports();
    const transport = transports.get(sessionId);

    if (!transport) {
        console.error(`[MCP MESSAGE] Session not found: ${sessionId}`);
        res.status(404).json({
            error: 'Session not found',
            sessionId,
            timestamp: new Date().toISOString()
        });
        return;
    }

    try {
        console.log(`[MCP MESSAGE] Processing message for session: ${sessionId}`);
        await transport.handlePostMessage(req, res);
        console.log(`[MCP MESSAGE] Message processed successfully: ${sessionId}`);
    } catch (err: any) {
        console.error('[MCP MESSAGE] Error processing message:', {
            sessionId,
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });

        // Only send error response if headers haven't been sent
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Internal Error',
                message: err.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}
