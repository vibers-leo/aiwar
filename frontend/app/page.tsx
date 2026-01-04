'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';

export default function RootPage() {
    const router = useRouter();
    const { user, loading } = useUser();

    useEffect(() => {
        // [Modern Auth Check] Rely on UserContext instead of localStorage directly.
        // This prevents the redirect loop between / and /intro.
        if (loading) return;

        console.log(`[RootPage] Authorization state confirmed. User: ${user ? user.uid : 'null'}`);

        if (user) {
            console.log("[RootPage] Valid session detected. Transitioning to Command Center...");
            router.replace('/main');
        } else {
            console.log("[RootPage] No active session. Redirecting to Entry Network...");
            router.replace('/intro');
        }
    }, [user, loading, router]);

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
            {/* Minimal Loading State */}
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-cyan-500 font-mono text-xs tracking-widest animate-pulse"
                >
                    VERIFYING_ACCESS...
                </motion.div>
            </div>
        </div>
    );
}
