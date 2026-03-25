/**
 * Firebase Admin SDK 초기화
 * 서버 사이드 전용 (API Routes에서만 사용)
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;

function getAdminApp(): App {
    if (adminApp) return adminApp;

    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return adminApp;
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            'Firebase Admin 환경변수 미설정:\n' +
            'FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY\n' +
            'Firebase Console > Project Settings > Service accounts 에서 키를 생성하세요.'
        );
    }

    adminApp = initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });

    return adminApp;
}

export function getAdminAuth() {
    return getAuth(getAdminApp());
}

/**
 * 카카오 UID로 Firebase Custom Token 발급
 * 클라이언트에서 signInWithCustomToken()에 사용
 */
export async function createKakaoCustomToken(kakaoUid: string): Promise<string> {
    const auth = getAdminAuth();
    const firebaseUid = `kakao:${kakaoUid}`;

    const customToken = await auth.createCustomToken(firebaseUid, {
        provider: 'kakao',
        kakaoUid,
    });

    return customToken;
}
