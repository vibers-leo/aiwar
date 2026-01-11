'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { Settings, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import CommanderProfileModal from '@/components/CommanderProfileModal';
import FriendsModal from '@/components/FriendsModal'; // [NEW] Import
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUser } from '@/context/UserContext';
import { getGenerationSlots } from '@/lib/generation-utils';

// No props needed - sidebar is always expanded
export default function GameSidebar() {
    const pathname = usePathname();
    const { t } = useTranslation();
    const { profile } = useUserProfile();
    const [nickname, setNickname] = useState('COMMANDER');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showFriendsModal, setShowFriendsModal] = useState(false); // [NEW]
    const [isCollapsed, setIsCollapsed] = useState(false);

    const { user } = useUser();
    const [hasReadyGenerations, setHasReadyGenerations] = useState(false);

    useEffect(() => {
        const checkGenerations = () => {
            const slots = getGenerationSlots(user?.uid);
            const hasReady = slots.some(s => s.status === 'active');
            setHasReadyGenerations(hasReady);
        };

        checkGenerations();
        const interval = setInterval(checkGenerations, 5000);

        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        // Use Firebase profile nickname if available
        if (profile?.nickname) {
            setNickname(profile.nickname);
        } else {
            const stored = localStorage.getItem('nickname');
            if (stored) setNickname(stored);
        }
    }, [profile]);

    type MenuItem = {
        name: string;
        path?: string;
        onClick?: () => void;
        icon: string;
        color: string;
    };

    const menuItems: MenuItem[] = [
        { name: t('menu.myCards'), path: '/my-cards', icon: '📦', color: 'purple' },
        { name: t('menu.generation'), path: '/generation', icon: '🎲', color: 'green' },
        { name: t('menu.uniqueGeneration'), path: '/unique-create', icon: '✨', color: 'pink' },
        { name: t('menu.enhance'), path: '/enhance', icon: '🆙', color: 'amber' },
        { name: t('menu.fusion'), path: '/fusion', icon: '🔮', color: 'blue' },
        { name: t('menu.encyclopedia'), path: '/encyclopedia', icon: '📖', color: 'cyan' },
        { name: '친구 목록', path: '/social', icon: '👥', color: 'pink' },
        { name: '지원센터', path: '/support', icon: '🛠️', color: 'blue' },
    ];

    const handleWheel = (e: React.WheelEvent) => {
        const main = document.getElementById('main-content');
        if (main) {
            main.scrollTop += e.deltaY;
        }
    };



    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; glow: string }> = {
            cyan: { bg: 'bg-cyan-500/10', glow: 'shadow-[0_0_10px_rgba(34,211,238,0.2)]' },
            purple: { bg: 'bg-purple-500/10', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.2)]' },
            green: { bg: 'bg-green-500/10', glow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]' },
            amber: { bg: 'bg-amber-500/10', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]' },
            blue: { bg: 'bg-blue-500/10', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]' },
            pink: { bg: 'bg-pink-500/10', glow: 'shadow-[0_0_10px_rgba(236,72,153,0.2)]' },
            red: { bg: 'bg-red-500/10', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]' },
        };
        return colors[color] || colors.cyan;
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        // Only toggle if clicking on empty space (not on buttons or interactive elements)
        const target = e.target as HTMLElement;
        if (target.tagName === 'ASIDE' || target.classList.contains('sidebar-empty-space')) {
            setIsCollapsed(!isCollapsed);
        }
    };

    return (
        <aside
            className="fixed right-0 top-16 h-[calc(100vh-4rem)] bg-black/95 backdrop-blur-2xl border-l border-white/5 z-50 transition-all duration-300 ease-out overflow-hidden flex flex-col"
            style={{ width: isCollapsed ? '60px' : '240px' }}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
        >
            {/* Top Border Gradient */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            {/* 1. Commander Profile */}
            <div
                className="p-4 border-b border-white/5 flex flex-col items-center flex-none cursor-pointer hover:bg-white/5 transition-all group"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileModal(true);
                }}
            >
                <div className={`relative mb-3 transition-all w-20 h-20 group-hover:scale-105`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full opacity-20 animate-pulse group-hover:opacity-30" />
                    <div className="absolute inset-0 border border-white/10 rounded-full group-hover:border-cyan-500/50" />
                    <div className="w-full h-full rounded-full bg-black/50 flex items-center justify-center overflow-hidden relative">
                        {profile?.photoURL ? (
                            <img
                                src={profile.photoURL}
                                alt="Commander"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <>
                                <span className="z-10 relative text-3xl">👨‍✈️</span>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
                            </>
                        )}
                    </div>
                    {/* Online Status Indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black shadow-[0_0_5px_#22c55e]" />
                </div>

                {/* Profile info - show when expanded */}
                {!isCollapsed && (
                    <div className="text-center w-full">
                        <h3 className="font-bold text-white text-base mb-0.5 truncate px-1 font-orbitron group-hover:text-cyan-400 transition-colors">{nickname}</h3>
                        <div className="flex items-center justify-center gap-1">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[8px] font-mono text-cyan-400">ONLINE</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Menu Items */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-hide">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    const colors = getColorClasses(item.color);
                    const content = (
                        <>
                            {/* Menu text - show when expanded */}
                            {!isCollapsed && isActive && (
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-${item.color}-500/50 rounded-r-full shadow-[0_0_10px_currentColor]`} />
                            )}

                            <span className={`text-xl flex-none ${isActive ? '' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'} transition-all`}>
                                {item.icon}
                            </span>

                            {/* Commander Name - show when expanded */}
                            {!isCollapsed && (
                                <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'} transition-colors font-mono tracking-wide truncate`}>
                                    {item.name}
                                </span>
                            )}

                            {/* Generation Ready Indicator */}
                            {item.path === '/generation' && hasReadyGenerations && (
                                <div className="absolute right-2 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e] animate-pulse" />
                            )}
                        </>
                    );

                    const commonClasses = `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                        ? `${colors.bg} border border-${item.color}-500/20`
                        : 'hover:bg-white/5 border border-transparent'
                        }`;

                    // Render as Button if onClick exists
                    if (item.onClick) {
                        return (
                            <button
                                key={item.name}
                                onClick={item.onClick}
                                className={`${commonClasses} w-full text-left`}
                                title={item.name}
                            >
                                {content}
                            </button>
                        );
                    }

                    // Render as Link
                    return (
                        <Link
                            key={item.path}
                            href={item.path || '#'}
                            className={commonClasses}
                            title={item.name}
                        >
                            {content}
                        </Link>
                    );
                })}
            </nav>



            {/* Commander Profile Modal */}
            <CommanderProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
            />

            {/* Friends Modal */}
            <FriendsModal
                isOpen={showFriendsModal}
                onClose={() => setShowFriendsModal(false)}
            />
        </aside>
    );
}
