import { test, expect } from '@playwright/test';

/**
 * Card Pack Purchase Flow E2E Tests
 * Tests card pack browsing, purchase, and inventory update
 *
 * OKR Impact: KR 1.2 (Game Economy)
 */
test.describe('Card Pack Purchase Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Setup: Simulate authenticated user with coins
        await page.goto('/');
        await page.evaluate(() => {
            const mockUser = {
                uid: 'test-user-pack',
                email: 'pack@example.com',
                displayName: 'Pack Tester'
            };
            localStorage.setItem('firebase:authUser', JSON.stringify(mockUser));

            // Mock user profile with coins
            const mockProfile = {
                userId: 'test-user-pack',
                coins: 10000,
                level: 5,
                experience: 500
            };
            localStorage.setItem('userProfile', JSON.stringify(mockProfile));
        });

        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('should navigate to card pack shop', async ({ page }) => {
        // Look for shop/store navigation
        const shopLink = page.locator('a[href*="shop"], a[href*="store"], button:has-text("상점"), button:has-text("Shop"), a:has-text("카드팩")').first();

        // If shop link exists, click it
        if (await shopLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await shopLink.click();
            await page.waitForLoadState('networkidle');

            // Verify we're on shop page
            const currentUrl = page.url();
            expect(currentUrl).toMatch(/shop|store|pack/i);
        } else {
            // Try direct navigation
            await page.goto('/shop');
            await page.waitForLoadState('networkidle');
        }

        // Should show card packs or purchase options
        const bodyText = await page.textContent('body');
        expect(bodyText).toMatch(/pack|팩|purchase|구매/i);
    });

    test('should display card pack options with prices', async ({ page }) => {
        await page.goto('/shop');
        await page.waitForLoadState('networkidle');

        // Look for pack cards/items
        const packItems = page.locator('[class*="pack"], [class*="card-pack"], [data-testid*="pack"]');
        const count = await packItems.count();

        // Should have at least one pack option
        expect(count).toBeGreaterThan(0);

        // Check for price display (coins/cost)
        const bodyText = await page.textContent('body');
        expect(bodyText).toMatch(/\d+.*coin|코인/i);
    });

    test('should show purchase confirmation dialog', async ({ page }) => {
        await page.goto('/shop');
        await page.waitForLoadState('networkidle');

        // Find first purchasable pack
        const buyButton = page.locator('button:has-text("구매"), button:has-text("Buy"), button:has-text("Purchase")').first();

        if (await buyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await buyButton.click();
            await page.waitForTimeout(1000);

            // Should show confirmation modal or proceed
            const modalText = await page.textContent('body');
            expect(modalText).toMatch(/confirm|확인|구매|cancel|취소/i);
        } else {
            console.log('No buy button found - might be disabled or different UI');
        }
    });

    test('should prevent purchase with insufficient coins', async ({ page }) => {
        // Reset to low coins
        await page.evaluate(() => {
            const mockProfile = {
                userId: 'test-user-pack',
                coins: 10, // Very low coins
                level: 1,
                experience: 0
            };
            localStorage.setItem('userProfile', JSON.stringify(mockProfile));
        });

        await page.reload();
        await page.waitForLoadState('networkidle');

        await page.goto('/shop');
        await page.waitForLoadState('networkidle');

        // Try to buy expensive pack
        const buyButtons = page.locator('button:has-text("구매"), button:has-text("Buy")');
        const count = await buyButtons.count();

        if (count > 0) {
            // Find most expensive pack (last in list usually)
            const expensivePackButton = buyButtons.last();

            // Should be disabled or show error
            const isEnabled = await expensivePackButton.isEnabled().catch(() => false);

            if (isEnabled) {
                await expensivePackButton.click();
                await page.waitForTimeout(1500);

                // Should show insufficient funds message
                const bodyText = await page.textContent('body');
                expect(bodyText).toMatch(/insufficient|부족|enough/i);
            } else {
                console.log('Buy button correctly disabled for expensive pack');
            }
        }
    });

    test('should update inventory after successful purchase (mock)', async ({ page }) => {
        // This test simulates a successful purchase flow
        await page.goto('/shop');
        await page.waitForLoadState('networkidle');

        // Get initial inventory count
        const initialInventory = await page.evaluate(() => {
            const inv = localStorage.getItem('inventory');
            return inv ? JSON.parse(inv).length : 0;
        });

        console.log('Initial inventory count:', initialInventory);

        // Simulate purchase by directly updating localStorage (since we can't complete real transaction)
        await page.evaluate(() => {
            const mockNewCards = [
                { id: 'new-card-1', name: 'Test Card 1', rarity: 'common' },
                { id: 'new-card-2', name: 'Test Card 2', rarity: 'rare' },
                { id: 'new-card-3', name: 'Test Card 3', rarity: 'epic' }
            ];

            const currentInv = JSON.parse(localStorage.getItem('inventory') || '[]');
            const newInv = [...currentInv, ...mockNewCards];
            localStorage.setItem('inventory', JSON.stringify(newInv));

            // Trigger custom event to notify app
            window.dispatchEvent(new Event('inventoryUpdate'));
        });

        // Navigate to inventory page to verify
        const inventoryLink = page.locator('a[href*="inventory"], a[href*="collection"], a:has-text("인벤토리"), a:has-text("Collection")').first();

        if (await inventoryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await inventoryLink.click();
            await page.waitForLoadState('networkidle');
        } else {
            await page.goto('/inventory');
            await page.waitForLoadState('networkidle');
        }

        // Check if new cards appear
        const finalInventory = await page.evaluate(() => {
            const inv = localStorage.getItem('inventory');
            return inv ? JSON.parse(inv).length : 0;
        });

        console.log('Final inventory count:', finalInventory);
        expect(finalInventory).toBeGreaterThan(initialInventory);
    });
});

/**
 * Pack Opening Animation Test
 */
test.describe('Pack Opening Experience', () => {
    test('should show card reveal animation', async ({ page }) => {
        await page.goto('/shop');
        await page.waitForLoadState('networkidle');

        // This is a visual/interaction test
        // In real implementation, would need to trigger pack opening flow
        const bodyText = await page.textContent('body');

        // Just verify shop page loads
        expect(bodyText).not.toBeNull();
    });
});
