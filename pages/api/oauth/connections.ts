/**
 * GET    /api/oauth/connections       — list active external connections for the current user
 * DELETE /api/oauth/connections?client_id=…  — revoke ALL tokens issued to a given client for this user
 *
 * "Connections" here means: OAuth clients that have at least one non-revoked
 * access token belonging to the current user. This is what the user sees on
 * the Connected Apps page — it answers "which AI assistants / 3rd-party apps
 * are currently authorized to access my data".
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'GET') {
        const [rows]: any = await db.query(
            `SELECT
                c.id AS client_id,
                c.client_id AS client_key,
                c.name,
                c.description,
                c.logo_url,
                c.website_url,
                c.owner_user_id,
                COUNT(t.id) AS active_tokens,
                MIN(t.createdAt) AS first_authorized_at,
                MAX(t.last_used_at) AS last_used_at,
                MAX(t.createdAt) AS latest_token_at
             FROM oauth_access_tokens t
             INNER JOIN oauth_clients c ON c.id = t.client_id
             WHERE t.user_id = ? AND t.revoked = 0 AND t.expires_at > NOW()
             GROUP BY c.id
             ORDER BY latest_token_at DESC`,
            { replacements: [auth.userId] }
        );

        // For each client, fetch the distinct scopes across its active tokens
        const enriched: any[] = [];
        for (const r of rows || []) {
            const [scopeRows]: any = await db.query(
                `SELECT DISTINCT scopes FROM oauth_access_tokens
                 WHERE user_id = ? AND client_id = ? AND revoked = 0 AND expires_at > NOW()`,
                { replacements: [auth.userId, r.client_id] }
            );
            const scopes = new Set<string>();
            for (const s of scopeRows || []) {
                try { JSON.parse(s.scopes || '[]').forEach((x: string) => scopes.add(x)); } catch { }
            }
            enriched.push({
                id: r.client_id,
                client_id: r.client_key,
                name: r.name,
                description: r.description,
                logo_url: r.logo_url,
                website_url: r.website_url,
                is_own_app: r.owner_user_id === auth.userId,
                active_tokens: Number(r.active_tokens) || 0,
                first_authorized_at: r.first_authorized_at,
                last_used_at: r.last_used_at,
                scopes: Array.from(scopes)
            });
        }
        return res.status(200).json({ connections: enriched });
    }

    if (req.method === 'DELETE') {
        const clientId = parseInt(String(req.query.client_id || ''));
        if (!clientId) return res.status(400).json({ error: 'client_id required' });
        const [result]: any = await db.query(
            `UPDATE oauth_access_tokens SET revoked = 1
             WHERE user_id = ? AND client_id = ? AND revoked = 0`,
            { replacements: [auth.userId, clientId] }
        );
        // Also revoke refresh tokens
        await db.query(
            `UPDATE oauth_refresh_tokens SET revoked = 1
             WHERE user_id = ? AND client_id = ? AND revoked = 0`,
            { replacements: [auth.userId, clientId] }
        );
        return res.status(200).json({ ok: true, revoked: (result as any)?.affectedRows || 0 });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
}
