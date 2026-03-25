import { Card, BattleMode, Stats, Rarity } from './types';
import { getGameState, updateGameState } from './game-state';
import { gameStorage } from './game-storage';
import { BattleMode as BaseBattleMode } from './battle-modes';
import { generateRandomCard } from './card-generation-system';
import { getLeaderboardData } from './firebase-db';
import { hasTypeAdvantage, TYPE_ADVANTAGE_MULTIPLIER, resolveBattleResult } from './type-system';
import { getResearchBonus } from './research-system';

export type { BattleMode } from './types';
export type MatchType = 'realtime' | 'ai-training';

/**
 * PVP 통계 인터페이스
 */
export interface PVPStats {
    finished: boolean;
    isGhost?: boolean;
    createdAt: number;
    winRate: number;
    totalBattles: number;
    rating: number;
    rank: number;
    wins: number;
    losses: number;
    pvpMatches: number;
}

/**
 * 전투 참여자 정보
 */
export interface BattleParticipant {
    name: string;
    level: number;
    deck: Card[];
    cardOrder?: number[];
    avatar?: string;
    style?: string;
}

/**
 * 라운드 결과 정보
 */
export interface RoundResult {
    round: number | string;
    playerCard: Card;
    opponentCard: Card;
    winner: 'player' | 'opponent' | 'draw';
    playerType: 'efficiency' | 'creativity' | 'function';
    opponentType: 'efficiency' | 'creativity' | 'function';
    playerPower?: number;
    opponentPower?: number;
    playerMultiplier?: number;
    opponentMultiplier?: number;
}

/**
 * 전투 결과 정보
 */
export interface BattleResult {
    winner: 'player' | 'opponent' | 'draw';
    rounds: RoundResult[];
    playerWins: number;
    opponentWins: number;
    rewards: {
        coins: number;
        experience: number;
        ratingChange: number;
        tokens?: number;  // Optional tokens for real-time PVP
    };
    dailyStats?: {
        aiWinsToday: number;
        aiMatchesToday: number;
        lastDailyReset: number;
        matchCount: Record<string, number>;
    };
    pvpStats?: {
        wins: number;
        losses: number;
        totalBattles: number;
        rating: number;
        pvpMatches: number;
        finished: boolean;
        createdAt: number;
        winRate: number;
        rank: number;
        isGhost?: boolean;
    };
    cardExchange?: {
        cardsLost: Card[];
        cardsGained: Card[];
    };
}

/**
 * 참가 조건
 */
export const PVP_REQUIREMENTS = {
    minLevel: 1,
    entryFeeCoins: 50,    // Real-time PVP entry fee (coins)
    entryFeeTokens: 50,   // Real-time PVP entry fee (tokens)
    minCards: 5,
};

/**
 * 보상 설정 인터페이스
 */
export interface RewardConfig {
    coins: number;
    exp: number;
    rating: number;
    tokens?: number;  // Optional tokens reward for real-time PVP
}

/**
 * 보상 체계
 */
export const PVP_REWARDS: Record<string, RewardConfig> = {
    'sudden-death': { coins: 100, exp: 30, rating: 15 },
    'tactics': { coins: 100, exp: 50, rating: 25 },
    'strategy': { coins: 100, exp: 70, rating: 35 },
    'double': { coins: 100, exp: 60, rating: 30 },
    loss: { coins: 0, exp: 10, rating: -10 },
    draw: { coins: 20, exp: 20, rating: 0 },
    // Real-time PVP rewards (entry fee: 50 coins + 50 tokens)
    'realtime-win': { coins: 100, exp: 50, rating: 50, tokens: 100 },   // Net: +50 coins, +50 tokens
    'realtime-loss': { coins: 0, exp: 10, rating: -25, tokens: 0 },     // No additional penalty (entry fee already paid)
};

/**
 * 카드 교환 설정
 */
export const CARD_EXCHANGE = {
    cardsToExchange: 3,
    minRarityToLose: 'common' as const,
};

/**
 * 전투 결과 적용
 */
export async function applyBattleResult(
    result: BattleResult,
    playerDeck: Card[],
    opponentDeck: Card[],
    isRanked: boolean = false,
    isGhost: boolean = false,
    isRealtime: boolean = false,  // NEW: Real-time PVP flag
    manualRewards?: { coins: number; experience: number; tokens?: number }
): Promise<void> {
    console.log(`📊 Applying battle result (Ranked: ${isRanked}, Ghost: ${isGhost}, Realtime: ${isRealtime})...`);

    try {
        const state = getGameState();
        const userId = state.userId; // [FIX] Get userId from state for Firebase sync
        const currentPvpStats = state.pvpStats || {
            wins: 0,
            losses: 0,
            totalBattles: 0,
            rating: 1000,
            pvpMatches: 0,
            finished: false,
            createdAt: Date.now(),
            winRate: 0,
            rank: 0,
        };

        const currentRating = currentPvpStats.rating || 1000;

        // [FIX] AI/Practice mode now gets 50% rating instead of 0
        // Previously: isRanked=false meant ratingChange=0, now it means 50%
        let ratingChange = result.rewards.ratingChange;
        let rewardMultiplier = 1.0;

        if (isGhost || !isRanked) {
            rewardMultiplier = 0.5;
            // [FIX] Rating is already balanced in the reward config (e.g., +25 for AI vs +50 for PvP)
            // So we award 100% of the ratingChange specified in the result.
            console.log(`📉 50% coin/xp rewards applied (Ghost/Practice Mode). Rating change remains: ${ratingChange}`);
        }

        const newRating = Math.max(0, currentRating + ratingChange);

        const newPvpStats = {
            ...currentPvpStats,
            wins: currentPvpStats.wins + (result.winner === 'player' ? 1 : 0),
            losses: currentPvpStats.losses + (result.winner === 'opponent' ? 1 : 0),
            totalBattles: currentPvpStats.totalBattles + 1,
            pvpMatches: currentPvpStats.pvpMatches + (isRanked ? 1 : 0),
            rating: newRating,
            finished: true,
            isGhost: isGhost,
        };

        let coinsEarned = manualRewards ? manualRewards.coins : Math.floor(result.rewards.coins * rewardMultiplier);
        let expEarned = manualRewards ? manualRewards.experience : Math.floor(result.rewards.experience * rewardMultiplier);
        let tokensEarned = 0;

        // Real-time PVP token rewards
        if (isRealtime && result.rewards.tokens !== undefined) {
            tokensEarned = manualRewards?.tokens !== undefined ? manualRewards.tokens : result.rewards.tokens;
        }

        const updatedState = {
            ...state,
            coins: state.coins + coinsEarned,
            experience: state.experience + expEarned,
            tokens: state.tokens + tokensEarned,  // Add tokens
            pvpStats: newPvpStats,
        };

        // Daily stats update for Practice mode
        if (!isRanked && state.dailyStats) {
            updatedState.dailyStats = {
                ...state.dailyStats,
                aiWinsToday: (state.dailyStats.aiWinsToday || 0) + (result.winner === 'player' ? 1 : 0),
                aiMatchesToday: (state.dailyStats.aiMatchesToday || 0) + 1
            };
        }

        // Card exchange logic
        if (result.winner === 'player' && isRanked && result.cardExchange) {
            for (const lostCard of result.cardExchange.cardsLost) {
                const index = updatedState.inventory.findIndex(c => c.id === lostCard.id);
                if (index !== -1) updatedState.inventory.splice(index, 1);
            }
            updatedState.inventory.push(...result.cardExchange.cardsGained);
        }

        await updateGameState(updatedState);

        if (coinsEarned > 0) await gameStorage.addCoins(coinsEarned);
        if (expEarned > 0) await gameStorage.addExperience(expEarned);

        // Award tokens for real-time PVP
        if (tokensEarned !== 0) {
            const { updateTokens } = await import('./firebase-db');
            await updateTokens(tokensEarned);
            console.log(`🪙 Tokens awarded: ${tokensEarned}`);
        }

        // [Jung-Gong-Beop] Persist PVP Stats to Firebase for Leaderboard
        // We must explicitly save the profile updates to trigger the root-doc sync we just added
        const { saveUserProfile } = await import('./firebase-db');
        await saveUserProfile({
            rating: newRating,
            wins: newPvpStats.wins,
            losses: newPvpStats.losses,
            // We can also sync nickname/avatar if needed, but they are usually static
        }, userId);

        console.log(`✅ Battle result processed & saved to DB. Rating: ${currentRating} -> ${newRating}`);
    } catch (error) {
        console.error("❌ Failed to apply battle result:", error);
    }
}

/**
 * Pay PVP entry fee (real-time PVP only)
 */
export async function payPVPEntryFee(): Promise<{ success: boolean; message?: string }> {
    try {
        const state = getGameState();

        if (state.coins < PVP_REQUIREMENTS.entryFeeCoins) {
            return {
                success: false,
                message: `코인이 부족합니다. (필요: ${PVP_REQUIREMENTS.entryFeeCoins}, 보유: ${state.coins})`
            };
        }

        if (state.tokens < PVP_REQUIREMENTS.entryFeeTokens) {
            return {
                success: false,
                message: `토큰이 부족합니다. (필요: ${PVP_REQUIREMENTS.entryFeeTokens}, 보유: ${state.tokens})`
            };
        }

        // Deduct entry fees
        const { updateCoins, updateTokens } = await import('./firebase-db');
        await updateCoins(-PVP_REQUIREMENTS.entryFeeCoins);
        await updateTokens(-PVP_REQUIREMENTS.entryFeeTokens);

        // Update local state
        await gameStorage.addCoins(-PVP_REQUIREMENTS.entryFeeCoins);

        console.log(`💰 Entry fee paid: ${PVP_REQUIREMENTS.entryFeeCoins} coins + ${PVP_REQUIREMENTS.entryFeeTokens} tokens`);

        return { success: true };
    } catch (error) {
        console.error("❌ Failed to pay entry fee:", error);
        return {
            success: false,
            message: '참가비 결제 중 오류가 발생했습니다.'
        };
    }
}


/**
 * PVP 입장료 환불 (매칭 실패 / 취소 시 호출)
 */
export async function refundPVPEntryFee(): Promise<void> {
    try {
        const { updateCoins, updateTokens } = await import('./firebase-db');
        await updateCoins(PVP_REQUIREMENTS.entryFeeCoins);
        await updateTokens(PVP_REQUIREMENTS.entryFeeTokens);
        await gameStorage.addCoins(PVP_REQUIREMENTS.entryFeeCoins);
        console.log(`↩️ Entry fee refunded: ${PVP_REQUIREMENTS.entryFeeCoins} coins + ${PVP_REQUIREMENTS.entryFeeTokens} tokens`);
    } catch (error) {
        console.error('❌ Failed to refund entry fee:', error);
    }
}

/**
 * 카드 타입 결정
 */
export function getCardType(card: Card): 'efficiency' | 'creativity' | 'function' {
    if (!card) return 'efficiency';
    if (card.type === 'EFFICIENCY') return 'efficiency';
    if (card.type === 'CREATIVITY') return 'creativity';
    if (card.type === 'FUNCTION') return 'function';

    const { efficiency = 0, creativity = 0, function: func = 0 } = card.stats;
    if (efficiency >= creativity && efficiency >= func) return 'efficiency';
    if (creativity >= efficiency && creativity >= func) return 'creativity';
    return 'function';
}

/**
 * 라운드 승자 판정
 */
export function determineRoundWinner(playerCard: Card, opponentCard: Card): 'player' | 'opponent' | 'draw' {
    const res = resolveBattleResult(playerCard, opponentCard);
    return res.winner === 'player1' ? 'player' : res.winner === 'player2' ? 'opponent' : 'draw';
}

/**
 * PVP 통계 가져오기
 */
export function getPVPStats(): PVPStats {
    const state = getGameState();
    const pvpStats = state.pvpStats || {
        wins: 0,
        losses: 0,
        totalBattles: 0,
        rating: 1000,
        pvpMatches: 0,
        finished: false,
        createdAt: Date.now(),
        winRate: 0,
        rank: 0,
    };

    return {
        ...pvpStats,
        winRate: pvpStats.totalBattles > 0
            ? Math.round((pvpStats.wins / pvpStats.totalBattles) * 100)
            : 0,
    };
}

/**
 * 참가 조건 확인
 */
export async function checkPVPRequirements(
    currentInventory?: Card[],
    currentLevel?: number,
    currentCoins?: number,
    currentTokens?: number,  // NEW: Token check
    isRealtime: boolean = false  // NEW: Check if real-time PVP
): Promise<{ canJoin: boolean; reason?: string }> {
    const state = typeof window !== 'undefined' ? getGameState() : { level: 0, coins: 0, tokens: 0, inventory: [] } as any;

    const inventory = currentInventory || state.inventory || [];
    const level = currentLevel !== undefined ? currentLevel : state.level;
    const coins = currentCoins !== undefined ? currentCoins : state.coins;
    const tokens = currentTokens !== undefined ? currentTokens : state.tokens;

    if (level < PVP_REQUIREMENTS.minLevel) {
        return {
            canJoin: false,
            reason: `레벨 ${PVP_REQUIREMENTS.minLevel} 이상부터 참가 가능합니다.`
        };
    }

    // Check entry fees and spare card for real-time PVP
    if (isRealtime) {
        if (coins < PVP_REQUIREMENTS.entryFeeCoins) {
            return {
                canJoin: false,
                reason: `참가비 ${PVP_REQUIREMENTS.entryFeeCoins} 코인이 필요합니다.`
            };
        }

        if (tokens < PVP_REQUIREMENTS.entryFeeTokens) {
            return {
                canJoin: false,
                reason: `참가비 ${PVP_REQUIREMENTS.entryFeeTokens} 토큰이 필요합니다.`
            };
        }

        // [NEW] Spare card requirement for card consumption
        const commonOrRareCards = inventory.filter((c: Card) => c.rarity === 'common' || c.rarity === 'rare');
        if (inventory.length < 6) {
            return {
                canJoin: false,
                reason: `최소 6장의 카드가 필요합니다. (기본 덱 5장 + 소모용 여분 1장)`
            };
        }

        if (commonOrRareCards.length < 1) {
            return {
                canJoin: false,
                reason: `소모용 여분 카드(일반 또는 희귀 등급)가 최소 1장 필요합니다.`
            };
        }
    } else {
        // AI practice mode - existing checks
        if (coins < PVP_REQUIREMENTS.entryFeeCoins) {
            return {
                canJoin: false,
                reason: `참가비 ${PVP_REQUIREMENTS.entryFeeCoins} 코인이 필요합니다.`
            };
        }

        if (inventory.length < PVP_REQUIREMENTS.minCards) {
            return {
                canJoin: false,
                reason: `최소 ${PVP_REQUIREMENTS.minCards}장의 카드가 필요합니다.`
            };
        }
    }

    return { canJoin: true };
}

/**
 * AI 연습 모드 및 스토리 모드용 상대 덱 생성
 * @param playerLevel 플레이어 레벨
 * @param cardPool 카드 풀 (옵션)
 * @param targetSize 덱 크기
 * @param pattern 타입 패턴 (옵션)
 * @param isBoss 보스 여부
 * @param playerRating 플레이어 레이팅 (AI 난이도 스케일링용)
 */
export function generateOpponentDeck(
    playerLevel: number,
    cardPool?: Card[],
    targetSize: number = 5,
    pattern?: { function: number; creativity: number; efficiency: number },
    isBoss: boolean = false,
    playerRating: number = 1000 // [NEW] Rating-based difficulty
): BattleParticipant {
    // [NEW] 레이팅 기반 난이도 계산
    // 브론즈(< 1100): Easy, 실버(1100-1299): Normal, 골드(1300-1499): Hard
    // 플래티넘(1500-1699): Expert, 다이아+(1700+): Master
    let difficulty: 'easy' | 'normal' | 'hard' | 'expert' | 'master' = 'easy';
    let statBonus = 0;
    let rarityBoost = 0; // 0-1 사이, 높을수록 고등급 카드 확률 증가

    if (playerRating >= 1700) {
        difficulty = 'master';
        statBonus = 15;
        rarityBoost = 0.4;
    } else if (playerRating >= 1500) {
        difficulty = 'expert';
        statBonus = 10;
        rarityBoost = 0.3;
    } else if (playerRating >= 1300) {
        difficulty = 'hard';
        statBonus = 5;
        rarityBoost = 0.2;
    } else if (playerRating >= 1100) {
        difficulty = 'normal';
        statBonus = 0;
        rarityBoost = 0.1;
    } else {
        difficulty = 'easy';
        statBonus = -5; // Easy mode: AI가 약간 약함
        rarityBoost = 0;
    }

    const styles = [
        { name: '맹장형', type: 'EFFICIENCY', desc: '공격적인 성향' },
        { name: '지장형', type: 'CREATIVITY', desc: '창의적인 전술' },
        { name: '덕장형', type: 'FUNCTION', desc: '기능성 중시' },
        { name: '운장형', type: 'BALANCED', desc: '밸런스 중시' }
    ];
    const style = styles[Math.floor(Math.random() * styles.length)];

    // 패턴이 있으면 패턴에 맞춰 타입별 개수를 정함
    const typesToGenerate: ('FUNCTION' | 'CREATIVITY' | 'EFFICIENCY')[] = [];
    if (pattern) {
        for (let i = 0; i < pattern.function; i++) typesToGenerate.push('FUNCTION');
        for (let i = 0; i < pattern.creativity; i++) typesToGenerate.push('CREATIVITY');
        for (let i = 0; i < pattern.efficiency; i++) typesToGenerate.push('EFFICIENCY');

        // 남은 자리는 랜덤 (5장 미만일 경우 대비)
        while (typesToGenerate.length < targetSize) {
            const types: ('FUNCTION' | 'CREATIVITY' | 'EFFICIENCY')[] = ['FUNCTION', 'CREATIVITY', 'EFFICIENCY'];
            typesToGenerate.push(types[Math.floor(Math.random() * 3)]);
        }
    }

    const aiCards = Array.from({ length: targetSize }).map((_, i) => {
        let rarity: Rarity = 'common';
        const roll = Math.random();

        // [NEW] 레이팅 기반 레어도 결정
        if (isBoss) {
            rarity = 'rare'; // 보스는 최소 레어
        } else {
            // 기본 확률 + 레이팅 부스트
            const boostedRoll = roll + rarityBoost;
            if (boostedRoll > 0.95) rarity = 'legendary';
            else if (boostedRoll > 0.8) rarity = 'epic';
            else if (boostedRoll > 0.5) rarity = 'rare';
            else rarity = 'common';
        }

        // 특정 타입 강제 또는 전체 랜덤
        const forcedType = typesToGenerate[i];
        const card = generateRandomCard(rarity, 0, undefined, undefined, forcedType);

        card.id = `ai-gen-${Date.now()}-${i}`;

        // [NEW] 레이팅 기반 레벨 조정
        const levelAdjust = difficulty === 'master' ? 2 : difficulty === 'expert' ? 1 : difficulty === 'hard' ? 0 : difficulty === 'normal' ? -1 : -2;
        card.level = Math.max(1, playerLevel + levelAdjust + (isBoss ? 1 : 0));

        // [NEW] 레이팅 기반 스탯 조정
        if (card.stats) {
            const bonus = statBonus + (isBoss ? 5 : 0);
            card.stats.efficiency = Math.max(1, (card.stats.efficiency || 0) + bonus);
            card.stats.creativity = Math.max(1, (card.stats.creativity || 0) + bonus);
            card.stats.function = Math.max(1, (card.stats.function || 0) + bonus);
            card.stats.totalPower = (card.stats.efficiency || 0) + (card.stats.creativity || 0) + (card.stats.function || 0);
        }

        return card;
    });

    // [NEW] 난이도를 이름에 표시
    const difficultyLabel = {
        'easy': '🟢 초보',
        'normal': '🔵 일반',
        'hard': '🟠 고수',
        'expert': '🔴 전문가',
        'master': '⚫ 마스터'
    }[difficulty];

    return {
        name: isBoss ? `[BOSS]` : `[AI ${difficultyLabel}] ${style.name}`,
        level: playerLevel,
        deck: aiCards,
        style: isBoss ? '챕터 최종 보스' : `${style.desc} (Rating: ${playerRating})`
    };
}


/**
 * 전투 시뮬레이션 (연습 모드용)
 */
export function simulateBattle(player: BattleParticipant, opponent: BattleParticipant, mode: BattleMode): BattleResult {
    let playerWins = 0;
    let opponentWins = 0;
    const rounds: RoundResult[] = [];
    const pOrder = player.cardOrder || [0, 1, 2, 3, 4];
    const oOrder = opponent.cardOrder || [0, 1, 2, 3, 4];

    for (let i = 0; i < 5; i++) {
        const pCard = player.deck[pOrder[i]];
        const oCard = opponent.deck[oOrder[i]];
        if (!pCard || !oCard) continue;

        const res = resolveBattleResult(pCard, oCard);
        const winner = res.winner === 'player1' ? 'player' : res.winner === 'player2' ? 'opponent' : 'draw';
        const pFinal = pCard.stats?.totalPower || 0;
        const oFinal = oCard.stats?.totalPower || 0;


        if (winner === 'player') playerWins++;
        else if (winner === 'opponent') opponentWins++;

        rounds.push({
            round: i + 1,
            playerCard: pCard,
            opponentCard: oCard,
            winner,
            playerType: getCardType(pCard),
            opponentType: getCardType(oCard),
            playerPower: pFinal,
            opponentPower: oFinal,
        });

        if (mode === 'sudden-death' && winner !== 'draw') break;
    }

    const battleWinner = playerWins > opponentWins ? 'player' : playerWins < opponentWins ? 'opponent' : 'draw';

    return {
        winner: battleWinner,
        rounds,
        playerWins,
        opponentWins,
        rewards: calculateRewards(mode, battleWinner)
    };
}

function calculateRewards(mode: BattleMode, winner: 'player' | 'opponent' | 'draw'): {
    coins: number;
    experience: number;
    ratingChange: number;
} {
    const rewards = winner === 'player' ? (PVP_REWARDS[mode] || PVP_REWARDS['sudden-death']) :
        winner === 'draw' ? PVP_REWARDS.draw :
            PVP_REWARDS.loss;

    // [NEW] 행운 연구 보너스 반영
    let fortuneBonus = 0;
    try {
        const state = getGameState();
        if (state.research?.stats?.fortune) {
            const level = state.research.stats.fortune.currentLevel;
            fortuneBonus = getResearchBonus('fortune', level);
        }
    } catch (e) { }

    const multiplier = 1 + (fortuneBonus / 100);

    return {
        coins: Math.floor(rewards.coins * multiplier),
        experience: Math.floor(rewards.exp * multiplier),
        ratingChange: rewards.rating,
    };
}

export function getTypeEmoji(type: 'efficiency' | 'creativity' | 'function'): string {
    return type === 'efficiency' ? '🪨' : type === 'creativity' ? '📄' : '✂️';
}

export function getTypeName(type: 'efficiency' | 'creativity' | 'function'): string {
    return type === 'efficiency' ? '효율성' : type === 'creativity' ? '창의성' : '기능성';
}
