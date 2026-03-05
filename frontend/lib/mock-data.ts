/**
 * Mock Data for Development
 * Firebase 없이 프론트엔드 개발 가능
 */

import { Card } from './types';

// Mock 사용자 프로필
export const mockUserProfile = {
    userId: 'mock-user-123',
    email: 'developer@aiwar.com',
    displayName: 'Dev User',
    level: 10,
    experience: 5000,
    coins: 50000,
    tokens: 1000,
    avatar: '/assets/avatars/default.png',
    createdAt: new Date('2026-01-01').toISOString(),
    lastLogin: new Date().toISOString(),
};

// Mock 카드 인벤토리
export const mockInventory: Card[] = [
    {
        id: 'mock-card-1',
        instanceId: 'mock-inst-1',
        templateId: 'template-1',
        ownerId: 'mock-user-123',
        name: 'Cyber Warrior',
        rarity: 'legendary',
        type: 'EFFICIENCY',
        aiFactionId: 'machine',
        imageUrl: '/assets/cards/dark_machine.png',
        stats: { efficiency: 150, stability: 100, totalPower: 250 },
        level: 1,
        experience: 0,
        acquiredAt: Date.now(),
        isLocked: false,
    },
    {
        id: 'mock-card-2',
        instanceId: 'mock-inst-2',
        templateId: 'template-2',
        ownerId: 'mock-user-123',
        name: 'Neon Hacker',
        rarity: 'epic',
        type: 'FUNCTION',
        aiFactionId: 'cyberpunk',
        imageUrl: '/assets/cards/dark_cyberpunk.png',
        stats: { function: 120, speed: 80, totalPower: 200 },
        level: 1,
        experience: 0,
        acquiredAt: Date.now(),
        isLocked: false,
    },
    {
        id: 'mock-card-3',
        instanceId: 'mock-inst-3',
        templateId: 'template-3',
        ownerId: 'mock-user-123',
        name: 'Corporate Elite',
        rarity: 'rare',
        type: 'CREATIVITY',
        aiFactionId: 'union',
        imageUrl: '/assets/cards/dark_union.png',
        stats: { creativity: 90, accuracy: 70, totalPower: 160 },
        level: 1,
        experience: 0,
        acquiredAt: Date.now(),
        isLocked: false,
    },
    {
        id: 'mock-card-4',
        instanceId: 'mock-inst-4',
        templateId: 'template-4',
        ownerId: 'mock-user-123',
        name: 'Imperial Commander',
        rarity: 'epic',
        type: 'EFFICIENCY',
        aiFactionId: 'emperor',
        imageUrl: '/assets/cards/dark_emperor.png',
        stats: { efficiency: 110, stability: 90, totalPower: 200 },
        level: 1,
        experience: 0,
        acquiredAt: Date.now(),
        isLocked: false,
    },
    {
        id: 'mock-card-5',
        instanceId: 'mock-inst-5',
        templateId: 'template-5',
        ownerId: 'mock-user-123',
        name: 'Shadow Warrior',
        rarity: 'mythic',
        type: 'FUNCTION',
        aiFactionId: 'empire',
        imageUrl: '/assets/cards/dark_empire.png',
        stats: { function: 200, speed: 150, totalPower: 350 },
        level: 1,
        experience: 0,
        acquiredAt: Date.now(),
        isLocked: false,
    },
];

// Mock 리더보드
export const mockLeaderboard = [
    {
        userId: 'user-1',
        displayName: 'TopPlayer1',
        level: 25,
        totalPower: 10000,
        winRate: 0.85,
        rank: 1,
    },
    {
        userId: 'user-2',
        displayName: 'ProGamer',
        level: 22,
        totalPower: 8500,
        winRate: 0.78,
        rank: 2,
    },
    {
        userId: mockUserProfile.userId,
        displayName: mockUserProfile.displayName,
        level: mockUserProfile.level,
        totalPower: 5000,
        winRate: 0.65,
        rank: 15,
    },
];

// Mock 게임 상태
export const mockGameState = {
    coins: mockUserProfile.coins,
    tokens: mockUserProfile.tokens,
    level: mockUserProfile.level,
    experience: mockUserProfile.experience,
    inventory: mockInventory,
    equipment: [],
    slots: [],
    unlockedFactions: ['machine', 'cyberpunk', 'union', 'emperor', 'empire'],
    research: null,
    stageProgress: null,
};

// Mock 카드팩 구매 결과
export const mockCardPackPurchase = {
    success: true,
    cards: [
        {
            id: 'new-card-1',
            instanceId: 'new-inst-1',
            templateId: 'template-6',
            ownerId: 'mock-user-123',
            name: 'New Warrior',
            rarity: 'rare',
            type: 'EFFICIENCY',
            aiFactionId: 'machine',
            imageUrl: '/assets/cards/dark_machine.png',
            stats: { efficiency: 100, stability: 80, totalPower: 180 },
            level: 1,
            experience: 0,
            acquiredAt: Date.now(),
            isLocked: false,
        },
    ],
    coinsSpent: 1000,
};

// Mock 전투 결과
export const mockBattleResult = {
    won: true,
    coinsEarned: 500,
    experienceGained: 100,
    cardsWon: [],
    playerDamage: 50,
    opponentDamage: 100,
};

// Mock 미니게임 결과
export const mockMinigameResult = {
    result: 'win' as const,
    coinsWon: 2000,
    playerCard: mockInventory[0],
    opponentCard: {
        id: 'ai-card-1',
        name: 'AI Opponent',
        rarity: 'rare',
        type: 'FUNCTION',
        aiFactionId: 'cyberpunk',
        imageUrl: '/assets/cards/dark_cyberpunk.png',
        stats: { totalPower: 150 },
    },
    reason: 'type',
};
