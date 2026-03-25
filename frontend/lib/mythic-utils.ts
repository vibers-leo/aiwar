// 신화 카드 생성 유틸리티
import { Card } from './types';
import uniqueCardsData from '@/data/unique-cards.json';
import { generateId } from './utils';

/**
 * 전설급 카드 3장으로 신화 카드 생성 가능 여부 확인
 */
export function canCreateMythicCard(cards: Card[]): boolean {
    if (cards.length !== 3) return false;

    // 모두 전설급이어야 함
    const allLegendary = cards.every(card => card.rarity === 'legendary');
    if (!allLegendary) return false;

    // 레벨 조건 (선택적)
    // const allMaxLevel = cards.every(card => card.level >= 10);
    // return allMaxLevel;

    return true;
}

/**
 * 신화 카드 생성 비용 계산
 */
export function getMythicCreationCost(): { tokens: number } {
    return {
        tokens: 5000 // 제작에 필요한 위상이 상향되었습니다.
    };
}

/**
 * 신화 카드 생성
 */
export function createMythicCard(
    materialCards: Card[],
    userId: string
): { success: boolean; card?: Card; message: string } {
    if (!canCreateMythicCard(materialCards)) {
        return {
            success: false,
            message: '전설급 카드 3장이 필요합니다.'
        };
    }

    // 랜덤하게 신화 카드 템플릿 선택
    const templates = uniqueCardsData.uniqueCards;
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

    // 재료 카드들의 평균 스탯 계산
    const avgStats = {
        creativity: Math.floor(materialCards.reduce((sum, c) => sum + (c.stats.creativity || 0), 0) / 3),
        accuracy: Math.floor(materialCards.reduce((sum, c) => sum + (c.stats.accuracy || 0), 0) / 3),
        speed: Math.floor(materialCards.reduce((sum, c) => sum + (c.stats.speed || 0), 0) / 3),
        stability: Math.floor(materialCards.reduce((sum, c) => sum + (c.stats.stability || 0), 0) / 3),
        ethics: Math.floor(materialCards.reduce((sum, c) => sum + (c.stats.ethics || 0), 0) / 3)
    };

    // 신화 카드 스탯 생성 (재료 카드 평균 + 템플릿 보너스)
    const baseCreativity = Math.floor(
        (randomTemplate.baseStats.creativity.min + randomTemplate.baseStats.creativity.max) / 2
    );
    const baseAccuracy = Math.floor(
        (randomTemplate.baseStats.accuracy.min + randomTemplate.baseStats.accuracy.max) / 2
    );
    const baseSpeed = Math.floor(
        (randomTemplate.baseStats.speed.min + randomTemplate.baseStats.speed.max) / 2
    );
    const baseStability = Math.floor(
        (randomTemplate.baseStats.stability.min + randomTemplate.baseStats.stability.max) / 2
    );
    const baseEthics = Math.floor(
        (randomTemplate.baseStats.ethics.min + randomTemplate.baseStats.ethics.max) / 2
    );

    // 최종 스탯 = (재료 평균 * 0.3) + (템플릿 기본 * 0.7)
    const creativity = Math.floor(avgStats.creativity * 0.3 + baseCreativity * 0.7);
    const accuracy = Math.floor(avgStats.accuracy * 0.3 + baseAccuracy * 0.7);
    const speed = Math.floor(avgStats.speed * 0.3 + baseSpeed * 0.7);
    const stability = Math.floor(avgStats.stability * 0.3 + baseStability * 0.7);
    const ethics = Math.floor(avgStats.ethics * 0.3 + baseEthics * 0.7);
    const totalPower = creativity + accuracy + speed + stability + ethics;

    const mythicCard: Card = {
        id: generateId(),
        instanceId: `${generateId()}-${Date.now()}`,
        templateId: randomTemplate.id,
        name: randomTemplate.name,
        ownerId: userId,
        level: 1,
        experience: 0,
        stats: {
            creativity,
            accuracy,
            speed,
            stability,
            ethics,
            totalPower
        },
        rarity: 'mythic',
        acquiredAt: new Date(),
        isLocked: false,
        isUnique: true,
        specialSkill: {
            name: randomTemplate.specialAbility.name,
            description: randomTemplate.specialAbility.description,
            effect: randomTemplate.specialAbility.type
        }
    };

    return {
        success: true,
        card: mythicCard,
        message: `${randomTemplate.name} 생성 완료!`
    };
}

/**
 * 신화 카드 목록 가져오기
 */
export function getMythicCardTemplates() {
    return uniqueCardsData.uniqueCards;
}

/**
 * 신화 카드 생성 품질 계산 (재료 카드 품질에 따라)
 */
export function calculateMythicQuality(materialCards: Card[]): {
    quality: 'low' | 'medium' | 'high' | 'perfect';
    bonusPercent: number;
} {
    const avgLevel = materialCards.reduce((sum, c) => sum + c.level, 0) / 3;
    const avgPower = materialCards.reduce((sum, c) => sum + c.stats.totalPower, 0) / 3;

    if (avgLevel === 10 && avgPower >= 450) {
        return { quality: 'perfect', bonusPercent: 20 };
    } else if (avgLevel >= 9 && avgPower >= 400) {
        return { quality: 'high', bonusPercent: 15 };
    } else if (avgLevel >= 8 && avgPower >= 350) {
        return { quality: 'medium', bonusPercent: 10 };
    } else {
        return { quality: 'low', bonusPercent: 5 };
    }
}
