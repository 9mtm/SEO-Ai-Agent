import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import ApiKey from '../../../database/models/apiKey';
import ApiAuditLog from '../../../database/models/apiAuditLog';

/**
 * Validate API Key and return user info + permissions
 * Used by MCP Server to authenticate requests
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }

        const apiKey = authHeader.substring(7); // Remove 'Bearer '

        if (!apiKey.startsWith('sk_live_')) {
            return res.status(401).json({ error: 'Invalid API key format' });
        }

        // Find all non-revoked keys for comparison
        const allKeys = await ApiKey.findAll({
            where: { revoked: false }
        });

        let matchedKey: ApiKey | null = null;

        // Compare hashed keys
        for (const key of allKeys) {
            const isMatch = await bcrypt.compare(apiKey, key.key_hash);
            if (isMatch) {
                matchedKey = key;
                break;
            }
        }

        if (!matchedKey) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        // Check if expired
        if (matchedKey.expires_at && new Date(matchedKey.expires_at) < new Date()) {
            return res.status(401).json({ error: 'API key has expired' });
        }

        // Update last used timestamp
        matchedKey.last_used_at = new Date();
        matchedKey.last_ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
        matchedKey.last_user_agent = req.headers['user-agent'] || '';
        await matchedKey.save();

        // Log the validation (optional)
        await ApiAuditLog.create({
            api_key_id: matchedKey.id,
            action: 'validate_key',
            success: true,
            ip_address: matchedKey.last_ip,
            user_agent: matchedKey.last_user_agent
        });

        // Return user info and permissions
        return res.status(200).json({
            valid: true,
            userId: matchedKey.user_id,
            permissions: matchedKey.permissions,
            keyName: matchedKey.name,
            expiresAt: matchedKey.expires_at
        });

    } catch (error: any) {
        console.error('API Key validation error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
