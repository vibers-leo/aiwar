// 랭킹 시스템 유틸리티
// 순수 유틸리티 함수만 유지 (Mock 데이터/로컬 스토리지 로직 삭제)

import { Season, SeasonReward } from './ranking-types';

/**
 * 현재 시즌 정보 가져오기
 */
export function getCurrentSeason(): Season {
    const now = Date.now();
    const seasonStart = new Date('2026-01-01').getTime();
    const seasonEnd = new Date('2026-01-31').getTime();

    return {
        id: 'season-1',
        name: 'AGI WAR : 전쟁의 서막 (시즌1)',
        startDate: seasonStart,
        endDate: seasonEnd,
        status: now < seasonStart ? 'upcoming' : now > seasonEnd ? 'ended' : 'active',
        rewards: [
            {
                rankRange: [1, 1],
                coins: 10000,
                cards: 10,
                title: '🏆 그랜드 마스터'
            },
            {
                rankRange: [2, 3],
                coins: 7000,
                cards: 7,
                title: '💎 마스터'
            },
            {
                rankRange: [4, 10],
                coins: 5000,
                cards: 5,
                title: '⭐ 다이아몬드'
            },
            {
                rankRange: [11, 50],
                coins: 3000,
                cards: 3,
                title: '🔷 플래티넘'
            },
            {
                rankRange: [51, 100],
                coins: 2000,
                cards: 2,
                title: '🔶 골드'
            }
        ]
    };
}


/**
 * 순위별 보상 찾기
 */
export function getRewardForRank(rank: number, season: Season): SeasonReward | null {
    for (const reward of season.rewards) {
        if (rank >= reward.rankRange[0] && rank <= reward.rankRange[1]) {
            return reward;
        }
    }
    return null;
}

/**
 * 랭킹 티어 계산
 * Default Start: 1000 -> Bronze
 */
export function getRankTier(rating: number): {
    tier: string;
    color: string;
    icon: string;
} {
    if (rating >= 2100) {
        return { tier: '그랜드 마스터', color: 'text-yellow-400', icon: '🏆' };
    } else if (rating >= 1900) {
        return { tier: '마스터', color: 'text-purple-400', icon: '💎' };
    } else if (rating >= 1700) {
        return { tier: '다이아몬드', color: 'text-blue-400', icon: '⭐' };
    } else if (rating >= 1500) {
        return { tier: '플래티넘', color: 'text-cyan-400', icon: '🔷' };
    } else if (rating >= 1300) {
        return { tier: '골드', color: 'text-yellow-600', icon: '🔶' };
    } else if (rating >= 1100) {
        return { tier: '실버', color: 'text-gray-400', icon: '⚪' };
    } else {
        return { tier: '브론즈', color: 'text-orange-600', icon: '🟤' };
    }
}

/**
 * 다음 티어까지 필요한 레이팅
 */
export function getRatingToNextTier(currentRating: number): number {
    const tiers = [1100, 1300, 1500, 1700, 1900, 2100];

    for (const tier of tiers) {
        if (currentRating < tier) {
            return tier - currentRating;
        }
    }

    return 0; // 이미 최고 티어
}
