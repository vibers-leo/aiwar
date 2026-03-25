// 연구소 시스템 - 군단장 스탯 강화를 통한 게임 전반 효율 향상

// ============================================
// 연구 카테고리 및 스탯
// ============================================
export type ResearchCategory =
    | 'insight'      // 통찰력: 희귀 등급 확률
    | 'efficiency'   // 효율성: 생산 속도
    | 'negotiation'  // 협상력: 비용 절감
    | 'leadership'   // 리더십: 숙련도 증가 속도
    | 'mastery'      // 숙달: 강화/합성 성공률
    | 'fortune';     // 행운: 배틀 보상 증가

export interface ResearchStat {
    id: ResearchCategory;
    name: string;
    description: string;
    icon: string;
    maxLevel: number;
    effects: {
        level: number;
        bonus: number;
        description: string;
    }[];
    baseCost: number;          // 레벨 1 비용
    costMultiplier: number;    // 레벨당 비용 증가율
    baseTime: number;          // 레벨 1 연구 시간 (분)
    timeMultiplier: number;    // 레벨당 시간 증가율
    requiredLevel: number;     // 개방에 필요한 군단장 레벨
    requiredResearchId?: ResearchCategory; // 개방에 필요한 선행 연구 ID
    requiredResearchLevel?: number;        // 개방에 필요한 선행 연구 레벨
    color: string;
    gradient: string;
}

export const RESEARCH_STATS: ResearchStat[] = [
    {
        id: 'insight',
        name: '통찰력',
        description: '유닛 발견 능력을 키워 더 높은 등급의 유닛을 확보합니다.',
        icon: '👁️',
        maxLevel: 9,
        effects: [
            { level: 1, bonus: 1, description: '고등급 확률 소폭 상승' },
            { level: 2, bonus: 2, description: '고등급 확률 상승' },
            { level: 3, bonus: 4, description: '희귀+ 확률 체감 상승' },
            { level: 4, bonus: 7, description: '영웅+ 확률 소폭 상향' },
            { level: 5, bonus: 10, description: '고등급 출현 빈도 증가' },
            { level: 6, bonus: 14, description: '영웅 등급 획득 유리' },
            { level: 7, bonus: 18, description: '전설 등급 확률 상향' },
            { level: 8, bonus: 23, description: '최상급 등급 확률 보정' },
            { level: 9, bonus: 30, description: '전설 유닛 획득 기회 대폭 확대' },
        ],
        baseCost: 200,
        costMultiplier: 1.5,
        baseTime: 10,
        timeMultiplier: 1.3,
        requiredLevel: 1,
        color: 'purple',
        gradient: 'from-purple-500 to-violet-600'
    },
    {
        id: 'efficiency',
        name: '효율',
        description: '생산 및 연구 공정을 최적화하여 대기 시간을 단축합니다.',
        icon: '⚡',
        maxLevel: 9,
        effects: [
            { level: 1, bonus: 5, description: '모든 대기 시간 5% 단축' },
            { level: 2, bonus: 10, description: '모든 대기 시간 10% 단축' },
            { level: 3, bonus: 15, description: '모든 대기 시간 15% 단축' },
            { level: 4, bonus: 20, description: '모든 대기 시간 20% 단축' },
            { level: 5, bonus: 25, description: '모든 대기 시간 25% 단축' },
            { level: 6, bonus: 30, description: '모든 대기 시간 30% 단축' },
            { level: 7, bonus: 35, description: '모든 대기 시간 35% 단축' },
            { level: 8, bonus: 40, description: '모든 대기 시간 40% 단축' },
            { level: 9, bonus: 50, description: '모든 대기 시간 절반으로 단축' },
        ],
        baseCost: 150,
        costMultiplier: 1.4,
        baseTime: 8,
        timeMultiplier: 1.25,
        requiredLevel: 2,
        requiredResearchId: 'insight',
        requiredResearchLevel: 1,
        color: 'yellow',
        gradient: 'from-yellow-500 to-amber-600'
    },
    {
        id: 'negotiation',
        name: '협상력',
        description: '경제적 우위를 점하여 상점가 및 각종 비용을 할인받습니다.',
        icon: '💰',
        maxLevel: 9,
        effects: [
            { level: 1, bonus: 4, description: '모든 비용 -4%' },
            { level: 2, bonus: 8, description: '모든 비용 -8%' },
            { level: 3, bonus: 12, description: '모든 비용 -12%' },
            { level: 4, bonus: 16, description: '모든 비용 -16%' },
            { level: 5, bonus: 20, description: '모든 비용 -20%' },
            { level: 6, bonus: 25, description: '모든 비용 -25%' },
            { level: 7, bonus: 30, description: '모든 비용 -30%' },
            { level: 8, bonus: 35, description: '모든 비용 -35%' },
            { level: 9, bonus: 40, description: '모든 비용 -40% (VIP)' },
        ],
        baseCost: 250,
        costMultiplier: 1.5,
        baseTime: 12,
        timeMultiplier: 1.3,
        requiredLevel: 3,
        requiredResearchId: 'efficiency',
        requiredResearchLevel: 2,
        color: 'green',
        gradient: 'from-green-500 to-emerald-600'
    },
    {
        id: 'leadership',
        name: '리더십',
        description: '전군을 지휘하여 부대 전체의 화력을 상시 강화합니다.',
        icon: '👑',
        maxLevel: 9,
        effects: [
            { level: 1, bonus: 2, description: '전군 전투력 +2%' },
            { level: 2, bonus: 4, description: '전군 전투력 +4%' },
            { level: 3, bonus: 6, description: '전군 전투력 +6%' },
            { level: 4, bonus: 8, description: '전군 전투력 +8%' },
            { level: 5, bonus: 10, description: '전군 전투력 +10%' },
            { level: 6, bonus: 12, description: '전군 전투력 +12%' },
            { level: 7, bonus: 14, description: '전군 전투력 +14%' },
            { level: 8, bonus: 16, description: '전군 전투력 +16%' },
            { level: 9, bonus: 20, description: '압도적인 지휘력 (전투력 +20%)' },
        ],
        baseCost: 300,
        costMultiplier: 1.6,
        baseTime: 15,
        timeMultiplier: 1.35,
        requiredLevel: 5,
        requiredResearchId: 'negotiation',
        requiredResearchLevel: 3,
        color: 'cyan',
        gradient: 'from-cyan-500 to-blue-600'
    },
    {
        id: 'mastery',
        name: '숙달',
        description: '강화 기술을 연마하여 더 높은 스탯 상승 기회를 얻습니다.',
        icon: '🔧',
        maxLevel: 9,
        effects: [
            { level: 1, bonus: 19, description: '+3 상승 확률 19.3%' },
            { level: 2, bonus: 23, description: '+3 상승 확률 23.6%' },
            { level: 3, bonus: 28, description: '+3 상승 확률 28.0%' },
            { level: 4, bonus: 32, description: '+3 상승 확률 32.3%' },
            { level: 5, bonus: 36, description: '+3 상승 확률 36.6%' },
            { level: 6, bonus: 41, description: '+3 상승 확률 41.0%' },
            { level: 7, bonus: 45, description: '+3 상승 확률 45.3%' },
            { level: 8, bonus: 50, description: '+3 상승 확률 50.0%' },
            { level: 9, bonus: 55, description: '+3 상승 확률 최고치 (55%)' },
        ],
        baseCost: 350,
        costMultiplier: 1.6,
        baseTime: 20,
        timeMultiplier: 1.4,
        requiredLevel: 7,
        requiredResearchId: 'leadership',
        requiredResearchLevel: 3,
        color: 'orange',
        gradient: 'from-orange-500 to-red-600'
    },
    {
        id: 'fortune',
        name: '행운',
        description: '운명을 개척하여 전투 보상을 대폭 증가시킵니다.',
        icon: '🍀',
        maxLevel: 9,
        effects: [
            { level: 1, bonus: 6, description: '모든 보상 +6%' },
            { level: 2, bonus: 12, description: '모든 보상 +12%' },
            { level: 3, bonus: 18, description: '모든 보상 +18%' },
            { level: 4, bonus: 24, description: '모든 보상 +24%' },
            { level: 5, bonus: 30, description: '모든 보상 +30%' },
            { level: 6, bonus: 38, description: '모든 보상 +38%' },
            { level: 7, bonus: 46, description: '모든 보상 +46%' },
            { level: 8, bonus: 54, description: '모든 보상 +54%' },
            { level: 9, bonus: 60, description: '보상 대폭 증가 (+60%)' },
        ],
        baseCost: 400,
        costMultiplier: 1.7,
        baseTime: 25,
        timeMultiplier: 1.45,
        requiredLevel: 10,
        requiredResearchId: 'mastery',
        requiredResearchLevel: 5,
        color: 'pink',
        gradient: 'from-pink-500 to-rose-600'
    }
];

// ============================================
// 연구 상태 인터페이스
// ============================================
export interface ResearchProgress {
    categoryId: ResearchCategory;
    currentLevel: number;
    isResearching: boolean;
    researchStartTime: number | null;
    researchEndTime: number | null;
}

export interface CommanderResearch {
    stats: Record<ResearchCategory, ResearchProgress>;
    totalResearchPoints: number;
}

// ============================================
// 유틸리티 함수
// ============================================

import { Card } from './types';

/**
 * 진행 중인 연구가 있는지 확인 및 반환
 */
export function getActiveResearch(research: CommanderResearch): ResearchProgress | null {
    if (!research || !research.stats) return null;
    for (const key in research.stats) {
        const progress = research.stats[key as ResearchCategory];
        if (progress.isResearching) return progress;
    }
    return null;
}

/**
 * 연구 선행 조건 확인
 */
export function checkResearchDependency(stat: ResearchStat, research: CommanderResearch): { met: boolean; message?: string } {
    if (!stat.requiredResearchId) return { met: true };

    const requiredProgress = research.stats[stat.requiredResearchId];
    if (!requiredProgress || requiredProgress.currentLevel < (stat.requiredResearchLevel || 1)) {
        const requiredStat = RESEARCH_STATS.find(s => s.id === stat.requiredResearchId);
        return {
            met: false,
            message: `${requiredStat?.name} Lv.${stat.requiredResearchLevel} 연구가 먼저 필요합니다.`
        };
    }

    return { met: true };
}

/**
 * 군단 카드 기반의 연구 시간 단축 버프 계산 (0 ~ 1 사이의 값)
 * 레전더리/유니크 카드 중 'reduction' 버프가 있는 카드를 찾습니다.
 */
/**
 * 연구 시간 단축 버프 계산 (0 ~ 1 사이의 값, 최대 70%)
 * 덱에 포함된 카드의 특수 능력, 업적, 아이템 등의 효과를 합산합니다.
 */
export function getResearchTimeBuff(deck: Card[]): number {
    let totalReduction = 0;

    // 1. 덱 카드 효과 (중첩 가능하도록 변경하거나, 최대값만 적용하거나 정책 결정 필요)
    // 여기서는 가장 높은 효과 하나만 적용하는 것으로 가정하다가, 특정 카드는 중첩 가능하게 할 수 있음
    let maxCardBuff = 0;

    for (const card of deck) {
        // 전설 등급 카드는 기본적으로 연구 효율이 높다고 가정
        if (card.rarity === 'legendary') {
            maxCardBuff = Math.max(maxCardBuff, 0.05); // 전설: 5%
        }

        // 연구 특화 카드 (이름이나 스킬 설명으로 판단)
        if (card.name && (card.name.includes('연구원') || card.name.includes('박사') || card.name.includes('Scientist'))) {
            maxCardBuff = Math.max(maxCardBuff, 0.10); // 연구원: 10%
        }

        // 특정 네임드 카드 (예시)
        if (card.name === 'GPT-4o' || card.name === 'Claude 3.5 Sonnet') {
            maxCardBuff = Math.max(maxCardBuff, 0.15); // 최신 AI: 15%
        }

        // 특수 스킬에 '연구'가 포함된 경우 (specialSkill이 객체인 경우 처리)
        if (card.specialSkill && typeof card.specialSkill === 'object') {
            if (card.specialSkill.description?.includes('연구') || card.specialSkill.name?.includes('연구')) {
                maxCardBuff = Math.max(maxCardBuff, 0.10);
            }
        }
        // specialSkill이 문자열일 경우 (호환성)
        else if (typeof card.specialSkill === 'string' && (card.specialSkill as string).includes('연구')) {
            maxCardBuff = Math.max(maxCardBuff, 0.10);
        }
    }

    totalReduction += maxCardBuff;

    // TODO: 2. 업적 보너스 추가 (매개변수로 받거나 store에서 조회)
    // TODO: 3. 아이템 효과 추가
    // TODO: 4. 구독 티어 보너스 추가

    // 최대 70% 제한
    return Math.min(totalReduction, 0.70);
}

/**
 * 연구 코인 비용 계산
 */
export function getResearchCost(stat: ResearchStat, targetLevel: number): number {
    return Math.floor(stat.baseCost * Math.pow(stat.costMultiplier, targetLevel - 1));
}

/**
 * 연구 토큰 비용 계산
 * Lv1: 0 토큰 (무료)
 * Lv2: 50 토큰
 * Lv3: 90 토큰 (50 * 1.8)
 * Lv4: 162 토큰 (50 * 1.8^2)
 * Lv5: 291 토큰 (50 * 1.8^3)
 * Lv6: 524 토큰 (50 * 1.8^4)
 * Lv7: 944 토큰 (50 * 1.8^5)
 * Lv8: 1,699 토큰 (50 * 1.8^6)
 * Lv9: 3,058 토큰 (50 * 1.8^7)
 */
export function getResearchTokenCost(targetLevel: number): number {
    if (targetLevel <= 1) return 0;
    return Math.floor(50 * Math.pow(1.8, targetLevel - 2));
}

/**
 * 연구 시간 계산 (분)
 * 고정된 시간 값 사용: Lv1=30분, Lv2=60분, Lv3=120분, Lv4=240분, Lv5=480분, Lv6=960분, Lv7=1920분, Lv8=3840분, Lv9=7680분
 */
export function getResearchTime(stat: ResearchStat, targetLevel: number): number {
    const FIXED_TIMES: Record<number, number> = {
        1: 30,      // 30분
        2: 60,      // 1시간
        3: 120,     // 2시간
        4: 240,     // 4시간
        5: 480,     // 8시간
        6: 960,     // 16시간
        7: 1920,    // 32시간
        8: 3840,    // 64시간
        9: 7680     // 128시간
    };

    let baseTime = FIXED_TIMES[targetLevel] || 30;

    // 효율성(Efficiency) 연구에 따른 시간 단축 적용 (추가)
    try {
        const { gameStorage } = require('./game-storage');
        const state = gameStorage.getGameState();
        if (state.research?.stats?.efficiency) {
            const level = state.research.stats.efficiency.currentLevel;
            const reduction = getResearchBonus('efficiency', level) / 100;
            baseTime = baseTime * (1 - reduction);
        }
    } catch (e) {
        // Fallback or SSR
    }

    return baseTime;
}

/**
 * 특정 카테고리의 현재 보너스 반환
 */
export function getResearchBonus(categoryId: ResearchCategory, currentLevel: number): number {
    if (currentLevel === 0) return 0;
    const stat = RESEARCH_STATS.find(s => s.id === categoryId);
    if (!stat) return 0;
    const effect = stat.effects[currentLevel - 1];
    return effect?.bonus || 0;
}

/**
 * 초기 연구 상태 생성
 */
export function createInitialResearchState(): CommanderResearch {
    const stats: Record<ResearchCategory, ResearchProgress> = {} as any;
    for (const stat of RESEARCH_STATS) {
        stats[stat.id] = {
            categoryId: stat.id,
            currentLevel: 1,  // 초기 레벨 1로 시작
            isResearching: false,
            researchStartTime: null,
            researchEndTime: null,
        };
    }
    return {
        stats,
        totalResearchPoints: 6  // 초기 6개 연구 모두 Lv1
    };
}

/**
 * 연구 가능한 카테고리 목록 반환 (군단장 레벨 기반)
 */
export function getAvailableResearch(commanderLevel: number): ResearchStat[] {
    return RESEARCH_STATS.filter(stat => stat.requiredLevel <= commanderLevel);
}

/**
 * 진행 중인 연구 남은 시간 (초)
 */
export function getRemainingResearchTime(progress: ResearchProgress): number {
    if (!progress.isResearching || !progress.researchEndTime) return 0;
    const remaining = progress.researchEndTime - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
}

/**
 * 연구 완료 여부 확인
 */
export function isResearchComplete(progress: ResearchProgress): boolean {
    if (!progress.isResearching || !progress.researchEndTime) return false;
    return Date.now() >= progress.researchEndTime;
}
