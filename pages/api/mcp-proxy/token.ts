import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import ApiKey from '../../../database/models/apiKey';
import { authCodes } from '../../../lib/oauth-store';

/**
 * OAuth Token Endpoint for ChatGPT MCP
 * 
 * Exchanges authorization code for access token.
 * The access token is actually the user's API key.
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { code, grant_type } = req.body;

        if (grant_type !== 'authorization_code') {
            res.status(400).json({ error: 'unsupported_grant_type' });
            return;
        }

        if (!code) {
            res.status(400).json({ error: 'invalid_request', error_description: 'Missing code' });
            return;
        }

        // Verify auth code
        const authData = authCodes.get(code);

        if (!authData) {
            res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired code' });
            return;
        }

        // Check expiration
        if (Date.now() > authData.expiresAt) {
            authCodes.delete(code);
            res.status(400).json({ error: 'invalid_grant', error_description: 'Code expired' });
            return;
        }

        // Delete code (one-time use)
        authCodes.delete(code);

        // Get user's API key
        const apiKey = await ApiKey.findOne({
            where: {
                user_id: authData.userId,
                revoked: false
            },
            order: [['created_at', 'DESC']]
        });

        if (!apiKey) {
            res.status(400).json({
                error: 'server_error',
                error_description: 'No API key found. Please create one in your profile.'
            });
            return;
        }

        // Decrypt API key
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from((process.env.SECRET || 'default-key-change-in-production-32b').padEnd(32, '0').slice(0, 32));
        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(apiKey.iv, 'hex'));
        let decryptedKey = decipher.update(apiKey.key_encrypted, 'hex', 'utf8');
        decryptedKey += decipher.final('utf8');

        // Return access token (the API key)
        res.status(200).json({
            access_token: decryptedKey,
            token_type: 'Bearer',
            expires_in: 3600, // 1 hour
            scope: 'mcp'
        });

    } catch (error: any) {
        console.error('[OAuth Token] Error:', error);
        res.status(500).json({
            error: 'server_error',
            error_description: error.message
        });
    }
}
