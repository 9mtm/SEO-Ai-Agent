/**
 * Shared OAuth state for ChatGPT MCP
 * 
 * Stores authorization codes temporarily
 */

interface AuthCodeData {
    userId: number;
    expiresAt: number;
}

// In-memory store (in production, use Redis or database)
export const authCodes = new Map<string, AuthCodeData>();

// Cleanup expired codes every 5 minutes
if (typeof window === 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [code, data] of authCodes.entries()) {
            if (now > data.expiresAt) {
                authCodes.delete(code);
            }
        }
    }, 5 * 60 * 1000);
}
