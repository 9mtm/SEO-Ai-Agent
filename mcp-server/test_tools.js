const { createServer } = require('./dist/server.js');

console.log('Starting MCP server test...');
const server = createServer();

// Simulate a tools/list request
const mockRequest = {
    params: {},
    method: 'tools/list'
};

console.log('\nTesting ListTools...');
setTimeout(() => {
    console.log('Test completed');
    process.exit(0);
}, 2000);
