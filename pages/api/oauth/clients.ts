/**
 * /api/oauth/clients
 * -------------------
 * Developer-facing CRUD for OAuth client registration.
 *
 *   GET    -> list my clients
 *   POST   -> register a new client (returns client_id + client_secret ONCE)
 *   PATCH  -> update name/redirect_uris/scopes/etc (?id=)
 *   DELETE -> revoke a client (?id=)
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import { randomToken, sha256 } from '../../../lib/oauth/crypto';
import { ALL_SCOPES, isValidScope } from '../../../lib/oauth/scopes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'GET') {
        const [rows]: any = await db.query(
            `SELECT id, client_id, name, description, logo_url, website_url, redirect_uris,
                    allowed_scopes, client_type, is_active, createdAt
             FROM oauth_clients WHERE owner_user_id = ?`,
            { replacements: [auth.userId] }
        );
        return res.status(200).json({
            clients: (rows || []).map((r: any) => ({
                ...r,
                redirect_uris: safeParse(r.redirect_uris, []),
                allowed_scopes: safeParse(r.allowed_scopes, [])
            }))
        });
    }

    if (req.method === 'POST') {
        const { name, description, logo_url, website_url, redirect_uris, scopes, client_type } = req.body || {};
        if (!name || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
            return res.status(400).json({ error: 'name and at least one redirect_uri are required' });
        }
        for (const uri of redirect_uris) {
            try { new URL(uri); } catch { return res.status(400).json({ error: `invalid redirect_uri: ${uri}` }); }
        }
        const requestedScopes: string[] = Array.isArray(scopes) ? scopes.filter(isValidScope) : [];
        const finalScopes = requestedScopes.length ? requestedScopes : ['read:profile'];

        const clientId = `client_${randomToken(12).replace(/[-_]/g, '').slice(0, 20)}`;
        const clientSecret = randomToken(32);
        const secretHash = sha256(clientSecret);
        const type = client_type === 'public' ? 'public' : 'confidential';

        await db.query(
            `INSERT INTO oauth_clients
             (client_id, client_secret_hash, name, description, logo_url, website_url,
              redirect_uris, allowed_scopes, owner_user_id, client_type, is_active, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            {
                replacements: [
                    clientId,
                    secretHash,
                    name,
                    description || null,
                    logo_url || null,
                    website_url || null,
                    JSON.stringify(redirect_uris),
                    JSON.stringify(finalScopes),
                    auth.userId,
                    type
                ]
            }
        );

        return res.status(201).json({
            client: {
                client_id: clientId,
                client_secret: clientSecret, // shown ONCE
                name,
                redirect_uris,
                allowed_scopes: finalScopes,
                client_type: type
            },
            warning: 'Save the client_secret now — it will not be shown again.'
        });
    }

    if (req.method === 'PATCH') {
        const id = parseInt(String(req.query.id || ''));
        if (!id) return res.status(400).json({ error: 'id required' });
        const [[row]]: any = await db.query(
            'SELECT * FROM oauth_clients WHERE id = ? AND owner_user_id = ? LIMIT 1',
            { replacements: [id, auth.userId] }
        );
        if (!row) return res.status(404).json({ error: 'not_found' });

        const updates: string[] = [];
        const params: any[] = [];
        const { name, description, logo_url, website_url, redirect_uris, scopes, is_active } = req.body || {};
        if (name) { updates.push('name = ?'); params.push(name); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (logo_url !== undefined) { updates.push('logo_url = ?'); params.push(logo_url); }
        if (website_url !== undefined) { updates.push('website_url = ?'); params.push(website_url); }
        if (Array.isArray(redirect_uris)) { updates.push('redirect_uris = ?'); params.push(JSON.stringify(redirect_uris)); }
        if (Array.isArray(scopes)) {
            const valid = scopes.filter(isValidScope);
            updates.push('allowed_scopes = ?');
            params.push(JSON.stringify(valid));
        }
        if (typeof is_active === 'boolean') { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
        if (!updates.length) return res.status(400).json({ error: 'no fields to update' });

        updates.push('updatedAt = NOW()');
        params.push(id);
        await db.query(`UPDATE oauth_clients SET ${updates.join(', ')} WHERE id = ?`, { replacements: params });
        return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
        const id = parseInt(String(req.query.id || ''));
        if (!id) return res.status(400).json({ error: 'id required' });
        await db.query('DELETE FROM oauth_clients WHERE id = ? AND owner_user_id = ?', {
            replacements: [id, auth.userId]
        });
        return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
}

function safeParse(s: any, fallback: any) {
    try { return JSON.parse(s); } catch { return fallback; }
}
