/**
 * POST /api/auth/kakao
 * 카카오 access_token → Firebase Custom Token 교환
 *
 * 흐름:
 * 1. 클라이언트에서 Kakao JS SDK로 로그인 → access_token 획득
 * 2. 이 API에 access_token POST
 * 3. 서버에서 Kakao /v2/user/me로 사용자 정보 확인
 * 4. Firebase Admin으로 Custom Token 발급
 * 5. 클라이언트에서 signInWithCustomToken() 호출
 */

import { NextRequest, NextResponse } from 'next/server';
import { createKakaoCustomToken } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { access_token } = await req.json();

        if (!access_token) {
            return NextResponse.json(
                { message: 'access_token이 필요합니다.' },
                { status: 400 }
            );
        }

        // 1. Kakao /v2/user/me 호출 - 사용자 정보 및 uid 획득
        const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        });

        if (!kakaoRes.ok) {
            const errText = await kakaoRes.text();
            console.error('[Kakao API] 사용자 정보 조회 실패:', errText);
            return NextResponse.json(
                { message: '유효하지 않은 카카오 토큰입니다.' },
                { status: 401 }
            );
        }

        const kakaoUser = await kakaoRes.json();
        const kakaoUid = String(kakaoUser.id);
        const nickname = kakaoUser.kakao_account?.profile?.nickname || '카카오유저';
        const profileImageUrl = kakaoUser.kakao_account?.profile?.profile_image_url || null;
        const email = kakaoUser.kakao_account?.email || null;

        console.log(`[Kakao Auth] 로그인: ${nickname} (uid: ${kakaoUid})`);

        // 2. Firebase Custom Token 발급
        const customToken = await createKakaoCustomToken(kakaoUid);

        // 바이버스 생태계 연결 (email 있을 때만, fire-and-forget)
        if (email) {
          fetch(`${process.env.VIBERS_SITE_URL ?? 'https://vibers.co.kr'}/api/vibers/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-vibers-secret': process.env.VIBERS_CONNECT_SECRET ?? '' },
            body: JSON.stringify({ type: 'join', brandSlug: 'aiwar', userEmail: email, userName: nickname }),
          }).catch(() => {});
        }

        // 3. 클라이언트로 반환
        return NextResponse.json({
            customToken,
            kakaoUser: {
                uid: kakaoUid,
                nickname,
                profileImageUrl,
                email,
            },
        });

    } catch (error: any) {
        console.error('[Kakao Auth API] 오류:', error);

        // Firebase Admin 미설정 오류 구분
        if (error.message?.includes('Firebase Admin 환경변수 미설정')) {
            return NextResponse.json(
                {
                    message: 'Firebase Admin 설정이 필요합니다.',
                    setup: 'Firebase Console > Project Settings > Service accounts에서 서비스 어카운트 키를 생성하고 환경변수를 설정하세요.',
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { message: '서버 오류: ' + error.message },
            { status: 500 }
        );
    }
}
