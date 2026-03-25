
import { Card as CardType, Rarity } from './types';
import { GameState, StudioApplication } from './game-storage';
import { getGameState } from './game-state';

export type { StudioApplication };

/**
 * 등급별 유니크 생성 비용 계산 (10배 인상)
 */
export function getStudioCost(rarity: Rarity): { coins: number; tokens: number } {
    const costTable: Record<Rarity, { coins: number; tokens: number }> = {
        'common': { coins: 10000, tokens: 500 },      // 10배
        'rare': { coins: 20000, tokens: 1000 },       // 10배
        'epic': { coins: 35000, tokens: 2000 },       // 10배
        'legendary': { coins: 50000, tokens: 3500 },  // 10배
        'mythic': { coins: 100000, tokens: 5000 },
        'commander': { coins: 150000, tokens: 7500 },
    };

    return costTable[rarity] || costTable['common'];
}

/**
 * 등급별 스탯 보너스 배율
 */
export function getUniqueStatBonus(rarity: Rarity): number {
    const bonusTable: Record<Rarity, number> = {
        'common': 1.15,      // +15%
        'rare': 1.20,        // +20%
        'epic': 1.25,        // +25%
        'legendary': 1.30,   // +30%
        'mythic': 1.35,      // +35%
        'commander': 1.40,   // +40%
    };

    return bonusTable[rarity] || 1.15;
}

/**
 * 유니크 생성 대기 시간 (72시간 = 3일)
 */
export const UNIQUE_CREATION_TIME_MS = 72 * 60 * 60 * 1000; // 72시간

/**
 * 필요한 재료 카드 수
 */
export const REQUIRED_MATERIAL_COUNT = 5;

/**
 * 유니크 생성 가능 여부 확인
 */
export function canApplyForStudio(baseCard: CardType): boolean {
    return true; // 모든 카드 허용
}

/**
 * 재료 카드 유효성 검증
 */
export function validateMaterialCards(
    baseCard: CardType,
    materialCards: CardType[]
): {
    isValid: boolean;
    message?: string;
} {
    // 재료 카드 수 체크
    if (materialCards.length !== REQUIRED_MATERIAL_COUNT) {
        return {
            isValid: false,
            message: `재료 카드 ${REQUIRED_MATERIAL_COUNT}장이 필요합니다. (현재: ${materialCards.length}장)`
        };
    }

    const baseRarity = baseCard.rarity || 'common';

    // 모든 재료 카드가 같은 등급인지 체크
    for (const material of materialCards) {
        if (material.rarity !== baseRarity) {
            return {
                isValid: false,
                message: `재료 카드는 모두 ${baseRarity} 등급이어야 합니다.`
            };
        }

        // 레벨 1만 허용
        if ((material.level || 1) !== 1) {
            return {
                isValid: false,
                message: `재료 카드는 레벨 1만 사용 가능합니다. (${material.name}: Lv.${material.level})`
            };
        }

        // 베이스 카드와 같은 카드는 재료로 사용 불가
        if (material.instanceId === baseCard.instanceId) {
            return {
                isValid: false,
                message: '베이스 카드를 재료로 사용할 수 없습니다.'
            };
        }
    }

    return { isValid: true };
}

/**
 * 유니크 생성 신청 제출
 */
export async function submitStudioApplication(
    name: string,
    description: string,
    imageUrl: string,
    baseCard: CardType,
    materialCards: CardType[]
): Promise<{ success: boolean; message: string; applicationId?: string }> {

    // 재료 카드 검증
    const validation = validateMaterialCards(baseCard, materialCards);
    if (!validation.isValid) {
        return { success: false, message: validation.message || '재료 카드가 유효하지 않습니다.' };
    }

    const rarity = baseCard.rarity || 'common';
    const { coins: costCoins, tokens: costTokens } = getStudioCost(rarity);
    const state = getGameState();

    if (state.coins < costCoins || state.tokens < costTokens) {
        return { success: false, message: `재화 부족 (필요: ${costCoins.toLocaleString()} 코인, ${costTokens.toLocaleString()} 토큰)` };
    }

    // 재화 소모
    const { gameStorage } = await import('@/lib/game-storage');
    await gameStorage.addCoins(-costCoins);
    await gameStorage.addTokens(-costTokens);

    // 베이스 카드를 '잠금' 처리
    const { updateInventoryCard, removeCardFromInventory } = await import('@/lib/inventory-system');
    await updateInventoryCard(baseCard.instanceId, { isLocked: true });

    // 재료 카드 소모 (인벤토리에서 제거)
    for (const material of materialCards) {
        await removeCardFromInventory(material.instanceId);
    }

    let firestoreId = `unique-app-${Date.now()}`;

    // Firebase 연동: 신청서 저장
    try {
        const { createUniqueRequest } = await import('@/lib/firebase-db');
        const { loadUserProfile } = await import('@/lib/firebase-db');
        const profile = await loadUserProfile();

        firestoreId = await createUniqueRequest({
            name,
            description,
            imageUrl,
            userNickname: profile?.nickname || 'Unknown Commander',
            baseRarity: rarity
        } as any);
    } catch (error) {
        console.error('Failed to save unique request to Firebase:', error);
    }

    const now = Date.now();
    const completionTime = now + UNIQUE_CREATION_TIME_MS;

    const newApp: StudioApplication = {
        id: firestoreId,
        name,
        description,
        imageUrl,
        baseCardId: baseCard.instanceId,
        status: 'pending',
        createdAt: now,
        completedAt: completionTime // 72시간 후
    };

    // 저장
    const newState = await gameStorage.loadGameState();
    const apps = newState.studioApplications || newState.uniqueApplications || [];
    await gameStorage.saveGameState({
        studioApplications: [...apps, newApp],
        uniqueApplications: [] // Clear old property
    });

    return {
        success: true,
        message: `유니크 생성 신청이 완료되었습니다! 72시간 후에 완성됩니다.`,
        applicationId: newApp.id
    };
}

/**
 * 내 신청 내역 조회
 */
export async function getMyApplications(): Promise<StudioApplication[]> {
    const { gameStorage } = await import('@/lib/game-storage');
    const state = await gameStorage.loadGameState();
    return state.studioApplications || state.uniqueApplications || [];
}

/**
 * 남은 시간 계산
 */
export function getRemainingTime(completedAt?: number): {
    isComplete: boolean;
    remainingMs: number;
    remainingText: string;
} {
    if (!completedAt) {
        return {
            isComplete: false,
            remainingMs: UNIQUE_CREATION_TIME_MS,
            remainingText: '72시간'
        };
    }

    const now = Date.now();
    const remaining = completedAt - now;

    if (remaining <= 0) {
        return {
            isComplete: true,
            remainingMs: 0,
            remainingText: '완료'
        };
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return {
        isComplete: false,
        remainingMs: remaining,
        remainingText: `${hours}시간 ${minutes}분`
    };
}
