'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signOutUser } from '@/lib/firebase-auth';

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
        const unsubscribe = onAuthChange((authUser) => {
            // "Clean Boot" Check: If a logout was pending, force sign out again.
            const isLogoutPending = localStorage.getItem('pending_logout');
            if (isLogoutPending) {
                console.warn('[Clean Boot] Pending logout detected. Forcing sign out.');
                // We don't have access to the full handleSignOut here,
                // so we call the core SDK signout and clean up flags.
                signOutUser();
                localStorage.removeItem('pending_logout');
                setUser(null);
                setLoading(false);
                return;
            }

            // CRITICAL CHANGE: Remove automatic anonymous sign-in.
            // If there's no user, the user is simply null. No more zombie sessions.
            setUser(authUser);
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
