import { NextResponse } from 'next/server';
import { AI_VERSION_REGISTRY, AIModelInfo } from '@/lib/ai-version-registry';

interface VersionCheckResult {
    cardId: string;
    displayName: string;
    faction: string;
    currentGameVersion: string;
    latestKnownVersion: string;
    isOutdated: boolean;
    fetchedVersion?: string;   // API에서 실제로 가져온 버전
    source: string;
    lastCheckedAt: string;
    statSuggestion?: AIModelInfo['statSuggestion'];
    benchmarks?: AIModelInfo['benchmarks'];
}

/**
 * OpenAI API에서 최신 모델 목록 조회
 * 반환: 최신 GPT 모델 ID (예: 'gpt-4o-2024-11-20')
 */
async function fetchOpenAILatestModel(officialModelId?: string): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !officialModelId) return null;

    try {
        const res = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            next: { revalidate: 3600 }, // 1시간 캐시
        });
        if (!res.ok) return null;

        const data = await res.json();
        const models: Array<{ id: string; created: number }> = data.data || [];

        // officialModelId prefix로 시작하는 최신 모델 찾기 (예: 'gpt-4o')
        const prefix = officialModelId.split('-').slice(0, 2).join('-'); // 'gpt-4o'
        const matching = models
            .filter(m => m.id.startsWith(prefix))
            .sort((a, b) => b.created - a.created);

        return matching[0]?.id || null;
    } catch {
        return null;
    }
}

/**
 * Anthropic API에서 최신 모델 목록 조회
 */
async function fetchAnthropicLatestModel(officialModelId?: string): Promise<string | null> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || !officialModelId) return null;

    try {
        const res = await fetch('https://api.anthropic.com/v1/models', {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;

        const data = await res.json();
        const models: Array<{ id: string; created_at: string }> = data.data || [];

        // claude- prefix 모델 중 최신
        const claudeModels = models
            .filter(m => m.id.startsWith('claude-'))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return claudeModels[0]?.id || null;
    } catch {
        return null;
    }
}

/**
 * Google AI API에서 최신 Gemini 모델 조회
 */
async function fetchGoogleLatestModel(officialModelId?: string): Promise<string | null> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey || !officialModelId) return null;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) return null;

        const data = await res.json();
        const models: Array<{ name: string; displayName: string }> = data.models || [];

        // gemini- prefix 모델 중 최신 flash/pro
        const geminiModels = models.filter(m =>
            m.name.includes('gemini') && !m.name.includes('embedding')
        );

        return geminiModels[0]?.name?.replace('models/', '') || null;
    } catch {
        return null;
    }
}

/**
 * GET /api/admin/check-ai-versions
 * AI 모델 버전 레지스트리를 체크하고 outdated 목록을 반환
 */
export async function GET() {
    const results: VersionCheckResult[] = [];
    const checkedAt = new Date().toISOString();

    for (const entry of AI_VERSION_REGISTRY) {
        let fetchedVersion: string | null = null;

        // 소스별 API 호출
        if (entry.source === 'openai-api') {
            fetchedVersion = await fetchOpenAILatestModel(entry.officialModelId);
        } else if (entry.source === 'anthropic-api') {
            fetchedVersion = await fetchAnthropicLatestModel(entry.officialModelId);
        } else if (entry.source === 'google-api') {
            fetchedVersion = await fetchGoogleLatestModel(entry.officialModelId);
        }
        // manual 소스는 API 호출 없이 레지스트리 데이터만 사용

        const isOutdated = entry.currentGameVersion !== entry.latestKnownVersion;

        results.push({
            cardId: entry.cardId,
            displayName: entry.displayName,
            faction: entry.faction,
            currentGameVersion: entry.currentGameVersion,
            latestKnownVersion: entry.latestKnownVersion,
            isOutdated,
            fetchedVersion: fetchedVersion || undefined,
            source: entry.source,
            lastCheckedAt: checkedAt,
            statSuggestion: entry.statSuggestion,
            benchmarks: entry.benchmarks,
        });
    }

    const outdated = results.filter(r => r.isOutdated);
    const upToDate = results.filter(r => !r.isOutdated);

    return NextResponse.json({
        checkedAt,
        totalCount: results.length,
        outdatedCount: outdated.length,
        upToDateCount: upToDate.length,
        outdated,
        upToDate,
        all: results,
    });
}
