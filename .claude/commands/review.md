Review recent code changes for quality and correctness.

Steps:
1. Check what files were recently modified (git status/diff or user-specified files)
2. Read each changed file
3. Check for:
   - TypeScript type safety issues
   - SQL injection or XSS vulnerabilities
   - Missing error handling at system boundaries
   - Inconsistency with existing patterns in the codebase
   - Missing or broken imports
   - Sequelize model/migration mismatches
4. Run `npx tsc --noEmit` to catch type errors
5. Report findings with file:line references
6. Suggest specific fixes for any issues found

Focus on correctness and security, not style preferences.
