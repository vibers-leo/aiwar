import {
    signInAnonymously,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    User
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { gameStorage } from './game-storage';

/**
 * 구글 로그인
 */
export async function signInWithGoogle(): Promise<User | null> {
    if (!isFirebaseConfigured || !auth) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return null;
    }

    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error: any) {
        console.error('구글 로그인 실패:', error);

        if (error.code === 'auth/unauthorized-domain') {
            alert(`[Firebase] 도메인 승인 오류: ${window.location.hostname} 가 승인된 도메인에 없습니다.\nFirebase Console > Authentication > Settings > Authorized Domains 에서 추가해주세요.`);
        } else if (error.code === 'auth/popup-closed-by-user') {
            console.log('사용자가 로그인 팝업을 닫았습니다.');
            alert('로그인 팝업이 닫혔습니다. 다시 시도해 주세요.');
        } else if (error.code === 'auth/cancelled-popup-request') {
            alert('이전 로그인 요청이 처리 중입니다. 잠시 후 다시 시도해 주세요.');
        } else if (error.code === 'auth/popup-blocked') {
            alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해 주세요.');
        } else {
            alert(`[Firebase Error ${error.code}] ${error.message}`);
        }

        return null;
    }
}

/**
 * 익명 로그인
 * 자동으로 사용자 ID를 생성하고 로그인합니다
 */
export async function signInAnonymous(): Promise<User | null> {
    if (!isFirebaseConfigured || !auth) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return null;
    }

    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user;
    } catch (error) {
        console.error('익명 로그인 실패:', error);
        return null;
    }
}

/**
 * 현재 로그인된 사용자 가져오기
 */
export function getCurrentUser(): User | null {
    if (!auth) return null;
    return auth.currentUser;
}

/**
 * 인증 상태 변경 리스너
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
    if (!auth) {
        callback(null);
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
}

/**
 * 사용자 ID 가져오기 (없으면 익명 로그인)
 */
export async function getUserId(): Promise<string> {
    if (!isFirebaseConfigured) {
        return 'local-user'; // Firebase 미설정 시 로컬 사용자 ID 반환
    }

    const user = getCurrentUser();

    if (!user) {
        // [Safety] Do NOT auto-login as guest.
        // This causes infinite login loops if any component checks ID during loading.
        // Instead, we should return a rejected promise or null, but since signature is string,
        // we throw an error that callers must handle.
        throw new Error('NO_AUTHENTICATED_USER');
    }

    return user.uid;
}

/**
 * 로그아웃
 * @description
 * This function orchestrates a clean and safe logout process.
 * 1. Clears all local session data ('Nuclear Option') to prevent "Zombie Data".
 * 2. Signs the user out from Firebase Authentication.
 * 3. Forces a page reload to ensure all React contexts and states are reset.
 */
export async function signOutUser(): Promise<void> {
    if (!auth) return;

    try {
        console.log('[Auth] Starting sign-out process...');

        // 1. Clear all sensitive local data BEFORE logging out
        console.log('[Auth] Clearing local session data...');
        gameStorage.clearAllSessionData();

        // 2. Sign out from Firebase
        console.log('[Auth] Signing out from Firebase...');
        await signOut(auth);

        // 3. [NUCLEAR] Manually clear Firebase Persistence DB to prevent zombie sessions
        // This addresses the issue where the browser restores the session from IndexedDB immediately after reload.
        try {
            const databases = await window.indexedDB.databases();
            const firebaseDb = databases.find(db => db.name === 'firebaseLocalStorageDb');
            if (firebaseDb && firebaseDb.name) {
                console.log('[Auth] Deleting Firebase LocalStorage DB...');
                window.indexedDB.deleteDatabase(firebaseDb.name);
            }
        } catch (dbError) {
            console.warn('[Auth] Failed to clear IndexedDB (Non-critical):', dbError);
        }

        // 4. Force a full page reload to reset application state
        // This is a critical step to ensure UserContext and other states are cleared.
        if (typeof window !== 'undefined') {
            console.log('[Auth] Reloading page to ensure clean state...');
            window.location.href = '/';
        }

    } catch (error) {
        console.error('Sign-out failed:', error);
        // Fallback reload even if error
        window.location.href = '/';
    }
}
