
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { prompt, duration_seconds = 1.0 } = await request.json();
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
            method: 'POST',
            headers: {
                'accept': 'audio/mpeg',
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: prompt,
                duration_seconds,
                prompt_influence: 0.3,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
            headers: { 'Content-Type': 'audio/mpeg' },
        });
    } catch (error) {
        console.error('[SFX API Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
