import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

declare global {
    var mcpTransports: Map<string, SSEServerTransport> | undefined;
    var mcpAuthCodes: Map<string, { token: string, expires: number }> | undefined;
    var mcpCleanupInterval: NodeJS.Timeout | undefined;
}

export const getTransports = () => {
    if (!global.mcpTransports) {
        global.mcpTransports = new Map<string, SSEServerTransport>();
    }
    return global.mcpTransports;
};

export const getAuthCodes = () => {
    if (!global.mcpAuthCodes) {
        global.mcpAuthCodes = new Map<string, { token: string, expires: number }>();
    }
    return global.mcpAuthCodes;
};

// Cleanup expired codes every minute
export const startCleanupInterval = () => {
    if (!global.mcpCleanupInterval) {
        global.mcpCleanupInterval = setInterval(() => {
            const codes = getAuthCodes();
            const now = Date.now();
            let cleaned = 0;

            for (const [code, data] of codes.entries()) {
                if (now > data.expires) {
                    codes.delete(code);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                console.log(`[MCP Cleanup] Removed ${cleaned} expired OAuth codes`);
            }
        }, 60000); // Every minute

        console.log('[MCP Cleanup] Cleanup interval started');
    }
};

// Start cleanup on module load
startCleanupInterval();
