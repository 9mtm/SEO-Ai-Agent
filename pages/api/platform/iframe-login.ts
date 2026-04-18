/**
 * GET /api/platform/iframe-login
 * -----------------------------------
 * Bridges an OAuth Bearer access token into a short-lived SaaS session cookie
 * so that embeddable pages (e.g. /domain/insight/...) can render inside an
 * iframe in third-party admin UIs (WordPress, Shopify, etc.).
 *
 * Query params:
 *   token       (required) — OAuth Bearer access token the third-party app holds
 *   next        (optional) — path on this SaaS to redirect to after sign-in.
 *                            Must start with `/`. Defaults to `/`.
 *
 * Contract:
 *   1. Validate the token via `verifyOAuthToken` → get userId.
 *   2. Mint a 30-minute JWT with { userId } (standard dashboard session shape).
 *   3. Set it as the `token` cookie with SameSite=None; Secure in prod (so it
 *      survives cross-site iframe navigation) or SameSite=Lax in dev (where
 *      Secure cookies are not sent over http://localhost).
 *   4. 302 redirect to `next`.
 *
 * Security:
 *   - Tokens come from an already-authenticated OAuth client; can't be guessed.
 *   - `next` is strictly path-relative to prevent open-redirect abuse.
 *   - Cookie is HttpOnly + short TTL + bound to this SaaS origin.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import Cookies from 'cookies';
import { verifyOAuthToken } from '../../../utils/oauthAuth';

const SESSION_MINUTES = 30;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).send('Method Not Allowed');
    }

    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const rawNext = typeof req.query.next === 'string' ? req.query.next : '/';

    // Validate `next` is path-relative and does not redirect to an external host.
    const safeNext = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

    if (!token) {
        return res.status(400).send('Missing token');
    }
    if (!process.env.SECRET) {
        console.error('[iframe-login] SECRET not set');
        return res.status(500).send('Server misconfigured');
    }

    // Mimic `verifyOAuthToken` by passing the token through an Authorization header.
    // The helper only reads `req.headers.authorization`, so we construct a minimal
    // shim — but we can also just call its internal sha256+DB lookup inline.
    const fakeReq = { headers: { authorization: `Bearer ${token}` } } as NextApiRequest;
    const auth = await verifyOAuthToken(fakeReq);
    if (!auth.valid || !auth.userId) {
        return res.status(401).send('Invalid or expired token');
    }

    // Mint a short-lived dashboard session JWT.
    const sessionToken = jwt.sign(
        { userId: auth.userId },
        process.env.SECRET,
        { expiresIn: `${SESSION_MINUTES}m` }
    );

    const cookies = new Cookies(req, res);
    const expires = new Date(Date.now() + SESSION_MINUTES * 60 * 1000);

    // In production (HTTPS) cross-site iframes need SameSite=None + Secure.
    // In local dev we fall back to Lax because browsers discard Secure cookies
    // over http://localhost.
    const isProd = process.env.NODE_ENV === 'production';
    cookies.set('token', sessionToken, {
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        expires,
    });

    // The SaaS dashboard's client-side services read `auth_token` from
    // `localStorage` (see services/domains.tsx → getAuthHeaders). In a
    // cross-origin iframe that storage starts empty, so even though we set
    // a cookie, client-side fetches fire with no Authorization header and
    // bounce to /login on 401. Solution: return a tiny HTML bridge that
    // writes the session JWT into localStorage *inside the iframe context*
    // before navigating. Works whether or not third-party cookies are blocked.
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // `safeNext` is already path-relative; also JSON-encode to escape quotes/nuls.
    res.status(200).send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Connecting…</title></head>
<body style="font:14px/1.5 -apple-system,system-ui,sans-serif;color:#50575e;padding:24px;">
Connecting to SEO Agent…
<script>
try {
  localStorage.setItem('auth_token', ${JSON.stringify(sessionToken)});
} catch (e) { /* storage unavailable — cookie fallback still applies */ }
window.location.replace(${JSON.stringify(safeNext)});
</script>
</body></html>`);
}
