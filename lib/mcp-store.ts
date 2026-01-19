import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

declare global {
    var mcpTransports: Map<string, SSEServerTransport> | undefined;
    var mcpAuthCodes: Map<string, { token: string, expires: number }> | undefined;
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
