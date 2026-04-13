---
name: deploy
description: Deploy SEO Agent to production server (seo-agent.net). Auto-invoked when user says "deploy", "push to server", "ارفع على السيرفر", or "نشر".
---

# Deploy to Production

## Trigger
User mentions deploying, pushing to production, or uploading to server.

## Steps

1. **Identify changed files** — check what was modified since last deploy
2. **TypeScript check** — `npx tsc --noEmit` on changed files
3. **Build locally** — `NEXT_PUBLIC_APP_URL=https://seo-agent.net npx next build --webpack`
4. **Package** — `tar -cf next-build.tar --exclude='dev' --exclude='cache' -C .next . && gzip next-build.tar`
5. **Upload build** — `scp next-build.tar.gz seo-server:/home/seoagent/public_html/agent/`
6. **Upload source files** — SCP changed files to matching paths on server
7. **Extract on server** — SSH and extract .next, clean up tar
8. **Install packages** — if package.json changed, run npm install on server
9. **Run migrations** — if new migration files, run sequelize migrate on server
10. **Notify user** — remind to restart app in cPanel

## Critical Rules
- NEVER build on server (Turbopack + cPanel symlinks = crash)
- Use tar.gz NOT zip (ClamAV blocks JS in zips)
- Always use `--webpack` flag
- SSH alias: `seo-server`
