/**
 * 일일 로그인 보상 시스템
 * Firestore collection: userRewards / doc: {uid}
 *
 * Fields:
 * - lastLoginDate: string (YYYY-MM-DD)
 * - currentStreak: number
 * - totalLogins: number
 * - rewards: { day: number, coins: number, claimedAt: timestamp }[]
 * - lastClaimedAt: timestamp
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// ─── 보상 테이블 ───
export interface DailyRewardTier {
    day: number;
    coins: number;
    label: string;
    special?: boolean; // 특별 보상 여부
    icon: string;
}

export const DAILY_REWARD_TABLE: DailyRewardTier[] = [
    { day: 1, coins: 10, label: '첫 출석', icon: '🪙' },
    { day: 2, coins: 15, label: '2일차', icon: '🪙' },
    { day: 3, coins: 30, label: '3일 연속!', icon: '💰', special: true },
    { day: 4, coins: 20, label: '4일차', icon: '🪙' },
    { day: 5, coins: 25, label: '5일차', icon: '💰' },
    { day: 6, coins: 35, label: '6일차', icon: '💰' },
    { day: 7, coins: 100, label: '7일 완주!', icon: '🏆', special: true },
    { day: 8, coins: 15, label: '8일차', icon: '🪙' },
    { day: 9, coins: 20, label: '9일차', icon: '🪙' },
    { day: 10, coins: 40, label: '10일 연속!', icon: '💰', special: true },
    { day: 11, coins: 20, label: '11일차', icon: '🪙' },
    { day: 12, coins: 25, label: '12일차', icon: '🪙' },
    { day: 13, coins: 30, label: '13일차', icon: '💰' },
    { day: 14, coins: 150, label: '14일 완주!', icon: '👑', special: true },
];

// 14일 이후에는 사이클 반복
export function getRewardForDay(streak: number): DailyRewardTier {
    const index = ((streak - 1) % DAILY_REWARD_TABLE.length);
    return DAILY_REWARD_TABLE[index];
}

// ─── Firestore 데이터 타입 ───
export interface UserRewardData {
    lastLoginDate: string; // YYYY-MM-DD
    currentStreak: number;
    totalLogins: number;
    rewards: { day: number; coins: number; claimedAt: any }[];
    lastClaimedAt: any;
}

// ─── 날짜 유틸 (한국 시간 기준, 오전 6시 리셋) ───
function getGameDate(): string {
    const now = new Date();
    // 한국 시간 (UTC+9)
    const kstOffset = 9 * 60;
    const localOffset = now.getTimezoneOffset();
    const kstTime = new Date(now.getTime() + (kstOffset + localOffset) * 60 * 1000);

    // 오전 6시 이전이면 전날로 처리
    if (kstTime.getHours() < 6) {
        kstTime.setDate(kstTime.getDate() - 1);
    }

    return kstTime.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getYesterday(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

// ─── Firestore 연동 ───

/** 유저 보상 데이터 로드 */
export async function loadUserRewards(uid: string): Promise<UserRewardData | null> {
    if (!isFirebaseConfigured || !db) return null;
    try {
        const ref = doc(db, 'userRewards', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return snap.data() as UserRewardData;
        }
        return null;
    } catch (error) {
        console.error('[DailyReward] 로드 실패:', error);
        return null;
    }
}

/** 유저 보상 데이터 저장 */
export async function saveUserRewards(uid: string, data: Partial<UserRewardData>): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
        const ref = doc(db, 'userRewards', uid);
        await setDoc(ref, {
            ...data,
            lastClaimedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error('[DailyReward] 저장 실패:', error);
    }
}

// ─── 핵심 로직 ───

export interface DailyRewardCheckResult {
    canClaim: boolean;
    reward: DailyRewardTier | null;
    currentStreak: number;
    totalLogins: number;
    isNewUser: boolean;
}

/**
 * 오늘 보상을 수령할 수 있는지 확인
 */
export async function checkDailyReward(uid: string): Promise<DailyRewardCheckResult> {
    const today = getGameDate();
    const existing = await loadUserRewards(uid);

    // 신규 유저
    if (!existing) {
        return {
            canClaim: true,
            reward: getRewardForDay(1),
            currentStreak: 1,
            totalLogins: 0,
            isNewUser: true,
        };
    }

    // 이미 오늘 수령함
    if (existing.lastLoginDate === today) {
        return {
            canClaim: false,
            reward: null,
            currentStreak: existing.currentStreak,
            totalLogins: existing.totalLogins,
            isNewUser: false,
        };
    }

    // 연속 출석 체크
    const yesterday = getYesterday(today);
    const isConsecutive = existing.lastLoginDate === yesterday;
    const newStreak = isConsecutive ? existing.currentStreak + 1 : 1;

    return {
        canClaim: true,
        reward: getRewardForDay(newStreak),
        currentStreak: newStreak,
        totalLogins: existing.totalLogins,
        isNewUser: false,
    };
}

/**
 * 일일 보상 수령 처리
 */
export async function claimDailyReward(uid: string): Promise<{
    success: boolean;
    reward: DailyRewardTier;
    newStreak: number;
    totalLogins: number;
}> {
    const check = await checkDailyReward(uid);

    if (!check.canClaim || !check.reward) {
        throw new Error('오늘 이미 보상을 수령했습니다.');
    }

    const today = getGameDate();
    const existing = await loadUserRewards(uid);

    const newTotalLogins = (existing?.totalLogins || 0) + 1;
    const newRewards = [
        ...(existing?.rewards || []).slice(-30), // 최근 30일분만 보관
        { day: check.currentStreak, coins: check.reward.coins, claimedAt: new Date().toISOString() },
    ];

    await saveUserRewards(uid, {
        lastLoginDate: today,
        currentStreak: check.currentStreak,
        totalLogins: newTotalLogins,
        rewards: newRewards,
    });

    // 알림 트리거 (일일 보상 수령 완료)
    import('@/lib/notification-service').then(({ notifyDailyReward }) => notifyDailyReward(uid)).catch(() => {});

    return {
        success: true,
        reward: check.reward,
        newStreak: check.currentStreak,
        totalLogins: newTotalLogins,
    };
}
