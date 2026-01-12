
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    console.log('[API] /api/tts-typecast hit');
    const body = await request.json();
    console.log('[API] Request body:', body);
    const { text, actor_id } = body;
    const apiKey = process.env.TYPECAST_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Typecast API key not configured' }, { status: 500 });
    }

    try {
        // 1. TTS 생성 요청 (Quickstart 문서 기준)
        const response = await fetch('https://api.typecast.ai/v1/text-to-speech', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                voice_id: actor_id, // actor_id -> voice_id
                model: 'ssfm-v21',  // 기본 고품질 모델
                prompt: {
                    preset: 'normal',
                    preset_intensity: 1.0,
                }
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();

        // Typecast API는 작업 완료 후 URL을 주거나 스트림을 줄 수 있는데, 
        // 일반적으로 v1/tts는 생성된 오디오 URL 또는 리다이렉션을 포함할 수 있습니다.
        // 여기서는 오디오 데이터를 직접 가져와서 반환하거나, URL을 클라이언트에 줄 수도 있습니다.
        // ElevenLabs 연동 방식에 맞춰 스트림(ArrayBuffer)으로 반환하도록 구현합니다.

        if (data.result && data.result.audio_url) {
            const audioResponse = await fetch(data.result.audio_url);
            const audioBuffer = await audioResponse.arrayBuffer();
            return new NextResponse(audioBuffer, {
                headers: { 'Content-Type': 'audio/mpeg' },
            });
        }

        return NextResponse.json({ error: 'Failed to generate audio URL' }, { status: 500 });
    } catch (error) {
        console.error('[Typecast API Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
