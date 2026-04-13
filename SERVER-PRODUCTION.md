# SEO Agent — Production Deployment Guide (cPanel)

This document is the authoritative, step-by-step guide to deploy **SEO Agent**
on a cPanel hosting account running **Node.js 22 + Phusion Passenger**.
It covers first-time setup, environment variables, pre-built `.next` upload
(to work around the Turbopack + cPanel symlink bug), database migrations,
cron jobs, and maintenance.

> ⚠️ Important: Turbopack cannot build on cPanel because cPanel's Node.js
> Selector symlinks `node_modules` out of the project directory, and Next.js 16
> Turbopack refuses to follow such symlinks. **Always build locally and upload
> the pre-built `.next/` directory** — do NOT run `npm run build` on the server.

---
shh : C:\MAMP\htdocs\dpro\seo-agent\agent\server_info_deply
## 1. Server Environment

| Item | Value |
|---|---|
| IP | `192.250.229.32` |
| Hostname | `s2903.fra1.stableserver.net` |
| cPanel user | `seoagent` |
| cPanel password | stored in `server_info_deply` (local file, NOT committed) |
| Home directory | `/home/seoagent` |
| Application root | `/home/seoagent/public_html/agent` |
| Node.js version | `22.22.0` (via cPanel Node.js Selector) |
| Passenger venv activator | `source /home/seoagent/nodevenv/public_html/agent/22/bin/activate && cd /home/seoagent/public_html/agent` |
| Public URL | `https://seo-agent.net` |
| Startup file | `server.js` |
| cPanel URL | `https://s2903.fra1.stableserver.net:2083` |
| SSH | **Disabled** (port 22 closed by hosting provider). Use cPanel Terminal only. |
| FTP | Port 21 open. User: `seoagent` |

> **Access methods:**
> - **cPanel Terminal** (browser): `https://s2903.fra1.stableserver.net:2083` → Terminal
> - **cPanel File Manager**: same URL → File Manager → `public_html/agent/`
> - **FTP**: `ftp://192.250.229.32` port 21 (for file uploads)
> - **SSH**: not available (port 22 blocked by StableServer firewall)

## 2. Database (cPanel MySQL)

| Item | Value |
|---|---|
| Host | `localhost` |
| Port | `3306` |
| Database name | `seoagent_agent` |
| DB user | `seoagent_agent` |
| DB password | `Necl4.p1)bWc}PJT` |

Create from cPanel → **MySQL Databases** if not already present, then grant
the user **ALL PRIVILEGES** on the database.

## 3. SMTP Email (no-reply@seo-agent.net)

| Item | Value |
|---|---|
| Outgoing server | `s2903.fra1.stableserver.net` |
| SMTP port | `465` (SSL) |
| Username | `no-reply@seo-agent.net` |
| Password | `+aA}ex8L5}co)[NO` |
| From name | `SEO AI Agent` |

IMAP (if ever needed for reading bounces): port `993` on the same host.

## 4. Environment Variables

Store the full production config at
`/home/seoagent/public_html/agent/.env.production`.
Next.js reads it automatically when `NODE_ENV=production`.

See `agent/.env.production` in this repo for the authoritative template.
Key entries:

```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://seo-agent.net
SECRET=<32-byte hex>
APIKEY=<cron endpoint guard token>

DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=seoagent_agent
DB_USER=seoagent_agent
DB_PASSWORD="Necl4.p1)bWc}PJT"

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://seo-agent.net/api/auth/google/callback

SMTP_HOST=s2903.fra1.stableserver.net
SMTP_PORT=465
SMTP_USERNAME=no-reply@seo-agent.net
SMTP_PASSWORD="+aA}ex8L5}co)[NO"
SMTP_ENCRYPTION=ssl
SMTP_FROM_EMAIL=no-reply@seo-agent.net
SMTP_FROM_NAME=SEO AI Agent

STRIPE_SECRET_KEY=sk_test_... (switch to sk_live_... for real payments)
STRIPE_WEBHOOK_SECRET=whsec_...
```

> Secrets must never be committed to git. `.env.production` is git-ignored and
> is uploaded to the server out-of-band (File Manager or SFTP).

---

## 5. First-Time Deployment

### 5.1 Build locally (Windows / macOS / Linux)

> **CRITICAL — three things that MUST be right or the deploy will fail:**
>
> 1. **Use `--webpack`** — Next.js 16 defaults to Turbopack which crashes on
>    cPanel's symlinked `node_modules`. Always build with `--webpack`.
> 2. **Set `NEXT_PUBLIC_APP_URL`** at build time — `NEXT_PUBLIC_*` vars are
>    baked into the JS bundle. If you build with `localhost`, every client-side
>    redirect will point to localhost on production.
> 3. **Match Next.js version** — the server's `next` version (installed via
>    `npm install` in the cPanel venv) must match the local build version.
>    Check with `node -e "console.log(require('next/package.json').version)"`.

```bash
cd C:\xampp\htdocs\dpro\seo-ai-agent
npm install
NEXT_PUBLIC_APP_URL=https://seo-agent.net npx next build --webpack
```

The build produces `.next/`. Verify the output lists all routes successfully.

### 5.2 Package source + pre-built output

Two archives are produced:

- **`seo-agent-deploy.zip`** — application source (no `node_modules`, no
  `.next`, no secrets):
  ```powershell
  cd C:\xampp\htdocs\dpro\seo-ai-agent
  $exclude = @('node_modules','.next','.git','logs','.venv','models','coverage','.env.local','.env.production','next-build.tar.gz','seo-agent-deploy.zip')
  $items = Get-ChildItem -Path '.' -Force | Where-Object { $exclude -notcontains $_.Name }
  Compress-Archive -Path $items.FullName -DestinationPath 'seo-agent-deploy.zip' -CompressionLevel Optimal -Force
  ```

- **`next-build.tar.gz`** — the pre-built `.next/` output (excluding `dev/`
  and `cache/`). **Use `.tar.gz` NOT `.zip`** because cPanel's ClamAV
  antivirus blocks zip files containing JavaScript (false positive
  `Sanesecurity.Foxhole.JS_Zip_12`):
  ```bash
  tar -cf next-build.tar --exclude='dev' --exclude='cache' -C .next .
  gzip next-build.tar
  ```

### 5.3 Upload to server

Via cPanel File Manager (or SFTP), upload both files to
`/home/seoagent/public_html/agent/`.

### 5.4 Create the Node.js application (once)

cPanel → **Setup Node.js App** → **Create Application**:

| Field | Value |
|---|---|
| Node.js version | `22.22.0` |
| Application mode | `Production` |
| Application root | `public_html/agent` |
| Application URL | `seo-agent.net` |
| Startup file | `server.js` |

Save. This creates the Passenger venv at
`/home/seoagent/nodevenv/public_html/agent/22/`.

### 5.5 Extract source, upload env, install

From cPanel Terminal:

```bash
source /home/seoagent/nodevenv/public_html/agent/22/bin/activate && cd /home/seoagent/public_html/agent

# Extract source (first time or after a source update)
unzip -o seo-agent-deploy.zip

# Fix permissions (cPanel sometimes uploads files with broken modes)
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod +x server.js cron.js 2>/dev/null || true

# Install dependencies (skip Chromium download — screenshot endpoint is disabled)
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

Then create `.env.production` by pasting the contents from the local template:

```bash
nano .env.production
# paste content, Ctrl+O, Enter, Ctrl+X
```

### 5.6 Extract the pre-built `.next/`

```bash
rm -rf .next
mkdir -p .next
tar -xzf next-build.tar.gz -C .next/
ls .next/ | head -10    # expect server/, static/, build-manifest.json, ...
rm next-build.tar.gz
```

### 5.7 Install devDependencies needed at runtime

`@tanstack/react-query-devtools` is in `devDependencies` but the dynamic
import in `_app.tsx` still causes Next.js to look for it at startup even in
production. cPanel installs with `NODE_ENV=production` which skips
devDependencies, so we must install it explicitly:

```bash
cd /home/seoagent/nodevenv/public_html/agent/22/lib/node_modules/@tanstack
npm pack @tanstack/react-query-devtools@5 2>/dev/null && tar -xzf tanstack-react-query-devtools-*.tgz && mv package react-query-devtools && rm -f tanstack-react-query-devtools-*.tgz
npm pack @tanstack/query-devtools@5 2>/dev/null && tar -xzf tanstack-query-devtools-*.tgz && mv package query-devtools && rm -f tanstack-query-devtools-*.tgz
cd /home/seoagent/public_html/agent
ls node_modules/@tanstack/react-query-devtools/package.json && echo "OK"
```

> This only needs to be done once. The packages survive across deploys
> because they live in the venv `node_modules`, not in the project directory.

### 5.8 Run database migrations

```bash
NODE_ENV=production npx sequelize-cli db:migrate --env production
```

> **Note:** Do NOT use `npm run db:migrate:prod` — the npm script uses
> `set NODE_ENV=production&&` which is Windows-only syntax. On Linux use
> `NODE_ENV=production npx sequelize-cli db:migrate --env production`.

This creates all tables: users, domains, keywords, workspaces, workspace_members,
workspace_invitations, posts, search_analytics, failed_jobs, notification_logs, etc.

### 5.8 Restart the application

cPanel → **Setup Node.js App** → **seo-agent.net** → **RESTART**.

Visit `https://seo-agent.net` — the login page should load.

---

## 6. Google OAuth Configuration

In Google Cloud Console → **APIs & Services → Credentials → OAuth 2.0 Client**:

Add the production redirect URI:

```
https://seo-agent.net/api/auth/google/callback
```

Keep localhost in place for local development. Save.

---

## 7. Stripe Webhook

Stripe Dashboard → **Developers → Webhooks → Add endpoint**:

- URL: `https://seo-agent.net/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

Copy the **Signing secret** and set it in `.env.production` as
`STRIPE_WEBHOOK_SECRET`, then restart the app.

---

## 8. Cron Jobs (cPanel → Cron Jobs)

`cron.js` is NOT run as a long-living process on cPanel (Passenger kills idle
processes). Instead, each job is a POST to an internal endpoint guarded by
`APIKEY`. Add these four entries in cPanel → **Cron Jobs**:

```cron
# Hourly — batch email notifications (monthly reports split into small batches)
0 * * * * curl -s -X POST -H "Authorization: Bearer REPLACE_WITH_APIKEY" https://seo-agent.net/api/batch-notify > /dev/null 2>&1

# Hourly — retry keywords whose rank scrape failed
15 * * * * curl -s -X POST -H "Authorization: Bearer REPLACE_WITH_APIKEY" https://seo-agent.net/api/refresh > /dev/null 2>&1

# Daily 02:00 — Google Search Console sync
0 2 * * * curl -s -X POST -H "Authorization: Bearer REPLACE_WITH_APIKEY" https://seo-agent.net/api/searchconsole > /dev/null 2>&1

# Monthly 00:00 on day 1 — SERP rank scrape for all tracked keywords
0 0 1 * * curl -s -X POST -H "Authorization: Bearer REPLACE_WITH_APIKEY" https://seo-agent.net/api/cron > /dev/null 2>&1
```

Replace `REPLACE_WITH_APIKEY` with the value from `.env.production → APIKEY`.

---

## 9. Updating the Application (subsequent deploys)

### Quick-deploy checklist

```bash
# === LOCAL (Windows / macOS) ===

# 1. Build with production URL + webpack
cd C:\xampp\htdocs\dpro\seo-ai-agent
NEXT_PUBLIC_APP_URL=https://seo-agent.net npx next build --webpack

# 2. Package build (tar.gz, NOT zip — ClamAV blocks JS in zips)
tar -cf next-build.tar --exclude='dev' --exclude='cache' -C .next .
gzip next-build.tar

# 3. Package source
# PowerShell:
$exclude = @('node_modules','.next','.git','logs','.venv','models','coverage','.env.local','.env.production','next-build.tar.gz','seo-agent-deploy.zip')
$items = Get-ChildItem -Path '.' -Force | Where-Object { $exclude -notcontains $_.Name }
Compress-Archive -Path $items.FullName -DestinationPath 'seo-agent-deploy.zip' -CompressionLevel Optimal -Force

# 4. Upload both files to /home/seoagent/public_html/agent/ via cPanel File Manager
```

```bash
# === SERVER (cPanel Terminal) ===

source /home/seoagent/nodevenv/public_html/agent/22/bin/activate && cd /home/seoagent/public_html/agent

# 5. Extract source
unzip -o seo-agent-deploy.zip

# 6. Extract build
rm -rf .next && mkdir -p .next
tar -xzf next-build.tar.gz -C .next/

# 7. Cleanup archives
rm -f next-build.tar.gz seo-agent-deploy.zip

# 8. Install deps (only if package.json changed)
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 9. Run migrations (only if new migration files exist)
NODE_ENV=production npx sequelize-cli db:migrate --env production

# 10. cPanel → Node.js App → RESTART
```

### Version mismatch gotcha

The `next` package version installed on the server MUST match the version used
for the local build. If they differ, `app.prepare()` will crash with a cryptic
`.map` error. Check both sides:

```bash
# Local
node -e "console.log(require('next/package.json').version)"

# Server
node -e "console.log(require('next/package.json').version)"
```

If they differ, update locally: `npm install next@<server-version>` then rebuild.

### Faster path for tiny fixes

If you changed only a handful of files (e.g. a single API route), you can
skip `seo-agent-deploy.zip` and upload only those files via File Manager.
You still MUST rebuild `.next` locally and upload `next-build.tar.gz` — the
Next.js runtime reads compiled output from `.next/server/pages/**`.

---

## 10. Known Limitations on cPanel

| Feature | Status | Reason / Workaround |
|---|---|---|
| Puppeteer SERP scraping | ✅ Works | Scrapers use external APIs (SerpApi, Serper, ValueSerp, etc.). No local Chromium needed. User connects their own API key. |
| `/api/screenshot` | ❌ Disabled | Replaced with a 501 stub because it requires a local Chromium install. Use an external screenshot service if needed. |
| `cron.js` long-living process | ❌ Killed by Passenger | Replaced by cPanel Cron Jobs (see §8). |
| Local Qwen AI (`llama-cpp-python`) | ❌ Not available | cPanel has no Python + GPU. Either use `SLM_API_URL` pointing at an external AI host, or remove `SLM_API_URL`/`SLM_API_KEY` and let the onboarding fall back to cheerio scraping. |
| `next build` via Turbopack | ❌ Broken by symlink | Build locally and upload the pre-built `.next/` zip (see §5). |

---

## 11. Troubleshooting

### `EACCES: permission denied` during build or listing
```bash
cd ~/public_html/agent
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod +x server.js cron.js
```

### `next: command not found` after reinstall
The Passenger venv recreated the `node_modules` symlink. Re-extract or reinstall:
```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

### `Error: EUSAGE npm ci` — lock file out of sync
Use `npm install` instead of `npm ci` on the server (lockfile is regenerated).

### `Turbopack error: Symlink ... invalid`
You tried to run `npm run build` on the server. Don't — build locally, upload
`next-build.zip`, extract into `.next/`.

### `Expression #N of SELECT list is not in GROUP BY clause`
Already fixed in `services/gscStorage.ts` via `ANY_VALUE(page)`. If you see it
elsewhere, wrap the unaggregated column in `ANY_VALUE()` or add it to
`GROUP BY`.

### Google profile picture not showing
Ensure `<img>` tags include `referrerPolicy="no-referrer"` (already applied in
`components/common/AccountMenu.tsx`).

### `Cannot find package '@tanstack/react-query-devtools'`
This devDependency is dynamically imported in `_app.tsx`. cPanel installs
with `NODE_ENV=production` and skips devDeps. Fix: install it manually in
the venv (see §5.7). This only needs to be done once.

### `Cannot read properties of undefined (reading 'map')` on startup
Almost always a **Next.js version mismatch** between the local build and
the server. The `.next/` output is version-specific. Fix: match versions
(see §9 "Version mismatch gotcha"), rebuild, re-upload.

### `NEXT_PUBLIC_APP_URL` pointing to localhost in production
`NEXT_PUBLIC_*` variables are **baked into the JS bundle at build time**.
Setting them in `.env.production` on the server has no effect for
client-side code. Fix: set them BEFORE running `next build`:
```bash
NEXT_PUBLIC_APP_URL=https://seo-agent.net npx next build --webpack
```

### ClamAV blocks `.zip` upload (Sanesecurity.Foxhole.JS_Zip)
cPanel's antivirus flags zip files containing JavaScript as malware (false
positive). Fix: use `.tar.gz` instead of `.zip` for the `.next/` build
archive (see §5.2).

### `node_modules` broken after `npm audit fix --force`
`npm audit fix --force` replaces the cPanel symlink with a real directory.
Fix:
```bash
rm -rf node_modules
ln -s /home/seoagent/nodevenv/public_html/agent/22/lib/node_modules node_modules
```
Then click **Run NPM Install** in cPanel Node.js App page.

### `Cloudlinux NodeJS Selector demands symlink` error
Same as above — `node_modules` must be a symlink, not a real directory.

### Database reset (nuclear option)
If columns are missing or tables are corrupt, drop everything and re-run
migrations from scratch:
```bash
mysql -u seoagent_agent -p'Necl4.p1)bWc}PJT' seoagent_agent -e "
SET FOREIGN_KEY_CHECKS=0;
$(mysql -u seoagent_agent -p'Necl4.p1)bWc}PJT' seoagent_agent -e \
  "SELECT CONCAT('DROP TABLE IF EXISTS \\\`',table_name,'\\\`;') FROM information_schema.tables WHERE table_schema='seoagent_agent';" 2>/dev/null | grep DROP)
SET FOREIGN_KEY_CHECKS=1;
"
NODE_ENV=production npx sequelize-cli db:migrate --env production
```

---

## 12. MCP Server — Architecture & Troubleshooting

### What we use

The MCP endpoint (`/api/mcp`) is built with the **official
`@modelcontextprotocol/sdk`** package (v1.29+). It uses:

- **`McpServer`** from `@modelcontextprotocol/sdk/server/mcp.js` — tool
  registration, protocol negotiation, capabilities
- **`StreamableHTTPServerTransport`** from
  `@modelcontextprotocol/sdk/server/streamableHttp.js` — SSE + JSON
  responses, session management, `Mcp-Session-Id` header

This is the same approach as `laravel-mcp` in the Flowxtra backend — the
official SDK handles SSE transport, session IDs, and protocol versions
automatically, which is required by Claude, Cursor, and ChatGPT.

### Why the custom implementation failed

Our initial hand-written JSON-RPC handler returned plain `application/json`
responses. Claude.ai's MCP client requires **Streamable HTTP transport**
(SSE envelope, session headers, protocol negotiation). Without the SDK
handling these details, every OAuth-authenticated request completed on the
server (tokens were issued and validated) but Claude rejected the response
format and reported "Authorization with the MCP server failed."

### How it works now

| Component | File |
|---|---|
| MCP endpoint | `pages/api/mcp/index.ts` |
| Tool definitions | inline in `createMcpServer()` (same file) |
| OAuth token verification | `utils/oauthAuth.ts` |
| Legacy API-key auth | `utils/mcpAuth.ts` |
| OAuth provider (authorize/token/register) | `pages/api/oauth/*` |
| Discovery | `pages/api/.well-known/oauth-authorization-server.ts` |

**19 tools** registered:
`get_profile`, `get_current_workspace`, `list_domains`,
`get_domain_insight`, `get_domain_keywords`, `list_tracked_keywords`,
`add_tracked_keyword`, `list_domain_competitors`,
`update_domain_competitors`, `get_keyword_competitors`,
`get_competitor_history`, `get_domain_seo_overview`,
`find_keyword_opportunities`, `generate_content_brief`, `list_posts`,
`get_post`, `analyze_seo`, `save_post`, `delete_post`

### Connecting from Claude.ai

1. Go to **Settings → Connectors → Add custom connector**
2. Name: `SEO AI Agent`
3. URL: `https://seo-agent.net/api/mcp`
4. Leave OAuth fields empty — auto-discovery handles everything
5. Claude opens the consent page → approve → connected

### Connecting from Claude Desktop (config file)

Claude Desktop does not yet support remote HTTP MCP via `url` in config.
Use the local proxy or wait for Claude Desktop to add remote support.

### MariaDB compatibility

cPanel uses MariaDB, not MySQL. MariaDB does not support the
`ANY_VALUE()` function. Use `MAX()` instead in GROUP BY queries
(already fixed in `services/gscStorage.ts`).

### `output: 'standalone'` must NOT be set

`next.config.js` must NOT contain `output: 'standalone'`. This mode
generates a self-contained server that conflicts with cPanel's Passenger
`server.js`. The setting was removed — do not re-add it.

---

## 13. File Checklist on Server

After a successful deploy, `/home/seoagent/public_html/agent/` should contain:

```
.env.production               <-- secrets, NOT from git
.next/                        <-- pre-built output from local build
components/
context/
cron.js                       <-- kept for reference but NOT executed on cPanel
database/
email/
hooks/
i18n.ts
lib/
locales/
next.config.js
node_modules/                 <-- symlinked by cPanel venv (normal)
package.json
package-lock.json
pages/
postcss.config.js
public/
scrapers/
server.js                     <-- Passenger startup file
services/
styles/
tailwind.config.js
tsconfig.json
types.d.ts
utils/
```

---

## 13. Quick Reference — common commands

```bash
# Activate venv and enter project
source /home/seoagent/nodevenv/public_html/agent/22/bin/activate && cd /home/seoagent/public_html/agent

# Install / update dependencies
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Run migrations
npm run db:migrate:prod

# Check DB from CLI
mysql -u seoagent_agent -p'Necl4.p1)bWc}PJT' seoagent_agent -e "SHOW TABLES;"

# Tail Node.js app logs
tail -f /home/seoagent/public_html/agent/stderr.log

# Manually trigger a cron endpoint to test
curl -s -X POST -H "Authorization: Bearer $APIKEY" https://seo-agent.net/api/batch-notify
```

---

**© 2026 Dpro GmbH — Flowxtra**
