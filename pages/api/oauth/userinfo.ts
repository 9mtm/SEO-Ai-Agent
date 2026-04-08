/**
 * GET /api/oauth/userinfo
 * -----------------------
 * OpenID-style user info endpoint. Authenticates by Bearer access_token
 * and returns the user's basic profile (governed by `read:profile` scope)
 * along with the workspace the token is bound to.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import { sha256 } from '../../../lib/oauth/crypto';
import User from '../../../database/models/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
    await db.sync();

    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const token = authHeader.substring(7);
    if (!token) return res.status(401).json({ error: 'unauthorized' });

    const tokenHash = sha256(token);
    const [[row]]: any = await db.query(
        'SELECT * FROM oauth_access_tokens WHERE token_hash = ? AND revoked = 0 LIMIT 1',
        { replacements: [tokenHash] }
    );
    if (!row) return res.status(401).json({ error: 'invalid_token' });
    if (new Date(row.expires_at) < new Date()) return res.status(401).json({ error: 'token_expired' });

    let scopes: string[] = [];
    try { scopes = JSON.parse(row.scopes || '[]'); } catch { }

    if (!scopes.includes('read:profile')) {
        return res.status(403).json({ error: 'insufficient_scope', required: 'read:profile' });
    }

    const user: any = await User.findByPk(row.user_id);
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    // Update last_used
    await db.query('UPDATE oauth_access_tokens SET last_used_at = NOW() WHERE id = ?', { replacements: [row.id] });

    return res.status(200).json({
        sub: String(user.id),
        email: user.email,
        name: user.name,
        picture: user.picture,
        workspace_id: row.workspace_id,
        scopes
    });
}
