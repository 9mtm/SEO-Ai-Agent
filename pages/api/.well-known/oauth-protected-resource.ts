/**
 * GET /.well-known/oauth-protected-resource
 * ------------------------------------------
 * RFC 9728 — OAuth 2.0 Protected Resource Metadata.
 *
 * Told to clients by the 401 WWW-Authenticate header that the MCP endpoint
 * returns. Tells them which authorization server to use to get a token.
 */
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
    const host = req.headers.host;
    const origin = `${proto}://${host}`;

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
        resource: `${origin}/api/mcp`,
        resource_name: 'SEO AI Agent',
        resource_documentation: `${origin}/mcp-seo`,
        logo_uri: `${origin}/dpro_logo.png`,
        authorization_servers: [origin],
        scopes_supported: [
            'read:profile',
            'read:domains',
            'write:domains',
            'read:gsc',
            'read:keywords',
            'write:keywords',
            'read:analytics'
        ],
        bearer_methods_supported: ['header']
    });
}
