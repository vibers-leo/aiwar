---
description: Review UI code for accessibility, UX, and web best practices
---

Use this workflow to ensure the user interface is accessible, responsive, and provides a polished user experience.

# Web Design & UI/UX Review Checklist

## 1. Accessibility (a11y)
- [ ] **Semantic HTML**: Verify the use of semantic tags (`<main>`, `<section>`, `<nav>`, `<article>`, `<button>`) instead of generic `<div>` soup.
- [ ] **Alt Text**: Ensure all `<img>` tags describe their content in the `alt` attribute. Decorative images should have empty `alt=""`.
- [ ] **Interactive Elements**: Check that `onClick` events are on `<button>` or `<a>` tags. If on a `div`/`span`, ensure `role="button"` and `tabIndex` are present.
- [ ] **Form Labels**: Confirm that every `<input>` has an associated `<label>` (via `htmlFor` or nesting) or `aria-label`.
- [ ] **Color Contrast**: Verify that text color has sufficient contrast against the background (WCAG AA standard).

## 2. Responsive Design
- [ ] **Mobile First**: Check if styles are written with mobile constraints first, using media queries (`md:`, `lg:`) for larger screens.
- [ ] **Touch Targets**: Ensure interactive elements (buttons, links) are at least 44x44px for touch usability on mobile.
- [ ] **Overflow**: Verify that no elements cause unintended horizontal scrolling on small screens.
- [ ] **Flex/Grid**: Confirm the use of modern CSS Layouts (Flexbox/Grid) for fluid responsiveness over fixed pixel dimensions.

## 3. UI Polish & Visuals
- [ ] **Loading States**: Ensure Skeletons or Loading Spinners are shown while data is loading to prevent layout shifts and perceived slowness.
- [ ] **Hover/Focus States**: Check for clear visual feedback on hover and focus states for all interactive elements.
- [ ] **Transitions**: Verify that state changes (modals, dropdowns, color changes) have smooth transitions (e.g., `transition-all duration-200`).
- [ ] **Spacing Consistency**: Ensure margins and paddings follow a consistent spacing scale (e.g., Tailwind's scale).

## 4. Error Handling
- [ ] **Empty States**: Check if there's a user-friendly UI for when lists or data are empty.
- [ ] **Error Boundaries**: Verify that component-level errors don't crash the entire page; look for error boundaries or fallback UIs.

# Execution Steps
1. **Visual/Code Analysis**: Scan the layout and component code provided.
2. **Audit**: Compare against the accessibility and design checklist.
3. **Report**: Highlight specific UI/UX flaws or accessibility violations.
4. **Polish**: If requested, provide the refined code or CSS/Tailwind classes to fix the issues.
