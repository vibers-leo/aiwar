// AI 타입 시스템 유틸리티

import { AIType } from './types';

/**
 * AI 타입 정보
 */
export const AI_TYPE_INFO: Record<string, { name: string; nameEn: string; icon: string; color: string; description: string; examples: string[] }> = {
    EFFICIENCY: {
        name: '효율 (ROCK)',
        nameEn: 'Efficiency',
        icon: '✊',
        color: '#ef4444', // red
        description: '빠른 처리와 정밀한 최적화 (가위 차단)',
        examples: ['GPT-4 Turbo', 'Claude Instant']
    },
    CREATIVITY: {
        name: '창의 (PAPER)',
        nameEn: 'Creativity',
        icon: '✋',
        color: '#3b82f6', // blue
        description: '혁신적인 아이디어와 예술성 (바위 감싸기)',
        examples: ['DALL-E', 'Midjourney', 'GPT-4']
    },
    FUNCTION: {
        name: '기능 (SCISSORS)',
        nameEn: 'Function',
        icon: '✌️',
        color: '#4ade80', // light green
        description: '날카로운 분석과 경제적 솔루션 (보자기 절단)',
        examples: ['Llama', 'Open Source AI']
    },
    COST: {
        name: '비용 (COST)',
        nameEn: 'Cost',
        icon: '💰',
        color: '#f59e0b', // amber
        description: '비용 효율적인 솔루션',
        examples: ['Lite Models', 'Edge AI']
    }
};

/**
 * 타입 상성 체크
 * @param attackerType 공격하는 카드의 타입
 * @param defenderType 방어하는 카드의 타입
 * @returns true if attacker has advantage
 */
export function hasTypeAdvantage(attackerType: AIType | undefined, defenderType: AIType | undefined): boolean {
    if (!attackerType || !defenderType) return false;
    const advantages: Record<string, AIType> = {
        EFFICIENCY: 'FUNCTION',      // 효율성 > 비용/기능
        FUNCTION: 'CREATIVITY',      // 비용/기능 > 창의성
        CREATIVITY: 'EFFICIENCY',    // 창의성 > 효율성
        COST: 'FUNCTION'             // 비용 > 기능
    };

    return advantages[attackerType] === defenderType;
}

/**
 * 타입 상성 보너스 배율
 */
export const TYPE_ADVANTAGE_MULTIPLIER = 1.3; // 30% 보너스

/**
 * 같은 타입 콤보 보너스 (2장 대결 시)
 */
export const SAME_TYPE_COMBO_BONUS = 0.3;

/**
 * 타입별 랜덤 생성 가중치
 */
export const TYPE_WEIGHTS: Record<string, number> = {
    EFFICIENCY: 25,
    CREATIVITY: 25,
    FUNCTION: 25,
    COST: 25
};

/**
 * 랜덤 타입 생성
 */
export function getRandomType(): AIType {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const [type, weight] of Object.entries(TYPE_WEIGHTS)) {
        cumulative += weight;
        if (random < cumulative) {
            return type as AIType;
        }
    }

    return 'EFFICIENCY';
}

/**
 * 타입 아이콘 가져오기
 */
export function getTypeIcon(type: AIType | undefined): string {
    if (!type) return '❓';
    return AI_TYPE_INFO[type].icon;
}

/**
 * 타입 색상 가져오기
 */
export function getTypeColor(type: AIType | undefined): string {
    if (!type) return '#9ca3af'; // gray-400
    return AI_TYPE_INFO[type].color;
}

/**
 * 타입 이름 가져오기
 */
export function getTypeName(type: AIType | undefined): string {
    if (!type) return 'Unknown';
    return AI_TYPE_INFO[type].name;
}

/**
 * 상성 관계 설명
 */
export function getTypeAdvantageDescription(attackerType: AIType | undefined, defenderType: AIType | undefined): string | null {
    if (!attackerType || !defenderType || !hasTypeAdvantage(attackerType, defenderType)) {
        return null;
    }

    const attacker = AI_TYPE_INFO[attackerType].name;
    const defender = AI_TYPE_INFO[defenderType].name;

    const descriptions: Record<string, string> = {
        'EFFICIENCY-FUNCTION': `${attacker}이(가) ${defender}을(를) 압도합니다! (빠른 처리가 비용을 절감)`,
        'FUNCTION-CREATIVITY': `${attacker}이(가) ${defender}을(를) 압도합니다! (저렴한 솔루션이 과도한 창의성을 이김)`,
        'CREATIVITY-EFFICIENCY': `${attacker}이(가) ${defender}을(를) 압도합니다! (혁신이 단순 효율을 뛰어넘음)`
    };

    const key = `${attackerType}-${defenderType}`;
    return descriptions[key] || null;
}
/**
 * Shared Battle Resolution Logic (Winner Takes All)
 * Priority: Type > Specific Stat > Total Power > Rarity
 */
export function resolveBattleResult(card1: any, card2: any): {
    winner: 'player1' | 'player2' | 'draw',
    reason: 'TYPE' | 'STAT' | 'POWER' | 'RARITY' | 'DRAW'
} {
    if (!card1 || !card2) return { winner: 'draw', reason: 'DRAW' };

    // [NEW] 전군 지휘 보너스 (리더십 연구 반영)
    let leadershipBoost = 0;
    try {
        const { gameStorage } = require('./game-storage');
        const state = gameStorage.getGameState();
        if (state.research?.stats?.leadership) {
            const rank = state.research.stats.leadership.currentLevel;
            leadershipBoost = rank > 0 ? (rank >= 9 ? 0.20 : rank * 0.02) : 0;
        }
    } catch (e) { }

    const type1 = card1.type || 'EFFICIENCY';
    const type2 = card2.type || 'EFFICIENCY';

    // 1. Type Advantage (Instant Win)
    if (hasTypeAdvantage(type1, type2)) return { winner: 'player1', reason: 'TYPE' };
    if (hasTypeAdvantage(type2, type1)) return { winner: 'player2', reason: 'TYPE' };

    // 2. Specific Stat (If same type)
    if (type1 === type2) {
        const getStat = (card: any, type: string, boost: number = 0) => {
            let base = 0;
            if (type === 'EFFICIENCY') base = card.stats?.efficiency || 0;
            else if (type === 'CREATIVITY') base = card.stats?.creativity || 0;
            else if (type === 'FUNCTION') base = card.stats?.function || 0;

            return Math.floor(base * (1 + boost));
        };
        const s1 = getStat(card1, type1, leadershipBoost);
        const s2 = getStat(card2, type2);
        if (s1 > s2) return { winner: 'player1', reason: 'STAT' };
        if (s2 > s1) return { winner: 'player2', reason: 'STAT' };
    }

    // 3. Total Power
    const p1 = Math.floor((card1.stats?.totalPower || 0) * (1 + leadershipBoost));
    const p2 = card2.stats?.totalPower || 0;
    if (p1 > p2) return { winner: 'player1', reason: 'POWER' };
    if (p2 > p1) return { winner: 'player2', reason: 'POWER' };

    // 4. Rarity Weight
    const rarityWeight: Record<string, number> = {
        'commander': 6, 'mythic': 5, 'legendary': 4, 'epic': 3, 'rare': 2, 'common': 1
    };
    const r1 = rarityWeight[card1.rarity?.toLowerCase() || 'common'] || 1;
    const r2 = rarityWeight[card2.rarity?.toLowerCase() || 'common'] || 1;
    if (r1 > r2) return { winner: 'player1', reason: 'RARITY' };
    if (r2 > r1) return { winner: 'player2', reason: 'RARITY' };

    return { winner: 'draw', reason: 'DRAW' };
}
