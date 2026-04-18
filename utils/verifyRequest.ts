/**
 * Unified request authentication
 * -------------------------------
 * Tries cookie/JWT auth first (`verifyUser`), then falls back to
 * OAuth 2.0 Bearer (`verifyOAuthToken`). Use this in API routes that must
 * accept BOTH a logged-in dashboard user AND external OAuth clients
 * (Claude MCP, the WordPress plugin, etc.).
 *
 *   const auth = await verifyRequest(req, res);
 *   if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });
 *   if (auth.source === 'oauth' && !auth.scopes.includes('read:domains')) {
 *       return res.status(403).json({ error: 'insufficient_scope' });
 *   }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from './verifyUser';
import { verifyOAuthToken } from './oauthAuth';

export interface VerifyRequestResult {
    authorized: boolean;
    userId?: number;
    isLegacy?: boolean;
    /** OAuth scopes on the access token — empty array when auth came from JWT. */
    scopes: string[];
    /** Where the authentication came from — useful for scope enforcement. */
    source?: 'jwt' | 'oauth';
    workspaceId?: number | null;
}

export async function verifyRequest(req: NextApiRequest, res: NextApiResponse): Promise<VerifyRequestResult> {
    // 1. Try cookie / JWT Bearer first (existing dashboard flow).
    const jwt = verifyUser(req, res);
    if (jwt.authorized) {
        return {
            authorized: true,
            userId: jwt.userId,
            isLegacy: jwt.isLegacy,
            scopes: [],
            source: 'jwt',
        };
    }

    // 2. Fall back to OAuth access token.
    const oauth = await verifyOAuthToken(req);
    if (oauth.valid) {
        return {
            authorized: true,
            userId: oauth.userId,
            isLegacy: false,
            scopes: oauth.scopes,
            source: 'oauth',
            workspaceId: oauth.workspaceId ?? null,
        };
    }

    return { authorized: false, scopes: [] };
}

/**
 * Scope guard helper: returns true if the request is either a JWT session
 * (which implicitly has full access) or an OAuth token with the given scope.
 */
export function requireScope(auth: VerifyRequestResult, scope: string): boolean {
    if (!auth.authorized) return false;
    if (auth.source === 'jwt') return true;
    return auth.scopes.includes(scope);
}

export default verifyRequest;
