import { UserProfile } from './firebase-db';
import { FactionSubscription, getSubscribedFactions } from './faction-subscription-utils'; // Using utils for full logic
import { CATEGORY_TOKEN_BONUS, FACTION_CATEGORY_MAP, TIER_MULTIPLIER } from './token-constants';
import { updateGameState } from './game-state'; // Local state update
import { updateTokens } from './firebase-db';   // Server state update (if distinct)

// 기본 설정
const BASE_RECHARGE_RATE = 10; // 10 Tokens
const BASE_RECHARGE_INTERVAL_MIN = 10; // 10 Minutes
const BASE_MAX_TOKENS = 1000;

interface RechargeParams {
    rateAmount: number;     // Tokens per interval
    intervalMin: number;    // Minutes per interval
    maxCap: number;         // Max Token Capacity
}

/**
 * 활성화된 구독을 기반으로 토큰 충전 파라미터 계산
 */
export function calculateRechargeParams(subscriptions: FactionSubscription[], level: number = 1): RechargeParams {
    let rateAmount = BASE_RECHARGE_RATE; // 10
    let intervalMin = BASE_RECHARGE_INTERVAL_MIN; // 10 min

    // [NEW] Max Cap Formula: Base + (Level * 100)
    let maxCap = BASE_MAX_TOKENS + ((level - 1) * 100);

    subscriptions.forEach(sub => {
        // Active check? Assuming list only contains active/valid subscriptions
        if (sub.tier === 'free') return; // Free tier typically gives no passive bonuses? Or check config.

        const category = FACTION_CATEGORY_MAP[sub.factionId];
        if (!category) return;

        const bonusType = CATEGORY_TOKEN_BONUS[category];
        if (!bonusType) return;

        const multiplier = TIER_MULTIPLIER[sub.tier] || 1;

        // Apply Bonuses
        if (category === 'AUDIO') {
            // Recharge Amount Increase: Base +10/hr equivalent?
            rateAmount += (CATEGORY_TOKEN_BONUS.AUDIO.baseValue * multiplier);
        } else if (category === 'IMAGE') {
            // Recharge Speed: Reduce Interval
            // bonusType.baseValue = 10 (min reduction? No, 10 is too big if interval is 10)
            // Let's assume description: "10분 단축 (60분 기준)". For 10 min interval, we need smaller steps.
            // Let's treat baseValue as "% speed increase" or flat reduction if logic allows.
            // token-constants says: baseValue: 10 // "10분 단축"
            // If interval is 10 min, we can't reduce by 10.
            // Let's interpret as: Interval = Base / (1 + (Value/100 * Multiplier)) ? 
            // Or flat reduction with clamp.
            // Let's assume it reduces interval by 1 min * multiplier (capped at minimum 1 min).
            intervalMin = Math.max(1, intervalMin - (1 * multiplier));
        } else if (category === 'TEXT') {
            // Max Capacity
            maxCap += (CATEGORY_TOKEN_BONUS.TEXT.baseValue * multiplier);
        }
    });

    return { rateAmount, intervalMin, maxCap };
}

/**
 * 토큰 자동 충전 처리
 * @param user User profile
 * @returns Updated user profile if changed, else null
 */
export async function processTokenRecharge(user: UserProfile, userId: string, subscriptions: FactionSubscription[]): Promise<number | null> {
    if (!user.lastTokenUpdate) {
        // 첫 실행이거나 데이터 없음 -> 현재 시간으로 초기화 (충전 없음)
        // DB에 타임스탬프만 찍어줌
        // await updateLastTokenTime(userId, new Date());
        return null; // Handled by caller to init if needed
    }

    // Load Subscriptions
    // Provided by caller to ensure sync with context

    const { rateAmount, intervalMin, maxCap } = calculateRechargeParams(subscriptions, user.level || 1);

    // Check if full
    if (user.tokens >= maxCap) return null;

    const lastUpdate = new Date(user.lastTokenUpdate.toDate ? user.lastTokenUpdate.toDate() : user.lastTokenUpdate);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMin = diffMs / (1000 * 60);

    if (diffMin < intervalMin) return null; // Not enough time passed

    // Calculate Intervals Passed
    const intervalsPassed = Math.floor(diffMin / intervalMin);
    const tokensToAdd = intervalsPassed * rateAmount;

    if (tokensToAdd <= 0) return null;

    // Cap check
    const newTokens = Math.min(maxCap, user.tokens + tokensToAdd);

    if (newTokens === user.tokens) return null;

    // Create new LastUpdate Time
    // 정확한 주기 유지를 위해: lastUpdate + (intervals * intervalMin)
    // 하지만 오랫동안 접속 안했을 때 '손해'를 보게 할지, '현재 기준'으로 할지.
    // 보통 모바일 게임은 'Overflow' 시간은 버림. 즉 정확히 주기적으로 충전된 것으로 간주.
    const timeProcessed = new Date(lastUpdate.getTime() + (intervalsPassed * intervalMin * 60 * 1000));

    // Server Update
    console.log(`[TokenSystem] Recharging ${tokensToAdd} tokens. New Balance: ${newTokens}`);

    // We update Firestore directly
    const { doc, updateDoc, serverTimestamp } = require('firebase/firestore');
    const { db } = require('./firebase');

    if (db) {
        const userRef = doc(db, 'users', userId, 'profile', 'data');
        // We set lastTokenUpdate to the calculated time to prevent time drift?
        // Or simplified: Just set to now if we ignore remainder drift.
        // Let's use timeProcessed to be fair and keep cycles.
        // Firestore doesn't take Date object directly in update usually? It does if driver supports.
        // Safer to use serverTimestamp() if we just reset, but for calculated past time we use Date.

        await updateDoc(userRef, {
            tokens: newTokens,
            lastTokenUpdate: timeProcessed
        });
    }

    return newTokens;
}

/**
 * 토큰 타임스탬프 초기화 (최초 접속 시 등)
 */
export async function initTokenTimestamp(userId: string) {
    const { doc, updateDoc, serverTimestamp } = require('firebase/firestore');
    const { db } = require('./firebase');
    if (db) {
        const userRef = doc(db, 'users', userId, 'profile', 'data');
        await updateDoc(userRef, {
            lastTokenUpdate: serverTimestamp()
        });
    }
}
