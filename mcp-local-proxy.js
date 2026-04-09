#!/usr/bin/env node
/**
 * Local MCP proxy for Claude Desktop
 * ------------------------------------
 * Claude Desktop only supports "command" MCP servers (local processes).
 * This tiny script bridges the gap: Claude launches it as a local process,
 * it reads JSON-RPC from stdin, forwards to the remote HTTPS endpoint with
 * the Bearer token, and writes the response to stdout.
 *
 * Usage in claude_desktop_config.json:
 *   {
 *     "mcpServers": {
 *       "seo-ai-agent": {
 *         "command": "node",
 *         "args": ["C:\\path\\to\\mcp-local-proxy.js"],
 *         "env": {
 *           "MCP_SERVER_URL": "https://seo-agent.net/api/mcp",
 *           "MCP_TOKEN": "your-token-here"
 *         }
 *       }
 *     }
 *   }
 */

const MCP_URL = process.env.MCP_SERVER_URL || 'https://seo-agent.net/api/mcp';
const TOKEN = process.env.MCP_TOKEN || '';

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
    buffer += chunk;
    // Try to parse complete JSON-RPC messages (newline-delimited)
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
        if (line.trim()) handleMessage(line.trim());
    }
});

process.stdin.on('end', () => {
    if (buffer.trim()) handleMessage(buffer.trim());
});

async function handleMessage(raw) {
    let msg;
    try {
        msg = JSON.parse(raw);
    } catch {
        return;
    }

    try {
        const res = await fetch(MCP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(msg)
        });
        const data = await res.json();
        process.stdout.write(JSON.stringify(data) + '\n');
    } catch (err) {
        process.stdout.write(JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id || null,
            error: { code: -32603, message: err.message }
        }) + '\n');
    }
}
