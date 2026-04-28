import { NextRequest, NextResponse } from 'next/server';

const ZEROCLAW_URL = process.env.ZEROCLAW_WEBHOOK_URL || 'http://49.50.138.93:42630/webhook';
const ZEROCLAW_TOKEN = process.env.ZEROCLAW_TOKEN || '';

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== 'string' || message.length > 500) {
            return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 });
        }

        if (!ZEROCLAW_TOKEN) {
            return NextResponse.json({ response: '챗봇이 아직 설정되지 않았어요.' }, { status: 200 });
        }

        const res = await fetch(ZEROCLAW_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ZEROCLAW_TOKEN}`,
            },
            body: JSON.stringify({ message }),
            signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) {
            return NextResponse.json({ response: '응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.' }, { status: 200 });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ response: '연결에 문제가 있어요. 잠시 후 다시 시도해 주세요.' }, { status: 200 });
    }
}
