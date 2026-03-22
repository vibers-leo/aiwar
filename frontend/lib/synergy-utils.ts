// 시너지 계산 유틸리티

import { Card } from './types';

export interface ComboDefinition {
    id: string;
    name: string;
    requiredFactions: string[]; // 다중 팩션 조합 등
    bonusPower: number;
    description: string;
    icon: string;
}

export interface DeckSynergy {
    factionCounts: Record<string, number>;
    totalBonus: number;
    activeSynergies: Array<{
        faction: string;
        count: number;
        bonus: number;
    }>;
    activeCombos: ComboDefinition[];
}

// 군단별 카드 개수 계산
export function calculateFactionCounts(cards: Card[]): Record<string, number> {
    const counts: Record<string, number> = {};

    cards.forEach(card => {
        // templateId에서 AI 군단 추출 (예: "gemini-text-001" -> "gemini")
        const faction = card.templateId.split('-')[0];
        counts[faction] = (counts[faction] || 0) + 1;
    });

    return counts;
}

// 시너지 보너스 계산
export function calculateSynergyBonus(count: number): number {
    const bonusMap: Record<number, number> = {
        2: 1.10, // +10%
        3: 1.20, // +20%
        4: 1.30, // +30%
        5: 1.50, // +50%
    };

    return bonusMap[count] || 1.0;
}

// 덱 시너지 분석
export function analyzeDeckSynergy(cards: Card[]): DeckSynergy {
    const factionCounts = calculateFactionCounts(cards);
    const activeSynergies: Array<{ faction: string; count: number; bonus: number }> = [];
    let totalBonus = 1.0;

    Object.entries(factionCounts).forEach(([faction, count]) => {
        if (count >= 2) {
            const bonus = calculateSynergyBonus(count);
            activeSynergies.push({ faction, count, bonus });

            // 가장 높은 보너스만 적용 (중복 방지)
            if (bonus > totalBonus) {
                totalBonus = bonus;
            }
        }
    });

    // 콤보 계산 로직
    const COMBO_DEFINITIONS: ComboDefinition[] = [
        {
            id: 'openai-alliance',
            name: 'OpenAI Alliance',
            requiredFactions: ['chatgpt', 'dalle'],
            bonusPower: 0.15,
            description: 'ChatGPT + DALL-E: OpenAI 군단 전체 전투력 +15%',
            icon: '🤖'
        },
        {
            id: 'google-dominance',
            name: 'Google Dominance',
            requiredFactions: ['gemini', 'stable'],
            bonusPower: 0.10,
            description: 'Gemini + 이미지 AI: 방어력 +10%, 토큰 소모 -20%',
            icon: '🔍'
        },
        {
            id: 'rival-clash',
            name: 'Rival Clash',
            requiredFactions: ['chatgpt', 'claude'],
            bonusPower: 0.30,
            description: 'ChatGPT vs Claude: 극한의 경쟁 — 전투력 +30% (리스크 포함)',
            icon: '⚔️'
        },
        {
            id: 'creative-trio',
            name: 'Creative Trio',
            requiredFactions: ['midjourney', 'dalle', 'stable'],
            bonusPower: 0.20,
            description: '이미지 AI 삼총사: 창의 스탯 +20%',
            icon: '🎨'
        },
        {
            id: 'text-titans',
            name: 'Text Titans',
            requiredFactions: ['chatgpt', 'claude', 'gemini'],
            bonusPower: 0.25,
            description: '3대 텍스트 AI 집결: 전투력 +25%',
            icon: '📝'
        },
        {
            id: 'audio-studio',
            name: 'Audio Studio',
            requiredFactions: ['suno', 'eleven'],
            bonusPower: 0.15,
            description: 'Suno + ElevenLabs: 음성 AI 시너지 — 안정성 +15%',
            icon: '🎵'
        },
        {
            id: 'video-empire',
            name: 'Video Empire',
            requiredFactions: ['runway', 'kling'],
            bonusPower: 0.20,
            description: 'Runway + Kling: 영상 AI 연합 — 속도 +20%',
            icon: '🎬'
        },
        // ── 신규 콤보 (신규 군단 추가분) ─────────────────────────────
        {
            id: 'open-source-rebellion',
            name: 'Open Source Rebellion',
            requiredFactions: ['deepseek', 'llama', 'mistral'],
            bonusPower: 0.40,
            description: 'DeepSeek + Llama + Mistral: 오픈소스 삼두정치 — 전투력 +40%, 비용 -30%',
            icon: '🔓'
        },
        {
            id: 'asian-ai-alliance',
            name: 'Asian AI Alliance',
            requiredFactions: ['deepseek', 'qwen', 'hyperclova'],
            bonusPower: 0.35,
            description: 'DeepSeek + Qwen + HyperCLOVA: 동방 AI 연합 — 아시아 시장 전투력 +35%',
            icon: '🐉'
        },
        {
            id: 'google-empire',
            name: 'Google Empire',
            requiredFactions: ['gemini', 'veo', 'notebooklm'],
            bonusPower: 0.30,
            description: 'Gemini + Veo + NotebookLM: Google 생태계 완전 장악 — 전투력 +30%',
            icon: '🌐'
        },
        {
            id: 'builder-squad',
            name: 'Builder Squad',
            requiredFactions: ['lovable', 'v0', 'devin'],
            bonusPower: 0.35,
            description: 'Lovable + v0 + Devin: AI 빌더 연합 — 개발 속도 2배, 전투력 +35%',
            icon: '🏗️'
        },
        {
            id: 'openai-full-stack',
            name: 'OpenAI Full Stack',
            requiredFactions: ['chatgpt', 'dalle', 'sora', 'whisper'],
            bonusPower: 0.45,
            description: 'ChatGPT + DALL-E + Sora + Whisper: OpenAI 완전체 — 전 분야 +45%',
            icon: '🚀'
        },
        {
            id: 'search-war',
            name: 'Search War',
            requiredFactions: ['perplexity', 'gemini'],
            bonusPower: 0.25,
            description: 'Perplexity + Gemini: AI 검색 패권 전쟁 — 정보 우위 +25%',
            icon: '🔎'
        },
        {
            id: 'video-mega-alliance',
            name: 'Video Mega Alliance',
            requiredFactions: ['sora', 'veo', 'luma'],
            bonusPower: 0.40,
            description: 'Sora + Veo + Luma: 영상 AI 3강 연합 — 영상 전투력 +40%',
            icon: '🎥'
        },
        {
            id: 'emotion-wave',
            name: 'Emotion Wave',
            requiredFactions: ['characterai', 'elevenlabs', 'suno'],
            bonusPower: 0.30,
            description: 'Character.AI + ElevenLabs + Suno: 감성 AI 동맹 — 사기 +30%',
            icon: '💫'
        },
    ];

    const activeCombos: ComboDefinition[] = COMBO_DEFINITIONS.filter(combo =>
        combo.requiredFactions.every(faction => (factionCounts[faction] || 0) >= 1)
    );

    // 콤보 보너스를 totalBonus에 반영
    activeCombos.forEach(combo => {
        totalBonus += combo.bonusPower;
    });

    return {
        factionCounts,
        totalBonus,
        activeSynergies,
        activeCombos
    };
}

// AI 군단 이름 가져오기
export function getFactionDisplayName(factionId: string): string {
    const factionNames: Record<string, string> = {
        'gemini': 'Gemini',
        'chatgpt': 'ChatGPT',
        'claude': 'Claude',
        'midjourney': 'Midjourney',
        'dalle': 'DALL-E',
        'stable': 'Stable Diffusion',
        'runway': 'Runway',
        'kling': 'Kling',
        'suno': 'Suno',
        'eleven': 'ElevenLabs',
    };

    return factionNames[factionId] || factionId;
}
