import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import ApiKey from '../database/models/apiKey';
import ApiAuditLog from '../database/models/apiAuditLog';

export interface AuthenticatedRequest extends NextApiRequest {
    userId?: number;
    apiKeyId?: number;
    permissions?: string[];
}

/**
 * Middleware to validate MCP API Key from Bearer token
 */
export async function validateMcpApiKey(
    req: AuthenticatedRequest,
    res: NextApiResponse
): Promise<{ valid: boolean; userId?: number; apiKeyId?: number; permissions?: string[] }> {
    try {
        // Get Bearer token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { valid: false };
        }

        const token = authHeader.substring(7); // Remove 'Bearer '

        // Find all API keys (we need to compare hashes)
        const apiKeys = await ApiKey.findAll({
            where: { revoked: false },
        });

        // Find matching key by comparing hashes
        let matchedKey: any = null;
        for (const key of apiKeys) {
            const isMatch = await bcrypt.compare(token, key.key_hash);
            if (isMatch) {
                matchedKey = key;
                break;
            }
        }

        if (!matchedKey) {
            return { valid: false };
        }

        // Check if expired
        if (matchedKey.expires_at && new Date(matchedKey.expires_at) < new Date()) {
            return { valid: false };
        }

        // Update last used
        await matchedKey.update({
            last_used_at: new Date(),
            last_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            last_user_agent: req.headers['user-agent'],
        });

        // Set auth info on request
        req.userId = matchedKey.user_id;
        req.apiKeyId = matchedKey.id;
        req.permissions = matchedKey.permissions;

        return {
            valid: true,
            userId: matchedKey.user_id,
            apiKeyId: matchedKey.id,
            permissions: matchedKey.permissions,
        };
    } catch (error) {
        console.error('API Key validation error:', error);
        return { valid: false };
    }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(permissions: string[], required: string): boolean {
    return permissions.includes(required) || permissions.includes('admin:all');
}

/**
 * Log API action to audit log
 */
export async function logApiAction(
    apiKeyId: number,
    action: string,
    resource: string,
    success: boolean,
    metadata?: any,
    errorMessage?: string,
    req?: NextApiRequest
) {
    try {
        await ApiAuditLog.create({
            api_key_id: apiKeyId,
            action,
            resource,
            metadata,
            ip_address: req?.headers['x-forwarded-for'] as string || req?.socket.remoteAddress || null,
            user_agent: req?.headers['user-agent'] || null,
            success,
            error_message: errorMessage,
        });
    } catch (error) {
        console.error('Failed to log API action:', error);
    }
}
