import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import crypto from 'crypto';

/**
 * OAuth Authorization Endpoint for ChatGPT MCP
 * 
 * This endpoint handles the OAuth authorization flow.
 * Since we use session-based auth, we simply verify the user's session
 * and generate an authorization code.
 */

// In-memory store for auth codes (in production, use Redis or database)
const authCodes = new Map<string, { userId: number; expiresAt: number }>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Verify user session
        const { authorized, userId } = verifyUser(req, res);

        if (!authorized || !userId) {
            // Redirect to login page
            const redirectUri = req.query.redirect_uri as string;
            const state = req.query.state as string;
            res.redirect(`/login?redirect=${encodeURIComponent(redirectUri)}&state=${state}`);
            return;
        }

        // Generate authorization code
        const code = crypto.randomBytes(32).toString('hex');

        // Store code with 10 minute expiration
        authCodes.set(code, {
            userId,
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        // Redirect back to ChatGPT with code
        const redirectUri = req.query.redirect_uri as string;
        const state = req.query.state as string;

        const redirectUrl = new URL(redirectUri);
        redirectUrl.searchParams.set('code', code);
        if (state) {
            redirectUrl.searchParams.set('state', state);
        }

        res.redirect(redirectUrl.toString());

    } catch (error: any) {
        console.error('[OAuth Authorize] Error:', error);
        res.status(500).json({ error: 'Authorization failed' });
    }
}

// Export auth codes store for use in token endpoint
export { authCodes };
