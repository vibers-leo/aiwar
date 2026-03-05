/**
 * Kakao JavaScript SDK 기반 클라이언트 인증
 * 카카오 로그인 → Firebase Custom Token → Firebase 로그인
 */

declare global {
    interface Window {
        Kakao: any;
    }
}

let isInitialized = false;

/**
 * Kakao SDK 초기화 (클라이언트 사이드)
 */
export function initKakao(): boolean {
    if (typeof window === 'undefined') return false;
    if (isInitialized && window.Kakao?.isInitialized()) return true;

    const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
    if (!key) {
        console.error('[Kakao] NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY 환경변수가 없습니다.');
        return false;
    }

    if (!window.Kakao) {
        console.error('[Kakao] Kakao SDK가 로드되지 않았습니다. _document.tsx에 스크립트를 추가하세요.');
        return false;
    }

    if (!window.Kakao.isInitialized()) {
        window.Kakao.init(key);
    }

    isInitialized = true;
    console.log('[Kakao] SDK 초기화 완료');
    return true;
}

/**
 * 카카오 로그인 팝업 실행 → access_token 반환
 */
export function kakaoLoginPopup(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!initKakao()) {
            reject(new Error('Kakao SDK 초기화 실패'));
            return;
        }

        window.Kakao.Auth.login({
            success: (authObj: { access_token: string }) => {
                console.log('[Kakao] 로그인 성공:', authObj.access_token.slice(0, 10) + '...');
                resolve(authObj.access_token);
            },
            fail: (err: any) => {
                console.error('[Kakao] 로그인 실패:', err);
                reject(new Error(err.error_description || '카카오 로그인에 실패했습니다.'));
            },
        });
    });
}

/**
 * 카카오 access_token → Firebase Custom Token 교환 (API Route 호출)
 */
export async function exchangeKakaoTokenForFirebase(accessToken: string): Promise<string> {
    const response = await fetch('/api/auth/kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '카카오 인증 서버 오류');
    }

    const { customToken } = await response.json();
    return customToken;
}

/**
 * 카카오 로그아웃
 */
export function kakaoLogout(): Promise<void> {
    return new Promise((resolve) => {
        if (!window.Kakao?.Auth) {
            resolve();
            return;
        }

        window.Kakao.Auth.logout(() => {
            console.log('[Kakao] 로그아웃 완료');
            resolve();
        });
    });
}
