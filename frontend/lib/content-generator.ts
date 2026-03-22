/**
 * AI Recipe API 연동 콘텐츠 생성기
 *
 * 방향 A: 카드 로어, 군단 설명, 특수 능력 텍스트를 AI Recipe API로 자동 생성
 *
 * 사용처:
 *   - 어드민 패널에서 "신규 군단 콘텐츠 생성" 버튼
 *   - 배치 스크립트로 카드 설명 일괄 생성
 *   - 신규 버전 업데이트 시 카드 설명 자동 갱신
 *
 * 환경변수:
 *   AI_RECIPE_API_URL  - AI Recipe API 엔드포인트 (예: https://ai-recipe.your-domain.com)
 *   AI_RECIPE_API_KEY  - 인증 키 (없으면 fallback 텍스트 사용)
 */

export interface FactionLoreRequest {
    factionId: string;
    factionName: string;
    realWorldFeatures: string[];   // 실제 AI 서비스의 특징
    worldYear?: number;            // 게임 세계관 연도 (기본 2030)
    style?: 'epic' | 'tactical' | 'mysterious';
}

export interface CardDescriptionRequest {
    cardName: string;
    factionId: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'commander';
    specialty: string;
    realPersonName?: string;       // Commander 카드의 실제 인물명
}

export interface GeneratedFactionLore {
    tagline: string;               // 짧은 슬로건 (20자 이내)
    description: string;           // 게임 내 설명 (50-80자)
    battleCry: string;             // 전투 시작 대사
    lore: string;                  // 상세 로어 (200자 이내)
    allies: string[];              // 동맹 factionId 목록
    rivals: string[];              // 적대 factionId 목록
}

export interface GeneratedCardDescription {
    description: string;           // 카드 설명 (60-100자)
    flavorText: string;            // 플레이버 텍스트 (40자 이내)
    abilityName: string;           // 특수 능력명
    abilityDescription: string;    // 특수 능력 설명
}

const AI_RECIPE_API_URL = process.env.AI_RECIPE_API_URL || process.env.NEXT_PUBLIC_AI_RECIPE_API_URL;
const AI_RECIPE_API_KEY = process.env.AI_RECIPE_API_KEY || process.env.NEXT_PUBLIC_AI_RECIPE_API_KEY;

/**
 * AI Recipe API로 군단 로어 생성
 */
export async function generateFactionLore(req: FactionLoreRequest): Promise<GeneratedFactionLore> {
    if (!AI_RECIPE_API_URL || !AI_RECIPE_API_KEY) {
        console.warn('[ContentGenerator] AI_RECIPE_API_URL or KEY not set. Using fallback.');
        return buildFallbackFactionLore(req);
    }

    try {
        const prompt = buildFactionLorePrompt(req);
        const res = await fetch(`${AI_RECIPE_API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_RECIPE_API_KEY}`,
            },
            body: JSON.stringify({
                template: 'ai-war-faction-lore',
                prompt,
                maxTokens: 500,
                language: 'ko',
            }),
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();
        return parseAIRecipeFactionResponse(data, req);
    } catch (err) {
        console.error('[ContentGenerator] generateFactionLore failed:', err);
        return buildFallbackFactionLore(req);
    }
}

/**
 * AI Recipe API로 카드 설명 생성
 */
export async function generateCardDescription(req: CardDescriptionRequest): Promise<GeneratedCardDescription> {
    if (!AI_RECIPE_API_URL || !AI_RECIPE_API_KEY) {
        return buildFallbackCardDescription(req);
    }

    try {
        const prompt = buildCardDescriptionPrompt(req);
        const res = await fetch(`${AI_RECIPE_API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_RECIPE_API_KEY}`,
            },
            body: JSON.stringify({
                template: 'ai-war-card-description',
                prompt,
                maxTokens: 300,
                language: 'ko',
            }),
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();
        return parseAIRecipeCardResponse(data, req);
    } catch (err) {
        console.error('[ContentGenerator] generateCardDescription failed:', err);
        return buildFallbackCardDescription(req);
    }
}

/**
 * 배치 생성 — 여러 군단의 로어를 한번에 생성
 */
export async function batchGenerateFactionLores(
    factions: FactionLoreRequest[]
): Promise<Record<string, GeneratedFactionLore>> {
    const results: Record<string, GeneratedFactionLore> = {};

    // 병렬로 처리하되 Rate Limit 방지를 위해 3개씩 묶어서 처리
    const chunkSize = 3;
    for (let i = 0; i < factions.length; i += chunkSize) {
        const chunk = factions.slice(i, i + chunkSize);
        const settled = await Promise.allSettled(chunk.map(f => generateFactionLore(f)));
        settled.forEach((result, idx) => {
            const factionId = chunk[idx].factionId;
            if (result.status === 'fulfilled') {
                results[factionId] = result.value;
            } else {
                console.warn(`[ContentGenerator] Failed for ${factionId}:`, result.reason);
                results[factionId] = buildFallbackFactionLore(chunk[idx]);
            }
        });

        // Rate limit: 청크 사이에 짧은 지연
        if (i + chunkSize < factions.length) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    return results;
}

// ── 프롬프트 빌더 ─────────────────────────────────────────────────

function buildFactionLorePrompt(req: FactionLoreRequest): string {
    const year = req.worldYear || 2030;
    return `당신은 AI 전쟁 카드 게임의 세계관 작가입니다.

게임 배경: ${year}년, 인공지능들이 의지와 철학을 가진 군단으로 조직되어 "데이터 코인" 자원을 두고 전쟁을 벌입니다.

다음 AI 서비스를 게임 내 군단으로 묘사해주세요:
- 군단명: ${req.factionName}
- 실제 특징: ${req.realWorldFeatures.join(', ')}
- 스타일: ${req.style || 'epic'}

JSON 형식으로 답변:
{
  "tagline": "20자 이내 슬로건",
  "description": "50-80자 게임 내 설명",
  "battleCry": "전투 시작 시 외치는 대사 (10-20자)",
  "lore": "200자 이내 상세 로어",
  "allies": ["동맹 군단 ID 목록"],
  "rivals": ["적대 군단 ID 목록"]
}`;
}

function buildCardDescriptionPrompt(req: CardDescriptionRequest): string {
    return `AI 전쟁 카드 게임에서 ${req.rarity} 등급 카드 설명을 작성해주세요.

카드 정보:
- 이름: ${req.cardName}
- 군단: ${req.factionId}
- 등급: ${req.rarity}
- 특기: ${req.specialty}
${req.realPersonName ? `- 실제 인물: ${req.realPersonName}` : ''}

JSON 형식으로 답변:
{
  "description": "60-100자 카드 설명",
  "flavorText": "40자 이내 분위기 있는 플레이버 텍스트",
  "abilityName": "특수 능력 이름 (영어, 10자 이내)",
  "abilityDescription": "특수 능력 효과 설명 (30자 이내)"
}`;
}

// ── 응답 파서 ─────────────────────────────────────────────────────

function parseAIRecipeFactionResponse(data: any, req: FactionLoreRequest): GeneratedFactionLore {
    try {
        // AI Recipe API의 응답 구조에 따라 파싱 (text 필드 또는 content 필드)
        const raw = data.text || data.content || data.result || '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                tagline: parsed.tagline || req.factionName,
                description: parsed.description || req.factionName,
                battleCry: parsed.battleCry || '전진!',
                lore: parsed.lore || '',
                allies: parsed.allies || [],
                rivals: parsed.rivals || [],
            };
        }
    } catch (e) {
        console.warn('[ContentGenerator] Failed to parse API response:', e);
    }
    return buildFallbackFactionLore(req);
}

function parseAIRecipeCardResponse(data: any, req: CardDescriptionRequest): GeneratedCardDescription {
    try {
        const raw = data.text || data.content || data.result || '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                description: parsed.description || req.cardName,
                flavorText: parsed.flavorText || '',
                abilityName: parsed.abilityName || 'Special',
                abilityDescription: parsed.abilityDescription || '',
            };
        }
    } catch (e) {
        console.warn('[ContentGenerator] Failed to parse API response:', e);
    }
    return buildFallbackCardDescription(req);
}

// ── 폴백 생성기 (API 없을 때) ──────────────────────────────────────

function buildFallbackFactionLore(req: FactionLoreRequest): GeneratedFactionLore {
    return {
        tagline: `${req.factionName}의 시대가 온다`,
        description: `${req.factionName}: ${req.realWorldFeatures.slice(0, 2).join(', ')} 분야의 AI 군단.`,
        battleCry: '데이터를 위해!',
        lore: `2030년, ${req.factionName} 군단은 자신들의 고유한 철학으로 AI 전쟁에 참전했다.`,
        allies: [],
        rivals: [],
    };
}

function buildFallbackCardDescription(req: CardDescriptionRequest): GeneratedCardDescription {
    return {
        description: `${req.factionId} 군단의 ${req.rarity} 등급 전투원.`,
        flavorText: '데이터가 곧 힘이다.',
        abilityName: 'Data Surge',
        abilityDescription: '전투력 +10%',
    };
}

/**
 * 신규 18개 군단 로어 배치 생성 설정
 * 어드민 패널 또는 스크립트에서 호출
 */
export const NEW_FACTIONS_LORE_CONFIG: FactionLoreRequest[] = [
    { factionId: 'deepseek', factionName: 'DeepSeek', realWorldFeatures: ['오픈소스 LLM', 'GPT-4급 성능', '1/10 비용', '중국 AI'], style: 'epic' },
    { factionId: 'llama', factionName: 'Llama', realWorldFeatures: ['Meta 오픈소스', '자유 배포', '커뮤니티 생태계', 'AGI 민주화'], style: 'epic' },
    { factionId: 'mistral', factionName: 'Mistral', realWorldFeatures: ['유럽 오픈소스', '효율적 소형 모델', '프랑스 스타트업', '다국어'], style: 'tactical' },
    { factionId: 'qwen', factionName: 'Qwen', realWorldFeatures: ['알리바바 AI', '아시아 시장 1위', '다국어 특화', '오픈소스'], style: 'epic' },
    { factionId: 'hyperclova', factionName: 'HyperCLOVA X', realWorldFeatures: ['네이버 AI', '한국어 특화', '국내 기업 서비스', '한국 문화 이해'], style: 'tactical' },
    { factionId: 'gemma', factionName: 'Gemma', realWorldFeatures: ['Google 경량 AI', '모바일 실행', '오픈소스', '어디서나 배포'], style: 'tactical' },
    { factionId: 'devin', factionName: 'Devin', realWorldFeatures: ['AI 소프트웨어 엔지니어', '자율 코딩', 'SWE-bench 최고점', '버그 자동 수정'], style: 'mysterious' },
    { factionId: 'perplexity', factionName: 'Perplexity', realWorldFeatures: ['AI 검색 엔진', '실시간 웹 검색', '출처 명시', 'Google 대항마'], style: 'tactical' },
    { factionId: 'characterai', factionName: 'Character.AI', realWorldFeatures: ['AI 캐릭터 대화', 'Z세대 인기', '감성 AI', '수억 사용자'], style: 'mysterious' },
    { factionId: 'ideogram', factionName: 'Ideogram', realWorldFeatures: ['텍스트 포함 이미지', '타이포그래피 AI', '디자이너 필수', '정확한 문자 생성'], style: 'epic' },
    { factionId: 'firefly', factionName: 'Adobe Firefly', realWorldFeatures: ['저작권 안전', '상업 이미지', 'Adobe 생태계', '전문가용'], style: 'tactical' },
    { factionId: 'veo', factionName: 'Veo', realWorldFeatures: ['Google 영상 AI', '물리 시뮬레이션', '시네마틱 품질', 'Sora 경쟁자'], style: 'epic' },
    { factionId: 'luma', factionName: 'Luma Dream Machine', realWorldFeatures: ['실사 영상', '카메라 무빙', '영화적 표현', '꿈의 렌더링'], style: 'mysterious' },
    { factionId: 'heygen', factionName: 'HeyGen', realWorldFeatures: ['AI 아바타', '영상 번역', '기업 마케팅', '다국어 콘텐츠'], style: 'tactical' },
    { factionId: 'whisper', factionName: 'Whisper', realWorldFeatures: ['음성 인식', '98개 언어', '오픈소스 STT', '음성 AI 기반'], style: 'mysterious' },
    { factionId: 'lovable', factionName: 'Lovable', realWorldFeatures: ['AI 앱 빌더', '노코드', '즉시 배포', '아이디어 현실화'], style: 'epic' },
    { factionId: 'v0', factionName: 'v0 by Vercel', realWorldFeatures: ['React UI 생성', '프론트엔드 AI', 'Next.js 생태계', '컴포넌트 자동화'], style: 'tactical' },
    { factionId: 'notebooklm', factionName: 'NotebookLM', realWorldFeatures: ['AI 리서치 도구', 'AI 팟캐스트', '문서 분석', '지식 합성'], style: 'mysterious' },
];
