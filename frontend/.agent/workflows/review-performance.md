---
description: Review React/Next.js code for performance issues using Vercel best practices
---

# React Performance Review Workflow

## When to Use
- Writing new React components
- Reviewing code for performance issues
- Refactoring existing components
- Optimizing bundle size

## Steps

1. **Read the best practices guide**
   ```
   Read .agent/skills/react-best-practices.md
   ```

2. **Check for Critical Issues (MUST FIX)**

   a. **Bundle Size** - Look for:
   - Heavy imports that should be dynamic (`next/dynamic`)
   - Barrel file imports (import from index)
   - Third-party libraries in initial bundle

   b. **Async Waterfalls** - Look for:
   - Sequential awaits that could be parallel (`Promise.all`)
   - Data fetching in components that should be parallelized

3. **Check for High Priority Issues**

   a. **Server-Side** - Look for:
   - Missing `cache()` for repeated data fetches
   - Passing large objects to client components

   b. **Client-Side** - Look for:
   - Missing SWR/React Query for data fetching
   - Duplicated event listeners

4. **Check for Medium Priority Issues**

   - Unnecessary re-renders (missing useMemo/useCallback)
   - Expensive state initialization
   - Layout thrashing animations

// turbo
5. **Run TypeScript Check**
   ```bash
   cd /Users/admin/Desktop/ai-war/frontend && npx tsc --noEmit
   ```

6. **Report Findings**
   - List all issues by priority
   - Provide code snippets showing before/after
   - Estimate impact of each fix
