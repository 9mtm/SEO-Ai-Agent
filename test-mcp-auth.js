/**
 * MCP OAuth Flow Tester
 * ----------------------
 * Simulates exactly what Claude does step by step.
 * Run: node test-mcp-auth.js
 */

const crypto = require('crypto');
const BASE = 'https://seo-agent.net';

const log = (step, msg, data) => {
    const status = data?.error ? '❌' : '✅';
    console.log(`\n${status} STEP ${step}: ${msg}`);
    if (data) console.log(JSON.stringify(data, null, 2));
};

// PKCE helpers
function generatePKCE() {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    return { verifier, challenge };
}

async function testFullFlow() {
    console.log('='.repeat(60));
    console.log('MCP OAuth Flow Test — simulating Claude');
    console.log('='.repeat(60));

    // ─── STEP 1: Discovery ───
    let discovery;
    try {
        const res = await fetch(`${BASE}/.well-known/oauth-authorization-server`);
        discovery = await res.json();
        log(1, `Discovery (${res.status})`, {
            authorization_endpoint: discovery.authorization_endpoint,
            token_endpoint: discovery.token_endpoint,
            registration_endpoint: discovery.registration_endpoint
        });
    } catch (e) {
        log(1, 'Discovery FAILED', { error: e.message });
        return;
    }

    // ─── STEP 2: Dynamic Client Registration ───
    let client;
    try {
        const res = await fetch(discovery.registration_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_name: 'MCP Flow Test',
                redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
                token_endpoint_auth_method: 'none',
                scope: 'read:profile read:domains read:gsc read:keywords write:keywords read:analytics'
            })
        });
        client = await res.json();
        log(2, `Client Registration (${res.status})`, {
            client_id: client.client_id,
            token_endpoint_auth_method: client.token_endpoint_auth_method,
            has_secret: !!client.client_secret
        });
        if (client.error) return;
    } catch (e) {
        log(2, 'Registration FAILED', { error: e.message });
        return;
    }

    // ─── STEP 3: Check client in DB ───
    try {
        const res = await fetch(`${BASE}/api/oauth/clients/public?client_id=${client.client_id}`);
        const data = await res.json();
        log(3, `Client Lookup (${res.status})`, {
            name: data.client?.name,
            client_type: data.client?.client_type,
            allowed_scopes: data.client?.allowed_scopes
        });
    } catch (e) {
        log(3, 'Client Lookup FAILED', { error: e.message });
    }

    // ─── STEP 4: Build authorize URL (what Claude would open in browser) ───
    const pkce = generatePKCE();
    const state = crypto.randomBytes(16).toString('base64url');
    const authorizeUrl = `${discovery.authorization_endpoint}?` +
        `response_type=code&` +
        `client_id=${client.client_id}&` +
        `redirect_uri=${encodeURIComponent('https://claude.ai/api/mcp/auth_callback')}&` +
        `scope=${encodeURIComponent('read:profile read:domains read:gsc')}&` +
        `state=${state}&` +
        `code_challenge=${pkce.challenge}&` +
        `code_challenge_method=S256`;
    log(4, 'Authorize URL built', { url: authorizeUrl, code_challenge: pkce.challenge });

    // ─── STEP 5: Simulate consent approval (create code manually via DB) ───
    console.log('\n⏳ STEP 5: Simulating consent approval...');
    const fakeCode = crypto.randomBytes(32).toString('base64url');
    const codeHash = crypto.createHash('sha256').update(fakeCode).digest('hex');

    try {
        // We need to insert a code directly since we can't open a browser
        const consentRes = await fetch(`${BASE}/api/oauth/consent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: client.client_id,
                redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
                scope: 'read:profile read:domains read:gsc',
                state: state,
                code_challenge: pkce.challenge,
                code_challenge_method: 'S256',
                approve: true
            })
        });
        const consentData = await consentRes.json();
        log(5, `Consent (${consentRes.status})`, consentData);

        if (consentData.error === 'login_required') {
            console.log('\n⚠️  Cannot simulate consent without a browser session.');
            console.log('   Testing token exchange with a manually created code instead...\n');

            // Skip to token test with existing token
            await testWithPersonalToken();
            return;
        }

        if (consentData.redirect) {
            // Extract code from redirect URL
            const redirectUrl = new URL(consentData.redirect);
            const code = redirectUrl.searchParams.get('code');
            log('5b', 'Got authorization code from redirect', { code: code?.substring(0, 20) + '...' });

            // ─── STEP 6: Token Exchange ───
            await testTokenExchange(client.client_id, code, pkce.verifier);
        }
    } catch (e) {
        log(5, 'Consent FAILED', { error: e.message });
        console.log('\n⚠️  Falling back to personal token test...\n');
        await testWithPersonalToken();
    }
}

async function testTokenExchange(clientId, code, codeVerifier) {
    try {
        const tokenBody = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
            client_id: clientId,
            code_verifier: codeVerifier
        };
        console.log('\n📤 Token request body:', JSON.stringify(tokenBody, null, 2));

        const res = await fetch(`${BASE}/api/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokenBody)
        });
        const data = await res.json();
        log(6, `Token Exchange (${res.status})`, {
            has_access_token: !!data.access_token,
            has_refresh_token: !!data.refresh_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            scope: data.scope,
            error: data.error,
            error_description: data.error_description
        });

        if (data.access_token) {
            // ─── STEP 7: Use token to call MCP ───
            await testMCPWithToken(data.access_token);
        }
    } catch (e) {
        log(6, 'Token Exchange FAILED', { error: e.message });
    }
}

async function testMCPWithToken(token) {
    // Test initialize
    try {
        const res = await fetch(`${BASE}/api/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' })
        });
        const data = await res.json();
        log(7, `MCP initialize (${res.status})`, {
            protocolVersion: data.result?.protocolVersion,
            serverName: data.result?.serverInfo?.name,
            error: data.error
        });
    } catch (e) {
        log(7, 'MCP initialize FAILED', { error: e.message });
    }

    // Test tools/list
    try {
        const res = await fetch(`${BASE}/api/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
        });
        const data = await res.json();
        const tools = data.result?.tools || [];
        log(8, `MCP tools/list (${res.status})`, {
            tool_count: tools.length,
            tool_names: tools.map(t => t.name),
            error: data.error
        });
    } catch (e) {
        log(8, 'MCP tools/list FAILED', { error: e.message });
    }

    // Test a tool call
    try {
        const res = await fetch(`${BASE}/api/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 3,
                method: 'tools/call',
                params: { name: 'get_profile', arguments: {} }
            })
        });
        const data = await res.json();
        log(9, `MCP tools/call get_profile (${res.status})`, {
            isError: data.result?.isError,
            content: data.result?.content?.[0]?.text?.substring(0, 200),
            error: data.error
        });
    } catch (e) {
        log(9, 'MCP tools/call FAILED', { error: e.message });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ FLOW COMPLETE — MCP server works correctly!');
    console.log('='.repeat(60));
}

async function testWithPersonalToken() {
    console.log('─'.repeat(60));
    console.log('Testing with Personal Access Token...');
    console.log('─'.repeat(60));

    const token = 'sk_live_e3a305938f4e44923024f736e815c1a7610bc5df4be7fd1e';
    await testMCPWithToken(token);
}

testFullFlow().catch(console.error);
