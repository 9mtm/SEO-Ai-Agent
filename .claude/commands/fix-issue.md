Fix a reported issue or bug.

Steps:
1. Read the issue description from the user
2. Search the codebase for related code (use Grep/Glob)
3. Read the relevant files to understand context
4. Identify the root cause
5. Implement the fix with minimal changes
6. Run TypeScript check: `npx tsc --noEmit` on affected files
7. Verify the fix doesn't break existing functionality
8. Summarize what was changed and why

Rules:
- Don't refactor unrelated code while fixing
- Keep changes minimal and focused
- Test edge cases mentally before committing
- If the fix requires a migration, create one with proper timestamp
