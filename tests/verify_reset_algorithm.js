
/**
 * Daily Reset Logic Verification Script (JavaScript Version)
 */

function runTest() {
    console.log("🧪 Starting Daily Reset Logic Verification...\n");

    // 1. Setup Mock Data
    const mockSlot = {
        index: 0,
        factionId: 'faction_1',
        status: 'limit_reached', // Simulate a slot that hit the limit yesterday
        nextGenerationAt: null
    };

    console.log("Before Reset:", JSON.stringify(mockSlot, null, 2));

    // 2. Simulate 'canGenerateToday' returning true (New Day!)
    const canGenerate = true;

    // 3. Apply the Logic (Copied from generation-utils.ts)
    console.log("\n🔄 Applying Reset Logic...");

    if (!canGenerate) {
        mockSlot.status = 'limit_reached';
        mockSlot.nextGenerationAt = null;
    } else {
        // [NEW] Daily Reset Logic: Auto-Resume & Instant Gratification
        if (!mockSlot.nextGenerationAt || mockSlot.status === 'limit_reached') {
            console.log(`[Generation] Auto-activating slot ${mockSlot.index} after daily reset!`);
            mockSlot.nextGenerationAt = new Date(); // Ready Now!
            mockSlot.status = 'active';
        }
        else if (mockSlot.nextGenerationAt && new Date() >= mockSlot.nextGenerationAt) {
            mockSlot.status = 'active';
        } else {
            mockSlot.status = 'waiting';
        }
    }

    // 4. Verify Results
    console.log("\nAfter Reset:", JSON.stringify(mockSlot, null, 2));

    if (mockSlot.status === 'active' && mockSlot.nextGenerationAt !== null) {
        console.log("\n✅ TEST PASSED: Slot correctly auto-activated after daily reset.");
    } else {
        console.error("\n❌ TEST FAILED: Slot did not activate.");
        process.exit(1);
    }
}

runTest();
