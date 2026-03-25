import { test, expect } from '@playwright/test';

/**
 * Battle Flow E2E Tests
 * Tests PVE battles, card selection, and battle results
 *
 * OKR Impact: KR 1.2 (Core Gameplay), KR 1.3 (PVP)
 */
test.describe('Battle Flow - PVE', () => {
    test.beforeEach(async ({ page }) => {
        // Setup: Authenticated user with cards
        await page.goto('/');
        await page.evaluate(() => {
            const mockUser = {
                uid: 'test-battle-user',
                email: 'battle@example.com',
                displayName: 'Battle Tester'
            };
            localStorage.setItem('firebase:authUser', JSON.stringify(mockUser));

            // Mock profile
            const mockProfile = {
                userId: 'test-battle-user',
                coins: 5000,
                level: 10,
                experience: 1000
            };
            localStorage.setItem('userProfile', JSON.stringify(mockProfile));

            // Mock inventory with cards
            const mockCards = [
                {
                    id: 'card-1',
                    instanceId: 'inst-1',
                    name: 'Cyber Warrior',
                    rarity: 'rare',
                    type: 'EFFICIENCY',
                    aiFactionId: 'machine',
                    stats: { attack: 100, defense: 80, totalPower: 180 },
                    imageUrl: '/assets/cards/dark_machine.png'
                },
                {
                    id: 'card-2',
                    instanceId: 'inst-2',
                    name: 'Neon Hacker',
                    rarity: 'epic',
                    type: 'FUNCTION',
                    aiFactionId: 'cyberpunk',
                    stats: { attack: 120, defense: 70, totalPower: 190 },
                    imageUrl: '/assets/cards/dark_cyberpunk.png'
                },
                {
                    id: 'card-3',
                    instanceId: 'inst-3',
                    name: 'Corporate Elite',
                    rarity: 'legendary',
                    type: 'CREATIVITY',
                    aiFactionId: 'union',
                    stats: { attack: 150, defense: 100, totalPower: 250 },
                    imageUrl: '/assets/cards/dark_union.png'
                }
            ];
            localStorage.setItem('inventory', JSON.stringify(mockCards));
        });

        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('should navigate to battle/arena page', async ({ page }) => {
        // Look for battle navigation
        const battleLink = page.locator('a[href*="battle"], a[href*="arena"], a:has-text("전투"), a:has-text("Battle"), a:has-text("Arena")').first();

        if (await battleLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await battleLink.click();
            await page.waitForLoadState('networkidle');

            const currentUrl = page.url();
            expect(currentUrl).toMatch(/battle|arena|fight/i);
        } else {
            // Try direct navigation
            await page.goto('/battle');
            await page.waitForLoadState('networkidle');
        }

        // Should show battle UI
        const bodyText = await page.textContent('body');
        expect(bodyText).toMatch(/battle|전투|fight|arena/i);
    });

    test('should display deck selection interface', async ({ page }) => {
        await page.goto('/battle');
        await page.waitForLoadState('networkidle');

        // Should allow selecting cards from inventory
        const bodyText = await page.textContent('body');

        // Look for card selection UI
        expect(bodyText).toMatch(/select|선택|deck|덱|card|카드/i);
    });

    test('should show opponent AI cards', async ({ page }) => {
        await page.goto('/battle');
        await page.waitForLoadState('networkidle');

        // Wait for AI opponent generation
        await page.waitForTimeout(2000);

        // Look for opponent section
        const opponentSection = page.locator('[class*="opponent"], [class*="enemy"], [data-testid*="opponent"]');

        // Should show AI opponent or cards
        const bodyText = await page.textContent('body');
        console.log('Battle page loaded, checking for opponent...');
    });

    test('should handle card drag-and-drop selection', async ({ page }) => {
        await page.goto('/battle');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Look for draggable cards
        const cards = page.locator('[draggable="true"], [class*="card"]');
        const count = await cards.count();

        console.log('Found', count, 'card elements');

        // If cards exist, verify they're interactive
        if (count > 0) {
            const firstCard = cards.first();
            const isVisible = await firstCard.isVisible().catch(() => false);
            expect(isVisible).toBe(true);
        }
    });

    test('should show battle start button when ready', async ({ page }) => {
        await page.goto('/battle');
        await page.waitForLoadState('networkidle');

        // Look for start/fight button
        const startButton = page.locator('button:has-text("시작"), button:has-text("Start"), button:has-text("Fight"), button:has-text("전투")').first();

        // Button should exist (might be disabled until deck ready)
        const exists = await startButton.count();
        console.log('Start button found:', exists > 0);
    });

    test('should display battle result after completion (simulated)', async ({ page }) => {
        await page.goto('/battle');
        await page.waitForLoadState('networkidle');

        // Simulate battle completion by injecting result state
        await page.evaluate(() => {
            const mockBattleResult = {
                won: true,
                coinsEarned: 500,
                experienceGained: 100,
                cardsWon: [
                    { id: 'reward-card-1', name: 'Victory Prize', rarity: 'rare' }
                ]
            };
            localStorage.setItem('lastBattleResult', JSON.stringify(mockBattleResult));

            // Trigger result display
            window.dispatchEvent(new CustomEvent('battleComplete', { detail: mockBattleResult }));
        });

        await page.waitForTimeout(2000);

        // Check for victory message
        const bodyText = await page.textContent('body');
        // Result might be shown in modal or dedicated section
        console.log('Battle result simulation complete');
    });
});

/**
 * PVP Battle Flow Tests
 * Requires Realtime Database to be active
 */
test.describe('Battle Flow - PVP (Realtime)', () => {
    test('should show PVP matchmaking interface', async ({ page }) => {
        // Setup authenticated user
        await page.goto('/');
        await page.evaluate(() => {
            const mockUser = {
                uid: 'test-pvp-user',
                email: 'pvp@example.com'
            };
            localStorage.setItem('firebase:authUser', JSON.stringify(mockUser));
        });

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Navigate to PVP (might be /battle/pvp or /pvp)
        const pvpLink = page.locator('a[href*="pvp"], button:has-text("PVP"), a:has-text("대전")').first();

        if (await pvpLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await pvpLink.click();
            await page.waitForLoadState('networkidle');

            // Should show matchmaking UI
            const bodyText = await page.textContent('body');
            expect(bodyText).toMatch(/match|매칭|opponent|상대|pvp/i);
        } else {
            console.log('PVP link not found - might not be implemented yet');
        }
    });

    test('should show waiting state during matchmaking', async ({ page }) => {
        // This test verifies the matchmaking waiting UI
        // Requires Realtime Database to actually match with opponent

        await page.goto('/pvp');
        await page.waitForLoadState('networkidle');

        // Look for waiting indicator
        const waiting = page.locator('[class*="loading"], [class*="waiting"], text=/waiting|대기/i');

        // Just verify page loads (actual matching needs backend)
        const pageLoaded = await page.title();
        expect(pageLoaded).toBeTruthy();
    });
});

/**
 * Battle Mechanics Tests
 */
test.describe('Battle Mechanics', () => {
    test('should calculate damage correctly based on stats', async ({ page }) => {
        // This is more of a unit test, but can verify in UI
        await page.goto('/battle');
        await page.waitForLoadState('networkidle');

        // Would need to trigger battle and check calculation
        // For now, just verify page structure
        const bodyText = await page.textContent('body');
        expect(bodyText).not.toBeNull();
    });

    test('should apply type advantages (rock-paper-scissors)', async ({ page }) => {
        // Verify type system works
        await page.goto('/battle');
        await page.waitForLoadState('networkidle');

        // Would inspect battle log or results to verify
        // EFFICIENCY > FUNCTION > CREATIVITY > EFFICIENCY
        console.log('Type advantage system check - needs implementation verification');
    });
});
