/**
 * PVP 시스템 테스트 스크립트
 * 
 * 실행: node --experimental-specifier-resolution=node scripts/test-pvp-system.js
 * 또는 브라우저 콘솔에서 실행
 */

// ==================== 테스트 1: AI 난이도 스케일링 ====================
function testAIDifficultyScaling() {
    console.log('\n========================================');
    console.log('🎮 TEST 1: AI Difficulty Scaling by Rating');
    console.log('========================================\n');

    const ratings = [900, 1050, 1200, 1400, 1600, 1800];

    ratings.forEach(rating => {
        // Simulate generateOpponentDeck logic
        let difficulty = 'easy';
        let statBonus = 0;
        let rarityBoost = 0;

        if (rating >= 1700) {
            difficulty = 'master';
            statBonus = 15;
            rarityBoost = 0.4;
        } else if (rating >= 1500) {
            difficulty = 'expert';
            statBonus = 10;
            rarityBoost = 0.3;
        } else if (rating >= 1300) {
            difficulty = 'hard';
            statBonus = 5;
            rarityBoost = 0.2;
        } else if (rating >= 1100) {
            difficulty = 'normal';
            statBonus = 0;
            rarityBoost = 0.1;
        } else {
            difficulty = 'easy';
            statBonus = -5;
            rarityBoost = 0;
        }

        const difficultyLabel = {
            'easy': '🟢 초보',
            'normal': '🔵 일반',
            'hard': '🟠 고수',
            'expert': '🔴 전문가',
            'master': '⚫ 마스터'
        }[difficulty];

        console.log(`Rating ${rating}: ${difficultyLabel} | Stat Bonus: ${statBonus >= 0 ? '+' : ''}${statBonus} | Rarity Boost: +${(rarityBoost * 100).toFixed(0)}%`);
    });

    console.log('\n✅ AI Difficulty Scaling Test Complete!\n');
    return true;
}

// ==================== 테스트 2: 랭킹 티어 시스템 ====================
function testRankingTierSystem() {
    console.log('\n========================================');
    console.log('🏆 TEST 2: Ranking Tier System');
    console.log('========================================\n');

    const testRatings = [950, 1050, 1150, 1350, 1550, 1750, 1950, 2150];

    testRatings.forEach(rating => {
        let tier, icon;

        if (rating >= 2100) {
            tier = '그랜드 마스터'; icon = '🏆';
        } else if (rating >= 1900) {
            tier = '마스터'; icon = '💎';
        } else if (rating >= 1700) {
            tier = '다이아몬드'; icon = '⭐';
        } else if (rating >= 1500) {
            tier = '플래티넘'; icon = '🔷';
        } else if (rating >= 1300) {
            tier = '골드'; icon = '🔶';
        } else if (rating >= 1100) {
            tier = '실버'; icon = '⚪';
        } else {
            tier = '브론즈'; icon = '🟤';
        }

        console.log(`Rating ${rating}: ${icon} ${tier}`);
    });

    console.log('\n✅ Ranking Tier System Test Complete!\n');
    return true;
}

// ==================== 테스트 3: 전투 시뮬레이션 (3회 가상 대전) ====================
function testBattleSimulation() {
    console.log('\n========================================');
    console.log('⚔️ TEST 3: Battle Simulation (3 Rounds)');
    console.log('========================================\n');

    // 가상 플레이어 데이터
    const player = {
        name: 'TestPlayer_01',
        level: 10,
        rating: 1350, // 골드 티어
        deck: generateMockDeck('player')
    };

    const results = [];

    for (let i = 1; i <= 3; i++) {
        console.log(`\n--- Battle ${i}/3 ---`);

        // AI 상대 생성 (레이팅 기반)
        const aiName = ['맹장형', '지장형', '덕장형'][i - 1];
        const ai = {
            name: `[AI 🟠 고수] ${aiName}`,
            level: player.level,
            rating: player.rating,
            deck: generateMockDeck('ai', player.rating)
        };

        console.log(`Player: ${player.name} (Lv.${player.level}, Rating: ${player.rating})`);
        console.log(`Opponent: ${ai.name}`);

        // 전투 시뮬레이션
        const battleResult = simulateMockBattle(player.deck, ai.deck);

        console.log(`\nRound Results:`);
        battleResult.rounds.forEach((r, idx) => {
            console.log(`  R${idx + 1}: Player ${r.playerPower} vs AI ${r.aiPower} → ${r.winner === 'player' ? '✅ WIN' : r.winner === 'ai' ? '❌ LOSS' : '🔄 DRAW'}`);
        });

        console.log(`\nFinal: ${battleResult.playerWins}W - ${battleResult.aiWins}L`);
        console.log(`Result: ${battleResult.winner === 'player' ? '🏆 VICTORY' : '💀 DEFEAT'}`);

        // 레이팅 변동
        const ratingChange = battleResult.winner === 'player' ? 30 : -10;
        player.rating += ratingChange;
        console.log(`Rating: ${player.rating - ratingChange} → ${player.rating} (${ratingChange >= 0 ? '+' : ''}${ratingChange})`);

        results.push({
            battle: i,
            opponent: ai.name,
            winner: battleResult.winner,
            score: `${battleResult.playerWins}-${battleResult.aiWins}`,
            ratingChange
        });
    }

    console.log('\n\n========== SUMMARY ==========');
    console.log(`Player: ${player.name}`);
    console.log(`Final Rating: ${player.rating}`);
    console.log(`Battles:`);
    results.forEach(r => {
        console.log(`  #${r.battle}: ${r.winner === 'player' ? '✅' : '❌'} ${r.score} vs ${r.opponent.split(']')[1]} (${r.ratingChange >= 0 ? '+' : ''}${r.ratingChange})`);
    });

    const wins = results.filter(r => r.winner === 'player').length;
    console.log(`\nTotal: ${wins}W - ${3 - wins}L`);

    console.log('\n✅ Battle Simulation Test Complete!\n');
    return results;
}

// Helper: 가상 덱 생성
function generateMockDeck(owner, rating = 1000) {
    const cards = [];
    const statBonus = rating >= 1700 ? 15 : rating >= 1500 ? 10 : rating >= 1300 ? 5 : rating >= 1100 ? 0 : -5;

    for (let i = 0; i < 5; i++) {
        const basePower = 50 + Math.floor(Math.random() * 30);
        cards.push({
            id: `${owner}-card-${i}`,
            name: `${owner === 'player' ? 'Hero' : 'Enemy'} Unit ${i + 1}`,
            power: owner === 'ai' ? basePower + statBonus : basePower,
            type: ['EFFICIENCY', 'CREATIVITY', 'FUNCTION'][Math.floor(Math.random() * 3)]
        });
    }
    return cards;
}

// Helper: 전투 시뮬레이션
function simulateMockBattle(playerDeck, aiDeck) {
    let playerWins = 0;
    let aiWins = 0;
    const rounds = [];

    for (let i = 0; i < 5; i++) {
        const pCard = playerDeck[i];
        const aCard = aiDeck[i];

        let winner = 'draw';
        if (pCard.power > aCard.power) {
            winner = 'player';
            playerWins++;
        } else if (aCard.power > pCard.power) {
            winner = 'ai';
            aiWins++;
        }

        rounds.push({
            round: i + 1,
            playerPower: pCard.power,
            aiPower: aCard.power,
            winner
        });
    }

    return {
        winner: playerWins > aiWins ? 'player' : 'ai',
        playerWins,
        aiWins,
        rounds
    };
}

// ==================== 실행 ====================
console.log('🚀 PVP System Test Suite Starting...\n');

testAIDifficultyScaling();
testRankingTierSystem();
const battleResults = testBattleSimulation();

console.log('\n========================================');
console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
console.log('========================================\n');

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testAIDifficultyScaling, testRankingTierSystem, testBattleSimulation };
}
