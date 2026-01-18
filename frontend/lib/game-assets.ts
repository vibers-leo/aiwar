/**
 * 게임 에셋 관리 유틸리티
 * 관리자 페이지에서 설정한 에셋 데이터를 게임에서 사용할 수 있도록 합니다.
 */

import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

// ================= 타입 정의 =================

export interface GameFaction {
    id: string;
    name: string;
    name_ko: string;
    description: string;
    description_ko: string;
    category: string;
    imageUrl: string;
    commanderName: string;
    commanderName_ko: string;
    commanderImageUrl: string;
    factionIconUrl: string;
    hoverVideoUrl?: string;
    hoverSoundUrl?: string;
    isActive: boolean;
}

export interface GameCard {
    id: string;
    templateId: string;
    name: string;
    name_ko: string;
    description: string;
    description_ko: string;
    category: string;
    factionId: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'unique';
    cardType: 'efficiency' | 'creativity' | 'function';
    imageUrl: string;
    hoverVideoUrl?: string;
    hoverSoundUrl?: string;
    isActive: boolean;
}

export interface GameAssets {
    version: string;
    factions: GameFaction[];
    cards: GameCard[];
}

// ================= 캐시 =================

let cachedAssets: GameAssets | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// ================= 에셋 로드 함수 =================

/**
 * Firebase에서 게임 에셋 데이터를 로드합니다.
 * 캐시된 데이터가 있으면 캐시를 반환합니다.
 */
export async function loadGameAssets(forceRefresh = false): Promise<GameAssets | null> {
    const now = Date.now();

    // 캐시가 유효한 경우 캐시 반환
    if (!forceRefresh && cachedAssets && (now - cacheTimestamp) < CACHE_DURATION) {
        return cachedAssets;
    }

    try {
        // 1. 먼저 game-data/assets 문서 확인 (관리자가 내보낸 데이터)
        if (db) {
            const cachedRef = doc(db, 'game-data', 'assets');
            const cachedDoc = await getDoc(cachedRef);

            if (cachedDoc.exists()) {
                const data = cachedDoc.data() as GameAssets;
                cachedAssets = data;
                cacheTimestamp = now;
                console.log('Game assets loaded from cache');
                return data;
            }
        }

        // 2. 캐시가 없으면 직접 조회
        if (!db) {
            console.warn('Firebase not initialized');
            return null;
        }

        const factions: GameFaction[] = [];
        const cards: GameCard[] = [];

        // Factions 로드
        const factionsSnapshot = await getDocs(collection(db, 'factions'));
        factionsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.isActive !== false) {
                factions.push({
                    id: doc.id,
                    name: data.name,
                    name_ko: data.name_ko,
                    description: data.description,
                    description_ko: data.description_ko,
                    category: data.category,
                    imageUrl: data.imageUrl,
                    commanderName: data.commanderName,
                    commanderName_ko: data.commanderName_ko,
                    commanderImageUrl: data.commanderImageUrl,
                    factionIconUrl: data.factionIconUrl,
                    hoverVideoUrl: data.hoverVideoUrl,
                    hoverSoundUrl: data.hoverSoundUrl,
                    isActive: data.isActive ?? true,
                });
            }
        });

        // Cards 로드
        const cardsSnapshot = await getDocs(collection(db, 'cards'));
        cardsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.isActive !== false) {
                cards.push({
                    id: doc.id,
                    templateId: data.templateId,
                    name: data.name,
                    name_ko: data.name_ko,
                    description: data.description,
                    description_ko: data.description_ko,
                    category: data.category,
                    factionId: data.factionId,
                    rarity: data.rarity,
                    cardType: data.cardType,
                    imageUrl: data.imageUrl,
                    hoverVideoUrl: data.hoverVideoUrl,
                    hoverSoundUrl: data.hoverSoundUrl,
                    isActive: data.isActive ?? true,
                });
            }
        });

        const assets: GameAssets = {
            version: '1.0',
            factions,
            cards
        };

        cachedAssets = assets;
        cacheTimestamp = now;
        console.log('Game assets loaded from database');
        return assets;

    } catch (error) {
        console.error('Failed to load game assets:', error);
        return cachedAssets; // 에러 시 이전 캐시 반환
    }
}

/**
 * 특정 군단 정보를 가져옵니다.
 */
export async function getFaction(factionId: string): Promise<GameFaction | null> {
    const assets = await loadGameAssets();
    return assets?.factions.find(f => f.id === factionId) || null;
}

/**
 * 특정 카드 정보를 가져옵니다.
 */
export async function getCard(cardId: string): Promise<GameCard | null> {
    const assets = await loadGameAssets();
    return assets?.cards.find(c => c.id === cardId || c.templateId === cardId) || null;
}

/**
 * 특정 군단에 속한 카드들을 가져옵니다.
 */
export async function getCardsByFaction(factionId: string): Promise<GameCard[]> {
    const assets = await loadGameAssets();
    return assets?.cards.filter(c => c.factionId === factionId) || [];
}

/**
 * 특정 카테고리의 군단들을 가져옵니다.
 */
export async function getFactionsByCategory(category: string): Promise<GameFaction[]> {
    const assets = await loadGameAssets();
    return assets?.factions.filter(f => f.category === category) || [];
}

/**
 * 캐시를 무효화합니다.
 */
export function invalidateCache(): void {
    cachedAssets = null;
    cacheTimestamp = 0;
}
