Deploy the SEO Agent to production.

Steps:
1. Run TypeScript check: `npx tsc --noEmit` — fix any errors in changed files
2. Build locally: `NEXT_PUBLIC_APP_URL=https://seo-agent.net npx next build --webpack`
3. Package the build: `tar -cf next-build.tar --exclude='dev' --exclude='cache' -C .next . && gzip next-build.tar`
4. Upload build to server: `scp next-build.tar.gz seo-server:/home/seoagent/public_html/agent/`
5. Upload any changed source files via SCP (migrations, services, pages, components, utils)
6. SSH to server and extract: `ssh seo-server "source /home/seoagent/nodevenv/public_html/agent/22/bin/activate && cd /home/seoagent/public_html/agent && rm -rf .next && mkdir -p .next && tar -xzf next-build.tar.gz -C .next/ && rm next-build.tar.gz"`
7. Run migrations if needed: `ssh seo-server "source /home/seoagent/nodevenv/public_html/agent/22/bin/activate && cd /home/seoagent/public_html/agent && NODE_ENV=production npx sequelize-cli db:migrate --env production"`
8. Install new packages if needed: `ssh seo-server "source /home/seoagent/nodevenv/public_html/agent/22/bin/activate && cd /home/seoagent/public_html/agent && PUPPETEER_SKIP_DOWNLOAD=true npm install"`
9. Remind user to restart app in cPanel → Node.js App → RESTART

Important:
- NEVER run `npm run build` on the server (Turbopack crashes on cPanel symlinks)
- Always use `--webpack` flag for build
- Use tar.gz NOT zip (ClamAV blocks JS in zips)
- Check node/next version match between local and server
