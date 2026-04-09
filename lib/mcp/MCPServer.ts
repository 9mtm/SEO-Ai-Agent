/**
 * MCPServer
 * ---------
 * Native MCP (Model Context Protocol) JSON-RPC handler that lives inside the
 * Next.js backend — no separate npm package, no separate process.
 *
 * Authentication is layered:
 *   1. OAuth 2.0 access_token (Bearer) from /api/oauth/token
 *      → token's user_id, workspace_id, and scopes are used
 *   2. MCP API key (legacy) via existing utils/mcpAuth
 *      → key's user_id, with all scopes implicitly granted
 *
 * Both end up calling the same tool registry in `lib/mcp/tools.ts`, so
 * Claude Desktop / Cursor / any MCP-compatible client can connect directly
 * to `https://your-domain.com/api/mcp` over HTTPS.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { TOOLS, getTool, listTools, ToolContext } from './tools';
import { verifyOAuthToken } from '../../utils/oauthAuth';
import { validateMcpApiKey } from '../../utils/mcpAuth';
import db from '../../database/database';

interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: number | string | null;
    method: string;
    params?: any;
}

interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: number | string | null;
    result?: any;
    error?: { code: number; message: string; data?: any };
}

// Support both versions — respond with what the client requested
const SUPPORTED_VERSIONS = ['2025-06-18', '2024-11-05'];
const DEFAULT_PROTOCOL_VERSION = '2024-11-05'; // Claude uses this
const SERVER_INFO = {
    name: 'SEO AI Agent',
    title: 'SEO AI Agent',
    version: '1.0.0',
    icons: [
        { src: '/dpro_logo.png', sizes: 'any', mimeType: 'image/png' }
    ]
};

const ERR = {
    parse: -32700,
    invalidRequest: -32600,
    methodNotFound: -32601,
    invalidParams: -32602,
    internal: -32603,
    unauthorized: -32001
};

export class MCPServer {
    /**
     * Resolve who is calling this MCP request. Tries OAuth Bearer first,
     * then falls back to the existing MCP API key.
     */
    static async authenticate(req: NextApiRequest): Promise<ToolContext | null> {
        // 1. OAuth Bearer
        const oauth = await verifyOAuthToken(req);
        if (oauth.valid && oauth.userId) {
            // OAuth tokens carry workspace_id directly
            return {
                userId: oauth.userId,
                workspaceId: oauth.workspaceId || 0,
                scopes: oauth.scopes,
                source: 'oauth'
            };
        }

        // 2. MCP API key (legacy / first-party)
        const apiKeyAuth: any = await validateMcpApiKey(req as any, null as any);
        if (apiKeyAuth?.valid && apiKeyAuth.userId) {
            // Determine workspace: explicit header > user's current_workspace_id
            let wsId = 0;
            const headerWs = req.headers['x-workspace-id'];
            if (headerWs && typeof headerWs === 'string') wsId = parseInt(headerWs);
            if (!wsId) {
                const [[u]]: any = await db.query(
                    'SELECT current_workspace_id FROM users WHERE id = ?',
                    { replacements: [apiKeyAuth.userId] }
                );
                if (u?.current_workspace_id) wsId = u.current_workspace_id;
            }
            return {
                userId: apiKeyAuth.userId,
                workspaceId: wsId,
                scopes: [], // API keys carry no OAuth scopes — full access via permissions check
                source: 'mcp'
            };
        }

        return null;
    }

    /**
     * Top-level dispatcher for a JSON-RPC request.
     */
    static async dispatch(reqBody: JsonRpcRequest, ctx: ToolContext | null): Promise<JsonRpcResponse> {
        const id = reqBody.id ?? null;

        try {
            switch (reqBody.method) {
                case 'initialize': {
                    // Negotiate protocol version — use what the client requests if we support it
                    const clientVersion = reqBody.params?.protocolVersion;
                    const negotiatedVersion = (clientVersion && SUPPORTED_VERSIONS.includes(clientVersion))
                        ? clientVersion
                        : DEFAULT_PROTOCOL_VERSION;
                    return {
                        jsonrpc: '2.0',
                        id,
                        result: {
                            protocolVersion: negotiatedVersion,
                            capabilities: { tools: {}, resources: {}, prompts: {} },
                            serverInfo: SERVER_INFO
                        }
                    };
                }

                case 'ping':
                    return { jsonrpc: '2.0', id, result: {} };

                case 'tools/list':
                    if (!ctx) return mcpError(id, ERR.unauthorized, 'unauthorized');
                    return {
                        jsonrpc: '2.0',
                        id,
                        result: { tools: listTools() }
                    };

                case 'tools/call': {
                    if (!ctx) return mcpError(id, ERR.unauthorized, 'unauthorized');
                    const { name, arguments: args } = reqBody.params || {};
                    const tool = getTool(name);
                    if (!tool) return mcpError(id, ERR.methodNotFound, `tool not found: ${name}`);
                    try {
                        const result = await tool.execute(args || {}, ctx);
                        return {
                            jsonrpc: '2.0',
                            id,
                            result: {
                                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                                isError: false
                            }
                        };
                    } catch (e: any) {
                        return {
                            jsonrpc: '2.0',
                            id,
                            result: {
                                content: [{ type: 'text', text: e?.message || String(e) }],
                                isError: true
                            }
                        };
                    }
                }

                case 'resources/list':
                    return { jsonrpc: '2.0', id, result: { resources: [] } };

                case 'prompts/list':
                    return { jsonrpc: '2.0', id, result: { prompts: [] } };

                default:
                    return mcpError(id, ERR.methodNotFound, `unknown method: ${reqBody.method}`);
            }
        } catch (err: any) {
            return mcpError(id, ERR.internal, err?.message || 'internal error');
        }
    }
}

function mcpError(id: any, code: number, message: string, data?: any): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error: { code, message, data } };
}
