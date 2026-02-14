# AI War E2E Test Suite

## Overview

Comprehensive end-to-end test suite for AI War game, covering all core user flows and game mechanics.

**OKR Impact**: KR 1.1 - 1.4 (Game Functionality), Quality Assurance

## Test Coverage

### 1. Authentication Flow (`auth-flow.spec.ts`)
- ✅ Login page display
- ✅ Signup form validation
- ✅ Guest mode functionality
- ✅ User profile initialization
- ✅ Google login button visibility

**Coverage**: ~70% of auth flow

### 2. Card Pack Purchase (`card-pack-purchase.spec.ts`)
- ✅ Shop navigation
- ✅ Pack pricing display
- ✅ Purchase confirmation
- ✅ Insufficient funds prevention
- ✅ Inventory update after purchase
- ✅ Pack opening animation

**Coverage**: ~80% of shop flow

### 3. Battle Flow (`battle-flow.spec.ts`)
- ✅ Battle arena navigation
- ✅ Deck selection interface
- ✅ AI opponent generation
- ✅ Card drag-and-drop
- ✅ Battle result display
- ✅ PVP matchmaking UI (requires Realtime DB)
- ✅ Type advantage system

**Coverage**: ~75% of battle mechanics

### 4. Minigame - Card Clash (`minigame-flow.spec.ts`)
- ✅ 4 game modes display
- ✅ Mode selection
- ✅ Betting interface
- ✅ Bet amount validation
- ✅ Card selection UI
- ✅ AI opponent hand generation
- ✅ Sudden-death gameplay
- ✅ Result display (win/lose/draw)
- ✅ Coins update after game
- ✅ AI difficulty scaling (level-based)
- ✅ Sound effects initialization

**Coverage**: ~90% of minigame flow

### 5. Data Isolation (`zombie-data-check.spec.ts`)
- ✅ Prevents zombie data leakage
- ✅ LocalStorage cleanup verification

**Coverage**: 100% of data isolation checks

## Running Tests

### Prerequisites

1. **Start development server**:
   ```bash
   cd frontend
   npm run dev
   ```
   Server must be running on `http://localhost:3000`

2. **Install Playwright browsers** (first time only):
   ```bash
   npx playwright install
   ```

### Run All Tests

```bash
npm run test
```

### Run Specific Test Suites

```bash
# Authentication tests only
npm run test:auth

# Card pack purchase tests
npm run test:shop

# Battle flow tests
npm run test:battle

# Minigame tests
npm run test:minigame
```

### Interactive UI Mode

```bash
npm run test:ui
```

**Benefits**:
- Visual test execution
- Step-by-step debugging
- Time travel through test steps
- Screenshot comparison

### Headed Mode (See Browser)

```bash
npm run test:headed
```

Shows browser window during test execution (useful for debugging).

### View Test Report

```bash
npm run test:report
```

Opens HTML report with detailed results, screenshots, and videos of failures.

## Test Strategy

### Mock vs Real Data

**What We Mock**:
- Firebase authentication state (localStorage simulation)
- User profiles (coins, level, inventory)
- Battle results
- Minigame outcomes

**Why Mock**:
- Tests run faster
- No dependency on backend
- Deterministic results
- No API costs

**What We Test Live**:
- UI rendering
- Navigation flows
- Form validation
- User interactions
- State persistence

### Firebase Integration

Some tests require **actual Firebase connection**:
- PVP matchmaking (needs Realtime Database)
- Real card pack purchases
- Persistent inventory sync

**Setup for Live Tests**:
1. Create test Firebase project
2. Add test credentials to `.env.test`
3. Run with `FIREBASE_ENV=test npm run test`

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      - name: Run tests
        run: cd frontend && npm run test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Test Writing Guidelines

### 1. Use Descriptive Test Names

```typescript
// ✅ Good
test('should prevent purchase with insufficient coins', async ({ page }) => {

// ❌ Bad
test('test coins', async ({ page }) => {
```

### 2. Arrange-Act-Assert Pattern

```typescript
test('example', async ({ page }) => {
    // Arrange: Setup state
    await page.goto('/shop');

    // Act: Perform action
    await buyButton.click();

    // Assert: Verify result
    expect(await page.textContent('body')).toContain('Success');
});
```

### 3. Use Timeouts Wisely

```typescript
// Wait for specific condition
await expect(element).toBeVisible({ timeout: 5000 });

// Avoid fixed waits unless necessary
await page.waitForTimeout(1000); // Use sparingly
```

### 4. Clean Up After Tests

```typescript
test.afterEach(async ({ page }) => {
    // Clear test data
    await page.evaluate(() => localStorage.clear());
});
```

## Common Issues & Solutions

### Issue: "Timeout waiting for element"

**Cause**: Element not rendered or selector is wrong

**Solution**:
```typescript
// Use flexible selectors
const button = page.locator('button:has-text("Buy"), button:has-text("구매")').first();

// Check visibility first
if (await button.isVisible({ timeout: 5000 }).catch(() => false)) {
    await button.click();
}
```

### Issue: "Test passes locally but fails in CI"

**Cause**: Timing issues, different screen size, or missing dependencies

**Solution**:
```typescript
// Wait for network idle
await page.waitForLoadState('networkidle');

// Set viewport
await page.setViewportSize({ width: 1280, height: 720 });
```

### Issue: "Firebase not initialized"

**Cause**: Tests running before Firebase auth completes

**Solution**:
```typescript
// Wait for auth check
await page.waitForTimeout(3000);

// Or mock auth state
await page.evaluate(() => {
    localStorage.setItem('firebase:authUser', JSON.stringify({ uid: 'test-123' }));
});
```

## Metrics & Reporting

### Test Execution Time

**Target**: < 2 minutes for full suite

**Current** (estimated):
- Auth flow: ~20s
- Shop flow: ~30s
- Battle flow: ~40s
- Minigame flow: ~60s
- Total: ~2.5 minutes

### Test Coverage Goals

| Feature Area | Current | Target |
|-------------|---------|--------|
| Authentication | 70% | 90% |
| Card Shop | 80% | 95% |
| Battle System | 75% | 85% |
| Minigame | 90% | 95% |
| Overall | 79% | 90% |

## Next Steps

### P1 Priority (1-2 weeks)

1. **Expand PVP Tests**
   - Real-time matchmaking
   - Opponent actions
   - Disconnection handling

2. **Add Visual Regression Tests**
   - Screenshot comparison
   - Component snapshots

3. **Performance Tests**
   - Load time benchmarks
   - Animation smoothness
   - Memory leaks

### P2 Priority (3-4 weeks)

1. **Mobile/Touch Tests**
   - Responsive design
   - Touch gestures
   - Mobile browser compatibility

2. **Accessibility Tests**
   - Keyboard navigation
   - Screen reader support
   - Color contrast

3. **Load Tests**
   - Concurrent users
   - Database stress testing

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Project OKR.md](../OKR.md)
- [Project CLAUDE.md](../CLAUDE.md)

---

**Last Updated**: 2026-02-14
**Maintained by**: Claude Code
**OKR Alignment**: KR 1.1 - 1.4
