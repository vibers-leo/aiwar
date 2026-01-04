'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signInAnonymous } from '@/lib/firebase-auth';
import { gameStorage } from '@/lib/game-storage';

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
        const { gameStorage } = require('@/lib/game-storage'); // Dynamic import to avoid cycles if necessary, though direct import is likely fine.
        // Actually, game-storage is a class instance export, so we import normally at top usually.

        // 인증 상태 변경 리스너
        const unsubscribe = onAuthChange(async (authUser) => {
            // [Kill Switch Check]
            if (authUser && gameStorage.checkAndConsumePendingLogout()) {
                console.warn('⚠️ [FirebaseProvider] Detected stale session despite logout request. Forcing sign-out.');
                const { signOut } = await import('firebase/auth');
                const { auth } = await import('@/lib/firebase');
                if (auth) await signOut(auth);
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
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <FirebaseContext.Provider value={{ user, loading }}>
            {children}
        </FirebaseContext.Provider>
    );
}
