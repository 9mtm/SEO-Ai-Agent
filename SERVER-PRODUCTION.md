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

## 1. Server Environment

| Item | Value |
|---|---|
| Host | `s2903.fra1.stableserver.net` |
| SSH user | `seoagent` |
| Home directory | `/home/seoagent` |
| Application root | `/home/seoagent/public_html/agent` |
| Node.js version | `22.22.0` (via cPanel Node.js Selector) |
| Passenger venv activator | `source /home/seoagent/nodevenv/public_html/agent/22/bin/activate && cd /home/seoagent/public_html/agent` |
| Public URL | `https://seo-agent.net` |
| Startup file | `server.js` |

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

```bash
cd agent
npm install
npm run build
```

The build produces `agent/.next/`. Verify the output lists all routes
successfully. If the build fails, fix locally before uploading.

### 5.2 Package source + pre-built output

Two zips are produced at the project root (one level above `agent/`):

- `seo-agent-deploy.zip` — application source (no `node_modules`, no `.next`,
  no secrets). Generated via PowerShell:
  ```powershell
  $src  = 'C:\MAMP\htdocs\dpro\seo-agent\agent'
  $dst  = 'C:\MAMP\htdocs\dpro\seo-agent\seo-agent-deploy.zip'
  $exclude = @('node_modules','.next','.git','logs','.venv','models','coverage','.env.local','.env.production')
  $items = Get-ChildItem -Path $src -Force | Where-Object { $exclude -notcontains $_.Name }
  Compress-Archive -Path $items.FullName -DestinationPath $dst -CompressionLevel Optimal -Force
  ```
- `next-build.zip` — the pre-built `.next/` output (excluding `dev/` and
  `cache/`):
  ```powershell
  $items = Get-ChildItem -Path 'C:\MAMP\htdocs\dpro\seo-agent\agent\.next' -Force |
           Where-Object { $_.Name -ne 'dev' -and $_.Name -ne 'cache' }
  Compress-Archive -Path $items.FullName -DestinationPath 'C:\MAMP\htdocs\dpro\seo-agent\next-build.zip' -CompressionLevel Optimal -Force
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
unzip -o next-build.zip -d .next/
ls -la .next/ | head -10    # expect server/, static/, build-manifest.json, ...
rm next-build.zip
```

### 5.7 Run database migrations

```bash
npm run db:migrate:prod
```

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

For any code change:

1. Edit locally → test with `npm run dev`.
2. Run `npm run build` locally.
3. Rebuild the two zips (`seo-agent-deploy.zip`, `next-build.zip`).
4. Upload both to `/home/seoagent/public_html/agent/`.
5. On the server:
   ```bash
   source /home/seoagent/nodevenv/public_html/agent/22/bin/activate && cd /home/seoagent/public_html/agent
   unzip -o seo-agent-deploy.zip
   rm -rf .next && mkdir -p .next && unzip -o next-build.zip -d .next/
   PUPPETEER_SKIP_DOWNLOAD=true npm install    # only if package.json changed
   npm run db:migrate:prod                      # only if new migrations exist
   ```
6. cPanel → Node.js App → **RESTART**.

### Faster path for tiny fixes

If you changed only a handful of files (e.g. a single API route), you can
skip the full zip and upload only those files via File Manager. Then still
rebuild `.next` locally and upload `next-build.zip` — this is the non-optional
part, because the Next.js runtime reads from `.next/server/pages/**`.

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

---

## 12. File Checklist on Server

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
