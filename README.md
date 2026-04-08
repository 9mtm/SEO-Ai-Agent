
# SEO Agent

website: https://seo-agent.net

![License](https://img.shields.io/badge/license-MIT-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![AI](https://img.shields.io/badge/AI-Powered-purple)

**SEO Agent** has been upgraded to a **Multi-Tenant SaaS** with a built-in **Local AI SEO Agent**.
This version runs entirely on your local machine using Node.js for the web app and a local Python server for the AI model (Qwen).

---

## ✨ New Features

- **🏠 Multi-Tenant SaaS:** Full user isolation. Sign up, login, and manage private projects.
- **🤖 SEO Agent (AI):** Chat with a local AI model (Qwen 2.5) to get keyword ideas and SEO advice.
- **🔐 Google OAuth:** One-click login and integration with Search Console & Google Ads.
- **⚡ Local Intelligence:** No external AI API keys required. Runs 100% locally on your CPU/GPU.

---

## 🛠️ Installation Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **MySQL Database** (Local or Remote)
- **Python 3.10+** (For the AI Server)
- **Git**

### 2. Setup the Web Application

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Update `.env.local` with your database and app settings:
   ```bash
   # Database
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASS=root
   DB_NAME=seo_db
   
   # App
   NEXT_PUBLIC_APP_URL=http://localhost:55781
   SECRET=your-random-secret
    
   # Local AI (Seo Agent)
   SLM_API_URL=http://127.0.0.1:38474
   ```

3. **Database Migrations:**

   - **For Local Development (MAMP/Local MySQL):**
     ```bash
     npm run db:migrate
     ```
     *Loads settings from `.env.local`.*

   - **For Production (TiDB Cloud/Remote MySQL):**
     ```bash
     npm run db:migrate:prod
     ```
     *Sets `NODE_ENV=production` and loads settings from `.env.production`. Mandatory SSL is automatically enabled for TiDB Cloud compatibility.*

4. **Start Web Server:**
   ```bash
   npm run dev
   ```
   Access at: **http://localhost:55781**

---

## 🤖 Setup Local AI Agent (Seo Agent)

The AI Agent uses `llama-cpp-python` to run the Qwen model efficiently on your CPU.

### 1. Create Python Virtual Environment
Run this inside the project folder:
```powershell
# Create venv
& "path\to\python.exe" -m venv .venv
```

*(Note: Replace `path\to\python.exe` with your actual Python installation path if needed)*

### 2. Install Dependencies
```powershell
# Install llama-cpp-python server
.venv\Scripts\pip install "llama-cpp-python[server]"
```

### 3. Download the Model
Place the `qwen2.5-3b-instruct-q4_k_m.gguf` model file in the `models/` directory.

### 4. Run the AI Server
Open a **separate PowerShell window** and run:

```powershell
# Activate Environment
.venv\Scripts\Activate.ps1

# Run Server (Port 38474)
python -m llama_cpp.server --model models\qwen2.5-3b-instruct-q4_k_m.gguf --host 127.0.0.1 --port 38474 --n_ctx 2048 --n_threads 6
```

✅ **Verification:**
- Open http://127.0.0.1:38474/docs to see the API Swagger UI.
- Go to the **Seo Agent** tab in the web app to chat with the model.

---

## 🔧 Managing the Project

### Start Everything
1. Terminal 1: `npm run dev` (Web App)
2. Terminal 2: `python -m llama_cpp.server ...` (AI Model)

### Troubleshooting
- **Module not found 'ai/react'**: Run `npm install ai@3.4.0`
- **Database Errors**: Ensure MySQL is running and `npm run db:migrate` has been executed.
- **Port Conflicts**: Change port in `package.json` or `.env.local` if 55781 is busy.

---

## 📧 Email Notifications Setup (Production)

The application includes an automated batch notification system that sends monthly email updates to users.

### Cron Job Configuration

### Running Cron Jobs (Production)

The system relies on several background tasks for scraping keywords and sending notifications.

#### Using PM2 (Recommended)
PM2 is a process manager that keeps your app and cron jobs running forever.

1. **Start the Web App:**
   ```bash
   npm run build
   pm2 start npm --name "seo-web" -- start
   ```

2. **Start the Cron Scheduler:**
   ```bash
   pm2 start npm --name "seo-cron" -- run cron
   ```
   *This runs `cron.js`, which handles:*
   *   Monthly SERP Scraping
   *   Hourly Batch Notifications
   *   Failed Job Retries
   *   Daily Google Search Console Sync

3. **Monitor Logs:**
   The cron system automatically creates a `logs/` directory in your project root.
   *   `logs/cron.log`: General activity and success messages.
   *   `logs/cron.error.log`: Errors and failure details.

   You can also check live logs via PM2:
   ```bash
   pm2 logs seo-cron
   ```

### Manual Testing

Test the batch notification system manually:
```bash
# Trigger Batch Notification
curl -X POST http://localhost:55781/api/batch-notify

# Trigger SERP Scraping (Protected)
curl -X POST http://localhost:55781/api/cron -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 📋 Project Status & Roadmap

### ✅ Completed

- **Multi-tenant Workspaces** — full team support (owner / admin / editor / viewer), invitations with email, workspace switching, rename, delete
- **OAuth 2.0 Provider** — Authorization Code + PKCE, Dynamic Client Registration (RFC 7591), Protected Resource Metadata (RFC 9728), consent screen, token rotation
- **Integrated MCP Server** — single endpoint `/api/mcp` with 19 tools, OAuth Bearer + API-key dual auth, JSON-RPC 2.0, auto-discovery via `.well-known`
- **SEO Analyzer** — professional 20+ on-page factor scoring engine (0-100), used in `save_post` tool + `/api/posts/analyze`
- **Smart Incremental GSC Sync** — on-demand, cooldown-based, with concurrency lock, audit log in `gsc_sync_log`
- **Content Research Tools** — domain SEO overview, keyword opportunities (striking distance / low CTR / rising), content brief generator
- **Setup Guide** — 3-step flow with automatic AI connection detection
- **Connected Apps page** — shows active OAuth sessions + developer app registration
- **Workspace Indicator** — Slack-style switcher in header
- **Workspace-scoped APIs** — domains, keywords, posts, competitors, usage, notifications
- **Workspace-based Billing** — Stripe checkout binds subscription to the active workspace via metadata
- **Translations** — `en` / `de` / `fr` for the new `mcp.autoConnect` block
- **Legacy cleanup** — removed standalone `mcp-server/`, `mcp-proxy/`, old API-key UI, duplicate MCP routes
- **Role-based UI + server guards** — `owner` & `admin` share the full management UI (Workspaces, Team, Search Console, Billing, Scraper, Connected Apps). `editor` and `viewer` only see Profile + Notifications + Connected Apps. Every owner-only page enforces the rule again in `getServerSideProps` via `utils/ownerOnlyPage.ts`.
- **Permission matrix**

  | Action | Owner | Admin | Editor | Viewer |
  |---|---|---|---|---|
  | View dashboard, insights, tracking | ✅ | ✅ | ✅ | ✅ |
  | Manage keywords / competitors / posts | ✅ | ✅ | ✅ | ❌ |
  | Add new domains (capped by owner plan) | ✅ | ✅ | ❌ | ❌ |
  | Manage Workspaces / Team / Search Console / Scraper | ✅ | ✅ | ❌ | ❌ |
  | Billing & Subscription | ✅ | view-only | ❌ | ❌ |
  | Delete workspace | owner only | ❌ | ❌ | ❌ |

- **Team member join flow** — accepting an invitation sets `onboarding_step = 3`, switches `current_workspace_id` to the invited workspace, and **deletes the user's empty personal workspace** so they only see the team workspace in the switcher.
- **Self-healing workspace cleanup** — `GET /api/workspaces` automatically deletes any empty, auto-created personal workspace for users who are already members of a team workspace. Legacy accounts are repaired on next page load without any manual SQL.
- **Team-aware Google OAuth callback** — new signups who arrive via an invitation link do NOT get a personal workspace auto-created. Returning users only get a personal workspace if they have zero memberships.
- **Team-aware post-login redirect** — the Google callback now reads the active workspace's domains (not `user.domains`) so team members land directly on the shared workspace's first domain instead of being bounced to `/onboarding`.
- **Team-member setup bypass** — `/api/user/setup-status` reports `percentage: 100` + `is_team_member: true` for non-owners, so the Setup Guide never nags them to connect GSC / configure scraper / add domains.

---

### 🔴 Remaining Production Blockers

1. **End-to-end OAuth flow test** from Cursor / Zed / Claude Desktop against a live HTTPS deployment. `localhost` is rejected by most MCP clients.
2. **Deploy to a real server with HTTPS** — VPS (Hetzner / DigitalOcean / Contabo) or a container host that supports full Node.js (Puppeteer + cron rule out pure serverless).
3. **Stripe production keys** — currently `sk_test_...`. Switch to live keys and register the webhook endpoint in the Stripe dashboard.
4. **Production environment variables**
   - `NEXT_PUBLIC_APP_URL=https://your-domain.com`
   - `GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback`
   - `STRIPE_WEBHOOK_SECRET` from the live dashboard
   - All SMTP credentials verified

---

### 🟡 Important (not blockers)

5. **Email verification on signup** — add `email_verified` column + verification link flow. Current email/password signup accepts any address.
6. **Password reset flow** — no "Forgot password" on the login page yet. Needs `/api/auth/forgot-password` + `/reset-password?token=...` page.
7. **Finish mcp-seo translations** — only the `mcp.autoConnect` block is localized. FAQ (8 questions) and per-tab step text are still hard-coded English.
8. **Plan-limit integration tests** — verify free plan caps at 2 domains / 9 keywords end-to-end.
9. **Profile landing page (`/profile`)** — review and clean up after the sidebar changes.
10. **Platform integrations (WordPress / Shopify / Wix)** — the `platform_integrations` tables still live in the DB. Either finish the workspace-scope migration for `/domain/settings/[slug]?tab=integrations` or drop the feature entirely.

---

### 🟢 Nice to have

11. **Bounced invitation email handling** — retry or flag when SMTP returns a hard bounce.
12. **Workspace audit log** — timestamped record of every member change, domain add/remove, plan change.
13. **Multi-workspace dashboard** — one-page overview across every workspace the user belongs to.
14. **2FA / TOTP** for owners and admins.
15. **Rate limiting** on `/api/oauth/authorize`, `/api/oauth/token`, `/api/oauth/register` (currently unbounded).
16. **Pending invitations badge** in the header bell icon.
17. **Outbound webhooks** — `workspace.member_added`, `domain.added`, `subscription.updated`, etc., so users can wire our events into Zapier / n8n.
18. **API documentation** — Swagger / OpenAPI for the REST endpoints and an MCP tool reference.
19. **i18n for the new pages** — `/profile/team`, `/profile/workspaces`, `/profile/oauth-apps`, `/oauth/consent`, `/workspace/invitation/[token]` are English-only.
20. **Onboarding refresh** — explain the MCP / OAuth flow and the workspace concept during signup.
21. **Error tracking** — Sentry (or similar) in production.
22. **Performance monitoring** — Vercel Analytics / Web Vitals.
23. **SEO meta tags** for all new public-facing pages.
24. **Cookie consent banner (GDPR)** — mandatory for EU traffic.

---

### 🔵 Future / long-term

- SSO (SAML / OIDC) for enterprise customers
- White-labelling per workspace (custom logo, colors, favicon)
- Custom domains per workspace
- Workspace data export / import
- API versioning (`/api/v1/mcp`)
- Optional GraphQL endpoint

---

### 💡 Suggested next step

1. **Test the OAuth flow from Cursor or Zed** against a live HTTPS host — everything downstream depends on this working.
2. Then: **email verification + password reset** (security baseline, no infrastructure changes required).
3. Then: **Stripe production switch** + end-to-end checkout run.
4. Then: the remaining 🟡 items as time allows.

---

**© 2026 Dpro GmbH - Flowxtra**
