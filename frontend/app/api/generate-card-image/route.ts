import { NextRequest, NextResponse } from 'next/server';
import {
    generateCardPrompt,
    getReplicateParams,
    validatePrompt,
    NEGATIVE_PROMPT
} from '@/lib/ai-prompt-templates';

/**
 * AI 카드 이미지 생성 API
 * POST /api/generate-card-image
 *
 * Body:
 * - faction: string (machine, cyberpunk, union, emperor, empire)
 * - rarity: string (common, rare, epic, legendary, mythic, unique)
 * - name: string (카드 이름)
 * - userPrompt?: string (사용자 커스텀 프롬프트)
 * - styleModifier?: string (artistic, realistic, anime, painting, cinematic)
 * - numOutputs?: number (생성할 이미지 개수, 기본 4장)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            faction = 'cyberpunk',
            rarity = 'common',
            name,
            userPrompt,
            styleModifier,
            numOutputs = 4
        } = body;

        // 필수 파라미터 검증
        if (!name || typeof name !== 'string') {
            return NextResponse.json(
                { error: '카드 이름은 필수입니다.' },
                { status: 400 }
            );
        }

        // 사용자 프롬프트 검증 (있을 경우)
        if (userPrompt) {
            const validation = validatePrompt(userPrompt);
            if (!validation.isValid) {
                return NextResponse.json(
                    { error: validation.message },
                    { status: 400 }
                );
            }
        }

        // Replicate API 키 확인
        const replicateToken = process.env.REPLICATE_API_TOKEN;
        if (!replicateToken) {
            console.error('[AI Image] REPLICATE_API_TOKEN not configured');

            // Mock 응답 (개발 환경용)
            if (process.env.NODE_ENV === 'development') {
                return NextResponse.json({
                    success: false,
                    mockMode: true,
                    message: 'Replicate API 토큰이 설정되지 않았습니다. .env.local에 REPLICATE_API_TOKEN을 추가해주세요.',
                    images: [
                        `/assets/cards/dark_${faction}.png`,
                        `/assets/cards/dark_${faction}.png`,
                        `/assets/cards/dark_${faction}.png`,
                        `/assets/cards/dark_${faction}.png`
                    ],
                    prompt: generateCardPrompt(faction, rarity, name, userPrompt, styleModifier as any)
                });
            }

            return NextResponse.json(
                { error: 'AI 이미지 생성 서비스가 설정되지 않았습니다.' },
                { status: 503 }
            );
        }

        // 프롬프트 생성
        const prompt = generateCardPrompt(
            faction,
            rarity,
            name,
            userPrompt,
            styleModifier as any
        );

        console.log('[AI Image] Generating with prompt:', prompt.substring(0, 100) + '...');

        // Replicate API 호출
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${replicateToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // SDXL
                input: getReplicateParams(prompt, numOutputs)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[AI Image] Replicate API error:', errorData);
            throw new Error(`Replicate API error: ${response.status}`);
        }

        const prediction = await response.json();
        console.log('[AI Image] Prediction started:', prediction.id);

        // Prediction 완료 대기 (최대 60초)
        let attempt = 0;
        const maxAttempts = 60;
        let result: any = prediction;

        while (result.status !== 'succeeded' && result.status !== 'failed' && attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기

            const statusResponse = await fetch(
                `https://api.replicate.com/v1/predictions/${prediction.id}`,
                {
                    headers: {
                        'Authorization': `Token ${replicateToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            result = await statusResponse.json();
            attempt++;

            console.log(`[AI Image] Status check ${attempt}/${maxAttempts}:`, result.status);
        }

        if (result.status === 'failed') {
            console.error('[AI Image] Generation failed:', result.error);
            return NextResponse.json(
                { error: '이미지 생성에 실패했습니다. 다시 시도해주세요.' },
                { status: 500 }
            );
        }

        if (result.status !== 'succeeded') {
            console.error('[AI Image] Timeout after', maxAttempts, 'seconds');
            return NextResponse.json(
                { error: '이미지 생성 시간이 초과되었습니다. 다시 시도해주세요.' },
                { status: 504 }
            );
        }

        // 생성된 이미지 URL 반환
        const images = result.output as string[];

        console.log('[AI Image] Generation succeeded:', images.length, 'images');

        return NextResponse.json({
            success: true,
            images,
            prompt,
            predictionId: prediction.id,
            message: `${images.length}장의 이미지를 생성했습니다.`
        });

    } catch (error: any) {
        console.error('[AI Image] Unexpected error:', error);
        return NextResponse.json(
            { error: error.message || '알 수 없는 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

/**
 * API 상태 확인
 * GET /api/generate-card-image
 */
export async function GET() {
    const isConfigured = !!process.env.REPLICATE_API_TOKEN;

    return NextResponse.json({
        service: 'AI Card Image Generation',
        status: isConfigured ? 'ready' : 'not_configured',
        provider: 'Replicate (SDXL)',
        message: isConfigured
            ? 'AI 이미지 생성 서비스가 준비되었습니다.'
            : 'REPLICATE_API_TOKEN을 .env.local에 추가해주세요.',
        documentation: 'https://replicate.com/stability-ai/sdxl'
    });
}
