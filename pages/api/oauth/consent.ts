/**
 * POST /api/oauth/consent
 * ------------------------
 * Called by the consent screen UI when a logged-in user approves (or denies)
 * an OAuth authorization request.
 *
 * Body:
 *   { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method, approve }
 *
 * On approve: stores the consent, issues an authorization code, returns the
 * redirect URL the front-end should send the user to.
 * On deny:    returns the error redirect URL.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import { parseScopes } from '../../../lib/oauth/scopes';
import { randomToken, sha256 } from '../../../lib/oauth/crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    await db.sync();

    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'login_required' });

    const {
        client_id,
        redirect_uri,
        scope,
        state,
        code_challenge,
        code_challenge_method,
        approve
    } = req.body || {};

    if (!client_id || !redirect_uri) return res.status(400).json({ error: 'invalid_request' });

    const [[client]]: any = await db.query(
        'SELECT * FROM oauth_clients WHERE client_id = ? AND is_active = 1 LIMIT 1',
        { replacements: [client_id] }
    );
    if (!client) return res.status(400).json({ error: 'invalid_client' });

    let allowedRedirects: string[] = [];
    try { allowedRedirects = JSON.parse(client.redirect_uris || '[]'); } catch { }
    if (!allowedRedirects.includes(redirect_uri)) return res.status(400).json({ error: 'invalid_redirect_uri' });

    let clientAllowedScopes: string[] = [];
    try { clientAllowedScopes = JSON.parse(client.allowed_scopes || '[]'); } catch { }
    const requestedScopes = parseScopes(scope);
    const finalScopes = requestedScopes.filter((s) => clientAllowedScopes.includes(s));

    if (!approve) {
        const url = new URL(redirect_uri);
        url.searchParams.set('error', 'access_denied');
        if (state) url.searchParams.set('state', state);
        return res.status(200).json({ redirect: url.toString() });
    }

    // Persist consent (replace existing)
    await db.query(
        `INSERT INTO oauth_consents (user_id, client_id, scopes, granted_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE scopes = VALUES(scopes), granted_at = NOW()`,
        { replacements: [auth.userId, client.id, JSON.stringify(finalScopes)] }
    );

    // Issue authorization code
    const code = randomToken(32);
    const codeHash = sha256(code);
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    const [[u]]: any = await db.query('SELECT current_workspace_id FROM users WHERE id = ?', {
        replacements: [auth.userId]
    });

    await db.query(
        `INSERT INTO oauth_authorization_codes
         (code_hash, client_id, user_id, workspace_id, redirect_uri, scopes, code_challenge, code_challenge_method, expires_at, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        {
            replacements: [
                codeHash,
                client.id,
                auth.userId,
                u?.current_workspace_id || null,
                redirect_uri,
                JSON.stringify(finalScopes),
                code_challenge || null,
                code_challenge_method || null,
                expires
            ]
        }
    );

    const url = new URL(redirect_uri);
    url.searchParams.set('code', code);
    if (state) url.searchParams.set('state', state);
    return res.status(200).json({ redirect: url.toString() });
}
