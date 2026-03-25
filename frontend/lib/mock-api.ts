/**
 * Mock API Layer
 * Firebase 없이 프론트엔드 개발 가능
 *
 * 사용법:
 * .env.development.mock 파일 사용
 * NEXT_PUBLIC_USE_MOCK=true npm run dev
 */

import {
    mockUserProfile,
    mockInventory,
    mockLeaderboard,
    mockGameState,
    mockCardPackPurchase,
    mockBattleResult,
    mockMinigameResult,
} from './mock-data';

// Mock 모드 활성화 여부
export const useMockAPI = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// 지연 시간 시뮬레이션 (실제 API 호출처럼)
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

console.log(`🔧 Mock API Mode: ${useMockAPI ? 'ENABLED' : 'DISABLED'}`);

/**
 * Mock Firebase Auth
 */
export const mockFirebaseAuth = {
    async getCurrentUser() {
        await delay(300);
        console.log('[Mock Auth] getCurrentUser:', mockUserProfile);
        return mockUserProfile;
    },

    async signInWithEmailAndPassword(email: string, password: string) {
        await delay(800);
        console.log('[Mock Auth] signInWithEmailAndPassword:', email);
        return { user: mockUserProfile };
    },

    async createUserWithEmailAndPassword(email: string, password: string) {
        await delay(1000);
        console.log('[Mock Auth] createUserWithEmailAndPassword:', email);
        return { user: { ...mockUserProfile, email } };
    },

    async signOut() {
        await delay(300);
        console.log('[Mock Auth] signOut');
        return true;
    },
};

/**
 * Mock Firebase Database
 */
export const mockFirebaseDB = {
    async loadUserProfile(userId: string) {
        await delay(400);
        console.log('[Mock DB] loadUserProfile:', userId);
        return mockUserProfile;
    },

    async updateUserProfile(userId: string, updates: any) {
        await delay(500);
        console.log('[Mock DB] updateUserProfile:', userId, updates);
        return { ...mockUserProfile, ...updates };
    },

    async loadInventory(userId: string) {
        await delay(600);
        console.log('[Mock DB] loadInventory:', userId, `${mockInventory.length} cards`);
        return mockInventory;
    },

    async addCardsToInventory(userId: string, cards: any[]) {
        await delay(400);
        console.log('[Mock DB] addCardsToInventory:', userId, `${cards.length} new cards`);
        return [...mockInventory, ...cards];
    },

    async purchaseCardPack(userId: string, packType: string, cost: number) {
        await delay(1200);
        console.log('[Mock DB] purchaseCardPack:', userId, packType, cost);
        return mockCardPackPurchase;
    },

    async saveBattleResult(userId: string, result: any) {
        await delay(700);
        console.log('[Mock DB] saveBattleResult:', userId, result);
        return mockBattleResult;
    },

    async saveMinigameResult(userId: string, result: any) {
        await delay(600);
        console.log('[Mock DB] saveMinigameResult:', userId, result);
        return mockMinigameResult;
    },

    async getLeaderboard(limit: number = 100) {
        await delay(500);
        console.log('[Mock DB] getLeaderboard:', limit);
        return mockLeaderboard.slice(0, limit);
    },

    async getMyRank(userId: string) {
        await delay(400);
        const entry = mockLeaderboard.find(e => e.userId === userId);
        console.log('[Mock DB] getMyRank:', userId, entry?.rank);
        return entry?.rank || null;
    },
};

/**
 * Mock Realtime Database
 */
export const mockRealtimeDB = {
    async saveUserData(path: string, data: any) {
        await delay(300);
        console.log('[Mock Realtime] saveUserData:', path, data);
        return true;
    },

    async loadUserData(path: string, defaultValue: any) {
        await delay(400);
        console.log('[Mock Realtime] loadUserData:', path);
        return defaultValue;
    },

    async updateUserData(path: string, updates: any) {
        await delay(300);
        console.log('[Mock Realtime] updateUserData:', path, updates);
        return true;
    },

    listenToUserData(path: string, callback: (data: any) => void) {
        console.log('[Mock Realtime] listenToUserData:', path);
        setTimeout(() => callback(mockGameState), 500);
        return () => console.log('[Mock Realtime] unsubscribe:', path);
    },
};

/**
 * Mock PVP Matching
 */
export const mockPVPMatching = {
    async joinQueue(userId: string, deck: any[]) {
        await delay(2000);
        console.log('[Mock PVP] joinQueue:', userId, `${deck.length} cards`);
        return {
            matchId: 'mock-match-123',
            opponent: {
                userId: 'opponent-456',
                displayName: 'AI Opponent',
                level: 10,
                deck: mockInventory.slice(0, 5),
            },
        };
    },

    async leaveQueue(userId: string) {
        await delay(300);
        console.log('[Mock PVP] leaveQueue:', userId);
        return true;
    },
};

/**
 * Mock Card Clash (Minigame)
 */
export const mockCardClash = {
    async joinQueue(userId: string, mode: string, betAmount: number, hand: any[]) {
        await delay(1500);
        console.log('[Mock CardClash] joinQueue:', userId, mode, betAmount);
        return {
            gameId: 'mock-game-789',
            aiOpponent: {
                hand: mockInventory.slice(0, hand.length),
            },
        };
    },

    async playGame(gameId: string, playerHand: any[], aiHand: any[]) {
        await delay(2000);
        console.log('[Mock CardClash] playGame:', gameId);
        return mockMinigameResult;
    },
};

/**
 * Mock AI Image Generation
 */
export const mockAIImageGeneration = {
    async generateCardImage(faction: string, rarity: string, name: string, userPrompt?: string) {
        await delay(3000);
        console.log('[Mock AI] generateCardImage:', faction, rarity, name);
        return {
            success: true,
            mockMode: true,
            images: [
                `/assets/cards/dark_${faction}.png`,
                `/assets/cards/dark_${faction}.png`,
                `/assets/cards/dark_${faction}.png`,
                `/assets/cards/dark_${faction}.png`,
            ],
            prompt: `${userPrompt || ''} ${faction} ${rarity} character named "${name}"`,
            message: 'Mock mode: 4 placeholder images generated',
        };
    },
};

/**
 * API 모드 전환 유틸리티
 */
export function getAPI<T>(realAPI: T, mockAPI: T): T {
    if (useMockAPI) {
        console.log('🔧 Using Mock API');
        return mockAPI;
    }
    return realAPI;
}

// 사용 예시:
// import { getAPI } from './mock-api';
// import { mockFirebaseDB } from './mock-api';
// import * as realFirebaseDB from './firebase-db';
//
// const db = getAPI(realFirebaseDB, mockFirebaseDB);
// const profile = await db.loadUserProfile(userId);
