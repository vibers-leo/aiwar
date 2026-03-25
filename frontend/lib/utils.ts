
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Rarity, Stats, Card } from './types';
import gameBalanceData from '@/data/game-balance.json';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// 게임 유틸리티 함수들

// 랜덤 숫자 생성 (min ~ max 사이)
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 등급별 확률에 따라 랜덤 등급 선택
export function getRandomRarity(weights: { common: number; rare: number; epic: number; legendary: number }): Rarity {
    const total = weights.common + weights.rare + weights.epic + weights.legendary;
    const random = Math.random() * total;

    let cumulative = 0;

    cumulative += weights.common;
    if (random < cumulative) return 'common';

    cumulative += weights.rare;
    if (random < cumulative) return 'rare';

    cumulative += weights.epic;
    if (random < cumulative) return 'epic';

    return 'legendary';
}

// 등급에 따른 랜덤 능력치 생성
export function generateRandomStats(rarity: Rarity): Stats {
    // [FIX] 'mythic' 등급은 데이터상 'unique' 키를 사용
    const dataKey = rarity === 'mythic' ? 'unique' : rarity;
    // @ts-ignore - JSON 데이터 키 타입 불일치 해결
    const ranges = gameBalanceData.statRanges[dataKey];

    const creativity = randomInt(ranges.creativity.min, ranges.creativity.max);
    const accuracy = randomInt(ranges.accuracy.min, ranges.accuracy.max);
    const speed = randomInt(ranges.speed.min, ranges.speed.max);
    const stability = randomInt(ranges.stability.min, ranges.stability.max);
    const ethics = randomInt(ranges.ethics.min, ranges.ethics.max);

    const totalPower = creativity + accuracy + speed + stability + ethics;

    return {
        creativity,
        accuracy,
        speed,
        stability,
        ethics,
        totalPower,
    };
}

// 시간 포맷팅 (분 단위 → "00:00" 형식)
export function formatTime(minutes: number): string {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 남은 시간 계산 (밀리초 → 분)
export function getRemainingMinutes(targetTime: Date): number {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    return Math.max(0, diff / 1000 / 60);
}

// UUID 생성
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 랜덤 카드 생성
export function generateCard(): Card {
    const rarity = getRandomRarity({
        common: 60,
        rare: 30,
        epic: 8,
        legendary: 2,
    });

    const stats = generateRandomStats(rarity);
    const id = generateId();

    return {
        id,
        instanceId: `${id}-${Date.now()}`, // Unique instance identifier
        templateId: `generated-${id}`,
        ownerId: 'user-001',
        level: 1,
        experience: 0,
        stats,
        acquiredAt: new Date(),
        isLocked: false,
    };
}

/**
 * [FIX] Firestore Timestamp 또는 객체 형태의 날짜를 JS Date 객체로 변환
 */
export function ensureDate(dateVal: any): Date {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;

    // Firestore Timestamp { seconds, nanoseconds }
    if (typeof dateVal === 'object' && ('seconds' in dateVal || '_seconds' in dateVal)) {
        const seconds = dateVal.seconds || dateVal._seconds;
        return new Date(seconds * 1000);
    }

    // Generic string or number
    const date = new Date(dateVal);
    // [SAFETY] Invalid Date인 경우 현재 시간 반환하여 에러 방지
    return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * [FIX] 6:00 AM KST (한국 시간) 기준 초기화 날짜 문자열 가져오기
 * 시스템/서버의 로컬 타임존에 의존하지 않고, 강제로 UTC+9(KST)를 적용하여 계산합니다.
 * - 한국 시간 오전 6시 이전이면 '어제' 날짜 반환
 * - 한국 시간 오전 6시 이후면 '오늘' 날짜 반환
 */
export function getResetDateString(): string {
    const now = new Date();

    // 1. 순수 UTC 타임스탬프 + 9시간 (KST)
    // getTime()은 UTC 기준 ms를 반환하므로, 여기에 9시간 ms를 더하면
    // 해당 시점의 UTC 표현이 곧 KST 시간이 됨.
    const kstTimestamp = now.getTime() + (9 * 60 * 60 * 1000);
    const kstDate = new Date(kstTimestamp);

    // 2. KST 기준 시간 확인 (getUTC* 메서드 사용 필수)
    // kstTimestamp는 이미 Shift된 시간이므로, 이를 UTC로 읽어야 원래 의도한 KST 시각이 나옴
    const kstHours = kstDate.getUTCHours();

    // 3. 오전 6시 이전이면 하루 빼기
    if (kstHours < 6) {
        kstDate.setUTCDate(kstDate.getUTCDate() - 1);
    }

    const year = kstDate.getUTCFullYear();
    const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


// 로컬 스토리지 헬퍼
export const storage = {
    get<T>(key: string, defaultValue: T): T {
        if (typeof window === 'undefined') return defaultValue;

        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set(key: string, value: unknown): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    },

    remove(key: string): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
    },
};

/**
 * 5전 3선승제 전투 시뮬레이션
 * 각 라운드에서 카드 전투력의 끝자리 숫자가 높은 쪽이 승리
 */
export function simulate5RoundBattle(playerCards: Card[], enemyCards: Card[]) {
    const rounds = [];
    let playerWins = 0;
    let enemyWins = 0;

    // 5라운드 진행
    for (let i = 0; i < 5; i++) {
        const playerCard = playerCards[i];
        const enemyCard = enemyCards[i];

        const playerPower = playerCard.stats?.totalPower || 0;
        const enemyPower = enemyCard.stats?.totalPower || 0;

        // 끝자리 숫자 추출
        const playerLastDigit = playerPower % 10;
        const enemyLastDigit = enemyPower % 10;

        // 승자 결정
        let winner: 'player' | 'enemy' | 'draw';
        if (playerLastDigit > enemyLastDigit) {
            winner = 'player';
            playerWins++;
        } else if (enemyLastDigit > playerLastDigit) {
            winner = 'enemy';
            enemyWins++;
        } else {
            // 끝자리가 같으면 전체 전투력 비교
            if (playerPower > enemyPower) {
                winner = 'player';
                playerWins++;
            } else if (enemyPower > playerPower) {
                winner = 'enemy';
                enemyWins++;
            } else {
                winner = 'draw';
            }
        }

        rounds.push({
            roundNumber: i + 1,
            playerCard,
            enemyCard,
            playerPower,
            enemyPower,
            playerLastDigit,
            enemyLastDigit,
            winner
        });

        // 3승 달성 시 조기 종료
        if (playerWins === 3 || enemyWins === 3) {
            break;
        }
    }

    // 최종 승자 결정
    const finalWinner = playerWins > enemyWins ? 'player' : 'enemy';

    // 보상 계산
    const baseCoins = 300;
    const baseExp = 50;
    const coins = finalWinner === 'player' ? baseCoins : Math.floor(baseCoins * 0.3);
    const experience = finalWinner === 'player' ? baseExp : Math.floor(baseExp * 0.3);

    return {
        rounds,
        playerWins,
        enemyWins,
        finalWinner,
        rewards: {
            coins,
            experience,
            cards: finalWinner === 'player' && Math.random() < 0.1 ? [generateCard()] : []
        }
    };
}
