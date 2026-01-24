'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Link as LinkIcon, Bell, LogOut, Settings, Menu, X, ChevronRight, Zap, Box, Users, HelpCircle } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { useAlert } from '@/context/AlertContext';
import { useNotification } from '@/context/NotificationContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import NotificationPanel from '@/components/NotificationPanel';
import { calculateRechargeParams } from '@/lib/token-system';

interface GameTopBarProps {
    sidebarCollapsed?: boolean;
    mobileMenuOpen?: boolean;
    setMobileMenuOpen?: (open: boolean) => void;
}

export default function GameTopBar({
    sidebarCollapsed = false,
    mobileMenuOpen = false,
    setMobileMenuOpen = () => { }
}: GameTopBarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();

    // Use UserContext as Single Source of Truth
    const {
        tokens: userTokens,
        coins: userCoins,
        level: userLevel,
        experience: userExp,
        maxTokens, // [NEW] From Context
        activeSubscriptions // [NEW] Correct usage for rate calculation
    } = useUser();

    const { profile } = useUserProfile();
    const params = calculateRechargeParams(activeSubscriptions as any, userLevel);

    // Required Exp Calculation
    const requiredExp = userLevel * 100;

    const navLinks = [
        { name: t('menu.story'), path: '/story', color: 'cyan' },
        // { name: t('menu.battle'), path: '/battle', color: 'red' }, // 스토리 모드에 집중 - 숨김
        { name: t('menu.aiFaction'), path: '/factions', color: 'green' },
        { name: t('menu.shop'), path: '/shop', color: 'yellow' },
        { name: 'LAB', path: '/lab', color: 'amber' },
        { name: t('menu.pvp'), path: '/pvp', color: 'purple' },
        { name: t('menu.ranking'), path: '/ranking', color: 'pink' },
    ];

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsAuthenticated(!!localStorage.getItem('nickname'));
    }, []);

    const { showConfirm } = useAlert();

    // Notification hooks
    const { unreadCount } = useNotification();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // [NEW] Next Recharge Countdown Logic
    const [timeUntilNextRecharge, setTimeUntilNextRecharge] = useState<string>('--:--');
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    useEffect(() => {
        if (!profile?.lastTokenUpdate || userTokens >= maxTokens) {
            setTimeUntilNextRecharge('MAX');
            return;
        }

        const updateTimer = () => {
            const lastUpdate = (profile.lastTokenUpdate && typeof profile.lastTokenUpdate.toDate === 'function')
                ? profile.lastTokenUpdate.toDate()
                : new Date(profile.lastTokenUpdate || Date.now());

            const intervalMs = params.intervalMin * 60 * 1000;
            const nextUpdate = new Date(lastUpdate.getTime() + intervalMs);
            const now = new Date();
            const diff = nextUpdate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeUntilNextRecharge('SOON...'); // Waiting for sync
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeUntilNextRecharge(`${m}:${s.toString().padStart(2, '0')}`);
            }
        };

        updateTimer(); // Initial call
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [profile?.lastTokenUpdate, params.intervalMin, userTokens, maxTokens]);

    const { handleSignOut } = useUser();

    const handleLogout = () => {
        showConfirm({
            title: '로그아웃',
            message: '정말로 로그아웃 하시겠습니까?',
            type: 'warning',
            confirmText: '로그아웃',
            cancelText: '취소',
            onConfirm: async () => {
                await handleSignOut();
            }
        });
    };

    // Close menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Consolidated Mobile Menu Items
    const mobileMenuItems = [
        {
            category: 'OPERATIONS',
            items: [
                { name: t('menu.story'), path: '/story', icon: '📖', color: 'cyan' },
                { name: t('menu.pvp'), path: '/pvp', icon: '⚔️', color: 'red' },
                { name: t('menu.aiFaction'), path: '/factions', icon: '🤖', color: 'green' },
                { name: 'LAB', path: '/lab', icon: '⚗️', color: 'amber' },
            ]
        },
        {
            category: 'FACILITIES',
            items: [
                { name: t('menu.shop'), path: '/shop', icon: '🛒', color: 'yellow' },
                { name: t('menu.generation'), path: '/generation', icon: '🎲', color: 'purple' },
                { name: t('menu.enhance'), path: '/enhance', icon: '⚡', color: 'blue' },
                { name: t('menu.fusion'), path: '/fusion', icon: '🔮', color: 'pink' },
            ]
        },
        {
            category: 'ARCHIVES',
            items: [
                { name: t('menu.encyclopedia'), path: '/encyclopedia', icon: '📘', color: 'cyan' },
                { name: t('menu.myCards'), path: '/my-cards', icon: '📦', color: 'purple' },
                { name: t('menu.ranking'), path: '/ranking', icon: '🏆', color: 'gold' },
            ]
        },
        {
            category: 'SYSTEM',
            items: [
                { name: '친구 목록', path: '/social', icon: '👥', color: 'pink' },
                { name: '지원센터', path: '/support', icon: '🛠️', color: 'gray' },
            ]
        }
    ];

    return (
        <>
            <div
                className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-2xl border-b border-cyan-500/10 z-60 px-6 flex items-center justify-between transition-all duration-300 ease-out"
            >
                {/* Decorative top line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[var(--primary-blue)] via-transparent to-[var(--primary-purple)]" />

                {/* Left - Logo */}
                <div className="flex items-center gap-3 md:gap-4">
                    <Link href="/main" className="group flex items-center gap-2">
                        <span className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:scale-105 transition-transform font-orbitron">
                            AGI WAR
                        </span>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
                    </Link>
                </div>

                {/* Middle - Navigation (wider spacing, bold italic) - HIDDEN ON MOBILE */}
                <nav className="absolute left-[42%] -translate-x-1/2 hidden md:flex items-center gap-8 h-full">
                    {navLinks.map((link) => {
                        const isActive = pathname.startsWith(link.path);
                        return (
                            <Link
                                key={link.path}
                                href={link.path}
                                className="relative h-full flex items-center group"
                            >
                                <span className={`text-base md:text-lg font-black italic tracking-[0.15em] transition-all duration-300 ${isActive
                                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 scale-110 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]'
                                    : 'text-white/50 group-hover:text-white group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                                    }`}>
                                    {link.name}
                                </span>

                                {/* Active indicator - more prominent */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.9)] rounded-full animate-pulse" />
                                )}

                                {/* Hover highlight */}
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </Link>
                        );
                    })}
                </nav>

                {/* Right - Stats & Actions */}
                <div className="flex items-center gap-3 ml-auto" data-tutorial="resources">
                    {/* Level & Exp */}
                    <div className="hidden xl:flex flex-col items-end gap-0.5 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-white/30 font-mono uppercase">SYNC LV</span>
                            <span className="text-sm font-black orbitron text-cyan-400">{userLevel}</span>
                        </div>
                        <div className="w-24 h-1 bg-black/50 rounded-full overflow-hidden border border-white/10">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                                style={{ width: `${(userExp / requiredExp) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Coins */}
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-amber-500/20">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-xs shadow-md">
                            💰
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-[8px] text-amber-400/60 font-mono uppercase hidden md:block">Coins</div>
                            <div className="text-xs font-black orbitron text-amber-400">
                                {userCoins.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Tokens with State-based Tooltip */}
                    <div
                        className="relative z-[50]"
                        onMouseEnter={() => setIsTooltipVisible(true)}
                        onMouseLeave={() => setIsTooltipVisible(false)}
                    >
                        {/* Token Badge */}
                        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-900/10 transition-all duration-300 cursor-default">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(168,85,247,0.4)] hover:scale-110 transition-transform duration-300">
                                    💎
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse" />
                            </div>

                            <div className="flex flex-col items-end">
                                <div className="text-[9px] text-purple-300/80 font-bold tracking-wider uppercase mb-0.5 hover:text-purple-300 transition-colors hidden md:block">
                                    Token Balance
                                </div>
                                <div className="flex items-baseline gap-1.5 font-orbitron">
                                    <span className="text-sm font-black text-white hover:text-purple-100 transition-colors">
                                        {userTokens.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-white/40 font-bold hidden md:inline">
                                        / <span className="text-purple-400">{maxTokens.toLocaleString()}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* TOOLTIP (State-based) */}
                        <AnimatePresence>
                            {isTooltipVisible && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full right-0 mt-3 w-80 z-[100]"
                                >
                                    <div className="bg-[#050510]/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 shadow-[0_0_50px_rgba(168,85,247,0.4)] relative">
                                        {/* Triangle Arrow */}
                                        <div className="absolute -top-2 right-10 w-4 h-4 bg-[#050510]/95 border-t border-l border-purple-500/30 rotate-45" />

                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-orbitron tracking-wider">
                                                RESOURCE MONITOR
                                            </h3>
                                            {timeUntilNextRecharge !== 'MAX' && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-bold border border-blue-500/30">
                                                    <Zap size={10} className="fill-current" />
                                                    <span>Recharging...</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Main Gauge */}
                                        <div className="mb-5 bg-black/40 rounded-xl p-3 border border-white/5">
                                            <div className="flex justify-between text-[10px] mb-1.5">
                                                <span className="text-white/60 font-bold uppercase tracking-wider">Storage Capacity</span>
                                                <span className="text-purple-400 font-mono font-bold">{Math.round((userTokens / maxTokens) * 100)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-black/80 rounded-full overflow-hidden border border-white/10">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                                                    style={{ width: `${Math.min(100, (userTokens / maxTokens) * 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Next Recharge Timer - THE FIX FOR "FEELING" */}
                                        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-3 border border-indigo-500/30 mb-4 flex items-center justify-between group/timer hover:border-indigo-400/50 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-blue-300/80 uppercase tracking-widest font-bold mb-0.5">Next Recharge</span>
                                                <span className="text-[10px] text-white/40">
                                                    +{params.rateAmount} Tokens every {params.intervalMin}m
                                                </span>
                                            </div>
                                            <div className="text-2xl font-black text-white font-orbitron tabular-nums drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                                                {timeUntilNextRecharge}
                                            </div>
                                        </div>

                                        {/* Breakdown Compact */}
                                        <div className="space-y-1 bg-white/5 rounded-lg p-3 border border-white/5">
                                            {activeSubscriptions && activeSubscriptions.length > 0 ? (
                                                <div className="flex justify-between items-center text-[10px] text-amber-300">
                                                    <span className="flex items-center gap-1.5">
                                                        <Zap size={10} className="fill-current" />
                                                        Active Boosts
                                                    </span>
                                                    <span className="font-mono font-bold">+{activeSubscriptions.length} Factions</span>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-white/30 text-center py-1">
                                                    No active boosts
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center text-[10px] text-white/50 pt-1 border-t border-white/5 mt-1">
                                                <span>Level Bonus (Lv.{userLevel})</span>
                                                <span className="font-mono text-green-400">+{((userLevel - 1) * 100).toLocaleString()} Cap</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Divider */}
                    <div className="h-8 w-px bg-white/10" />

                    {/* Notification */}
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="relative w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-white/10 border border-white/5 rounded-lg transition-all group"
                    >
                        <Bell size={16} className={isNotificationOpen ? "text-white" : "text-white/40 group-hover:text-white transition-colors"} />
                        {unreadCount > 0 && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse" />
                        )}
                    </button>

                    {/* Settings */}
                    <Link
                        href="/settings"
                        className="w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-white/10 border border-white/5 rounded-lg transition-all group"
                    >
                        <Settings size={16} className="text-white/40 group-hover:text-white group-hover:rotate-90 transition-all" />
                    </Link>

                    {/* Logout - Hidden on mobile if space is tight, usually fine */}
                    <button
                        onClick={handleLogout}
                        className="w-9 h-9 hidden md:flex items-center justify-center bg-black/40 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 rounded-lg transition-all group"
                    >
                        <LogOut size={16} className="text-white/40 group-hover:text-red-400 transition-colors" />
                    </button>

                    {/* [NEW] Hamburger Button (Right Side) */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </div>

            <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />

            {/* [NEW] Mobile Side Menu Drawer (Cyberpunk Style) - Right Side */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] md:hidden"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#050510] border-l border-cyan-500/30 z-[80] md:hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                        >
                            {/* Drawer Header */}
                            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-orbitron">
                                        AGI WAR
                                    </span>
                                    <div className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[10px] text-cyan-400 font-bold border border-cyan-500/30">
                                        SYSTEM
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1 text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* User Info Summary */}
                            <div className="p-4 bg-white/5 border-b border-white/5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 p-[1px]">
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                            {profile?.avatarUrl ? (
                                                <img src={profile.avatarUrl} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-xs">CMD</div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white font-orbitron">{profile?.nickname || 'Commander'}</div>
                                        <div className="text-[10px] text-cyan-400 font-mono">Level {userLevel}</div>
                                    </div>
                                </div>
                                {/* Mini Stats */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-black/40 rounded px-2 py-1.5 border border-white/5">
                                        <div className="text-[9px] text-amber-400/70 uppercase">Coins</div>
                                        <div className="text-xs font-bold text-amber-400">{userCoins.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-black/40 rounded px-2 py-1.5 border border-white/5">
                                        <div className="text-[9px] text-purple-400/70 uppercase">Tokens</div>
                                        <div className="text-xs font-bold text-purple-400">{userTokens.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="flex-1 overflow-y-auto py-2">
                                {mobileMenuItems.map((category, idx) => (
                                    <div key={idx} className="mb-4">
                                        <div className="px-4 py-1.5 mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                            {category.category}
                                        </div>
                                        <div className="space-y-0.5">
                                            {category.items.map((item) => (
                                                <Link
                                                    key={item.path}
                                                    href={item.path}
                                                    className={`
                                                        relative flex items-center gap-3 px-5 py-3 transition-all duration-200 border-l-2
                                                        ${pathname.startsWith(item.path)
                                                            ? `bg-white/5 border-${item.color}-500 text-white`
                                                            : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                                        }
                                                    `}
                                                >
                                                    <span className="text-lg">{item.icon}</span>
                                                    <span className="text-sm font-medium font-orbitron tracking-wide">{item.name}</span>
                                                    {pathname.startsWith(item.path) && (
                                                        <motion.div
                                                            layoutId="active-mobile-menu"
                                                            className={`absolute right-4 w-1.5 h-1.5 rounded-full bg-${item.color}-500 shadow-[0_0_8px_currentColor]`}
                                                        />
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Area */}
                            <div className="p-4 border-t border-white/10 bg-black/50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-bold text-sm"
                                >
                                    <LogOut size={16} />
                                    <span>SYSTEM LOGOUT</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
