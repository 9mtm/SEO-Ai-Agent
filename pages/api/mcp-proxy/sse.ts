import type { NextApiRequest, NextApiResponse } from 'next';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpServer } from '../../../lib/mcp';
import { getTransports } from '../../../lib/mcp-store';
import connection from '../../../database/database';
import ApiKey from '../../../database/models/apiKey';
import verifyUser from '../../../utils/verifyUser';

/**
 * ChatGPT MCP Proxy Endpoint
 * 
 * This endpoint allows ChatGPT to connect to the MCP server using session-based
 * authentication instead of API keys. The proxy:
 * 1. Validates the user's session
 * 2. Retrieves the user's API key from the database
 * 3. Injects the Bearer token automatically
 * 4. Relays SSE events between ChatGPT and the MCP server
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    console.log('[MCP Proxy] New ChatGPT connection attempt');

    try {
        // Initialize database
        await connection.sync();

        // Validate user session
        const { authorized, userId } = verifyUser(req, res);
        if (!authorized || !userId) {
            console.log('[MCP Proxy] No valid session found');
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Please login to SEO Agent'
            });
            return;
        }

        console.log(`[MCP Proxy] Valid session for user: ${userId}`);

        // Get user's API key from database
        const apiKey = await ApiKey.findOne({
            where: {
                user_id: userId,
                revoked: false
            },
            order: [['created_at', 'DESC']]
        });

        if (!apiKey) {
            console.log('[MCP Proxy] No API key found for user');
            res.status(403).json({
                error: 'No API key found',
                message: 'Please create an API key in your profile settings'
            });
            return;
        }

        // Decrypt the API key (using SECRET like rest of codebase)
        const crypto = require('crypto');
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from((process.env.SECRET || 'default-key-change-in-production-32b').padEnd(32, '0').slice(0, 32));
        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(apiKey.iv, 'hex'));
        let decryptedKey = decipher.update(apiKey.key_encrypted, 'hex', 'utf8');
        decryptedKey += decipher.final('utf8');

        console.log(`[MCP Proxy] Using API key ID: ${apiKey.id} for user: ${userId}`);

        // Initialize SSE Transport
        const transport = new SSEServerTransport('/api/mcp/message', res);

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        // Create and connect the MCP Server with the user's API key
        const server = createMcpServer(baseUrl, decryptedKey);
        await server.connect(transport);

        // Store the transport globally
        const transports = getTransports();
        transports.set(transport.sessionId, transport);

        console.log(`[MCP Proxy] Connection established. SessionId: ${transport.sessionId}, UserId: ${userId}`);

        // Set connection timeout (1 hour)
        const timeout = setTimeout(() => {
            console.log(`[MCP Proxy] Connection timeout for session: ${transport.sessionId}`);
            transports.delete(transport.sessionId);
            try {
                res.end();
            } catch (e) {
                // Connection already closed
            }
        }, 60 * 60 * 1000); // 1 hour

        // Cleanup on connection close
        req.on('close', () => {
            console.log(`[MCP Proxy] Client disconnected. SessionId: ${transport.sessionId}`);
            clearTimeout(timeout);
            transports.delete(transport.sessionId);
        });

        // Update API key last_used_at
        await apiKey.update({ last_used_at: new Date() });

    } catch (error: any) {
        console.error('[MCP Proxy] Error:', error);

        // Only send response if headers haven't been sent
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Proxy server error',
                message: error.message || 'An unexpected error occurred'
            });
        }
    }
}
