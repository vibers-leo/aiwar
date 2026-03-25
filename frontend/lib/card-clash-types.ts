// Card Clash - 독립 게임 타입 정의

export type ClashCardType = 'rock' | 'paper' | 'scissors';
export type ClashRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ClashCard {
    id: string;
    name: string;
    type: ClashCardType;
    rarity: ClashRarity;
    imageUrl?: string;
    power: number; // 동일 타입일 때 비교용
}

export interface ClashPlayer {
    userId: string;
    username: string;
    cards: ClashCard[];
    totalGames: number;
    wins: number;
    losses: number;
}

export interface ClashRoom {
    id: string;
    mode: 'sudden-death' | 'tactics' | 'double' | 'strategy';
    hostId: string;
    hostName: string;
    guestId?: string;
    guestName?: string;
    status: 'waiting' | 'betting' | 'selecting' | 'revealing' | 'finished';

    // 베팅 정보
    hostBet: ClashCard[];
    guestBet: ClashCard[];

    // 선택된 카드
    hostSelected: ClashCard[];
    guestSelected: ClashCard[];

    // 연결 상태 추적
    hostConnected?: boolean;
    guestConnected?: boolean;
    hostLastHeartbeat?: number;
    guestLastHeartbeat?: number;

    // 결과
    winner?: string;
    disconnectDefeat?: boolean; // 연결 끊김으로 인한 패배 여부

    // 재대결 요청
    rematchRequestedBy?: string; // 재대결 요청한 플레이어 ID
    rematchAccepted?: boolean;   // 재대결 수락 여부

    createdAt: number;
    updatedAt: number;
}

export const CARD_NAMES = {
    rock: ['Iron Fist', 'Stone Wall', 'Mountain Guard', 'Steel Titan', 'Boulder Crusher'],
    paper: ['Wind Blade', 'Sky Dancer', 'Cloud Walker', 'Storm Caller', 'Mystic Scroll'],
    scissors: ['Sharp Edge', 'Blade Master', 'Swift Cutter', 'Shadow Strike', 'Dual Slasher']
};

export const RARITY_POWER = {
    common: 100,
    rare: 150,
    epic: 200,
    legendary: 300
};

// 채팅 메시지
export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: number;
    filtered?: boolean; // 욕설 필터링 여부
}

// 욕설 필터 단어 목록 (한글 + 영어)
export const PROFANITY_WORDS = [
    // 한글 욕설
    '시발', '씨발', '병신', '개새', '좆', '지랄', '미친', '닥쳐', '꺼져',
    '바보', '멍청', '쓰레기', '죽어', '엿먹', '개같', '븅신', '등신',
    // 영어 욕설
    'fuck', 'shit', 'bitch', 'ass', 'damn', 'bastard', 'dick', 'pussy',
    'cunt', 'cock', 'motherfucker', 'asshole', 'retard', 'idiot', 'stupid'
];

// 이모티콘 (빠른 채팅)
export const QUICK_CHAT_EMOJIS = [
    { emoji: '👍', label: '좋아요' },
    { emoji: '😎', label: '멋져' },
    { emoji: '🔥', label: '불타오른다' },
    { emoji: '💪', label: '파이팅' },
    { emoji: '😂', label: '웃김' },
    { emoji: '😱', label: '놀람' },
    { emoji: '🎯', label: '정확해' },
    { emoji: '⚡', label: '빠르다' }
];
