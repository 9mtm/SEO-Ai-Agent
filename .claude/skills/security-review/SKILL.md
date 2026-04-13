---
name: security-review
description: Review code for security vulnerabilities. Auto-invoked when creating API endpoints, auth code, or handling user input.
---

# Security Review

## Trigger
New or modified API endpoints, auth logic, database queries, or user input handling.

## Checks

### SQL Injection
- Ensure all DB queries use Sequelize parameterized methods (findAll, findByPk, create)
- Never concatenate user input into raw SQL strings
- Check `sequelize.query()` calls use bind parameters

### XSS
- Ensure user-generated content is escaped before rendering
- Check dangerouslySetInnerHTML usage
- Validate that API responses don't reflect unsanitized input

### Authentication
- All protected routes must call `verifyUser(req, res)`
- Admin routes must verify `is_super_admin`
- Workspace routes must verify membership via `getWorkspaceContext()`

### Authorization
- Users should only access their own data (check `user_id` in queries)
- Admin endpoints must not be accessible by regular users

### Secrets
- No secrets in client-side code (NEXT_PUBLIC_ prefix)
- No hardcoded credentials in source files
- .env files must be in .gitignore

### File Upload
- Validate file types and sizes
- Store uploads in dedicated directory with unique names
- Never execute uploaded files
