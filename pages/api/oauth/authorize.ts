/**
 * GET /api/oauth/authorize
 * -------------------------
 * Standard OAuth 2.0 Authorization Endpoint.
 *
 * Query params:
 *   - response_type=code           (required, must be "code")
 *   - client_id                    (required)
 *   - redirect_uri                 (required, must match a registered URI)
 *   - scope                        (space-separated)
 *   - state                        (CSRF protection — echoed back)
 *   - code_challenge               (PKCE)
 *   - code_challenge_method        ("S256" recommended)
 *
 * Behaviour:
 *   - If user not logged in -> redirect to /login?return=<this URL>
 *   - If valid + already consented -> issue code and redirect to redirect_uri
 *   - Else -> redirect to /oauth/consent?<token> for the user to approve
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import { parseScopes } from '../../../lib/oauth/scopes';
import { randomToken, sha256 } from '../../../lib/oauth/crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
    await db.sync();

    const {
        response_type,
        client_id,
        redirect_uri,
        scope,
        state,
        code_challenge,
        code_challenge_method
    } = req.query as Record<string, string>;

    if (response_type !== 'code') {
        return res.status(400).json({ error: 'unsupported_response_type' });
    }
    if (!client_id || !redirect_uri) {
        return res.status(400).json({ error: 'invalid_request', error_description: 'client_id and redirect_uri are required' });
    }

    // Find client
    const [[client]]: any = await db.query(
        'SELECT * FROM oauth_clients WHERE client_id = ? AND is_active = 1 LIMIT 1',
        { replacements: [client_id] }
    );
    if (!client) return res.status(400).json({ error: 'invalid_client' });

    // Validate redirect_uri against whitelist
    let allowedRedirects: string[] = [];
    try { allowedRedirects = JSON.parse(client.redirect_uris || '[]'); } catch { }
    if (!allowedRedirects.includes(redirect_uri)) {
        return res.status(400).json({ error: 'invalid_redirect_uri' });
    }

    // Validate requested scopes against client's allowed scopes
    let clientAllowedScopes: string[] = [];
    try { clientAllowedScopes = JSON.parse(client.allowed_scopes || '[]'); } catch { }
    const requestedScopes = parseScopes(scope);
    const finalScopes = requestedScopes.filter((s) => clientAllowedScopes.includes(s));

    // Public clients MUST use PKCE
    if (client.client_type === 'public' && !code_challenge) {
        return res.status(400).json({ error: 'invalid_request', error_description: 'code_challenge required for public clients' });
    }

    // Auth check
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) {
        // The login page reads `?redirect=` (not `?return=`); send it through
        // Google's `returnUrl` state so the callback lands us back here after
        // a successful sign-in and the OAuth flow resumes.
        const returnUrl = `/api/oauth/authorize?${new URLSearchParams(req.query as any).toString()}`;
        return res.redirect(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }

    // Check existing consent
    const [[consent]]: any = await db.query(
        'SELECT * FROM oauth_consents WHERE user_id = ? AND client_id = ? LIMIT 1',
        { replacements: [auth.userId, client.id] }
    );

    let alreadyConsented = false;
    if (consent) {
        try {
            const granted: string[] = JSON.parse(consent.scopes || '[]');
            alreadyConsented = finalScopes.every((s) => granted.includes(s));
        } catch { }
    }

    if (alreadyConsented) {
        // Issue code immediately
        const code = randomToken(32);
        const codeHash = sha256(code);
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 min

        // Get user's current workspace
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
        return res.redirect(url.toString());
    }

    // Redirect to consent screen with all params (state + scopes etc.)
    const consentUrl = `/oauth/consent?${new URLSearchParams(req.query as any).toString()}`;
    return res.redirect(consentUrl);
}
