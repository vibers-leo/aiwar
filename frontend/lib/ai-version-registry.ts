/**
 * AI 모델 버전 레지스트리
 * 게임 카드 ↔ 실제 AI 모델 버전 매핑
 *
 * 업데이트 방법:
 * 1. /admin/ai-monitor 에서 "지금 체크" 버튼으로 최신 버전 확인
 * 2. 변경 감지 시 "업데이트" 클릭 → Firestore card_metadata에 저장
 * 3. latestKnownVersion / lastCheckedAt은 API 호출 시 자동 갱신
 */

export type VersionSource = 'openai-api' | 'anthropic-api' | 'google-api' | 'manual';

export interface AIModelInfo {
    cardId: string;              // card-database.ts의 id값
    displayName: string;         // 게임 표시명
    faction: string;             // aiFactionId
    category: 'text' | 'image' | 'video' | 'music' | 'voice' | 'code';
    currentGameVersion: string;  // 현재 게임에 반영된 버전
    latestKnownVersion: string;  // 외부 소스에서 확인된 최신 버전
    lastCheckedAt: string;       // ISO 날짜 (마지막 버전 확인 시각)
    source: VersionSource;       // 버전 데이터 출처
    officialModelId?: string;    // API에서 사용하는 공식 모델 ID (예: 'gpt-4o-2024-11-20')
    releaseDate?: string;        // 최신 버전 출시일 (ISO 날짜)
    benchmarks?: {
        mmlu?: number;           // MMLU 점수 (0-100)
        humaneval?: number;      // HumanEval 코드 벤치마크 (0-100)
        speedTps?: number;       // 토큰/초 (Artificial Analysis 기준)
        contextWindow?: number;  // 최대 컨텍스트 크기 (tokens)
    };
    statSuggestion?: {           // 버전 업 시 스탯 조정 제안값 (baseStats max 기준)
        creativity?: number;
        accuracy?: number;
        speed?: number;
        stability?: number;
        ethics?: number;
    };
}

/**
 * 게임 카드 ↔ 실제 AI 모델 매핑 레지스트리
 * commander 카드(CEO 카드)는 버전과 무관하므로 제외
 * hero/epic 카드만 관리
 */
export const AI_VERSION_REGISTRY: AIModelInfo[] = [
    // ── TEXT AI ──────────────────────────────────────────────────
    {
        cardId: 'hero-chatgpt',
        displayName: 'ChatGPT (OpenAI)',
        faction: 'chatgpt',
        category: 'text',
        currentGameVersion: 'GPT-5',
        latestKnownVersion: 'GPT-5.4',
        lastCheckedAt: '2026-03-06',
        source: 'openai-api',
        officialModelId: 'gpt-4o',
        releaseDate: '2026-03-05',
        benchmarks: { mmlu: 95.2, humaneval: 90.1, speedTps: 68, contextWindow: 128000 },
        statSuggestion: { accuracy: 97, speed: 97, creativity: 95 },
    },
    {
        cardId: 'hero-claude',
        displayName: 'Claude (Anthropic)',
        faction: 'claude',
        category: 'text',
        currentGameVersion: 'Claude 3.7 Sonnet',
        latestKnownVersion: 'Claude 3.7 Sonnet',
        lastCheckedAt: '2026-03-06',
        source: 'anthropic-api',
        officialModelId: 'claude-sonnet-4-6',
        releaseDate: '2026-02-24',
        benchmarks: { mmlu: 92.1, humaneval: 88.5, speedTps: 72, contextWindow: 200000 },
        statSuggestion: { accuracy: 100, ethics: 100, stability: 100 },
    },
    {
        cardId: 'hero-gemini',
        displayName: 'Gemini (Google)',
        faction: 'gemini',
        category: 'text',
        currentGameVersion: 'Gemini 2.0 Flash',
        latestKnownVersion: 'Gemini 2.0 Flash',
        lastCheckedAt: '2026-03-06',
        source: 'google-api',
        officialModelId: 'gemini-2.0-flash',
        releaseDate: '2026-01-15',
        benchmarks: { mmlu: 89.5, speedTps: 150, contextWindow: 1000000 },
        statSuggestion: { speed: 100, accuracy: 92, creativity: 93 },
    },
    {
        cardId: 'hero-grok',
        displayName: 'Grok (xAI)',
        faction: 'grok',
        category: 'text',
        currentGameVersion: 'Grok 3',
        latestKnownVersion: 'Grok 3',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        officialModelId: 'grok-3',
        releaseDate: '2026-02-17',
        benchmarks: { mmlu: 87.5, speedTps: 85, contextWindow: 131072 },
        statSuggestion: { creativity: 100, speed: 98, accuracy: 85 },
    },

    // ── IMAGE AI ─────────────────────────────────────────────────
    {
        cardId: 'hero-midjourney',
        displayName: 'Midjourney',
        faction: 'midjourney',
        category: 'image',
        currentGameVersion: 'Midjourney v7',
        latestKnownVersion: 'Midjourney v7',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2026-01-20',
        statSuggestion: { creativity: 100, accuracy: 90, stability: 85 },
    },
    {
        cardId: 'hero-dalle',
        displayName: 'DALL-E (OpenAI)',
        faction: 'dalle',
        category: 'image',
        currentGameVersion: 'DALL-E 4',
        latestKnownVersion: 'DALL-E 4',
        lastCheckedAt: '2026-03-06',
        source: 'openai-api',
        officialModelId: 'dall-e-3',
        releaseDate: '2025-09-01',
        statSuggestion: { creativity: 95, accuracy: 92, stability: 88 },
    },
    {
        cardId: 'hero-stable-diffusion',
        displayName: 'Stable Diffusion',
        faction: 'stable-diffusion',
        category: 'image',
        currentGameVersion: 'SDXL 3.5',
        latestKnownVersion: 'SD 3.5 Large Turbo',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2025-10-22',
        statSuggestion: { creativity: 90, speed: 95, stability: 80 },
    },
    {
        cardId: 'hero-flux',
        displayName: 'Flux (Black Forest Labs)',
        faction: 'flux',
        category: 'image',
        currentGameVersion: 'Flux 1.1 Pro',
        latestKnownVersion: 'Flux 1.1 Pro Ultra',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2025-12-01',
        statSuggestion: { creativity: 97, accuracy: 93, speed: 90 },
    },

    // ── VIDEO AI ─────────────────────────────────────────────────
    {
        cardId: 'hero-sora',
        displayName: 'Sora (OpenAI)',
        faction: 'sora',
        category: 'video',
        currentGameVersion: 'Sora 1.0',
        latestKnownVersion: 'Sora 2.0',
        lastCheckedAt: '2026-03-06',
        source: 'openai-api',
        releaseDate: '2026-02-01',
        statSuggestion: { creativity: 100, accuracy: 88, speed: 75 },
    },
    {
        cardId: 'hero-runway',
        displayName: 'Runway ML',
        faction: 'runway',
        category: 'video',
        currentGameVersion: 'Gen-3 Alpha',
        latestKnownVersion: 'Gen-4',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2026-01-10',
        statSuggestion: { creativity: 95, speed: 88, accuracy: 85 },
    },
    {
        cardId: 'hero-pika',
        displayName: 'Pika',
        faction: 'pika',
        category: 'video',
        currentGameVersion: 'Pika 2.1',
        latestKnownVersion: 'Pika 2.2',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2026-02-10',
        statSuggestion: { creativity: 90, speed: 92, stability: 85 },
    },
    {
        cardId: 'hero-kling',
        displayName: 'Kling (Kuaishou)',
        faction: 'kling',
        category: 'video',
        currentGameVersion: 'Kling 1.6',
        latestKnownVersion: 'Kling 2.0',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2026-02-20',
        statSuggestion: { creativity: 88, speed: 90, stability: 88 },
    },

    // ── MUSIC AI ─────────────────────────────────────────────────
    {
        cardId: 'hero-suno',
        displayName: 'Suno AI',
        faction: 'suno',
        category: 'music',
        currentGameVersion: 'Suno v4',
        latestKnownVersion: 'Suno v4.5',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2026-01-15',
        statSuggestion: { creativity: 100, accuracy: 88, stability: 85 },
    },
    {
        cardId: 'hero-udio',
        displayName: 'Udio',
        faction: 'udio',
        category: 'music',
        currentGameVersion: 'Udio 1.5',
        latestKnownVersion: 'Udio 1.5',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2025-11-01',
        statSuggestion: { creativity: 95, accuracy: 85, stability: 82 },
    },

    // ── VOICE AI ─────────────────────────────────────────────────
    {
        cardId: 'hero-elevenlabs',
        displayName: 'ElevenLabs',
        faction: 'elevenlabs',
        category: 'voice',
        currentGameVersion: 'ElevenLabs v3',
        latestKnownVersion: 'ElevenLabs v3',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2025-12-15',
        statSuggestion: { accuracy: 98, creativity: 90, stability: 95 },
    },

    // ── CODE AI ──────────────────────────────────────────────────
    {
        cardId: 'hero-copilot',
        displayName: 'GitHub Copilot',
        faction: 'copilot',
        category: 'code',
        currentGameVersion: 'Copilot (GPT-4o)',
        latestKnownVersion: 'Copilot (Claude Sonnet)',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2026-01-01',
        statSuggestion: { accuracy: 93, speed: 92, stability: 90 },
    },
    {
        cardId: 'hero-cursor',
        displayName: 'Cursor',
        faction: 'cursor',
        category: 'code',
        currentGameVersion: 'Cursor 0.45',
        latestKnownVersion: 'Cursor 0.47',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2026-02-28',
        statSuggestion: { accuracy: 95, speed: 95, creativity: 90 },
    },
    {
        cardId: 'hero-replit',
        displayName: 'Replit AI',
        faction: 'replit',
        category: 'code',
        currentGameVersion: 'Replit AI 2024',
        latestKnownVersion: 'Replit Agent 2025',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2025-09-15',
        statSuggestion: { accuracy: 88, speed: 90, stability: 85 },
    },
    {
        cardId: 'hero-codeium',
        displayName: 'Codeium (Windsurf)',
        faction: 'codeium',
        category: 'code',
        currentGameVersion: 'Windsurf 1.0',
        latestKnownVersion: 'Windsurf 2.0',
        lastCheckedAt: '2026-03-06',
        source: 'manual',
        releaseDate: '2026-02-01',
        statSuggestion: { accuracy: 92, speed: 93, stability: 88 },
    },
];

/**
 * cardId로 레지스트리 항목 조회
 */
export function getRegistryEntry(cardId: string): AIModelInfo | undefined {
    return AI_VERSION_REGISTRY.find(entry => entry.cardId === cardId);
}

/**
 * 현재 버전과 최신 버전이 다른 항목(업데이트 필요) 조회
 */
export function getOutdatedEntries(): AIModelInfo[] {
    return AI_VERSION_REGISTRY.filter(
        entry => entry.currentGameVersion !== entry.latestKnownVersion
    );
}

/**
 * faction으로 레지스트리 항목 조회
 */
export function getRegistryByFaction(faction: string): AIModelInfo | undefined {
    return AI_VERSION_REGISTRY.find(entry => entry.faction === faction);
}
