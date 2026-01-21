'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, Settings } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { useAlert } from '@/context/AlertContext';
import { useNotification } from '@/context/NotificationContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import NotificationPanel from '@/components/NotificationPanel';
import { calculateRechargeParams } from '@/lib/token-system';

interface GameTopBarProps {
    sidebarCollapsed?: boolean;
}

export default function GameTopBar({ sidebarCollapsed = false }: GameTopBarProps) {
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
        subscriptions // [NEW] For calculating rates
    } = useUser();

    const { profile } = useUserProfile();
    const params = calculateRechargeParams(subscriptions as any, userLevel);

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

    // Removed useUserProfile effect to prevent flickering (overwriting local state with empty/loading server state)

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsAuthenticated(!!localStorage.getItem('nickname'));
    }, []);

    const { showConfirm } = useAlert();

    // Notification hooks
    const { unreadCount } = useNotification();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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

    return (
        <>
            <div
                className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-2xl border-b border-cyan-500/10 z-60 px-6 flex items-center justify-between transition-all duration-300 ease-out"
            >
                {/* Decorative top line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[var(--primary-blue)] via-transparent to-[var(--primary-purple)]" />

                {/* Left - Logo */}
                <div className="flex items-center gap-4">
                    <Link href="/main" className="group flex items-center gap-2">
                        <span className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:scale-105 transition-transform font-orbitron">
                            AGI WAR
                        </span>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
                    </Link>
                </div>

                {/* Middle - Navigation (wider spacing, bold italic) */}
                <nav className="absolute left-[42%] -translate-x-1/2 flex items-center gap-8 h-full">
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
                            <div className="text-[8px] text-amber-400/60 font-mono uppercase">Coins</div>
                            <div className="text-xs font-black orbitron text-amber-400">
                                {userCoins.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Tokens with Tooltip */}
                    <div className="relative group z-[100]">
                        {/* Token Badge */}
                        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-purple-500/20 group-hover:border-purple-500/50 group-hover:bg-purple-900/10 transition-all duration-300 cursor-help">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(168,85,247,0.4)] group-hover:scale-110 transition-transform duration-300">
                                    💎
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse" />
                            </div>

                            <div className="flex flex-col items-end">
                                <div className="text-[9px] text-purple-300/80 font-bold tracking-wider uppercase mb-0.5 group-hover:text-purple-300 transition-colors">
                                    Token Balance
                                </div>
                                <div className="flex items-baseline gap-1.5 font-orbitron">
                                    <span className="text-sm font-black text-white group-hover:text-purple-100 transition-colors">
                                        {userTokens.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-white/40 font-bold">
                                        / <span className="text-purple-400">{maxTokens.toLocaleString()}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced HUD Tooltip */}
                        <div className="absolute top-full right-0 mt-3 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 z-[1000]">
                            <div className="relative bg-[#0F0F13] border border-purple-500/30 rounded-2xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                                {/* Decorator Line */}
                                <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-black text-purple-400 tracking-widest uppercase flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                                        Resource Monitor
                                    </h4>
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                        ACTIVE
                                    </span>
                                </div>

                                {/* Main Gauge */}
                                <div className="mb-5">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-white/60">Capacity Usage</span>
                                        <span className="text-purple-300 font-mono">{Math.round((userTokens / maxTokens) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (userTokens / maxTokens) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                        <span className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Recharge Rate</span>
                                        <div className="flex items-end gap-1">
                                            <span className="text-xl font-black text-white font-orbitron">+{params.rateAmount}</span>
                                            <span className="text-[10px] text-purple-400 mb-1">Tokens</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                        <span className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Interval</span>
                                        <div className="flex items-end gap-1">
                                            <span className="text-xl font-black text-white font-orbitron">{params.intervalMin}</span>
                                            <span className="text-[10px] text-purple-400 mb-1">Min</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Breakdown */}
                                <div className="space-y-2 bg-black/20 rounded-xl p-3 border border-white/5">
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Bonus Breakdown</p>

                                    <div className="flex justify-between items-center text-[11px] px-1">
                                        <span className="text-white/60">Base Rate</span>
                                        <span className="font-mono text-white/40">50 / 10min</span>
                                    </div>

                                    <div className="flex justify-between items-center text-[11px] px-1">
                                        <span className="text-white/60">Level Bonus (Lv.{userLevel})</span>
                                        <span className="font-mono text-green-400">+{((userLevel - 1) * 100).toLocaleString()} Cap</span>
                                    </div>

                                    {subscriptions.length > 0 && (
                                        <div className="flex justify-between items-center text-[11px] px-1 pt-1 border-t border-white/5 mt-1">
                                            <span className="text-purple-300">Faction Boosts</span>
                                            <span className="font-mono text-purple-300">{subscriptions.length} Active</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
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

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 rounded-lg transition-all group"
                    >
                        <LogOut size={16} className="text-white/40 group-hover:text-red-400 transition-colors" />
                    </button>
                </div>
            </div>

            <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
        </>
    );
}
