/**
 * 유저 프로필 관련 유틸리티 함수
 */

import { doc, getDoc, updateDoc, collection, addDoc, query, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from './firebase-db';
import { InventoryCard } from './inventory-system';

/**
 * 유저의 주력 덱 가져오기
 */
export async function getUserMainDeck(userId: string): Promise<InventoryCard[]> {
    if (!db) return [];

    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) return [];

        const data = userDoc.data();
        return data.mainDeck || [];
    } catch (error) {
        console.error('Failed to get user main deck:', error);
        return [];
    }
}

/**
 * 유저의 주력 덱 저장하기
 */
export async function saveUserMainDeck(userId: string, cards: InventoryCard[]): Promise<void> {
    if (!db) return;

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            mainDeck: cards,
            mainDeckUpdatedAt: Date.now()
        });
        console.log('✅ Main deck saved for user:', userId);
    } catch (error) {
        console.error('❌ Failed to save user main deck:', error);
    }
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

export async function saveBattleHistory(
    userId: string,
    battleData: Omit<BattleHistory, 'battleId' | 'timestamp'>
): Promise<void> {
    if (!db) return;

    try {
        const historyRef = collection(db, 'users', userId, 'battleHistory');
        await addDoc(historyRef, {
            ...battleData,
            timestamp: Date.now()
        });
        console.log('✅ Battle history saved for user:', userId);
    } catch (error) {
        console.error('❌ Failed to save battle history:', error);
    }
}

export async function getUserBattleHistory(userId: string, limitCount = 10): Promise<BattleHistory[]> {
    if (!db) return [];

    try {
        const historyRef = collection(db, 'users', userId, 'battleHistory');
        const q = query(historyRef, orderBy('timestamp', 'desc'), firestoreLimit(limitCount));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            battleId: doc.id,
            ...doc.data()
        } as BattleHistory));
    } catch (error) {
        console.error('❌ Failed to get user battle history:', error);
        return [];
    }
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
