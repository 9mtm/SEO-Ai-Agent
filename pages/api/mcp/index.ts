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
    // Compute origin for OAuth discovery hints
    const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
    const host = req.headers.host;
    const origin = `${proto}://${host}`;

    // CORS so Claude Desktop / Cursor (which call from localhost) can reach us
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Protocol-Version');
    res.setHeader('Access-Control-Expose-Headers', 'WWW-Authenticate');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        // Health check / server discovery
        return res.status(200).json({
            name: 'SEO AI Agent',
            version: '1.0.0',
            protocol: '2025-06-18',
            transport: 'http',
            endpoint: '/api/mcp',
            icon: `${origin}/dpro_logo.png`,
            authentication: ['oauth2', 'api_key'],
            authorization_server: origin,
            resource_metadata: `${origin}/.well-known/oauth-protected-resource`
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'method_not_allowed' });
    }

    await db.sync();

    const ctx = await MCPServer.authenticate(req);
    const body = req.body || {};

    // Unauthenticated → RFC 9728 challenge so MCP clients can start the
    // Authorization Code + PKCE flow with zero manual setup.
    // Exception: the "initialize" handshake is allowed without auth so the
    // client can learn our capabilities first.
    const isInitialize =
        (!Array.isArray(body) && body?.method === 'initialize') ||
        (Array.isArray(body) && body.every((b: any) => b?.method === 'initialize'));
    if (!ctx && !isInitialize) {
        res.setHeader(
            'WWW-Authenticate',
            `Bearer realm="MCP", resource_metadata="${origin}/.well-known/oauth-protected-resource"`
        );
        return res.status(401).json({
            jsonrpc: '2.0',
            id: body?.id ?? null,
            error: {
                code: -32001,
                message: 'unauthorized',
                data: {
                    authorization_url: `${origin}/.well-known/oauth-authorization-server`,
                    resource_metadata: `${origin}/.well-known/oauth-protected-resource`
                }
            }
        });
    }

    // Handle batch requests (JSON-RPC supports arrays)
    if (Array.isArray(body)) {
        const results = await Promise.all(body.map((r) => MCPServer.dispatch(r, ctx)));
        return res.status(200).json(results);
    }

    const result = await MCPServer.dispatch(body, ctx);
    return res.status(200).json(result);
}
