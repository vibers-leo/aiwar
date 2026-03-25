---
description: Review React/Next.js code for performance issues using Vercel best practices
---

Use this workflow to review code for performance bottlenecks, re-rendering issues, and Core Web Vitals optimization.

# React & Next.js Performance Review Checklist

## 1. Core Web Vitals & Loading Performance
- [ ] **LCP (Largest Contentful Paint)**: Ensure critical images (hero images) use `priority` prop in `next/image`.
- [ ] **CLS (Cumulative Layout Shift)**: Verify that all images and containers have explicit dimensions (`width`/`height` or aspect ratio) to prevent layout shifts.
- [ ] **Font Loading**: Check that `next/font` is used for automatic font optimization and layout shift prevention.
- [ ] **Script Loading**: Use `next/script` with appropriate loading strategies (`beforeInteractive`, `afterInteractive`, `lazyOnload`).

## 2. Rendering Optimization
- [ ] **Server Components**: Verify that Server Components are used by default from the root, and `use client` is only used at the leaves of the component tree where interactivity is needed.
- [ ] **Suspense Boundaries**: Check if `Suspense` is used to wrap slow data-fetching components to enable instant loading states and streaming.
- [ ] **Memoization**: Review expensive calculations. Use `useMemo` only for computationally heavy operations, not for simple derivations.
- [ ] **Callback Stability**: Check `useCallback` usage for functions passed as props to optimized child components (memoized components).

## 3. Data Fetching
- [ ] **Parallel Fetching**: Ensure data fetching is parallelized (e.g., `Promise.all`) where possible, rather than waterfall requests.
- [ ] **Colocation**: Data fetching logic should be co-located with the component that needs it, or lifted appropriately if shared.
- [ ] **Caching**: Verify fetch requests have appropriate caching configurations (`force-cache`, `no-store`, or `next: { revalidate: N }`).

## 4. Code Splitting & Bundle Size
- [ ] **Dynamic Imports**: Use `next/dynamic` (React.lazy) for heavy components/modules that are not critical for the initial render (e.g., modals, heavy charts).
- [ ] **Package Imports**: Check for large library imports. Ensure tree-shaking is effective (e.g., verify named imports are used correctly).

# Execution Steps
1. **Identify Critical Components**: Focus on the file or feature requested by the user.
2. **Analyze**: Run a mental simulation of the rendering lifecycle.
3. **Report**: List specific performance issues found, referencing the checklist above.
4. **Refactor**: If requested, provide the optimized code block using the identified best practices.
