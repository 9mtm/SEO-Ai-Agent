/**
 * OAuth Token Authentication Helper
 * ----------------------------------
 * Validates a Bearer access_token issued by /api/oauth/token and returns
 * the associated user, workspace, and scopes. Use this in API routes that
 * should be callable by external OAuth-authenticated apps.
 *
 *   const auth = await verifyOAuthToken(req);
 *   if (!auth.valid) return res.status(401).json({ error: 'unauthorized' });
 *   if (!auth.scopes.includes('read:gsc')) return res.status(403).json({ error: 'insufficient_scope' });
 */
import type { NextApiRequest } from 'next';
import db from '../database/database';
import { sha256 } from '../lib/oauth/crypto';

export interface OAuthAuthResult {
    valid: boolean;
    userId?: number;
    workspaceId?: number | null;
    scopes: string[];
    clientId?: number;
    error?: string;
}

export async function verifyOAuthToken(req: NextApiRequest): Promise<OAuthAuthResult> {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return { valid: false, scopes: [], error: 'missing_token' };
    const token = authHeader.substring(7);
    if (!token) return { valid: false, scopes: [], error: 'missing_token' };

    const tokenHash = sha256(token);
    const [[row]]: any = await db.query(
        'SELECT * FROM oauth_access_tokens WHERE token_hash = ? AND revoked = 0 LIMIT 1',
        { replacements: [tokenHash] }
    );
    if (!row) return { valid: false, scopes: [], error: 'invalid_token' };
    if (new Date(row.expires_at) < new Date()) return { valid: false, scopes: [], error: 'token_expired' };

    let scopes: string[] = [];
    try { scopes = JSON.parse(row.scopes || '[]'); } catch { }

    // Update last_used_at without blocking
    db.query('UPDATE oauth_access_tokens SET last_used_at = NOW() WHERE id = ?', { replacements: [row.id] }).catch(() => { });

    return {
        valid: true,
        userId: row.user_id,
        workspaceId: row.workspace_id,
        clientId: row.client_id,
        scopes
    };
}

export function hasScope(auth: OAuthAuthResult, required: string): boolean {
    return auth.valid && auth.scopes.includes(required);
}
