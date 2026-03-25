'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { kakaoLoginPopup, exchangeKakaoTokenForFirebase, initKakao } from '@/lib/kakao-auth';

export default function KakaoLoginButton() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/main';
    const [isLoading, setIsLoading] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);

    // Kakao SDK 동적 로드
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const loadKakaoSDK = () => {
            if (window.Kakao) {
                initKakao();
                setSdkReady(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
            script.async = true;
            script.onload = () => {
                initKakao();
                setSdkReady(true);
            };
            script.onerror = () => {
                console.error('[Kakao] SDK 로드 실패');
            };
            document.head.appendChild(script);
        };

        loadKakaoSDK();
    }, []);

    const handleKakaoLogin = async () => {
        if (!sdkReady) {
            alert('카카오 SDK 로딩 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. 카카오 팝업 로그인 → access_token
            const accessToken = await kakaoLoginPopup();

            // 2. 서버에서 Firebase Custom Token 발급
            const customToken = await exchangeKakaoTokenForFirebase(accessToken);

            // 3. Firebase 로그인
            if (!auth) throw new Error('Firebase auth 초기화 실패');
            await signInWithCustomToken(auth, customToken);

            console.log('[Kakao] Firebase 로그인 완료');
            router.push(redirectUrl);

        } catch (error: any) {
            console.error('[Kakao] 로그인 실패:', error);

            if (error.message?.includes('Firebase Admin 설정이 필요합니다')) {
                alert('서버 설정이 필요합니다. 관리자에게 문의하세요.');
            } else if (error.message?.includes('팝업') || error.message?.includes('popup')) {
                alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
            } else {
                alert('카카오 로그인 실패: ' + (error.message || '알 수 없는 오류'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleKakaoLogin}
            disabled={isLoading || !sdkReady}
            className="w-full flex items-center justify-center gap-3 py-3 bg-[#FEE500] hover:bg-[#FFDC00] text-[#3C1E1E] rounded-lg font-bold transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#3C1E1E]/30 border-t-[#3C1E1E] rounded-full animate-spin" />
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 3C6.48 3 2 6.73 2 11.35c0 2.88 1.73 5.41 4.38 6.97L5.3 21.6a.5.5 0 00.74.56l4.23-2.73c.56.07 1.14.12 1.73.12 5.52 0 10-3.73 10-8.2S17.52 3 12 3z"
                        fill="#3C1E1E"
                    />
                </svg>
            )}
            <span>{isLoading ? '연결 중...' : '카카오로 시작하기'}</span>
        </button>
    );
}
