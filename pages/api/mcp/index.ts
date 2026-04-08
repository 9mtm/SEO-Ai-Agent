/**
 * POST /api/mcp
 * --------------
 * Native MCP (Model Context Protocol) JSON-RPC endpoint.
 * Single endpoint that handles all MCP methods: initialize, tools/list,
 * tools/call, resources/list, prompts/list, ping.
 *
 * Authentication: OAuth Bearer access_token OR legacy MCP API key.
 *
 * Connect from Claude Desktop / Cursor by pointing the MCP client to:
 *   https://your-domain.com/api/mcp
 *
 * with header: Authorization: Bearer <access_token>
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import { MCPServer } from '../../../lib/mcp/MCPServer';

export const config = {
    api: {
        bodyParser: { sizeLimit: '2mb' }
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        // Health check / server discovery
        return res.status(200).json({
            name: 'seo-ai-agent-mcp',
            version: '1.0.0',
            protocol: '2024-11-05',
            transport: 'http',
            endpoint: '/api/mcp',
            authentication: ['oauth2', 'api_key']
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'method_not_allowed' });
    }

    await db.sync();

    const ctx = await MCPServer.authenticate(req);
    const body = req.body || {};

    // Handle batch requests (JSON-RPC supports arrays)
    if (Array.isArray(body)) {
        const results = await Promise.all(body.map((r) => MCPServer.dispatch(r, ctx)));
        return res.status(200).json(results);
    }

    const result = await MCPServer.dispatch(body, ctx);
    return res.status(200).json(result);
}
