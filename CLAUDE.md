# SEO Agent — Project Guide for Claude

> ⚠️ **READ THIS FIRST**
> This project is **Next.js 16 + MySQL (Sequelize)** — it is **NOT Laravel**.
> Do **NOT** run `php artisan` here. There is no `artisan` file.
> To run migrations use **`npm run db:migrate`**. To reset the DB use **`npm run db:reset`** (dev) or **`npm run db:reset:prod`** (prod, destructive).

---

## 1. Project Identity

- **Name:** SEO Agent (`seo-ai-agent` v2.1.0)
- **Type:** Multi-Tenant SaaS for SEO research, tracking, and content
- **Path:** `C:\MAMP\htdocs\flowxtra\hr_blogs\seo_ai_agent`
- **Website:** https://seo-agent.net
- **Owner:** © 2026 Dpro GmbH — Flowxtra
- **Sibling apps in monorepo:** `backend/` (Laravel API), `admin_dashboard/` (Filament), `landdingpage_flowxtra/` (Next.js), `company-jobs-page/` (Next.js), `angular_dashboard/` (Angular). **This guide only covers `seo_ai_agent`.**

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16.1** (Pages Router) |
| Runtime | Node.js 18+ |
| Language | TypeScript 5.7 (strict) |
| UI | React 18.3, Radix UI, Tailwind CSS 3.4, shadcn-style components |
| State / data | TanStack Query 5, Zod validation |
| Database | **MySQL 5.7+/8.0** or **TiDB Cloud** |
| ORM | **Sequelize 6** + `sequelize-typescript` + `sequelize-cli` |
| Auth | bcryptjs, JWT (`jsonwebtoken`), Google OAuth (`googleapis`), own OAuth 2.0 Provider (PKCE, RFC 7591/9728) |
| MCP | `@modelcontextprotocol/sdk` — single endpoint `/api/mcp` (19 tools, JSON-RPC 2.0, OAuth Bearer + API-key dual auth) |
| Payments | **Stripe v20** (workspace-scoped) |
| Background jobs | `cron.js` + `croner` + PM2 |
| Scraping | Puppeteer 24 |
| AI | **Local Qwen 2.5 3B** via `llama-cpp-python` server on port `38474` (no external keys required). `openai` + `ai` SDKs available as fallback. |
| Email | Nodemailer (SMTP) |
| i18n | `next-intl` 4.7 — `en` / `de` / `fr` |
| Testing | Jest 29, React Testing Library, MSW |
| Deployment | **PM2 on VPS** (Puppeteer + cron rule out pure serverless) |
| Dev port | **55781** — `predev` script auto-kills any process holding it |

---

## 3. Directory Map

```
seo_ai_agent/
├── pages/                  # Next.js Pages Router
│   ├── api/                # API routes (auth, workspaces, domains,
│   │                       #   keywords, posts, gsc, mcp, oauth,
│   │                       #   billing, cron, batch-notify, ...)
│   ├── domain/             # Per-domain dashboards
│   ├── workspace/          # Workspace UI + invitation flow
│   ├── profile/            # User/workspace/team/oauth-apps pages
│   ├── oauth/              # Consent screen
│   ├── mcp-seo.tsx         # MCP setup wizard
│   └── ...
├── components/             # Reusable React components (Radix + Tailwind)
├── database/
│   ├── config.js           # Sequelize CLI config (reads .env.local / .env.production)
│   ├── database.ts         # Runtime Sequelize instance
│   ├── migrations/         # Sequelize CLI migrations (timestamp-prefixed)
│   └── models/             # sequelize-typescript models
├── services/               # Business logic (keep API routes thin)
├── lib/                    # Shared libs (auth, mailer, gsc, stripe, ...)
├── scrapers/               # Puppeteer SERP scrapers
├── mcp-server/             # Standalone MCP package (legacy / publishable)
├── utils/                  # Helpers — incl. ownerOnlyPage.ts SSR guard
├── hooks/                  # React hooks
├── context/                # React contexts
├── locales/                # next-intl messages (en/de/fr)
├── i18n.ts                 # next-intl request config
├── email/                  # Nodemailer templates
├── cron.js                 # Background job entrypoint
├── scripts/                # One-off node scripts
├── docs/                   # Internal docs
├── __tests__/ + __mocks__/ # Jest tests
├── public/                 # Static assets
├── styles/                 # Global Tailwind / CSS
├── components.json         # shadcn config
├── tailwind.config.js
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## 4. Environment Variables

Dev reads `.env.local`. Prod reads `.env.production` (`NODE_ENV=production`).
Sequelize CLI is wired the same way via `database/config.js`.

```bash
# Database (Sequelize)
DB_HOST=127.0.0.1
DB_PORT=8889            # MAMP default; 3306 for stock MySQL
DB_USER=root
DB_PASSWORD=root        # NOTE: Sequelize reads DB_PASSWORD (not DB_PASS)
DB_NAME=flowxtra_serp   # README example uses seo_db; default in config.js is flowxtra_serp
# If DB_HOST contains "tidbcloud" SSL is auto-enabled.

# App
NEXT_PUBLIC_APP_URL=http://localhost:55781
SECRET=<random 32-byte hex>   # generate with: npm run env:generate-secret

# Local AI (Qwen via llama-cpp-python)
SLM_API_URL=http://127.0.0.1:38474

# Google OAuth + Search Console + Ads
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:55781/api/auth/google/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...           # switch to sk_live_... in prod
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP (Nodemailer)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="SEO Agent <noreply@seo-agent.net>"
```

Sanity-check env loading: `npm run env:check`.

---

## 5. Database Rules

- ORM: **Sequelize 6** (`database/database.ts` for runtime, `database/config.js` for CLI).
- Migrations live in `database/migrations/` and use Sequelize CLI format with timestamp prefixes (e.g. `20260408100000-create-workspaces.js`).
- Every migration **must** implement a reversible `down()`.
- Models live in `database/models/*.ts` (User, Domain, Keyword, Post, Workspace, WorkspaceMember, WorkspaceInvitation, ApiKey, ApiAuditLog, NotificationLog, NotificationSetting, PlatformIntegration, PlatformIntegrationLog, InvoiceDetail, SearchAnalytics, FailedJob, Setting).
- Use the npm scripts — **never** drop tables by hand:

```bash
npm run db:migrate          # apply pending (dev — .env.local)
npm run db:migrate:prod     # apply pending (prod — .env.production)
npm run db:migrate:undo     # rollback last migration
npm run db:reset            # undo:all + migrate (DEV ONLY)
npm run db:reset:prod       # undo:all + migrate in PROD ⚠️ DESTRUCTIVE
npm run db:seed             # run seeders
```

- TiDB Cloud: SSL is auto-enabled when `DB_HOST` contains `tidbcloud`. Use `npm run db:migrate:prod` against `.env.production`.

---

## 6. API Conventions

- All API routes are Next.js Pages Router handlers under **`pages/api/`**.
- **Workspace-scoped** endpoints must:
  1. Resolve the active workspace from the session/cookie.
  2. Enforce the role of the requesting user (owner / admin / editor / viewer).
  3. Never leak data across workspaces.
- Owner-only **SSR pages**: wrap `getServerSideProps` with `utils/ownerOnlyPage.ts`.
- **Validation:** every handler validates input with **Zod** before doing anything else. Return 422 on validation failure.
- **Business logic** lives in `services/` and `lib/`. Keep handlers thin (parse → validate → call service → format response).
- **MCP:** all 19 tools are served from `/api/mcp` (JSON-RPC 2.0). Auth = OAuth Bearer **or** personal API key. Discovery via `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource`.
- **OAuth 2.0 Provider** endpoints live under `pages/api/oauth/*` (authorize, token, register, clients/public, consent).
- **Self-healing endpoints:** `/api/workspaces` deletes empty auto-created personal workspaces; `/api/domains` adopts orphan domains into the active workspace. Preserve this behavior when editing.

---

## 7. Auth & Permissions Matrix

| Action | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|
| View dashboard / insights / tracking | ✅ | ✅ | ✅ | ✅ |
| Manage keywords / competitors / posts | ✅ | ✅ | ✅ | ❌ |
| Add new domains (capped by owner plan) | ✅ | ✅ | ❌ | ❌ |
| Manage Workspaces / Team / Search Console / Scraper | ✅ | ✅ | ❌ | ❌ |
| Billing & Subscription | ✅ | view-only | ❌ | ❌ |
| Delete workspace | owner only | ❌ | ❌ | ❌ |

Plan limits: **Free = 1 domain / 9 keywords**. See `utils/planLimits` for the source of truth.

---

## 8. Background Jobs (`cron.js`)

Run via `npm run cron` (or PM2: `pm2 start npm --name "seo-cron" -- run cron`).

Responsibilities:
- Monthly SERP scraping (Puppeteer)
- Hourly batch notifications
- Failed job retries
- Daily Google Search Console sync

Logs: `logs/cron.log` and `logs/cron.error.log` (auto-created).

PM2 layout in production:
```bash
pm2 start npm --name "seo-web"  -- start
pm2 start npm --name "seo-cron" -- run cron
pm2 logs seo-cron
```

Manual trigger:
```bash
curl -X POST http://localhost:55781/api/batch-notify
curl -X POST http://localhost:55781/api/cron -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 9. Local AI Agent (Qwen 2.5)

The "Seo Agent" chat is powered by a **local** Qwen 2.5 3B model served by `llama-cpp-python`. No external AI API keys required.

Setup once:
```powershell
& "path\to\python.exe" -m venv .venv
.venv\Scripts\pip install "llama-cpp-python[server]"
# put qwen2.5-3b-instruct-q4_k_m.gguf in models/
```

Run (in a separate terminal, alongside `npm run dev`):
```powershell
.venv\Scripts\Activate.ps1
python -m llama_cpp.server --model models\qwen2.5-3b-instruct-q4_k_m.gguf --host 127.0.0.1 --port 38474 --n_ctx 2048 --n_threads 6
```

Verify: open http://127.0.0.1:38474/docs (Swagger UI). The web app talks to it via `SLM_API_URL`.

---

## 10. Coding Rules

- **Strict TypeScript** — no `any` unless unavoidable (and then comment why).
- **Server Components mindset:** in Pages Router, push client-only logic into leaf components; keep data fetching on the server (`getServerSideProps` / API route).
- **Tailwind utility classes** + **Radix primitives** + shadcn components — avoid custom CSS unless Tailwind cannot express it.
- **All user-facing strings** go through `next-intl`. Add keys to `locales/en`, `locales/de`, `locales/fr` together.
- **Async UI:** every async operation needs explicit loading, error, and empty states.
- **Validation:** Zod at every API boundary.
- **Business logic** in `services/` and `lib/`, not in handlers or React components.
- **Imports** ordered: framework → third-party → local.
- **Naming:** descriptive over comments. `getActiveDomainsForWorkspace()` not `getDomains()`.
- **No secrets in code** — only in `.env.local` / `.env.production`. Never commit either.
- **Migrations** must be reversible.
- **Workspace boundary:** never write a query that crosses workspaces without an explicit, audited reason.

---

## 11. Testing

- Framework: **Jest 29** + **React Testing Library** + **MSW**.
- Mirror the source tree under `__tests__/`.
- One test file per source file.
- Descriptive test names: `test_workspace_admin_cannot_delete_workspace`.
- Run before pushing:
  ```bash
  npm run test:ci
  npm run lint
  ```
- Full pre-push gate: `npm run deploy:check` (lint + test:ci + build).

---

## 12. Common Pitfalls — DO NOT

- ❌ **Do NOT run `php artisan` here.** This is Next.js, not Laravel. Use `npm run db:migrate`.
- ❌ **Do NOT** hardcode `localhost` in OAuth redirect URIs for production — most MCP clients (Cursor, Zed, Claude Desktop) reject it. Use HTTPS public URLs.
- ❌ **Do NOT** deploy to pure serverless. Puppeteer + `cron.js` need a long-lived Node host (VPS + PM2).
- ❌ **Do NOT** run `npm run db:reset:prod` without explicit user confirmation. It wipes production data.
- ❌ **Do NOT** bypass workspace role guards on new endpoints.
- ❌ **Do NOT** return raw Sequelize models from API responses — shape them first.
- ❌ **Do NOT** add `'use client'`-style hacks; this app uses the **Pages Router**, not the App Router.
- ❌ **Do NOT** hardcode plan limits — read from `utils/planLimits`.

---

## 13. Quick Start (new session)

```bash
# 1. Install
npm install

# 2. Configure env (see section 4)
cp .env.example .env.local   # or create from scratch
npm run env:generate-secret  # paste into SECRET=

# 3. Database
npm run db:migrate

# 4. Run web app (port 55781)
npm run dev

# 5. (Optional) Start local Qwen AI server in a second terminal
.venv\Scripts\Activate.ps1
python -m llama_cpp.server --model models\qwen2.5-3b-instruct-q4_k_m.gguf --host 127.0.0.1 --port 38474 --n_ctx 2048 --n_threads 6

# 6. Open
start http://localhost:55781
```

---

## 14. Roadmap

The full list of ✅ completed features, 🔴 production blockers, 🟡 important items, 🟢 nice-to-haves, and 🔵 long-term ideas lives in **`README.md`** (sections "Project Status & Roadmap"). Don't duplicate it — read it there before proposing new features.

---

**© 2026 Dpro GmbH — Flowxtra**
