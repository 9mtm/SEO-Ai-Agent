/**
 * GET    /api/oauth/personal-token — list my personal access tokens (masked)
 * POST   /api/oauth/personal-token — generate a new personal token (returned ONCE in plain text)
 * DELETE /api/oauth/personal-token?id=… — revoke a personal token
 *
 * Personal tokens are stored in the existing `api_keys` table with name prefix
 * "personal-" so we can distinguish them from OAuth app tokens.
 * The user can paste this token as `Authorization: Bearer …` in Claude Desktop,
 * Cursor, or any MCP client to connect directly without going through the
 * full OAuth flow.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Cryptr from 'cryptr';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import ApiKey from '../../../database/models/apiKey';

const ALL_PERMISSIONS = [
    'read:profile',
    'read:domains',
    'write:domains',
    'read:gsc',
    'read:keywords',
    'write:keywords',
    'read:analytics'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'GET') {
        const rows: any = await ApiKey.findAll({
            where: { user_id: auth.userId, revoked: false },
            order: [['created_at', 'DESC']]
        });
        return res.status(200).json({
            tokens: rows.map((r: any) => {
                const o = r.get({ plain: true });
                return {
                    id: o.id,
                    name: o.name,
                    permissions: o.permissions,
                    last_used_at: o.last_used_at,
                    created_at: o.created_at,
                    masked: `${String(o.key_hash).slice(0, 8)}…`
                };
            })
        });
    }

    if (req.method === 'POST') {
        const { name } = req.body || {};
        const cryptr = new Cryptr(process.env.SECRET as string);

        // Generate a random token, e.g. "sk_live_<48 hex chars>"
        const rawToken = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
        const keyHash = await bcrypt.hash(rawToken, 10);
        const keyEncrypted = cryptr.encrypt(rawToken);

        const created: any = await ApiKey.create({
            user_id: auth.userId,
            name: name || 'Personal Access Token',
            key_hash: keyHash,
            key_encrypted: keyEncrypted,
            permissions: ALL_PERMISSIONS,
            revoked: false
        } as any);

        return res.status(201).json({
            token: rawToken, // shown ONCE
            id: created.id,
            name: created.name,
            warning: 'Save this token now — it cannot be retrieved later.'
        });
    }

    if (req.method === 'DELETE') {
        const id = parseInt(String(req.query.id || ''));
        if (!id) return res.status(400).json({ error: 'id required' });
        await ApiKey.update(
            { revoked: true } as any,
            { where: { id, user_id: auth.userId } }
        );
        return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
}
