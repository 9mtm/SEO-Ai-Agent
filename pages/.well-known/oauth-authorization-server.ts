import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * OAuth Discovery Endpoint (Well-Known)
 * 
 * ChatGPT looks for OAuth configuration at this standard path
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seo-agent.net';

    // Return OAuth 2.0 Authorization Server Metadata
    res.status(200).json({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/api/mcp-proxy/authorize`,
        token_endpoint: `${baseUrl}/api/mcp-proxy/token`,
        grant_types_supported: ['authorization_code'],
        response_types_supported: ['code'],
        scopes_supported: ['mcp'],
        token_endpoint_auth_methods_supported: ['none']
    });
}
