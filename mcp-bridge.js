#!/usr/bin/env node

/**
 * MCP STDIO to SSE Bridge
 * This script acts as a bridge between Claude Desktop (STDIO) and our SSE-based MCP server
 */

const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');

const API_KEY = process.env.SEO_API_KEY || '';
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:55781';

if (!API_KEY) {
    console.error('Error: SEO_API_KEY environment variable is required');
    process.exit(1);
}

async function main() {
    // Create STDIO transport for Claude Desktop
    const transport = new StdioClientTransport({
        command: 'node',
        args: [__filename],
        env: {
            SEO_API_KEY: API_KEY,
            API_BASE_URL: BASE_URL
        }
    });

    // Create MCP client
    const client = new Client({
        name: 'dpro-seo-agent-bridge',
        version: '1.0.0'
    }, {
        capabilities: {}
    });

    // Connect to our SSE server
    await client.connect(transport);

    console.error('Bridge connected successfully');
}

main().catch(error => {
    console.error('Bridge error:', error);
    process.exit(1);
});
