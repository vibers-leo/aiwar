/**
 * 인벤토리 시스템
 * Firebase Firestore를 사용한 카드 인벤토리 관리
 */

import { Card } from './types';
import { CARD_DATABASE } from '@/data/card-database';
import { db, isFirebaseConfigured } from './firebase';
import { getUserId } from './firebase-auth';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch,
    updateDoc
} from 'firebase/firestore';

/**
 * InventoryCard extends Card with additional inventory-specific properties.
 * 
 * [PROPER TYPE DESIGN]
 * - InventoryCard IS-A Card, so it inherits all Card properties
 * - Additional properties are added for inventory management
 * - This ensures InventoryCard[] is assignable to Card[] without casting
 */
export interface InventoryCard extends Omit<Card, 'acquiredAt'> {
    // Override acquiredAt to support Firestore Timestamp
    acquiredAt: Timestamp | Date;

    // Required inventory-specific field
    instanceId: string;

    // Optional inventory metadata
    faction?: string;
    power?: number;
    affinity?: number;
    isCommanderCard?: boolean;
    isRentalCard?: boolean; // [NEW] True for temporary slot-based commander rentals
}

export type CardFilter = {
    rarity?: string[];
    faction?: string[];
    type?: string[];
};

export type CardSortBy = 'name' | 'power' | 'acquiredAt' | 'rarity';

/**
 * UID 기반 인벤토리 저장 키 생성
 */
function getInventoryKey(uid?: string): string {
    if (!uid) return 'inventory_guest';
    return `inventory_${uid}`;
}

/**
 * 인벤토리 카드 업데이트 (Partial)
 */
export async function updateInventoryCard(instanceId: string, updates: Partial<InventoryCard>, uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        // localStorage fallback
        const key = getInventoryKey(uid);
        const inventory = JSON.parse(localStorage.getItem(key) || '[]');
        const index = inventory.findIndex((c: InventoryCard) => c.instanceId === instanceId);
        if (index !== -1) {
            inventory[index] = { ...inventory[index], ...updates };
            localStorage.setItem(key, JSON.stringify(inventory));
        }
        return;
    }

    try {
        const userId = uid || await getUserId();
        const cardRef = doc(db, 'users', userId, 'inventory', instanceId);
        // @ts-ignore
        await updateDoc(cardRef, updates);
        console.log('✅ 카드 업데이트:', instanceId);
    } catch (error) {
        console.error('❌ 카드 업데이트 실패:', error);
        throw error;
    }
}

/**
 * 인벤토리에 카드 추가
 */
export async function addCardToInventory(card: Card, uid?: string): Promise<string> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        // localStorage fallback
        const key = getInventoryKey(uid);
        const inventory = JSON.parse(localStorage.getItem(key) || '[]');
        const instanceId = `${card.id}-${Date.now()}`;
        inventory.push({ ...card, instanceId, acquiredAt: new Date() });
        localStorage.setItem(key, JSON.stringify(inventory));
        return instanceId;
    }

    try {
        const userId = uid || await getUserId();
        const instanceId = `${card.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const cardRef = doc(db, 'users', userId, 'inventory', instanceId);

        const inventoryCard: InventoryCard = {
            ...card,
            instanceId,
            acquiredAt: serverTimestamp() as Timestamp
        };

        await setDoc(cardRef, inventoryCard);
        console.log('✅ 카드 추가:', card.name);
        return instanceId;
    } catch (error) {
        console.error('❌ 카드 추가 실패:', error);
        throw error;
    }
}

/**
 * 인벤토리에 여러 카드 추가 (배치 작업)
 */
export async function addCardsToInventory(cards: Card[], uid?: string): Promise<string[]> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        const key = getInventoryKey(uid);
        const inventory = JSON.parse(localStorage.getItem(key) || '[]');

        const instanceIds: string[] = [];
        const newCards = cards.map(card => {
            const instanceId = `${card.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            instanceIds.push(instanceId);
            return { ...card, instanceId, acquiredAt: new Date() };
        });

        inventory.push(...newCards);
        localStorage.setItem(key, JSON.stringify(inventory));
        return instanceIds;
    }

    try {
        const userId = uid || await getUserId();
        const batch = writeBatch(db);
        const instanceIds: string[] = [];

        for (const card of cards) {
            const instanceId = `${card.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            instanceIds.push(instanceId);
            const cardRef = doc(db, 'users', userId, 'inventory', instanceId);

            const inventoryCard: InventoryCard = {
                ...card,
                instanceId,
                acquiredAt: serverTimestamp() as Timestamp
            };
            batch.set(cardRef, inventoryCard);
        }

        await batch.commit();
        console.log(`✅ ${cards.length}개 카드 배치 추가 완료`);
        return instanceIds;
    } catch (error) {
        console.error('❌ 카드 배치 추가 실패:', error);
        throw error;
    }
}

/**
 * 인벤토리에서 카드 제거
 */
export async function removeCardFromInventory(instanceId: string, uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        // localStorage fallback
        const key = getInventoryKey(uid);
        const inventory = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = inventory.filter((c: InventoryCard) => c.instanceId !== instanceId);
        localStorage.setItem(key, JSON.stringify(filtered));
        return;
    }

    try {
        const userId = uid || await getUserId();
        const cardRef = doc(db, 'users', userId, 'inventory', instanceId);
        await deleteDoc(cardRef);
        console.log('✅ 카드 제거:', instanceId);
    } catch (error) {
        console.error('❌ 카드 제거 실패:', error);
        throw error;
    }
}

/**
 * 전체 인벤토리 로드
 */

export async function loadInventory(uid?: string): Promise<InventoryCard[]> {
    // [Request] "로컬스토리지 내용을 불러오는 것부터 완전히 차단"
    // If logged in (uid exists), we strictly rely on DB.
    // If DB is not configured or not ready, return empty [] instead of risking local data bleed.

    try {
        const userId = uid || await getUserId();

        if (!isFirebaseConfigured || !db) {
            if (userId && userId !== 'guest' && userId !== 'local-user') {
                console.warn('[Inventory] Firebase not ready for logged-in user, returning empty.');
                return [];
            }

            console.warn('Firebase가 설정되지 않았습니다. localStorage 사용.');
            const key = getInventoryKey(userId);
            const inventory = JSON.parse(localStorage.getItem(key) || '[]');
            return inventory.map((card: InventoryCard) => {
                const staticData = CARD_DATABASE.find(c => c.id === card.id);
                // Ensure templateId is always set (fallback to id)
                const templateId = card.templateId || card.id;
                if (staticData) {
                    return {
                        ...card,
                        ...staticData,
                        templateId,
                        instanceId: card.instanceId,
                        acquiredAt: card.acquiredAt,
                        level: card.level || 1,
                        experience: card.experience || 0,
                        stats: card.stats || staticData.baseStats,
                        isLocked: card.isLocked ?? false
                    };
                }
                return { ...card, templateId, isLocked: card.isLocked ?? false };
            });
        }

        const inventoryRef = collection(db, 'users', userId, 'inventory');
        const querySnapshot = await getDocs(inventoryRef);

        const cards: InventoryCard[] = querySnapshot.docs.map(doc => {
            const data = doc.data() as InventoryCard;
            const staticData = CARD_DATABASE.find(c => c.id === data.id);

            // Ensure templateId is always set (fallback to id or doc.id)
            const templateId = data.templateId || data.id || doc.id;

            if (staticData) {
                return {
                    ...data,
                    ...staticData,
                    templateId,
                    instanceId: data.instanceId,
                    acquiredAt: data.acquiredAt || new Date(),
                    level: data.level || 1,
                    experience: data.experience || 0,
                    stats: data.stats || staticData.baseStats,
                    isLocked: data.isLocked ?? false
                } as InventoryCard;
            }

            return {
                ...data,
                templateId,
                acquiredAt: data.acquiredAt || new Date(),
                isLocked: data.isLocked ?? false
            } as InventoryCard;
        });

        console.log(`✅ 인벤토리 로드: ${cards.length}개 카드`);
        return cards;
    } catch (error) {
        console.error('❌ 인벤토리 로드 실패:', error);
        return [];
    }
}

/**
 * 특정 카드 조회
 */
export async function getCardByInstanceId(instanceId: string, uid?: string): Promise<InventoryCard | null> {
    if (!isFirebaseConfigured || !db) {
        const key = getInventoryKey(uid);
        const inventory = JSON.parse(localStorage.getItem(key) || '[]');
        return inventory.find((c: InventoryCard) => c.instanceId === instanceId) || null;
    }

    try {
        const userId = uid || await getUserId();
        const cardRef = doc(db, 'users', userId, 'inventory', instanceId);
        const docSnap = await getDoc(cardRef);

        if (docSnap.exists()) {
            return docSnap.data() as InventoryCard;
        }
        return null;
    } catch (error) {
        console.error('❌ 카드 조회 실패:', error);
        return null;
    }
}

/**
 * 카드 필터링
 */
export function filterCards(cards: InventoryCard[], filters: CardFilter): InventoryCard[] {
    let filtered = [...cards];

    if (filters.rarity && filters.rarity.length > 0) {
        filtered = filtered.filter(card => card.rarity && filters.rarity!.includes(card.rarity));
    }

    if (filters.faction && filters.faction.length > 0) {
        filtered = filtered.filter(card => card.faction && filters.faction!.includes(card.faction));
    }

    if (filters.type && filters.type.length > 0) {
        filtered = filtered.filter(card => card.type && filters.type!.includes(card.type));
    }

    return filtered;
}

/**
 * 주력 카드 선택 규칙:
 * 등급별로 1장씩 선택하며, 전체 전투력이 높은 것보다도
 * 세부 스텟(효율, 창의, 기능 중) 1개가 가장 높은 것을 주력카드로 선정.
 */
export function getMainCards(cards: InventoryCard[]): InventoryCard[] {
    const mainCards: Record<string, InventoryCard> = {};
    const rarities = ['commander', 'mythic', 'legendary', 'epic', 'rare', 'common'];

    cards.forEach(card => {
        const rarity = card.rarity || 'common';
        const stats = card.stats || { efficiency: 0, creativity: 0, function: 0 };
        // Determine the highest single stat
        const highestStat = Math.max(stats.efficiency || 0, stats.creativity || 0, stats.function || 0);

        if (!mainCards[rarity]) {
            mainCards[rarity] = card;
        } else {
            const currentStats = mainCards[rarity].stats || { efficiency: 0, creativity: 0, function: 0 };
            const currentHighestStat = Math.max(currentStats.efficiency || 0, currentStats.creativity || 0, currentStats.function || 0);

            if (highestStat > currentHighestStat) {
                mainCards[rarity] = card;
            } else if (highestStat === currentHighestStat) {
                // If highest single stats are equal, prefer higher level
                if ((card.level || 1) > (mainCards[rarity].level || 1)) {
                    mainCards[rarity] = card;
                } else if ((card.level || 1) === (mainCards[rarity].level || 1)) {
                    // If levels are also equal, prefer higher total power
                    if ((card.stats?.totalPower || 0) > (mainCards[rarity].stats?.totalPower || 0)) {
                        mainCards[rarity] = card;
                    }
                }
            }
        }
    });

    // Return in the specific order: Commander -> Mythic -> Legendary -> Epic -> Rare -> Common
    return rarities.map(r => mainCards[r]).filter(Boolean);
}

/**
 * 카드 정렬 (주력 카드 우선 정렬 옵션 추가)
 */
export function sortCards(
    cards: InventoryCard[],
    sortBy: CardSortBy,
    ascending: boolean = true,
    prioritizeMain: boolean = false
): InventoryCard[] {
    let result = [...cards];

    if (prioritizeMain) {
        const mainCards = getMainCards(cards);
        const mainInstanceIds = new Set(mainCards.map(c => c.instanceId));

        const mains = result.filter(c => mainInstanceIds.has(c.instanceId));
        const others = result.filter(c => !mainInstanceIds.has(c.instanceId));

        // Sort mains by rarity descending (Commander first)
        const sortedMains = [...mains].sort((a, b) => {
            const rarityOrder = { 'common': 1, 'rare': 2, 'epic': 3, 'legendary': 4, 'mythic': 5, 'commander': 6 };
            return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) -
                (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0);
        });

        // Sort others by requested criteria
        const sortedOthers = sortInner(others, sortBy, ascending);

        return [...sortedMains, ...sortedOthers];
    }

    return sortInner(result, sortBy, ascending);
}

function sortInner(cards: InventoryCard[], sortBy: CardSortBy, ascending: boolean = true): InventoryCard[] {
    const sorted = [...cards];

    sorted.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'name':
                comparison = (a.name || '').localeCompare(b.name || '');
                break;
            case 'power':
                const powerA = a.power || a.stats?.totalPower || 0;
                const powerB = b.power || b.stats?.totalPower || 0;
                comparison = powerA - powerB;
                break;
            case 'acquiredAt':
                const dateA = a.acquiredAt instanceof Date ? a.acquiredAt :
                    (a.acquiredAt && 'seconds' in a.acquiredAt ? new Date(a.acquiredAt.seconds * 1000) : new Date());
                const dateB = b.acquiredAt instanceof Date ? b.acquiredAt :
                    (b.acquiredAt && 'seconds' in b.acquiredAt ? new Date(b.acquiredAt.seconds * 1000) : new Date());
                comparison = dateA.getTime() - dateB.getTime();
                break;
            case 'rarity':
                const rarityOrder = { 'common': 1, 'rare': 2, 'epic': 3, 'legendary': 4, 'mythic': 5, 'commander': 6 };
                comparison = (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0) -
                    (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0);
                break;
        }

        return ascending ? comparison : -comparison;
    });

    return sorted;
}

/**
 * 인벤토리 통계
 */
export function getInventoryStats(cards: InventoryCard[]) {
    const stats = {
        total: cards.length,
        byRarity: {} as Record<string, number>,
        byFaction: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        totalPower: 0,
        averagePower: 0
    };

    cards.forEach(card => {
        // Rarity
        if (card.rarity) {
            stats.byRarity[card.rarity] = (stats.byRarity[card.rarity] || 0) + 1;
        }

        // Faction
        if (card.faction) {
            stats.byFaction[card.faction] = (stats.byFaction[card.faction] || 0) + 1;
        }

        // Type
        if (card.type) {
            stats.byType[card.type] = (stats.byType[card.type] || 0) + 1;
        }

        // Power
        const power = card.power || card.stats?.totalPower || 0;
        stats.totalPower += power;
    });

    stats.averagePower = cards.length > 0 ? Math.round(stats.totalPower / cards.length) : 0;

    return stats;
}

/**
 * 스타터팩 지급 (튜토리얼 완료 시)
 * 일반 1, 희귀 1, 영웅 1, 전설 1, 유니크 1 (군단장 카드) 지급
 * 
 * @deprecated This function does NOT set the hasReceivedStarterPack flag.
 * Use claimStarterPackTransaction from firebase-db.ts instead for atomic operations.
 * This function is kept for backward compatibility but should not be used for new code.
 */
const UNIQUE_COMMANDER_PORTRAITS = [
    '/assets/cards/cyber-warlord.png',
    '/assets/cards/fleet-admiral.png',
    '/assets/cards/gemini-character.png',
    '/assets/cards/cursor-character.png',
    '/assets/cards/runway-character.png'
];

export async function distributeStarterPack(uid?: string, nickname?: string): Promise<InventoryCard[]> {
    try {
        const { generateCardByRarity } = await import('./card-generation-system');

        // 각 등급별 1장씩 생성 (일반, 희귀, 에픽, 전설, 유니크)
        const commonCard = generateCardByRarity('common', uid);
        const rareCard = generateCardByRarity('rare', uid);
        const epicCard = generateCardByRarity('epic', uid);
        const legendaryCard = generateCardByRarity('legendary', uid);
        const uniqueCard = generateCardByRarity('mythic', uid);

        // Customize Unique Card with Nickname
        if (nickname) {
            uniqueCard.name = `군단장 ${nickname}`;
            uniqueCard.description = "전장에 새롭게 합류한 군단장의 전용 유닛입니다.";
        }

        const starterPack = [
            commonCard,
            rareCard,
            epicCard,
            legendaryCard,
            uniqueCard
        ];

        // 인벤토리에 추가
        await addCardsToInventory(starterPack, uid);

        // [NEW] Award 1000 Coins via Unified Storage
        try {
            const { gameStorage } = await import('./game-storage');
            await gameStorage.addCoins(1000, uid);
            console.log('✅ 스타터팩 코인 지급 완료: 1000 Coins');
        } catch (coinError) {
            console.error('❌ 스타터팩 코인 지급 실패:', coinError);
        }

        // InventoryCard 형태로 반환 (UI 표시용)
        const inventoryCards = starterPack.map(card => ({
            ...card,
            instanceId: '', // UI 표시용이라 ID 불필요하지만 타입 맞춤
            acquiredAt: new Date()
        } as InventoryCard));

        console.log('✅ 스타터팩 지급 완료 (5장, 1000코인, 포함: 군단장 카드)');
        return inventoryCards;
    } catch (error) {
        console.error('❌ 스타터팩 지급 실패:', error);
        return [];
    }
}

/**
 * 인벤토리 초기화 (데이터 리셋용)
 */
export async function clearInventory(uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        const key = getInventoryKey(uid);
        localStorage.removeItem(key);
        return;
    }

    try {
        const userId = uid || await getUserId();
        const inventoryRef = collection(db, 'users', userId, 'inventory');
        const snapshot = await getDocs(inventoryRef);

        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`✅ 인벤토리 초기화 완료: ${snapshot.docs.length}장 삭제`);
    } catch (error) {
        console.error('❌ 인벤토리 초기화 실패:', error);
        throw error;
    }
}
