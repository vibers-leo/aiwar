'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Avatar } from '@/components/ui/custom/Avatar';
import { Bell, Users, Settings } from 'lucide-react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Header() {
    const pathname = usePathname();
    const { user } = useUser();
    const { profile } = useUserProfile();
    const [pendingCount, setPendingCount] = useState(0);

    // Friend Request Listener
    useEffect(() => {
        if (!user || !db) return;

        const friendsRef = collection(db, 'users', user.uid, 'friends');
        const q = query(friendsRef, where('status', '==', 'pending_received'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendingCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user]);

    const menuItems = [
        { name: 'Story', href: '/story' },
        { name: 'Battle', href: '/battle' },
        { name: 'AI Factions', href: '/factions' },
        { name: 'Shop', href: '/shop' },
        { name: 'Lab', href: '/lab' },
        { name: 'PVP Arena', href: '/pvp/realtime' },
        { name: 'Ranking', href: '/ranking' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/10">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/main">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-3 cursor-pointer"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-black text-xl">AI</span>
                            </div>
                            <span className="text-2xl font-black bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
                                WAR
                            </span>
                        </motion.div>
                    </Link>

                    {/* Navigation Menu */}
                    <nav className="flex items-center gap-8">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                            return (
                                <Link key={item.href} href={item.href}>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="relative"
                                    >
                                        <span
                                            className={`text-sm font-medium tracking-wide transition-colors ${isActive
                                                ? 'text-purple-300'
                                                : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {item.name}
                                        </span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute -bottom-6 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Profile & Notifications */}
                    <div className="flex items-center gap-4">
                        {/* Social Dashboard & Notifications */}
                        <Link href="/social">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-10 h-10 rounded-full bg-slate-800/50 border border-purple-500/20 flex items-center justify-center hover:border-purple-400/40 transition-colors group"
                            >
                                <Users size={18} className="text-slate-400 group-hover:text-purple-300 transition-colors" />
                                {pendingCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500 text-[10px] items-center justify-center text-white font-bold">
                                            {pendingCount}
                                        </span>
                                    </span>
                                )}
                            </motion.button>
                        </Link>

                        {/* Settings */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 rounded-full bg-slate-800/50 border border-purple-500/20 flex items-center justify-center hover:border-purple-400/40 transition-colors group"
                        >
                            <Settings size={18} className="text-slate-400 group-hover:text-purple-300 transition-colors" />
                        </motion.button>

                        <div className="h-6 w-[1px] bg-white/10 mx-1" />

                        {/* User Profile */}
                        <Link href={`/profile/${user?.uid || 'guest'}`}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-slate-800/30 border border-white/5 hover:border-purple-500/30 transition-all"
                            >
                                <Avatar
                                    src={profile?.avatarUrl}
                                    className="w-8 h-8 border border-purple-500/30"
                                />
                                <div className="hidden md:block text-left">
                                    <p className="text-[10px] font-bold text-white orbitron leading-none">
                                        {profile?.nickname || 'COMMANDER'}
                                    </p>
                                    <p className="text-[8px] text-purple-400 font-mono mt-0.5">LV.{profile?.level || 1}</p>
                                </div>
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
