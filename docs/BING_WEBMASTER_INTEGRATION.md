# Bing Webmaster Tools Integration — Implementation Guide

## Overview
Add Bing Webmaster Tools data to SEO Agent alongside Google Search Console. This gives users analytics from Bing + Yahoo (Yahoo uses Bing results) — covering Google + Bing + Yahoo with two integrations.

## Azure App Credentials (ALREADY CREATED)

| Item | Value |
|---|---|
| **App Name** | SEO Agent |
| **Application (Client) ID** | `ada92cb9-a6c1-4bdb-a145-bf18f578e092` |
| **Directory (Tenant) ID** | `f3935af3-2749-4ef4-9299-9c645b63539f` |
| **Client Secret Value** | `x7B8Q~RQ5DaDwVdYrZLv0NK4SHtKyGqG_usQzc02` |
| **Client Secret ID** | `a8bf63f2-690b-4c48-8f28-f8651345736b` |
| **Secret Expires** | 4/13/2028 |
| **Supported Account Types** | All Microsoft account users (Any Entra ID + Personal) |
| **Redirect URI** | `https://seo-agent.net/api/auth/microsoft/callback` |
| **Azure Portal** | https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/ada92cb9-a6c1-4bdb-a145-bf18f578e092 |

## Environment Variables to Add

Add these to `.env.local` and `.env.production`:

```bash
# Microsoft / Bing Webmaster Tools
MICROSOFT_CLIENT_ID=ada92cb9-a6c1-4bdb-a145-bf18f578e092
MICROSOFT_CLIENT_SECRET=x7B8Q~RQ5DaDwVdYrZLv0NK4SHtKyGqG_usQzc02
MICROSOFT_TENANT_ID=f3935af3-2749-4ef4-9299-9c645b63539f
MICROSOFT_REDIRECT_URI=https://seo-agent.net/api/auth/microsoft/callback
```

For local development, also add:
```bash
MICROSOFT_REDIRECT_URI=http://localhost:55781/api/auth/microsoft/callback
```
And add `http://localhost:55781/api/auth/microsoft/callback` as a second Redirect URI in Azure Portal → Authentication.

## API Reference

### Microsoft OAuth 2.0 Flow
- **Authorize URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- **Token URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/token`
- **Scopes**: `user.read offline_access https://api.bing.com/webmasters/read`

### Bing Webmaster Tools API
- **Base URL**: `https://ssl.bing.com/webmaster/api.svc/json/`
- **Auth**: API key from user's Bing Webmaster account OR OAuth token
- **Docs**: https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api

### Key Bing API Endpoints
| Endpoint | Description |
|---|---|
| `GetUserSites` | List user's verified sites |
| `GetQueryStats(siteUrl, query)` | Keyword stats (impressions, clicks, position) |
| `GetPageStats(siteUrl)` | Page-level analytics |
| `GetCrawlStats(siteUrl)` | Crawl data |
| `GetQueryTrafficStats(siteUrl)` | Traffic by query |
| `GetPageTrafficStats(siteUrl)` | Traffic by page |
| `GetCountryTrafficStats(siteUrl)` | Traffic by country |

### Alternative: Bing Webmaster API v1 (REST)
```
GET https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats?siteUrl={url}&query={keyword}
Header: Authorization: Bearer {access_token}
```

## Implementation Steps

### Step 1: Database Migration
Create `database/migrations/XXXXXXXX-add-microsoft-auth-to-users.js`:
- Add columns to `users` table:
  - `microsoft_access_token` TEXT
  - `microsoft_refresh_token` TEXT
  - `microsoft_token_expiry` DATETIME

### Step 2: Update User Model
Add to `database/models/user.ts`:
```typescript
@Column({ type: DataType.TEXT, allowNull: true })
declare microsoft_access_token?: string;

@Column({ type: DataType.TEXT, allowNull: true })
declare microsoft_refresh_token?: string;

@Column({ type: DataType.DATE, allowNull: true })
declare microsoft_token_expiry?: Date;
```

### Step 3: Microsoft OAuth API Routes
Create these files:
- `pages/api/auth/microsoft/login.ts` — Redirect to Microsoft login
- `pages/api/auth/microsoft/callback.ts` — Handle OAuth callback, save tokens
- `pages/api/auth/microsoft/disconnect.ts` — Remove Microsoft connection

**OAuth Flow:**
1. User clicks "Connect Bing" → redirect to Microsoft login
2. User approves → Microsoft redirects to callback with `code`
3. Callback exchanges code for access_token + refresh_token
4. Tokens saved to user record
5. User redirected back to settings

### Step 4: Bing Webmaster API Service
Create `services/bingWebmaster.ts`:
- `getBingSites(userId)` — List verified Bing sites
- `getBingKeywordStats(userId, siteUrl, days)` — Keyword analytics
- `getBingPageStats(userId, siteUrl, days)` — Page analytics
- `getBingCountryStats(userId, siteUrl, days)` — Country breakdown
- `refreshMicrosoftToken(userId)` — Auto-refresh expired tokens

### Step 5: Bing API Routes
- `pages/api/bing/sites.ts` — GET user's Bing sites
- `pages/api/bing/stats.ts` — GET Bing analytics for a domain
- `pages/api/bing/keywords.ts` — GET Bing keyword data

### Step 6: UI — Settings Page
Add to `pages/profile/search-console.tsx` (or create separate `pages/profile/bing.tsx`):
- "Connect Bing Webmaster Tools" button (same pattern as Google)
- Show connected status
- Disconnect button

### Step 7: UI — Dashboard Integration
Update domain insight pages to show both Google and Bing data:
- `pages/domain/insight/[slug].tsx` — Add Bing stats alongside Google stats
- Tab or toggle: "Google" | "Bing" | "Combined"
- Show separate metrics for each engine

### Step 8: MCP Tools
Add new MCP tools to `pages/api/mcp/index.ts`:
- `get_bing_insight` — Bing analytics for a domain
- `get_bing_keywords` — Bing keyword data

## Data Model

### Bing vs Google Comparison
| Metric | Google (GSC) | Bing (Webmaster) |
|---|---|---|
| Clicks | ✅ | ✅ |
| Impressions | ✅ | ✅ |
| CTR | ✅ | ✅ (calculated) |
| Average Position | ✅ | ✅ |
| Pages | ✅ | ✅ |
| Countries | ✅ | ✅ |
| Keywords | ✅ | ✅ |
| Crawl Stats | ❌ | ✅ |
| Backlinks | ❌ | ✅ |

## Testing

1. Add env vars → restart dev server
2. Go to `/profile/search-console` → click "Connect Bing"
3. Login with Microsoft → approve → redirected back
4. Check Bing sites appear
5. Go to domain insight → Bing data tab shows stats
6. Test MCP tools: `get_bing_insight`, `get_bing_keywords`

## Microsoft Clarity Integration (Bonus)

Clarity provides user behavior analytics (heatmaps, session recordings, scroll depth) — complements Bing Webmaster keyword data. Uses the SAME Azure App credentials.

### Clarity Resources
- **API Docs**: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
- **Context7 Reference**: https://context7.com/microsoft/clarity

### Clarity API Endpoints
| Endpoint | Description |
|---|---|
| `GET /api/clarity/projects` | List user's Clarity projects |
| `GET /api/clarity/projects/{id}/dashboard` | Dashboard metrics (sessions, pages/session, scroll depth, engagement) |
| `GET /api/clarity/projects/{id}/heatmaps` | Heatmap data for pages |
| `GET /api/clarity/projects/{id}/recordings` | Session recordings list |
| `GET /api/clarity/projects/{id}/funnels` | Funnel analysis |

### Clarity OAuth
- Uses same Microsoft OAuth flow as Bing Webmaster
- Additional scope needed: `https://clarity.microsoft.com/user_impersonation`
- Add this scope to the Microsoft login request alongside Bing scopes

### What Clarity Adds to SEO Agent
| Feature | Value for SEO |
|---|---|
| **Heatmaps** | See where users click — optimize CTA placement |
| **Session Recordings** | Watch how users interact with pages |
| **Scroll Depth** | See how far users read content — optimize content length |
| **Dead Clicks** | Find broken links or confusing UI elements |
| **Rage Clicks** | Identify frustrating user experiences |
| **Engagement Score** | Measure content quality beyond SEO metrics |

### Implementation Steps for Clarity
1. Add `clarity` scope to Microsoft OAuth login
2. Create `services/clarity.ts` — Clarity API client
3. Create `pages/api/clarity/` — API routes
4. Add Clarity dashboard tab in domain insight page
5. Add MCP tools: `get_clarity_dashboard`, `get_clarity_heatmap`

### Clarity + Bing + Google = Complete Picture
```
Google Search Console → How users FIND your site (keywords, rankings, CTR)
Bing Webmaster Tools → Same data for Bing/Yahoo users
Microsoft Clarity    → How users BEHAVE on your site (engagement, UX)
```

## Notes

- Bing API rate limit: ~10,000 requests/day per API key
- Token expires every 1 hour — use refresh_token to auto-renew
- Yahoo uses Bing results — Bing data covers Yahoo too
- DuckDuckGo has no webmaster API — cannot be integrated
- Consider caching Bing data same way as GSC (services/gscStorage.ts pattern)
- Clarity and Bing use the SAME Azure App + OAuth tokens — one login covers both

---

**© 2026 Dpro GmbH **
