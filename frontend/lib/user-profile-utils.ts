/**
 * 유저 프로필 관련 유틸리티 함수
 */

import { UserProfile } from './firebase-db';
import { InventoryCard } from './inventory-system';

/**
 * 유저의 주력 덱 가져오기
 */
export async function getUserMainDeck(userId: string): Promise<InventoryCard[]> {
    // TODO: Firebase에서 저장된 주력 덱 가져오기
    // 현재는 빈 배열 반환
    return [];
}

/**
 * 유저의 주력 덱 저장하기
 */
export async function saveUserMainDeck(userId: string, cards: InventoryCard[]): Promise<void> {
    // TODO: Firebase에 주력 덱 저장
    console.log('Saving main deck for user:', userId, cards);
}

/**
 * 유저의 최근 전투 기록 가져오기
 */
export interface BattleHistory {
    battleId: string;
    opponentId: string;
    opponentName: string;
    opponentAvatar?: string;
    result: 'win' | 'loss' | 'draw';
    ratingChange: number;
    battleMode: string;
    timestamp: number;
}

export async function getUserBattleHistory(userId: string, limit = 10): Promise<BattleHistory[]> {
    // TODO: Firebase에서 전투 기록 가져오기
    // 현재는 빈 배열 반환
    return [];
}

/**
 * 티어 뱃지 색상 가져오기
 */
export function getTierColor(rating: number): string {
    if (rating >= 2000) return 'from-yellow-400 to-amber-500';
    if (rating >= 1800) return 'from-purple-400 to-pink-500';
    if (rating >= 1600) return 'from-blue-400 to-cyan-500';
    if (rating >= 1400) return 'from-cyan-400 to-teal-500';
    if (rating >= 1200) return 'from-yellow-600 to-orange-500';
    if (rating >= 1000) return 'from-gray-400 to-gray-500';
    return 'from-orange-600 to-red-600';
}

/**
 * 승률 색상 가져오기
 */
export function getWinRateColor(winRate: number): string {
    if (winRate >= 70) return 'text-green-400';
    if (winRate >= 60) return 'text-cyan-400';
    if (winRate >= 50) return 'text-amber-400';
    if (winRate >= 40) return 'text-orange-400';
    return 'text-red-400';
}

/**
 * 상대 시간 포맷 (예: "2시간 전")
 */
export function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
}
