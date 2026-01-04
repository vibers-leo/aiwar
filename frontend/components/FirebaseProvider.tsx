'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/firebase-auth';

interface FirebaseContextType {
    user: User | null;
    loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
    user: null,
    loading: true,
});

export function useFirebase() {
    return useContext(FirebaseContext);
}

interface FirebaseProviderProps {
    children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // [Safety System] Check for pending logout (Kill Switch)
        // If the user requested logout but the browser restored the session, this flag will force a cleanup.
        const { gameStorage } = require('@/lib/game-storage'); // Dynamic import to avoid cycles

        // 인증 상태 변경 리스너
        // 인증 상태 변경 리스너
        const unsubscribe = onAuthChange(async (authUser) => {
            try {
                // [Kill Switch / Clean Boot Check]
                if (authUser && gameStorage.checkAndConsumePendingLogout()) {
                    console.warn('⚠️ [FirebaseProvider] Detected stale session despite logout request. Forcing sign-out.');
                    try {
                        const { signOut } = await import('firebase/auth');
                        const { auth } = await import('@/lib/firebase');
                        if (auth) await signOut(auth);
                    } catch (e) {
                        console.error('[FirebaseProvider] Kill Switch sign-out error (ignoring):', e);
                    }
                    setUser(null);
                    setLoading(false);
                    return;
                }

                if (authUser) {
                    console.log(`[FirebaseProvider] User detected: ${authUser.uid}`);
                    setUser(authUser);
                } else {
                    console.log('[FirebaseProvider] No user detected. Authentication state is null.');
                    setUser(null);
                }
            } catch (error) {
                console.error('[FirebaseProvider] Auth state change error:', error);
                setUser(null); // Default to guest/null on error
            } finally {
                setLoading(false);
            }
        });

        // [Safety] Force release loading state if Firebase takes too long (e.g. network hang)
        const safetyTimer = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn('[FirebaseProvider] Auth initialization timed out (4s). releasing loading state.');
                    return false;
                }
                return prev;
            });
        }, 4000);

        return () => {
            unsubscribe();
            clearTimeout(safetyTimer);
        };
    }, []);

    return (
        <FirebaseContext.Provider value={{ user, loading }}>
            {children}
        </FirebaseContext.Provider>
    );
}
