
import { Card } from '@/lib/types'; // 기존 카드 타입 활용

// 상성 타입 정의
export type HandType = 'rock' | 'paper' | 'scissors';

// 게임 모드 정의
export type MiniGameMode = 'sudden-death' | 'tactics' | 'double' | 'strategy';
// 한글 명칭 매핑 (UI용)
export const MINI_GAME_MODE_NAMES = {
    'sudden-death': '단판승부',
    'double': '2장승부',
    'tactics': '전술승부',
    'strategy': '전략승부'
};

// 승패 결과 타입
export type GameResult = 'win' | 'lose' | 'draw';

// 미니게임 상태 인터페이스
export interface MiniGameState {
    mode: MiniGameMode;
    playerHand: Card[];
    opponentHand: Card[];
    result?: GameResult;
    logs: string[];
}

/**
 * 카드의 AI 타입 또는 군단을 가위바위보 상성으로 매핑 (v1.0 공식)
 * 효율(EFFICIENCY) -> ✊ 바위 (Rock)
 * 기능(FUNCTION) -> ✌️ 가위 (Scissors)
 * 창의(CREATIVITY) -> ✋ 보 (Paper)
 */
export function getHandType(card: Card): HandType {
    const type = (card.type || '').toUpperCase();

    if (type === 'EFFICIENCY') return 'rock';
    if (type === 'FUNCTION') return 'scissors';
    if (type === 'CREATIVITY') return 'paper';

    // 타입이 없는 경우 군단 ID로 추론 (하위 호환)
    const lowerId = (card.aiFactionId || '').toLowerCase();
    if (['machine', 'force', 'warrior', 'tank', 'hell'].some(f => lowerId.includes(f))) return 'rock';
    if (['cyberpunk', 'shadow', 'agility', 'speed'].some(f => lowerId.includes(f))) return 'scissors';

    return 'paper'; // 기본값 (Union, Logic 등은 주로 창의/보 계열)
}

// 상성 비교 로직 (가위바위보)
// Efficiency(Rock) > Function(Scissors)
// Function(Scissors) > Creativity(Paper)
// Creativity(Paper) > Efficiency(Rock)
export function compareHands(playerType: HandType, opponentType: HandType): GameResult {
    if (playerType === opponentType) return 'draw';

    if (
        (playerType === 'rock' && opponentType === 'scissors') || // 효율 > 기능
        (playerType === 'scissors' && opponentType === 'paper') || // 기능 > 창의
        (playerType === 'paper' && opponentType === 'rock')      // 창의 > 효율
    ) {
        return 'win';
    }

    return 'lose';
}

/**
 * 등급(Rarity) 비교 로직
 * 상성이 같을 때 등급이 높은 쪽이 이깁니다.
 * Common(1) < Rare(2) < Epic(3) < Legendary(4) < Mythic(5)
 */
const rarityScore: Record<string, number> = {
    'common': 1,
    'rare': 2,
    'epic': 3,
    'legendary': 4,
    'mythic': 5,
    'secret': 6 // 히든 등급
};

export function compareRarity(playerCard: Card, opponentCard: Card): GameResult {
    const pScore = rarityScore[playerCard.rarity?.toLowerCase() || 'common'] || 1;
    const oScore = rarityScore[opponentCard.rarity?.toLowerCase() || 'common'] || 1;

    if (pScore > oScore) return 'win';
    if (pScore < oScore) return 'lose';
    return 'draw';
}

/**
 * 최종 승부 판정 (단판 승부 기준)
 * 1순위: 상성 / 2순위: 등급
 */
export function determineWinner(playerCard: Card, opponentCard: Card): { result: GameResult, reason: string } {
    const pType = getHandType(playerCard);
    const oType = getHandType(opponentCard);

    const typeResult = compareHands(pType, oType);

    if (typeResult !== 'draw') {
        return { result: typeResult, reason: 'type' }; // 상성으로 승부
    }

    // 상성이 같으면 등급 대결
    const rarityResult = compareRarity(playerCard, opponentCard);

    if (rarityResult !== 'draw') {
        return { result: rarityResult, reason: 'rarity' }; // 등급으로 승부
    }

    return { result: 'draw', reason: 'equal' }; // 완전 무승부
}

/**
 * 사용자 레벨 기반 AI 카드 등급 확률 계산
 * Level 1: Common 70%, Rare 20%, Epic 9%, Legendary 1%
 * Level 10: Common 30%, Rare 30%, Epic 30%, Legendary 10%
 * Level 20+: Common 10%, Rare 30%, Epic 40%, Legendary 20%
 */
function calculateRarityProbabilities(userLevel: number) {
    // 레벨에 따른 동적 확률 조정
    const commonProb = Math.max(10, 70 - userLevel * 3);  // 70% → 10%
    const rareProb = Math.min(30, 20 + userLevel * 0.5);  // 20% → 30%
    const epicProb = Math.min(40, 9 + userLevel * 1.5);   // 9% → 40%
    const legendaryProb = Math.min(20, 1 + userLevel);    // 1% → 20%

    return { commonProb, rareProb, epicProb, legendaryProb };
}

/**
 * 확률 기반 등급 결정
 */
function determineRarityByProbability(userLevel: number): string {
    const { commonProb, rareProb, epicProb, legendaryProb } = calculateRarityProbabilities(userLevel);

    const roll = Math.random() * 100;

    // 누적 확률로 판정
    if (roll < legendaryProb) return 'legendary';
    if (roll < legendaryProb + epicProb) return 'epic';
    if (roll < legendaryProb + epicProb + rareProb) return 'rare';
    return 'common';
}

/**
 * AI 상대의 레벨 기반 핸드 생성
 * userLevel이 높을수록 더 강력한 카드(높은 등급) 출현 확률 증가
 */
export function generateOpponentHand(mode: MiniGameMode, userLevel: number = 1): Card[] {
    const count = mode === 'double' || mode === 'strategy' ? 6 : 5;

    console.log(`[AI Difficulty] Generating hand for Level ${userLevel} opponent`);
    const { commonProb, rareProb, epicProb, legendaryProb } = calculateRarityProbabilities(userLevel);
    console.log(`  Probabilities: Common ${commonProb.toFixed(1)}%, Rare ${rareProb.toFixed(1)}%, Epic ${epicProb.toFixed(1)}%, Legendary ${legendaryProb.toFixed(1)}%`);

    // 등급별 기본 파워 범위
    const RARITY_BASE_POWER: Record<string, { min: number; max: number }> = {
        common:    { min: 60,  max: 120 },
        rare:      { min: 130, max: 220 },
        epic:      { min: 240, max: 380 },
        legendary: { min: 400, max: 600 },
    };

    const AI_NAMES: Record<string, string[]> = {
        machine:   ['Iron Core', 'Steel Frame', 'Logic Gate', 'Binary Cipher', 'Neural Link'],
        union:     ['Data Stream', 'Open Protocol', 'Free Agent', 'Swarm Node', 'Mesh Guard'],
        cyberpunk: ['Neon Blade', 'Ghost Wire', 'Chrome Jack', 'Surge Punk', 'Void Hacker'],
        emperor:   ['Dark Throne', 'Iron Decree', 'Shadow Court', 'Silent Edge', 'Obsidian Veil'],
        empire:    ['Command Grid', 'Siege Engine', 'War Protocol', 'Titan Shell', 'Apex Drone'],
    };

    return Array(count).fill(null).map((_, i) => {
        const factionPool = ['machine', 'union', 'cyberpunk', 'emperor', 'empire'];
        const faction = factionPool[Math.floor(Math.random() * factionPool.length)];
        const rarity = determineRarityByProbability(userLevel);

        // [FIX] 등급+레벨 기반 실제 스탯 생성 (플레이스홀더 제거)
        const basePower = RARITY_BASE_POWER[rarity] || RARITY_BASE_POWER.common;
        const levelBonus = userLevel * 8;
        const totalPower = basePower.min + Math.floor(Math.random() * (basePower.max - basePower.min)) + levelBonus;

        // 세부 스탯: totalPower를 5개 스탯에 분배 (각 최소 5pt)
        const statKeys = ['creativity', 'accuracy', 'speed', 'stability', 'ethics'];
        const remaining = totalPower - 5 * 5; // 최소 5씩 배분 후 남은 포인트
        const rawSplit = statKeys.map(() => Math.random());
        const sum = rawSplit.reduce((a, b) => a + b, 0);
        const stats = statKeys.reduce((acc, key, idx) => {
            acc[key] = 5 + Math.floor((rawSplit[idx] / sum) * remaining);
            return acc;
        }, {} as Record<string, number>);
        stats.totalPower = Object.values(stats).reduce((a, b) => a + b, 0);

        const namePool = AI_NAMES[faction] || AI_NAMES.machine;
        const name = namePool[i % namePool.length];

        return {
            id: `ai-card-${Date.now()}-${i}`,
            instanceId: `ai-inst-${Date.now()}-${i}`,
            name,
            rarity,
            aiFactionId: faction,
            imageUrl: `/assets/cards/dark_${faction}.png`,
            stats,
            type: faction === 'machine' ? 'EFFICIENCY' : (faction === 'cyberpunk' ? 'FUNCTION' : 'CREATIVITY')
        } as any;
    });
}
