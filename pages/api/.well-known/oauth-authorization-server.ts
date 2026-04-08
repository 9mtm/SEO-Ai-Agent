/**
 * GET /.well-known/oauth-authorization-server
 * --------------------------------------------
 * RFC 8414 — OAuth 2.0 Authorization Server Metadata.
 *
 * MCP clients (Claude Desktop, Cursor, ChatGPT) fetch this document to learn
 * how to authenticate with us. They use it to discover the authorize, token,
 * and registration endpoints, then run the full Authorization Code + PKCE
 * flow automatically — no manual token copy.
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
        issuer: origin,
        service_name: 'SEO AI Agent',
        op_policy_uri: `${origin}/privacy`,
        op_tos_uri: `${origin}/terms`,
        logo_uri: `${origin}/dpro_logo.png`,
        authorization_endpoint: `${origin}/api/oauth/authorize`,
        token_endpoint: `${origin}/api/oauth/token`,
        registration_endpoint: `${origin}/api/oauth/register`,
        userinfo_endpoint: `${origin}/api/oauth/userinfo`,
        scopes_supported: [
            'read:profile',
            'read:domains',
            'write:domains',
            'read:gsc',
            'read:keywords',
            'write:keywords',
            'read:analytics'
        ],
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
        code_challenge_methods_supported: ['S256', 'plain'],
        service_documentation: `${origin}/mcp-seo`
    });
}
