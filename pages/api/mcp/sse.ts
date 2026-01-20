import type { NextApiRequest, NextApiResponse } from 'next';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpServer } from '../../../lib/mcp';
import { getTransports } from '../../../lib/mcp-store';
import { validateMcpApiKey } from '../../../utils/mcpAuth';
import connection from '../../../database/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.status(405).end();
        return;
    }

    console.log('[MCP SSE] New connection attempt');

    // Initialize database
    await connection.sync();

    // Validate API Key
    const auth = await validateMcpApiKey(req as any, res);
    if (!auth.valid || !auth.userId || !auth.apiKeyId) {
        console.log('[MCP SSE] Invalid or missing API key');
        res.status(401).json({ error: 'Unauthorized: Invalid API key' });
        return;
    }

    console.log(`[MCP SSE] Valid API key for user: ${auth.userId}`);

    const authHeader = req.headers.authorization;
    const token = authHeader!.replace('Bearer ', '').trim();

    // Initialize SSE Transport with connection timeout
    const transport = new SSEServerTransport('/api/mcp/message', res);

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Create and connect the MCP Server
    const server = createMcpServer(baseUrl, token);
    await server.connect(transport);

    // Store the transport globally so the POST handler can access it
    const transports = getTransports();
    transports.set(transport.sessionId, transport);

    console.log(`[MCP SSE] Connection established. SessionId: ${transport.sessionId}, UserId: ${auth.userId}`);

    // Set connection timeout (1 hour)
    const timeout = setTimeout(() => {
        console.log(`[MCP SSE] Connection timeout. SessionId: ${transport.sessionId}`);
        server.close();
        transports.delete(transport.sessionId);
        try {
            res.end();
        } catch (e) {
            // Connection might already be closed
        }
    }, 3600000); // 1 hour

    // Handle client disconnect
    req.on('close', () => {
        clearTimeout(timeout);
        console.log(`[MCP SSE] Connection closed. SessionId: ${transport.sessionId}`);
        server.close();
        transports.delete(transport.sessionId);
    });
}
