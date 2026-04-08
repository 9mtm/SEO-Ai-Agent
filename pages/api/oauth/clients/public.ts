/**
 * GET /api/oauth/clients/public?client_id=…
 * -----------------------------------------
 * Public (unauthenticated) lookup that returns just the display fields for
 * an OAuth client: name, description, logo, website. Used by the consent
 * screen to show "Authorize <app name>" before the user has any session
 * context with that client.
 *
 * Never returns client_secret, redirect_uris, or owner info.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../database/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
    await db.sync();

    const clientId = String(req.query.client_id || '');
    if (!clientId) return res.status(400).json({ error: 'client_id required' });

    const [[row]]: any = await db.query(
        `SELECT client_id, name, description, logo_url, website_url, client_type, allowed_scopes
         FROM oauth_clients
         WHERE client_id = ? AND is_active = 1
         LIMIT 1`,
        { replacements: [clientId] }
    );
    if (!row) return res.status(404).json({ error: 'not_found' });

    let scopes: string[] = [];
    try { scopes = JSON.parse(row.allowed_scopes || '[]'); } catch { }

    return res.status(200).json({
        client: {
            client_id: row.client_id,
            name: row.name,
            description: row.description,
            logo_url: row.logo_url,
            website_url: row.website_url,
            client_type: row.client_type,
            allowed_scopes: scopes
        }
    });
}
