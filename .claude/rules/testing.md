## Testing Rules

- **Framework**: Jest 29 + React Testing Library
- **Config**: `jest.config.js` at project root
- **Tests**: `__tests__/` directory mirrors source structure
- **Mocks**: `__mocks__/` for shared mocks
- **Run**: `npm test` or `npx jest <pattern>`

### When to write tests
- New utility functions with complex logic
- New API endpoints with business logic
- Bug fixes (write a test that reproduces the bug first)

### When NOT to write tests
- Simple CRUD endpoints with no special logic
- UI components that are just layout/styling
- One-off scripts

### Existing test status
- Some tests have pre-existing failures (e.g., missing props in Keyword component tests)
- Don't fix unrelated test failures when working on a different feature
- Focus TypeScript checks (`npx tsc --noEmit`) over test suite for quick validation
