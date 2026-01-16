#!/usr/bin/env node

/**
 * MCP Tools Verification Script
 *
 * This script verifies that all tools are correctly compiled and available
 * in the MCP server.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 MCP Tools Verification\n');
console.log('=' .repeat(60));

// Read the compiled server file
const serverPath = path.join(__dirname, 'dist', 'server.js');

if (!fs.existsSync(serverPath)) {
    console.error('❌ Error: Compiled server not found!');
    console.error('   Run: npm run build');
    process.exit(1);
}

const serverCode = fs.readFileSync(serverPath, 'utf8');

// Expected tools
const expectedTools = [
    'create_post',
    'add_keyword',
    'get_domain_stats',
    'get_gsc_data',
    'get_keyword_rankings'  // NEW!
];

console.log('\n📋 Checking for tools in compiled code:\n');

let allFound = true;

expectedTools.forEach(tool => {
    const toolDefinition = `name: '${tool}'`;
    const toolHandler = `if (name === '${tool}')`;

    const hasDefinition = serverCode.includes(toolDefinition);
    const hasHandler = serverCode.includes(toolHandler);

    const status = (hasDefinition && hasHandler) ? '✅' : '❌';
    const details = [];

    if (!hasDefinition) details.push('missing definition');
    if (!hasHandler) details.push('missing handler');

    console.log(`${status} ${tool.padEnd(25)} ${details.length ? `(${details.join(', ')})` : ''}`);

    if (!hasDefinition || !hasHandler) {
        allFound = false;
    }
});

console.log('\n' + '='.repeat(60));

if (allFound) {
    console.log('\n✅ All tools are correctly compiled!');
    console.log('\n📝 Next steps:');
    console.log('   1. Close Claude Desktop completely');
    console.log('   2. Restart Claude Desktop');
    console.log('   3. Test the new tools\n');
    process.exit(0);
} else {
    console.log('\n❌ Some tools are missing!');
    console.log('\n🔧 Fix:');
    console.log('   1. Check src/server.ts for missing tools');
    console.log('   2. Run: npm run build');
    console.log('   3. Run this script again\n');
    process.exit(1);
}
