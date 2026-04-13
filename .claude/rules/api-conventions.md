## API Route Conventions

All API routes live in `pages/api/` (Pages Router pattern).

### Authentication
- Public routes: no auth needed (e.g., `/api/blog/[slug]`)
- User routes: use `verifyUser(req, res)` — returns `{ authorized, userId }`
- Admin routes: verify user + check `user.is_super_admin`
- Workspace context: use `getWorkspaceContext(req, res)` for workspace-scoped operations

### Response Format
```typescript
// Success
res.status(200).json({ data })
res.status(201).json({ created_item })

// Error
res.status(400).json({ error: 'Description' })
res.status(401).json({ error: 'Unauthorized' })
res.status(500).json({ error: error.message })
```

### Database
- Always call `await sequelize.sync()` at the start of handlers
- Use model includes for joins: `User.findByPk(id, { include: [InvoiceDetail] })`
- Use transactions for multi-table operations

### Method Handling
```typescript
if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
}
```
