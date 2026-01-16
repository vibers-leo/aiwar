/**
 * 토큰 시스템 유틸리티
 * 
 * NOTE: 자동 충전 로직은 firebase-db.ts의 checkAndRechargeTokens()에서 처리됩니다.
 * 이 파일은 충전 파라미터 계산 및 초기화 유틸리티만 제공합니다.
 */

import { CATEGORY_TOKEN_BONUS, FACTION_CATEGORY_MAP, TIER_MULTIPLIER } from './token-constants';
import { SubscriptionTier } from './faction-subscription';

// 기본 설정 (firebase-db.ts와 동기화)
export const BASE_RECHARGE_RATE = 100; // Tokens per cycle (기본 100, firebase-db.ts와 동일)
export const BASE_RECHARGE_INTERVAL_MIN = 60; // Minutes per cycle (기본 60분, firebase-db.ts와 동일)
export const BASE_MAX_TOKENS = 1000;

interface RechargeParams {
    rateAmount: number;     // Tokens per interval
    intervalMin: number;    // Minutes per interval
    maxCap: number;         // Max Token Capacity
}

interface SubscriptionInput {
    factionId: string;
    tier: string; // Accept any tier string (basic, pro, ultra, free)
}

/**
 * 활성화된 구독을 기반으로 토큰 충전 파라미터 계산
 * @param subscriptions 활성 구독 목록
 * @param level 유저 레벨 (최대 토큰 한도에 영향)
 * @returns 충전 파라미터 (충전량, 충전 간격, 최대 용량)
 */
export function calculateRechargeParams(subscriptions: SubscriptionInput[], level: number = 1): RechargeParams {
    let rateAmount = BASE_RECHARGE_RATE;
    let intervalMin = BASE_RECHARGE_INTERVAL_MIN;

    // Max Cap Formula: Base + (Level * 100)
    let maxCap = BASE_MAX_TOKENS + ((level - 1) * 100);

    subscriptions.forEach(sub => {
        const category = FACTION_CATEGORY_MAP[sub.factionId];
        if (!category) return;

        const bonusConfig = CATEGORY_TOKEN_BONUS[category];
        if (!bonusConfig) return;

        const multiplier = TIER_MULTIPLIER[sub.tier as SubscriptionTier] || 1;

        // Apply Bonuses by Category
        if (bonusConfig.type === 'recharge_amount') {
            // AUDIO: Recharge Amount Increase
            rateAmount += ((bonusConfig.baseValue || 0) * multiplier);
        } else if (bonusConfig.type === 'recharge_speed') {
            // IMAGE: Recharge Speed (reduce interval, min 10 min)
            intervalMin = Math.max(10, intervalMin - ((bonusConfig.baseValue || 0) * multiplier));
        } else if (bonusConfig.type === 'max_capacity') {
            // TEXT: Max Capacity Increase
            maxCap += ((bonusConfig.baseValue || 0) * multiplier);
        }
    });

    return { rateAmount, intervalMin, maxCap };
}

/**
 * 토큰 타임스탬프 초기화 (최초 접속 시 등)
 * @param userId Firebase User ID
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

/**
 * 사용자의 최대 토큰 한도 계산 (UI 표시용)
 * @param level 유저 레벨
 * @param subscriptions 활성 구독 목록
 */
export function getMaxTokenCapacity(level: number, subscriptions: SubscriptionInput[] = []): number {
    const { maxCap } = calculateRechargeParams(subscriptions, level);
    return maxCap;
}

/**
 * 다음 충전까지 남은 시간 계산 (초 단위)
 * @param lastTokenUpdate 마지막 충전 시간
 * @param subscriptions 활성 구독 목록
 */
export function getSecondsUntilNextRecharge(
    lastTokenUpdate: Date | null,
    subscriptions: SubscriptionInput[] = []
): number {
    if (!lastTokenUpdate) return 0;

    const { intervalMin } = calculateRechargeParams(subscriptions);
    const now = new Date();
    const nextRecharge = new Date(lastTokenUpdate.getTime() + (intervalMin * 60 * 1000));
    const diffMs = nextRecharge.getTime() - now.getTime();

    return Math.max(0, Math.floor(diffMs / 1000));
}
