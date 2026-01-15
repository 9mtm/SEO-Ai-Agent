import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import verifyUser from '../../../utils/verifyUser';
import ApiKey from '../../../database/models/apiKey';
import ApiAuditLog from '../../../database/models/apiAuditLog';
import { encrypt } from '../../../utils/encryption';

// Available permissions
export const AVAILABLE_PERMISSIONS = {
    'read:domains': 'View domain information',
    'read:keywords': 'View keywords data',
    'read:posts': 'View posts',
    'read:gsc': 'View Google Search Console data',
    'read:analytics': 'View analytics',
    'write:posts': 'Create and edit posts',
    'write:keywords': 'Add and update keywords',
    'write:settings': 'Modify domain settings',
    'delete:posts': 'Delete posts',
    'delete:keywords': 'Delete keywords',
    'publish:wordpress': 'Publish to WordPress',
    'admin:all': 'Full admin access'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const auth = await verifyUser(req, res);
        if (!auth.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // GET - List all API keys for user
        if (req.method === 'GET') {
            const keys = await ApiKey.findAll({
                where: { user_id: auth.userId },
                attributes: ['id', 'name', 'permissions', 'last_used_at', 'expires_at', 'revoked', 'created_at'],
                order: [['created_at', 'DESC']]
            });

            return res.status(200).json({ keys });
        }

        // POST - Create new API key
        if (req.method === 'POST') {
            const { name, permissions, expiresInDays } = req.body;

            if (!name || !permissions || !Array.isArray(permissions)) {
                return res.status(400).json({ error: 'Missing required fields: name, permissions' });
            }

            // Validate permissions
            const invalidPerms = permissions.filter(p => !AVAILABLE_PERMISSIONS[p as keyof typeof AVAILABLE_PERMISSIONS]);
            if (invalidPerms.length > 0) {
                return res.status(400).json({ error: `Invalid permissions: ${invalidPerms.join(', ')}` });
            }

            // Generate API key (sk_live_...)
            const randomBytes = crypto.randomBytes(32).toString('hex');
            const apiKey = `sk_live_${randomBytes}`;

            // Hash the key for validation
            const keyHash = await bcrypt.hash(apiKey, 10);

            // Encrypt the key for storage
            const keyEncrypted = encrypt(apiKey);

            // Calculate expiration
            let expiresAt = null;
            if (expiresInDays && expiresInDays > 0) {
                expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + expiresInDays);
            }

            // Create API key record
            const newKey = await ApiKey.create({
                user_id: auth.userId,
                key_hash: keyHash,
                key_encrypted: keyEncrypted,
                name,
                permissions,
                expires_at: expiresAt,
                revoked: false
            });

            // Return the plain API key ONLY once
            return res.status(201).json({
                message: 'API key created successfully',
                apiKey, // Plain key - shown only once!
                keyInfo: {
                    id: newKey.id,
                    name: newKey.name,
                    permissions: newKey.permissions,
                    expires_at: newKey.expires_at,
                    created_at: newKey.created_at
                }
            });
        }

        // PUT - Update API key (revoke, update permissions, etc.)
        if (req.method === 'PUT') {
            const { keyId, revoked, permissions, name } = req.body;

            if (!keyId) {
                return res.status(400).json({ error: 'Missing keyId' });
            }

            const apiKey = await ApiKey.findOne({
                where: { id: keyId, user_id: auth.userId }
            });

            if (!apiKey) {
                return res.status(404).json({ error: 'API key not found' });
            }

            // Update fields
            if (revoked !== undefined) apiKey.revoked = revoked;
            if (permissions) {
                const invalidPerms = permissions.filter((p: string) => !AVAILABLE_PERMISSIONS[p as keyof typeof AVAILABLE_PERMISSIONS]);
                if (invalidPerms.length > 0) {
                    return res.status(400).json({ error: `Invalid permissions: ${invalidPerms.join(', ')}` });
                }
                apiKey.permissions = permissions;
            }
            if (name) apiKey.name = name;

            await apiKey.save();

            return res.status(200).json({
                message: 'API key updated successfully',
                key: {
                    id: apiKey.id,
                    name: apiKey.name,
                    permissions: apiKey.permissions,
                    revoked: apiKey.revoked
                }
            });
        }

        // DELETE - Delete API key
        if (req.method === 'DELETE') {
            const { keyId } = req.query;

            if (!keyId) {
                return res.status(400).json({ error: 'Missing keyId' });
            }

            const apiKey = await ApiKey.findOne({
                where: { id: keyId, user_id: auth.userId }
            });

            if (!apiKey) {
                return res.status(404).json({ error: 'API key not found' });
            }

            await apiKey.destroy();

            return res.status(200).json({ message: 'API key deleted successfully' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error: any) {
        console.error('API Keys error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
