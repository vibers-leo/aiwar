import { test, expect } from '@playwright/test';

test.describe('Data Isolation & Zombie Data Check', () => {
    test.beforeEach(async ({ page }) => {
        // Go to home page
        await page.goto('/');
        // Wait for hydration
        await page.waitForTimeout(2000);
    });

    test('should prevent zombie data from persisting across sessions', async ({ page }) => {
        // 1. Simulate "Zombie Data" from a previous session
        await page.evaluate(() => {
            localStorage.setItem('userCoins', '99999');
            localStorage.setItem('inventory', JSON.stringify([{ id: 'zombie_card', name: 'Zombie Card' }]));
            // Also set a generic game state
            localStorage.setItem('gameState_guest', JSON.stringify({
                coins: 88888,
                inventory: [{ id: 'zombie_card_2', name: 'Zombie Card 2' }]
            }));
        });

        // 2. Refresh the page to trigger initialization
        await page.reload();
        await page.waitForTimeout(3000); // Wait for auth check and profile load

        // 3. Verify that the Zombie Data is NOT displayed
        // This assumes the UI displays coins. If the user is GUEST, it might show 0 or default.
        // If data leaked, it might show 99999 or 88888.

        // Log current coins from UI if possible (assuming there's a coin display with id or class)
        // We'll check localStorage again to see if it was cleared or if the app adopted it.
        const currentLocalStorage = await page.evaluate(() => {
            return {
                userCoins: localStorage.getItem('userCoins'),
                gameStateGuest: localStorage.getItem('gameState_guest')
            };
        });

        console.log('Post-Reload Storage:', currentLocalStorage);

        // Expectation: The app should have either cleared the legacy 'userCoins' 
        // OR overwritten gameState_guest with a fresh state (0 coins) if it's a new session.
        // For a strict test, we check if the Zombie Data is still there unmodified.

        // If the fix is working ("Nuclear Cleanup"), 'userCoins' should be null or ignored.
        // And 'gameState_guest' should reset to default (0 coins) if no user is logged in.

        // Ideally, we want to ensure the UI doesn't show 99999.
        // Since we don't know the exact UI selector for coins, checking localStorage is a proxy.
        // But checking the text content is better.

        const bodyText = await page.textContent('body');
        expect(bodyText).not.toContain('99999');
        expect(bodyText).not.toContain('Zombie Card');
    });
});
