import type { NextApiRequest, NextApiResponse } from 'next';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpServer } from '../../../lib/mcp';
import { getTransports } from '../../../lib/mcp-store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.status(405).end();
        return;
    }

    console.log('[MCP SSE] New connection attempt');

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('[MCP SSE] Missing Authorization header');
        res.status(401).end('Unauthorized: Missing Token');
        return;
    }
    const token = authHeader.replace('Bearer ', '').trim();

    // Initialize SSE Transport
    // The second argument 'res' allows the transport to write events directly to the response stream
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

    console.log(`[MCP SSE] Connection established. SessionId: ${transport.sessionId}`);

    // Handle client disconnect
    req.on('close', () => {
        console.log(`[MCP SSE] Connection closed. SessionId: ${transport.sessionId}`);
        server.close();
        transports.delete(transport.sessionId);
    });
}
