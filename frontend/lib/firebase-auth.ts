import {
    signInAnonymously,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged,
    signOut,
    User,
    setPersistence,
    inMemoryPersistence,
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { gameStorage } from './game-storage';

/**
 * 구글 로그인 (Popup 방식, 실패 시 Redirect로 폴백)
 */
export async function signInWithGoogle(): Promise<User | null> {
    if (!isFirebaseConfigured || !auth) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return null;
    }

    try {
        const provider = new GoogleAuthProvider();

        // Try popup first
        console.log('[Auth] Attempting popup-based Google login...');
        const result = await signInWithPopup(auth, provider);

        // [Safety] Clear Any Pending Logout Flag on successful entry
        gameStorage.clearPendingLogout();

        console.log('[Auth] Popup login successful');
        return result.user;
    } catch (error: any) {
        console.error('구글 팝업 로그인 실패:', error);

        // Handle specific errors
        if (error.code === 'auth/unauthorized-domain') {
            alert(`[Firebase] 도메인 승인 오류: ${window.location.hostname} 가 승인된 도메인에 없습니다.\nFirebase Console > Authentication > Settings > Authorized Domains 에서 추가해주세요.`);
            return null;
        } else if (error.code === 'auth/popup-closed-by-user') {
            console.log('사용자가 로그인 팝업을 닫았습니다.');
            return null;
        } else if (error.code === 'auth/cancelled-popup-request') {
            console.log('이전 팝업 요청 취소됨');
            return null;
        } else if (error.code === 'auth/popup-blocked') {
            console.warn('[Auth] Popup blocked, falling back to redirect...');
            // Fallback to redirect
            try {
                const provider = new GoogleAuthProvider();
                await signInWithRedirect(auth, provider);
                // Redirect will happen, return null for now
                return null;
            } catch (redirectError) {
                console.error('[Auth] Redirect login also failed:', redirectError);
                alert('로그인에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
                return null;
            }
        } else {
            // For CORS or other errors, try redirect as fallback
            console.warn('[Auth] Popup failed with error, trying redirect as fallback...');
            try {
                const provider = new GoogleAuthProvider();
                await signInWithRedirect(auth, provider);
                return null;
            } catch (redirectError) {
                console.error('[Auth] Redirect login also failed:', redirectError);
                alert(`로그인 실패: ${error.message}`);
                return null;
            }
        }
    }
}

/**
 * 리다이렉트 결과 처리 (페이지 로드 시 호출)
 */
export async function handleRedirectResult(): Promise<User | null> {
    if (!isFirebaseConfigured || !auth) {
        return null;
    }

    try {
        console.log('[Auth] Checking for redirect result...');
        const result = await getRedirectResult(auth);

        if (result && result.user) {
            console.log('[Auth] Redirect login successful');
            gameStorage.clearPendingLogout();
            return result.user;
        }

        return null;
    } catch (error: any) {
        console.error('[Auth] Redirect result error:', error);
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

        // [Safety] Clear Any Pending Logout Flag on successful entry
        gameStorage.clearPendingLogout();

        return userCredential.user;
    } catch (error) {
        console.error('익명 로그인 실패:', error);
        return null;
    }
}

/**
 * 이메일/비밀번호 가입
 */
export async function signUpWithEmail(email: string, password: string): Promise<User | null> {
    if (!isFirebaseConfigured || !auth) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return null;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // [Safety] Clear Any Pending Logout Flag on successful entry
        gameStorage.clearPendingLogout();

        return userCredential.user;
    } catch (error: any) {
        console.error('이메일 가입 실패:', error);
        alert(`[Firebase Signup Error] ${error.message}`);
        return null;
    }
}

/**
 * 이메일/비밀번호 로그인
 */
export async function signInWithEmail(email: string, password: string): Promise<User | null> {
    if (!isFirebaseConfigured || !auth) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return null;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // [Safety] Clear Any Pending Logout Flag on successful entry
        gameStorage.clearPendingLogout();

        return userCredential.user;
    } catch (error: any) {
        console.error('이메일 로그인 실패:', error);
        alert(`[Firebase Login Error] ${error.message}`);
        return null;
    }
}

/**
 * 비밀번호 재설정 이메일 전송
 */
export async function resetPassword(email: string): Promise<void> {
    if (!isFirebaseConfigured || !auth) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        console.error('비밀번호 재설정 이메일 전송 실패:', error);
        throw error;
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
 * 사용자 ID 가져오기 (인증 상태가 확정될 때까지 대기)
 */
export async function getUserId(): Promise<string> {
    if (!isFirebaseConfigured) {
        return 'local-user';
    }

    // [Fix] Auth가 초기화될 때까지 최대 3초간 대기
    let user = auth?.currentUser;

    if (!user && auth) {
        console.log('[Auth] currentUser is null, waiting for auth state to stabilize...');
        // onAuthStateChanged를 사용하여 상태를 기다림
        user = await new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth!, (u) => {
                unsubscribe();
                resolve(u);
            });
            // 3초 타임아웃
            setTimeout(() => {
                unsubscribe();
                resolve(null);
            }, 3000);
        });
    }

    if (!user) {
        throw new Error('NO_AUTHENTICATED_USER');
    }

    return user.uid;
}

/**
 * Firebase Auth의 세션 영속성 설정
 */
export async function setAuthPersistence(persistenceType: 'local' | 'in-memory'): Promise<void> {
    if (!auth) return;

    const persistence = persistenceType === 'local' ? browserLocalPersistence : inMemoryPersistence;

    try {
        await setPersistence(auth, persistence);
        console.log(`[Auth] Persistence set to ${persistenceType}`);
    } catch (error) {
        console.error('Failed to set auth persistence:', error);
    }
}

/**
 * 로그아웃
 * @description
 * This function orchestrates a clean and safe logout process.
 */
export async function signOutUser(): Promise<void> {
    if (!auth) return;

    try {
        console.log('[Auth] Starting sign-out process...');

        // 1. Clear all sensitive local data
        console.log('[Auth] Clearing local session data...');
        gameStorage.clearAllSessionData();

        // 2. [SDK-NATIVE CLEANUP] Switch to In-Memory Persistence
        try {
            console.log('[Auth] Switching to in-memory persistence to wipe storage...');
            await setPersistence(auth, inMemoryPersistence);
        } catch (pError) {
            console.warn('[Auth] Failed to switch persistence (Non-critical):', pError);
        }

        // 3. Sign out from Firebase
        console.log('[Auth] Signing out from Firebase...');
        await signOut(auth);

        // [Verification] Wait for auth state to actually clear
        let attempts = 0;
        while (auth.currentUser && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        // 4. Force a full page reload to reset application state
        if (typeof window !== 'undefined') {
            console.log('[Auth] Reloading page to ensure clean state...');

            // [Safety] Set Pending Logout Flag
            gameStorage.setPendingLogout();

            setTimeout(() => {
                window.location.href = '/';
            }, 100);
        }

    } catch (error) {
        console.error('Sign-out failed:', error);
        window.location.href = '/';
    }
}
