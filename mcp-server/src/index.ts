#!/usr/bin/env node

import { createServer } from './server.js';

// Start the MCP server
const server = createServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.error('Shutting down MCP server...');
    await server.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.error('Shutting down MCP server...');
    await server.close();
    process.exit(0);
});
