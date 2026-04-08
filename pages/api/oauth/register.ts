/**
 * POST /api/oauth/register
 * -------------------------
 * RFC 7591 — OAuth 2.0 Dynamic Client Registration.
 *
 * Let MCP clients (Claude Desktop, Cursor, ChatGPT) register themselves
 * automatically when the user first connects. No human admin step.
 *
 * Body:
 *   {
 *     "client_name": "Claude Desktop",
 *     "redirect_uris": ["http://localhost:33418/callback"],
 *     "scope": "read:profile read:gsc ..."
 *   }
 *
 * Returns: client_id + client_secret (for confidential clients) or just
 * client_id (for public clients using PKCE — standard for desktop apps).
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import { randomToken, sha256 } from '../../../lib/oauth/crypto';
import { ALL_SCOPES, isValidScope } from '../../../lib/oauth/scopes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // CORS so Claude Desktop / Cursor can POST from their local contexts
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    await db.sync();

    const {
        client_name,
        redirect_uris,
        scope,
        token_endpoint_auth_method,
        application_type
    } = req.body || {};

    if (!client_name || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
        return res.status(400).json({ error: 'invalid_client_metadata', error_description: 'client_name and redirect_uris are required' });
    }
    for (const uri of redirect_uris) {
        try { new URL(uri); } catch {
            return res.status(400).json({ error: 'invalid_redirect_uri', error_description: `invalid: ${uri}` });
        }
    }

    // Parse scopes: space-separated string or array
    let requested: string[] = [];
    if (Array.isArray(scope)) requested = scope;
    else if (typeof scope === 'string') requested = scope.split(/\s+/).filter(Boolean);
    const finalScopes = (requested.length ? requested.filter(isValidScope) : ALL_SCOPES) as string[];

    // Desktop apps without client_secret → public clients (PKCE required).
    // Confidential clients get a secret.
    const isPublic =
        token_endpoint_auth_method === 'none' ||
        application_type === 'native' ||
        redirect_uris.some((u: string) => u.startsWith('http://localhost') || u.startsWith('http://127.0.0.1'));

    const clientId = `mcp_${randomToken(12).replace(/[-_]/g, '').slice(0, 24)}`;
    const clientSecret = isPublic ? '' : randomToken(32);
    const secretHash = isPublic ? '' : sha256(clientSecret);

    // Dynamically registered clients do NOT belong to any user (owner_user_id = 0)
    // because there's no logged-in session at registration time. We insert with
    // owner_user_id pointing to the system user (id = 1) or leave null if allowed.
    // For simplicity we point to user_id 1 (admin) — but the token, consent and
    // usage will still be bound to whichever end-user goes through /authorize.
    // Pick up optional logo_uri from the client's metadata (RFC 7591)
    const clientLogoUri = (req.body?.logo_uri && typeof req.body.logo_uri === 'string') ? req.body.logo_uri : null;

    await db.query(
        `INSERT INTO oauth_clients
         (client_id, client_secret_hash, name, description, logo_url, redirect_uris, allowed_scopes,
          owner_user_id, client_type, is_active, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        {
            replacements: [
                clientId,
                secretHash || 'public',
                client_name,
                'Dynamically registered via RFC 7591',
                clientLogoUri,
                JSON.stringify(redirect_uris),
                JSON.stringify(finalScopes),
                1,
                isPublic ? 'public' : 'confidential'
            ]
        }
    );

    // RFC 7591 response shape
    const response: any = {
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name,
        redirect_uris,
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: isPublic ? 'none' : 'client_secret_post',
        scope: finalScopes.join(' ')
    };
    if (!isPublic) {
        response.client_secret = clientSecret;
    }

    return res.status(201).json(response);
}
