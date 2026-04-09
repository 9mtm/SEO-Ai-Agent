/**
 * POST /api/oauth/token
 * ---------------------
 * OAuth 2.0 Token Endpoint. Exchanges an authorization_code (or refresh_token)
 * for an access_token + refresh_token pair.
 *
 * Supported grant types:
 *   - authorization_code   (with PKCE for public clients)
 *   - refresh_token
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import { randomToken, sha256, safeEqual, verifyPkce } from '../../../lib/oauth/crypto';

const ACCESS_TTL_MS = 365 * 24 * 60 * 60 * 1000;  // 1 year
const REFRESH_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // CORS — Claude sends the token request from its own origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    await db.sync();

    // Accept both JSON and form-urlencoded (OAuth spec requires form-urlencoded,
    // but some clients send JSON). Next.js parses both into req.body.
    const body = (req.body || {}) as Record<string, string>;
    const grant_type = body.grant_type;

    if (grant_type === 'authorization_code') return handleAuthorizationCode(body, res);
    if (grant_type === 'refresh_token') return handleRefreshToken(body, res);
    return res.status(400).json({ error: 'unsupported_grant_type' });
}

async function authenticateClient(client_id: string, client_secret?: string) {
    const [[client]]: any = await db.query(
        'SELECT * FROM oauth_clients WHERE client_id = ? AND is_active = 1 LIMIT 1',
        { replacements: [client_id] }
    );
    if (!client) return null;
    if (client.client_type === 'confidential') {
        if (!client_secret) return null;
        if (!safeEqual(sha256(client_secret), client.client_secret_hash)) return null;
    }
    return client;
}

async function issueTokenPair(client: any, user_id: number, workspace_id: number | null, scopes: string[]) {
    const accessRaw = randomToken(32);
    const refreshRaw = randomToken(32);
    const accessHash = sha256(accessRaw);
    const refreshHash = sha256(refreshRaw);
    const accessExp = new Date(Date.now() + ACCESS_TTL_MS);
    const refreshExp = new Date(Date.now() + REFRESH_TTL_MS);

    const [accessId]: any = await db.query(
        `INSERT INTO oauth_access_tokens
         (token_hash, client_id, user_id, workspace_id, scopes, expires_at, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        { replacements: [accessHash, client.id, user_id, workspace_id, JSON.stringify(scopes), accessExp] }
    );

    await db.query(
        `INSERT INTO oauth_refresh_tokens
         (token_hash, access_token_id, client_id, user_id, expires_at, createdAt)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        { replacements: [refreshHash, accessId, client.id, user_id, refreshExp] }
    );

    return {
        access_token: accessRaw,
        refresh_token: refreshRaw,
        token_type: 'Bearer',
        expires_in: ACCESS_TTL_MS / 1000,
        scope: scopes.join(' ')
    };
}

async function handleAuthorizationCode(body: Record<string, string>, res: NextApiResponse) {
    const { code, redirect_uri, client_id, client_secret, code_verifier } = body;
    if (!code || !redirect_uri || !client_id) return res.status(400).json({ error: 'invalid_request' });

    const client = await authenticateClient(client_id, client_secret);
    if (!client) return res.status(401).json({ error: 'invalid_client' });

    const codeHash = sha256(code);
    const [[row]]: any = await db.query(
        'SELECT * FROM oauth_authorization_codes WHERE code_hash = ? LIMIT 1',
        { replacements: [codeHash] }
    );
    if (!row) return res.status(400).json({ error: 'invalid_grant' });
    if (row.used_at) return res.status(400).json({ error: 'invalid_grant', error_description: 'code already used' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'invalid_grant', error_description: 'expired' });
    if (row.client_id !== client.id) return res.status(400).json({ error: 'invalid_grant' });
    if (row.redirect_uri !== redirect_uri) return res.status(400).json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' });

    if (row.code_challenge) {
        if (!code_verifier) return res.status(400).json({ error: 'invalid_grant', error_description: 'code_verifier required' });
        const ok = verifyPkce(code_verifier, row.code_challenge, row.code_challenge_method || 'S256');
        if (!ok) return res.status(400).json({ error: 'invalid_grant', error_description: 'pkce verification failed' });
    }

    await db.query('UPDATE oauth_authorization_codes SET used_at = NOW() WHERE id = ?', { replacements: [row.id] });

    let scopes: string[] = [];
    try { scopes = JSON.parse(row.scopes || '[]'); } catch { }

    const tokens = await issueTokenPair(client, row.user_id, row.workspace_id, scopes);
    return res.status(200).json(tokens);
}

async function handleRefreshToken(body: Record<string, string>, res: NextApiResponse) {
    const { refresh_token, client_id, client_secret } = body;
    if (!refresh_token || !client_id) return res.status(400).json({ error: 'invalid_request' });

    const client = await authenticateClient(client_id, client_secret);
    if (!client) return res.status(401).json({ error: 'invalid_client' });

    const tokenHash = sha256(refresh_token);
    const [[row]]: any = await db.query(
        'SELECT * FROM oauth_refresh_tokens WHERE token_hash = ? LIMIT 1',
        { replacements: [tokenHash] }
    );
    if (!row || row.revoked) return res.status(400).json({ error: 'invalid_grant' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'invalid_grant', error_description: 'expired' });
    if (row.client_id !== client.id) return res.status(400).json({ error: 'invalid_grant' });

    const [[oldAccess]]: any = await db.query(
        'SELECT * FROM oauth_access_tokens WHERE id = ?',
        { replacements: [row.access_token_id] }
    );
    let scopes: string[] = [];
    try { scopes = JSON.parse(oldAccess?.scopes || '[]'); } catch { }

    // Rotation: revoke old pair
    await db.query('UPDATE oauth_refresh_tokens SET revoked = 1 WHERE id = ?', { replacements: [row.id] });
    await db.query('UPDATE oauth_access_tokens SET revoked = 1 WHERE id = ?', { replacements: [row.access_token_id] });

    const tokens = await issueTokenPair(client, row.user_id, oldAccess?.workspace_id || null, scopes);
    return res.status(200).json(tokens);
}
