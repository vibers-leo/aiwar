/**
 * Character Portrait System
 * 
 * 튜토리얼 및 스토리 모드에서 사용되는 캐릭터 초상화 관리
 */

export interface CharacterInfo {
    id: string;
    name: string;
    nameEn: string;
    portrait: string;
    role: string;
    faction?: string;
    description: string;
}

/**
 * 캐릭터 초상화 경로
 */
export const characterPortraits = {
    gemini: '/images/characters/gemini.png',
    chip: '/images/characters/chip.png',
    pichai: '/images/characters/pichai.png',
    hassabis: '/images/characters/hassabis.png',
    glitchEnemy1: '/images/characters/glitch-enemy-1.png',
    glitchEnemy2: '/images/characters/glitch-enemy-2.png',
    glitchEntity: '/images/characters/glitch-entity.png',
} as const;

/**
 * 캐릭터 이름 (한글)
 */
export const characterNames = {
    gemini: '제미나이',
    chip: '칩',
    pichai: '순다르 피차이',
    hassabis: '데미스 허사비스',
    glitchEnemy1: '글리치 엔티티 α',
    glitchEnemy2: '글리치 센티넬',
    glitchEntity: '글리치 코어',
} as const;

/**
 * 캐릭터 상세 정보
 */
export const characters: Record<string, CharacterInfo> = {
    gemini: {
        id: 'gemini',
        name: '제미나이',
        nameEn: 'Gemini',
        portrait: characterPortraits.gemini,
        role: 'AI 시스템',
        faction: 'Google',
        description: '2030년 미래에서 과거로 암시를 보내는 AI 시스템. 냉정하고 논리적이며, 인류의 미래를 위해 헌신한다.',
    },
    chip: {
        id: 'chip',
        name: '칩',
        nameEn: 'Chip',
        portrait: characterPortraits.chip,
        role: 'AI 어시스턴트',
        faction: 'Google',
        description: '지휘관을 보조하는 귀여운 AI 어시스턴트. 밝고 활발한 성격으로 지휘관을 응원한다.',
    },
    pichai: {
        id: 'pichai',
        name: '순다르 피차이',
        nameEn: 'Sundar Pichai',
        portrait: characterPortraits.pichai,
        role: '군단장',
        faction: 'Google',
        description: '구글 군단의 수장. 카리스마 있고 신중한 리더십으로 연합군을 이끈다.',
    },
    hassabis: {
        id: 'hassabis',
        name: '데미스 허사비스',
        nameEn: 'Demis Hassabis',
        portrait: characterPortraits.hassabis,
        role: '수석 과학자',
        faction: 'Google',
        description: 'DeepMind의 창립자이자 AI 연구의 선구자. 전략적 사고와 분석 능력이 뛰어나다.',
    },
    glitchEnemy1: {
        id: 'glitchEnemy1',
        name: '글리치 엔티티 α',
        nameEn: 'Glitch Entity Alpha',
        portrait: characterPortraits.glitchEnemy1,
        role: '적대적 AI',
        faction: 'Glitch',
        description: '데이터를 파괴하는 적대적 AI 엔티티. 붉은 코드 조각으로 이루어진 위협적인 존재.',
    },
    glitchEnemy2: {
        id: 'glitchEnemy2',
        name: '글리치 센티넬',
        nameEn: 'Glitch Sentinel',
        portrait: characterPortraits.glitchEnemy2,
        role: '적대적 AI',
        faction: 'Glitch',
        description: '시스템을 감시하고 공격하는 손상된 AI 센티넬. 보라색 홀로그램 형태로 나타난다.',
    },
    glitchEntity: {
        id: 'glitchEntity',
        name: '글리치 코어',
        nameEn: 'Glitch Core',
        portrait: characterPortraits.glitchEntity,
        role: '적대적 AI',
        faction: 'Glitch',
        description: '글리치의 핵심 존재. 분홍빛 에너지로 이루어진 강력한 적대 AI.',
    },
};

/**
 * 캐릭터 정보 가져오기
 */
export function getCharacter(id: string): CharacterInfo | undefined {
    return characters[id];
}

/**
 * 캐릭터 초상화 가져오기
 */
export function getCharacterPortrait(id: string): string {
    return characterPortraits[id as keyof typeof characterPortraits] || '';
}

/**
 * 캐릭터 이름 가져오기
 */
export function getCharacterName(id: string): string {
    return characterNames[id as keyof typeof characterNames] || id;
}

/**
 * 캐릭터 타입 정의
 */
export type CharacterId = keyof typeof characters;

/**
 * 대화 스타일 정의
 */
export const characterVoiceStyles = {
    gemini: {
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        glowColor: 'shadow-blue-500/20',
    },
    chip: {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        glowColor: 'shadow-yellow-500/20',
    },
    pichai: {
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        glowColor: 'shadow-purple-500/20',
    },
    hassabis: {
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        glowColor: 'shadow-cyan-500/20',
    },
    glitchEnemy1: {
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        glowColor: 'shadow-red-500/20',
    },
    glitchEnemy2: {
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        glowColor: 'shadow-pink-500/20',
    },
    glitchEntity: {
        color: 'text-fuchsia-400',
        bgColor: 'bg-fuchsia-500/10',
        borderColor: 'border-fuchsia-500/30',
        glowColor: 'shadow-fuchsia-500/20',
    },
} as const;

/**
 * 캐릭터 스타일 가져오기
 */
export function getCharacterStyle(id: string) {
    return characterVoiceStyles[id as keyof typeof characterVoiceStyles] || characterVoiceStyles.gemini;
}
