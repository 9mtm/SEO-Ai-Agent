/**
 * OAuth crypto helpers — token generation, hashing, PKCE verification.
 * All tokens are stored as sha256 hashes; only the raw value is shown to the
 * client a single time.
 */
import crypto from 'crypto';

export function randomToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
}

/** Constant-time string compare to avoid timing attacks. */
export function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
        return false;
    }
}

/**
 * Verify a PKCE code_verifier against a stored code_challenge.
 * Supports `S256` (recommended) and `plain` (discouraged).
 */
export function verifyPkce(
    verifier: string,
    challenge: string,
    method: 'S256' | 'plain' | string
): boolean {
    if (!verifier || !challenge) return false;
    if (method === 'plain') return safeEqual(verifier, challenge);
    if (method === 'S256') {
        const hashed = crypto.createHash('sha256').update(verifier).digest('base64url');
        return safeEqual(hashed, challenge);
    }
    return false;
}
