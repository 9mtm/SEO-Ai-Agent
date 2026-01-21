#!/usr/bin/env node

/**
 * SEO Agent MCP Server
 * Entry point for the MCP server CLI
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';

const API_KEY = process.env.SEO_API_KEY || '';
const BASE_URL = process.env.API_BASE_URL || 'https://seo-agent.net';

if (!API_KEY) {
    console.error('Error: SEO_API_KEY environment variable is required');
    console.error('Please set it in your MCP configuration');
    process.exit(1);
}

async function main() {
    console.error(`[MCP] Starting SEO Agent MCP Server...`);
    console.error(`[MCP] API Base URL: ${BASE_URL}`);

    const transport = new StdioServerTransport();
    const server = createMcpServer(BASE_URL, API_KEY);

    await server.connect(transport);

    console.error('[MCP] Server started successfully');
}

main().catch((error) => {
    console.error('[MCP] Fatal error:', error);
    process.exit(1);
});
