---
description: Review UI code for accessibility, UX, and web best practices
---

# UI/UX Review Workflow

## When to Use
- Reviewing UI components
- Checking accessibility
- Auditing design
- Reviewing UX

## Steps

1. **Read the design guidelines**
   ```
   Read .agent/skills/web-design-guidelines.md
   ```

2. **Accessibility Audit**

   - [ ] All buttons have aria-labels or visible text
   - [ ] Interactive elements are keyboard accessible
   - [ ] Proper heading hierarchy (h1 → h2 → h3)
   - [ ] Form inputs have labels
   - [ ] Error messages are accessible
   - [ ] Color contrast is sufficient

3. **Focus States Audit**

   - [ ] All interactive elements have visible focus states
   - [ ] Focus ring is visible against background
   - [ ] Tab order is logical

4. **Animation Audit**

   - [ ] prefers-reduced-motion is respected
   - [ ] Animations use GPU-friendly properties (transform, opacity)
   - [ ] No layout thrashing

5. **Image Audit**

   - [ ] All images have alt text
   - [ ] Images have width/height to prevent CLS
   - [ ] Lazy loading for below-fold images
   - [ ] Using next/image where possible

6. **Dark Mode Audit**

   - [ ] All colors use CSS variables
   - [ ] theme-color meta tag is set
   - [ ] No hardcoded colors

7. **Touch & Mobile Audit**

   - [ ] Touch targets are 44x44px minimum
   - [ ] touch-action is set appropriately
   - [ ] No hover-only interactions

// turbo
8. **Run TypeScript Check**
   ```bash
   cd /Users/admin/Desktop/ai-war/frontend && npx tsc --noEmit
   ```

9. **Report Findings**
   - Group issues by category
   - Provide fix suggestions for each issue
   - Note any critical accessibility violations
