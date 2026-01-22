import type { NextApiRequest } from 'next';
import ApiKey from '../models/ApiKey';
import { verifyUser } from './auth';

/**
 * Validate user session for proxy connections
 */
export async function validateProxySession(req: NextApiRequest): Promise<{ valid: boolean; userId?: number; error?: string }> {
    try {
        const user = await verifyUser(req);

        if (!user) {
            return {
                valid: false,
                error: 'No valid session. Please login to SEO Agent.'
            };
        }

        return {
            valid: true,
            userId: user.id
        };
    } catch (error: any) {
        return {
            valid: false,
            error: error.message || 'Session validation failed'
        };
    }
}

/**
 * Get user's active API key
 */
export async function getUserApiKey(userId: number): Promise<{ success: boolean; apiKey?: string; error?: string }> {
    try {
        const apiKeyRecord = await ApiKey.findOne({
            where: {
                user_id: userId,
                revoked: false
            },
            order: [['created_at', 'DESC']]
        });

        if (!apiKeyRecord) {
            return {
                success: false,
                error: 'No active API key found. Please create one in your profile.'
            };
        }

        // Decrypt the API key
        const crypto = require('crypto');
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(
            process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b',
            'utf-8'
        );
        const decipher = crypto.createDecipheriv(
            algorithm,
            key,
            Buffer.from(apiKeyRecord.iv, 'hex')
        );

        let decryptedKey = decipher.update(apiKeyRecord.key_encrypted, 'hex', 'utf8');
        decryptedKey += decipher.final('utf8');

        // Update last used timestamp
        await apiKeyRecord.update({ last_used_at: new Date() });

        return {
            success: true,
            apiKey: decryptedKey
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to retrieve API key'
        };
    }
}

/**
 * Log proxy connection for audit
 */
export async function logProxyConnection(userId: number, sessionId: string, action: 'connect' | 'disconnect' | 'error', details?: string) {
    console.log(`[MCP Proxy Audit] User: ${userId}, Session: ${sessionId}, Action: ${action}${details ? `, Details: ${details}` : ''}`);

    // TODO: Store in database audit log if needed
    // await ApiAuditLog.create({
    //     user_id: userId,
    //     action: `proxy_${action}`,
    //     details: details || sessionId,
    //     ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    // });
}
