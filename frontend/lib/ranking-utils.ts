// 랭킹 시스템 유틸리티

import { RankingEntry, Season, SeasonReward } from './ranking-types';
import { getPvPStats } from './pvp-utils';

/**
 * 현재 시즌 정보 가져오기
 */
export function getCurrentSeason(): Season {
    const now = Date.now();
    const seasonStart = new Date('2026-01-01').getTime();
    const seasonEnd = new Date('2026-01-31').getTime();

    return {
        id: 'season-1',
        name: 'AI WAR : 전쟁의 서막 (시즌1)',
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
 * 초기 랭킹 데이터 생성 (실제 유저만 포함)
 * 더 이상 더미 AI 플레이어를 생성하지 않음
 */
export function initializeRankings(playerRating: number): RankingEntry[] {
    const rankings: RankingEntry[] = [];

    // 플레이어만 추가 (더미 데이터 제거)
    rankings.push({
        rank: 1,
        playerId: 'player',
        playerName: '나',
        level: Math.max(1, Math.floor(playerRating / 100)),
        rating: playerRating,
        wins: 0,
        losses: 0,
        winRate: 0,
        highestRating: playerRating
    });

    return rankings;
}

// 랭킹 정렬 헬퍼
function sortAndRank(entries: RankingEntry[]): RankingEntry[] {
    // 레이팅 내림차순 정렬
    const sorted = [...entries].sort((a, b) => b.rating - a.rating);

    // 순위 부여
    return sorted.map((entry, index) => ({
        ...entry,
        rank: index + 1
    }));
}

/**
 * 랭킹 데이터 저장
 */
export function saveRankings(rankings: RankingEntry[]): void {
    localStorage.setItem('rankings', JSON.stringify(rankings));
}

/**
 * 랭킹 데이터 로드
 * 기존 더미 데이터가 있다면 필터링하여 실제 유저만 남김
 */
export function loadRankings(): RankingEntry[] {
    const data = localStorage.getItem('rankings');
    if (data) {
        let rankings = JSON.parse(data) as RankingEntry[];

        // 더미 AI 플레이어 필터링 (playerId가 'ai-'로 시작하거나 '플레이어 1XXX' 패턴)
        const hasOldDummy = rankings.some(r => r.playerId.startsWith('ai-') || /플레이어 \d+/.test(r.playerName));

        if (hasOldDummy) {
            // 오래된 더미 데이터 발견 - 실제 플레이어만 남기고 재설정
            rankings = rankings.filter(r => r.playerId === 'player');

            // 플레이어도 없으면 새로 생성
            if (rankings.length === 0) {
                const stats = getPvPStats();
                rankings = initializeRankings(stats.currentRating);
            }

            // 업데이트된 랭킹 저장
            saveRankings(rankings);
        }

        return rankings;
    }

    // 초기 데이터 생성
    const stats = getPvPStats();
    const rankings = initializeRankings(stats.currentRating);
    saveRankings(rankings);
    return rankings;
}

/**
 * 플레이어 레이팅 업데이트 시 랭킹 테이블 갱신
 * (다른 AI들도 시뮬레이션하여 순위 변동 생동감 부여)
 */
export function updatePlayerRanking(newRating: number, win: boolean): void {
    let rankings = loadRankings();

    // 1. 플레이어 업데이트
    const playerIndex = rankings.findIndex(r => r.playerId === 'player');
    if (playerIndex !== -1) {
        rankings[playerIndex].rating = newRating;
        rankings[playerIndex].highestRating = Math.max(rankings[playerIndex].highestRating, newRating);
        if (win) rankings[playerIndex].wins += 1;
        else rankings[playerIndex].losses += 1;

        const total = rankings[playerIndex].wins + rankings[playerIndex].losses;
        rankings[playerIndex].winRate = total > 0 ? Math.round((rankings[playerIndex].wins / total) * 100) : 0;
    }

    // 2. 다른 AI들 시뮬레이션 (일부만 레이팅 변동)
    rankings = rankings.map(r => {
        if (r.playerId === 'player') return r;

        // 30% 확률로 레이팅 변동
        if (Math.random() < 0.3) {
            const change = Math.floor(Math.random() * 30) - 15; // -15 ~ +15
            const newR = Math.max(0, r.rating + change);
            return { ...r, rating: newR };
        }
        return r;
    });

    // 3. 재정렬 및 저장
    const newRankings = sortAndRank(rankings);
    saveRankings(newRankings);
}

/**
 * 내 순위 찾기
 */
export function findMyRank(rankings: RankingEntry[]): RankingEntry | null {
    return rankings.find(entry => entry.playerId === 'player') || null;
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
 */
export function getRankTier(rating: number): {
    tier: string;
    color: string;
    icon: string;
} {
    if (rating >= 2000) {
        return { tier: '그랜드 마스터', color: 'text-yellow-400', icon: '🏆' };
    } else if (rating >= 1800) {
        return { tier: '마스터', color: 'text-purple-400', icon: '💎' };
    } else if (rating >= 1600) {
        return { tier: '다이아몬드', color: 'text-blue-400', icon: '⭐' };
    } else if (rating >= 1400) {
        return { tier: '플래티넘', color: 'text-cyan-400', icon: '🔷' };
    } else if (rating >= 1200) {
        return { tier: '골드', color: 'text-yellow-600', icon: '🔶' };
    } else if (rating >= 1000) {
        return { tier: '실버', color: 'text-gray-400', icon: '⚪' };
    } else {
        return { tier: '브론즈', color: 'text-orange-600', icon: '🟤' };
    }
}

/**
 * 다음 티어까지 필요한 레이팅
 */
export function getRatingToNextTier(currentRating: number): number {
    const tiers = [1000, 1200, 1400, 1600, 1800, 2000];

    for (const tier of tiers) {
        if (currentRating < tier) {
            return tier - currentRating;
        }
    }

    return 0; // 이미 최고 티어
}
