import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * OAuth Configuration Endpoint for ChatGPT MCP
 * 
 * Returns OAuth configuration that ChatGPT expects.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seo-agent.net';

    // Return OAuth configuration
    res.status(200).json({
        authorization_endpoint: `${baseUrl}/api/mcp-proxy/authorize`,
        token_endpoint: `${baseUrl}/api/mcp-proxy/token`,
        grant_types_supported: ['authorization_code'],
        response_types_supported: ['code'],
        scopes_supported: ['mcp']
    });
}
