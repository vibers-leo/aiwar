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

    // ── 신규 LLM ────────────────────────────────────────────────────
    {
        cardId: 'hero-deepseek',
        displayName: 'DeepSeek (Liang Wenfeng)',
        faction: 'deepseek',
        category: 'text',
        currentGameVersion: 'DeepSeek R2',
        latestKnownVersion: 'DeepSeek R2',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        officialModelId: 'deepseek-r1',
        releaseDate: '2026-01-20',
        benchmarks: { mmlu: 91.0, humaneval: 92.0, speedTps: 55, contextWindow: 128000 },
        statSuggestion: { accuracy: 97, speed: 96, creativity: 90, stability: 88 },
    },
    {
        cardId: 'hero-llama',
        displayName: 'Llama (Meta)',
        faction: 'llama',
        category: 'text',
        currentGameVersion: 'Llama 4',
        latestKnownVersion: 'Llama 4 Scout',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        officialModelId: 'meta-llama/llama-4-scout',
        releaseDate: '2026-03-10',
        benchmarks: { mmlu: 89.0, humaneval: 88.0, speedTps: 72, contextWindow: 1048576 },
        statSuggestion: { accuracy: 88, speed: 90, creativity: 85, stability: 88 },
    },
    {
        cardId: 'hero-mistral',
        displayName: 'Mistral Large',
        faction: 'mistral',
        category: 'text',
        currentGameVersion: 'Mistral Large 2',
        latestKnownVersion: 'Mistral Large 2501',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        officialModelId: 'mistral-large-latest',
        releaseDate: '2025-12-15',
        benchmarks: { mmlu: 84.0, humaneval: 92.0, speedTps: 60, contextWindow: 128000 },
        statSuggestion: { accuracy: 93, speed: 90, creativity: 88, stability: 90 },
    },
    {
        cardId: 'hero-qwen',
        displayName: 'Qwen 3 (Alibaba)',
        faction: 'qwen',
        category: 'text',
        currentGameVersion: 'Qwen 3',
        latestKnownVersion: 'Qwen3-235B-A22B',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        officialModelId: 'qwen3-235b-a22b',
        releaseDate: '2026-02-20',
        benchmarks: { mmlu: 87.0, humaneval: 90.0, speedTps: 50, contextWindow: 32768 },
        statSuggestion: { accuracy: 90, speed: 88, creativity: 85, stability: 88 },
    },
    {
        cardId: 'hero-hyperclova',
        displayName: 'HyperCLOVA X (Naver)',
        faction: 'hyperclova',
        category: 'text',
        currentGameVersion: 'HyperCLOVA X',
        latestKnownVersion: 'HyperCLOVA X SEED',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        officialModelId: 'hyperclova-x',
        releaseDate: '2025-11-01',
        benchmarks: { mmlu: 78.0, humaneval: 72.0, speedTps: 45, contextWindow: 32768 },
        statSuggestion: { accuracy: 88, speed: 83, stability: 92, ethics: 90 },
    },
    {
        cardId: 'hero-gemma',
        displayName: 'Gemma 3 (Google)',
        faction: 'gemma',
        category: 'text',
        currentGameVersion: 'Gemma 3',
        latestKnownVersion: 'Gemma 3 27B',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        officialModelId: 'gemma-3-27b-it',
        releaseDate: '2026-03-12',
        benchmarks: { mmlu: 82.0, humaneval: 80.0, speedTps: 90, contextWindow: 128000 },
        statSuggestion: { accuracy: 88, speed: 95, stability: 92 },
    },

    // ── 신규 AGENT ──────────────────────────────────────────────────
    {
        cardId: 'hero-devin',
        displayName: 'Devin 2 (Cognition)',
        faction: 'devin',
        category: 'code',
        currentGameVersion: 'Devin 2',
        latestKnownVersion: 'Devin 2',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2026-02-15',
        benchmarks: { humaneval: 97, contextWindow: 200000 },
        statSuggestion: { accuracy: 97, creativity: 92, speed: 88, stability: 85 },
    },
    {
        cardId: 'hero-perplexity',
        displayName: 'Perplexity Pro',
        faction: 'perplexity',
        category: 'text',
        currentGameVersion: 'Perplexity Pro 2026',
        latestKnownVersion: 'Perplexity Pro 2026',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2026-01-01',
        statSuggestion: { accuracy: 93, speed: 97, stability: 83 },
    },
    {
        cardId: 'hero-characterai',
        displayName: 'Character.AI',
        faction: 'characterai',
        category: 'text',
        currentGameVersion: 'Character.AI 2026',
        latestKnownVersion: 'Character.AI 2026',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2025-09-01',
        statSuggestion: { creativity: 90, stability: 83, ethics: 72 },
    },

    // ── 신규 IMAGE ──────────────────────────────────────────────────
    {
        cardId: 'hero-ideogram',
        displayName: 'Ideogram 3',
        faction: 'ideogram',
        category: 'image',
        currentGameVersion: 'Ideogram 3',
        latestKnownVersion: 'Ideogram 3',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2026-02-01',
        statSuggestion: { creativity: 97, accuracy: 93, stability: 85 },
    },
    {
        cardId: 'hero-firefly',
        displayName: 'Adobe Firefly 4',
        faction: 'firefly',
        category: 'image',
        currentGameVersion: 'Firefly 4',
        latestKnownVersion: 'Firefly 4',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2026-01-15',
        statSuggestion: { accuracy: 88, stability: 95, ethics: 95 },
    },

    // ── 신규 VIDEO ──────────────────────────────────────────────────
    {
        cardId: 'hero-veo',
        displayName: 'Veo 3 (Google)',
        faction: 'veo',
        category: 'video',
        currentGameVersion: 'Veo 3',
        latestKnownVersion: 'Veo 3',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2026-03-01',
        statSuggestion: { accuracy: 90, creativity: 88, stability: 88 },
    },
    {
        cardId: 'hero-luma',
        displayName: 'Luma Dream Machine 2',
        faction: 'luma',
        category: 'video',
        currentGameVersion: 'Dream Machine 2',
        latestKnownVersion: 'Dream Machine 2',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2026-02-10',
        statSuggestion: { creativity: 93, accuracy: 86, stability: 83 },
    },
    {
        cardId: 'hero-heygen',
        displayName: 'HeyGen 3',
        faction: 'heygen',
        category: 'video',
        currentGameVersion: 'HeyGen 3',
        latestKnownVersion: 'HeyGen 3',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2026-01-20',
        statSuggestion: { accuracy: 88, speed: 90, stability: 88 },
    },

    // ── 신규 AUDIO ──────────────────────────────────────────────────
    {
        cardId: 'hero-whisper',
        displayName: 'Whisper v3 (OpenAI)',
        faction: 'whisper',
        category: 'voice',
        currentGameVersion: 'Whisper v3',
        latestKnownVersion: 'Whisper Large v3 Turbo',
        lastCheckedAt: '2026-03-23',
        source: 'openai-api',
        officialModelId: 'whisper-1',
        releaseDate: '2025-10-01',
        benchmarks: { speedTps: 200, contextWindow: 1500 },
        statSuggestion: { accuracy: 97, speed: 93, stability: 90 },
    },

    // ── 신규 BUILDER ────────────────────────────────────────────────
    {
        cardId: 'hero-lovable',
        displayName: 'Lovable 2',
        faction: 'lovable',
        category: 'code',
        currentGameVersion: 'Lovable 2',
        latestKnownVersion: 'Lovable 2',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2026-02-01',
        statSuggestion: { creativity: 90, speed: 90, stability: 83 },
    },
    {
        cardId: 'hero-v0',
        displayName: 'v0 by Vercel',
        faction: 'v0',
        category: 'code',
        currentGameVersion: 'v0 2026',
        latestKnownVersion: 'v0 2026',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2026-01-01',
        statSuggestion: { creativity: 93, speed: 93, accuracy: 88 },
    },
    {
        cardId: 'hero-notebooklm',
        displayName: 'NotebookLM (Google)',
        faction: 'notebooklm',
        category: 'text',
        currentGameVersion: 'NotebookLM 2026',
        latestKnownVersion: 'NotebookLM Plus 2026',
        lastCheckedAt: '2026-03-23',
        source: 'manual',
        releaseDate: '2026-01-01',
        statSuggestion: { accuracy: 90, stability: 90, ethics: 88 },
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
