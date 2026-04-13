## Code Style Rules

- **Framework**: Next.js 16 with **Pages Router** (NOT App Router) — all pages in `pages/`, API routes in `pages/api/`
- **Language**: TypeScript strict mode. Use `declare` for Sequelize model fields.
- **Components**: React functional components with hooks. Use shadcn/ui + Radix + Tailwind.
- **State**: TanStack Query for server state, React useState/useContext for local state.
- **Imports**: Use `@/components/ui/*` for shadcn components. Use relative imports for project code.
- **API routes**: Thin handlers that call services. Verify auth with `verifyUser()`. Always `await sequelize.sync()` before DB operations.
- **Database**: Sequelize 6 with sequelize-typescript decorators. Migrations in `database/migrations/` with timestamp prefix.
- **i18n**: Use `useLanguage()` hook and `t()` function. Support en/de/fr.
- **No unused code**: Don't add backwards-compat shims, unused variables, or speculative abstractions.
- **Currency**: Default EUR for European customers. Format with comma decimal (e.g. `29,00 EUR`).
