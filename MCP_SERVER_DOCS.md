# MCP Server Documentation

## Overview
This is a production-ready Model Context Protocol (MCP) server implementation integrated into the Next.js application. It provides secure, authenticated access to SEO tools and data via SSE (Server-Sent Events).

## Architecture

### Components

1. **`lib/mcp.ts`** - Core MCP server logic
   - Defines tools, resources, and prompts
   - Handles API requests to internal endpoints
   - Type-safe implementation with proper interfaces

2. **`pages/api/mcp/sse.ts`** - SSE Connection Handler
   - Validates API keys using `validateMcpApiKey`
   - Establishes SSE transport
   - Implements 1-hour connection timeout
   - Logs connection lifecycle

3. **`pages/api/mcp/message.ts`** - Message Handler
   - Processes incoming JSON-RPC messages
   - Enhanced error handling and logging
   - Session validation

4. **`lib/mcp-store.ts`** - Global State Management
   - Manages active SSE transports
   - Stores OAuth authorization codes
   - Automatic cleanup of expired codes (every 60 seconds)

5. **`pages/api/oauth/`** - OAuth 2.0 Implementation
   - `code.ts` - Generates authorization codes
   - `token.ts` - Exchanges codes for access tokens
   - `pages/oauth/authorize.tsx` - User authorization UI

6. **`pages/api/mcp/health.ts`** - Health Check Endpoint
   - Monitors active connections
   - Reports memory usage
   - Returns health status (healthy/degraded/unhealthy)

## Security Features

### 1. API Key Validation
- All SSE connections validate API keys against the database
- Uses existing `validateMcpApiKey` utility
- Logs user ID for audit trail

### 2. OAuth 2.0 Flow
- Standard Authorization Code Flow
- 5-minute code expiration
- Automatic cleanup of expired codes
- One-time code usage (consumed after exchange)

### 3. Connection Management
- 1-hour connection timeout
- Proper cleanup on disconnect
- Session tracking with unique IDs

## Available Tools

1. **create_post** - Create blog posts
2. **add_keyword** - Track new keywords
3. **get_domain_stats** - Domain statistics
4. **get_gsc_data** - Google Search Console data
5. **get_keyword_rankings** - Keyword rankings with competitors
6. **get_gsc_insight** - Comprehensive GSC insights
7. **get_gsc_keywords** - Detailed GSC keyword data

## Available Resources

1. **seo://domains** - List all domains
2. **seo://keywords** - Tracked keywords
3. **seo://posts** - Blog posts
4. **seo://gsc** - GSC analytics

## Configuration

### Client Setup (Cursor/Claude)

```json
{
  "mcpServers": {
    "seo-agent": {
      "url": "http://localhost:55781/api/mcp/sse",
      "authentication": {
        "type": "oauth",
        "authorizationUrl": "http://localhost:55781/oauth/authorize",
        "tokenUrl": "http://localhost:55781/api/oauth/token"
      }
    }
  }
}
```

### Environment Variables
- `API_BASE_URL` - Base URL for API calls (auto-detected from request)

## Monitoring

### Health Check
```bash
curl http://localhost:55781/api/mcp/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-20T18:20:00.000Z",
  "uptime": 3600,
  "connections": {
    "active": 5,
    "total": 5
  },
  "oauth": {
    "activeCodes": 2
  },
  "memory": {
    "used": 128,
    "total": 512,
    "percentage": 25
  }
}
```

### Logs
All operations are logged with context:
- `[MCP SSE]` - Connection lifecycle
- `[MCP MESSAGE]` - Message processing
- `[MCP API]` - API requests
- `[MCP Cleanup]` - Code cleanup operations

## Production Considerations

### 1. State Management
⚠️ **Important**: Current implementation uses in-memory global state, which works for:
- Single-server deployments (VPS, dedicated server)
- Development environments

For serverless/multi-instance deployments, consider:
- Redis for session storage
- Database for OAuth codes
- Sticky sessions at load balancer

### 2. Rate Limiting
Consider adding rate limiting for production:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

### 3. Monitoring
- Monitor `/api/mcp/health` endpoint
- Set up alerts for:
  - Memory usage > 75%
  - Active connections > 100
  - Unhealthy status

## Troubleshooting

### Connection Issues
1. Check API key validity
2. Verify database connection
3. Check server logs for `[MCP SSE]` entries

### OAuth Issues
1. Ensure user is logged in
2. Check code expiration (5 minutes)
3. Verify redirect URI matches

### Performance Issues
1. Check `/api/mcp/health` for memory usage
2. Monitor active connections
3. Review cleanup interval logs

## Version History

### v1.0.0 (Current)
- ✅ Token validation
- ✅ Connection timeout
- ✅ Automatic code cleanup
- ✅ Enhanced logging
- ✅ Health check endpoint
- ✅ Type-safe implementation
- ✅ OAuth 2.0 support
