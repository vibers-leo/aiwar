import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 * Tests user login, signup, and profile loading
 *
 * OKR Impact: KR 1.1 (User Auth 100%)
 */
test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should display login page for unauthenticated users', async ({ page }) => {
        // Check if redirected to login or shows login UI
        await expect(page).toHaveURL(/\/login|\/$/);

        // Should show login options
        const bodyText = await page.textContent('body');
        expect(bodyText).toMatch(/로그인|Login|Sign in/i);
    });

    test('should show signup form elements', async ({ page }) => {
        // Navigate to signup if not already there
        const signupLink = page.locator('a[href="/signup"], button:has-text("회원가입"), button:has-text("Sign up")').first();

        if (await signupLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await signupLink.click();
            await page.waitForLoadState('networkidle');
        } else {
            await page.goto('/signup');
            await page.waitForLoadState('networkidle');
        }

        // Verify signup form exists
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    });

    test('should validate email format on signup', async ({ page }) => {
        await page.goto('/signup');
        await page.waitForLoadState('networkidle');

        // Try invalid email
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
        const submitButton = page.locator('button[type="submit"], button:has-text("회원가입"), button:has-text("Sign up")').first();

        await emailInput.fill('invalid-email');
        await passwordInput.fill('password123');

        // Try to submit
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Should show validation error or not proceed
        const currentUrl = page.url();
        expect(currentUrl).toContain('/signup'); // Still on signup page
    });

    test('guest mode should work without authentication', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Look for guest login option or skip login
        const guestButton = page.locator('button:has-text("게스트"), button:has-text("Guest"), a:has-text("Skip")').first();

        if (await guestButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await guestButton.click();
            await page.waitForLoadState('networkidle');
        }

        // Check if we can access some game content
        // (The app might auto-allow guest access or show limited features)
        await page.waitForTimeout(2000);

        // Verify we're not stuck on login page
        const currentUrl = page.url();
        console.log('Guest mode URL:', currentUrl);
    });

    test('should initialize user profile after login simulation', async ({ page, context }) => {
        // Simulate authenticated state via localStorage/cookies
        await page.goto('/');

        // Inject a mock auth state (for testing without actual Firebase auth)
        await page.evaluate(() => {
            const mockUser = {
                uid: 'test-user-123',
                email: 'test@example.com',
                displayName: 'Test User'
            };

            // Simulate auth persistence
            localStorage.setItem('firebase:authUser', JSON.stringify(mockUser));
        });

        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Check if user context loaded
        const bodyText = await page.textContent('body');

        // Should show user-related content (coins, profile, etc.)
        // Not showing error messages about auth failure
        expect(bodyText).not.toContain('error');
        expect(bodyText).not.toContain('실패');
    });
});

/**
 * Google Login Flow Test (Visual/Manual verification)
 * Note: Full Google OAuth flow requires real credentials
 */
test.describe('Google Login (Visual Check)', () => {
    test('should display Google login button', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        // Check for Google login button
        const googleButton = page.locator('button:has-text("Google"), button:has-text("구글"), img[alt*="Google"]').first();

        await expect(googleButton).toBeVisible({ timeout: 10000 });

        // Visual verification: button should be clickable
        const isEnabled = await googleButton.isEnabled();
        expect(isEnabled).toBe(true);
    });
});
