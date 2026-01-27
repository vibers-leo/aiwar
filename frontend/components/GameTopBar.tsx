'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, LogOut, Settings, Menu, X, Zap, Box } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { useAlert } from '@/context/AlertContext';
import { useNotification } from '@/context/NotificationContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import NotificationPanel from '@/components/NotificationPanel';
import { calculateRechargeParams } from '@/lib/token-system';
import { Tooltip } from '@/components/ui/custom/Tooltip';
import { cn } from '@/lib/utils';

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
    const { t } = useTranslation();
    const {
        tokens: userTokens,
        coins: userCoins,
        level: userLevel,
        experience: userExp,
        maxTokens,
        activeSubscriptions,
        handleSignOut
    } = useUser();

    const { profile } = useUserProfile();
    const { showConfirm } = useAlert();
    const { unreadCount } = useNotification();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [timeUntilNextRecharge, setTimeUntilNextRecharge] = useState<string>('--:--');

    const params = calculateRechargeParams(
        activeSubscriptions as any,
        userLevel,
        profile?.commander?.stats?.efficiency || 0
    );
    const requiredExp = userLevel * 100;

    const navLinks = [
        { name: t('menu.story'), path: '/story', color: 'cyan' },
        { name: t('menu.aiFaction'), path: '/factions', color: 'green' },
        { name: t('menu.shop'), path: '/shop', color: 'yellow' },
        { name: t('menu.research'), path: '/lab', color: 'amber' },
        { name: t('menu.pvp'), path: '/pvp', color: 'purple' },
        { name: t('menu.ranking'), path: '/ranking', color: 'pink' },
    ];

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
                setTimeUntilNextRecharge('SOON...');
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeUntilNextRecharge(`${m}:${s.toString().padStart(2, '0')}`);
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [profile?.lastTokenUpdate, params.intervalMin, userTokens, maxTokens]);

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

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

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

    const colorMap: Record<string, { borderClass: string; bgClass: string; shadowClassMobile: string }> = {
        cyan: { borderClass: 'border-cyan-500', bgClass: 'bg-cyan-500', shadowClassMobile: 'shadow-[0_0_8px_rgba(6,182,212,0.8)]' },
        red: { borderClass: 'border-red-500', bgClass: 'bg-red-500', shadowClassMobile: 'shadow-[0_0_8px_rgba(239,68,68,0.8)]' },
        green: { borderClass: 'border-green-500', bgClass: 'bg-green-500', shadowClassMobile: 'shadow-[0_0_8px_rgba(34,197,94,0.8)]' },
        amber: { borderClass: 'border-amber-500', bgClass: 'bg-amber-500', shadowClassMobile: 'shadow-[0_0_8px_rgba(245,158,11,0.8)]' },
        yellow: { borderClass: 'border-yellow-500', bgClass: 'bg-yellow-500', shadowClassMobile: 'shadow-[0_0_8px_rgba(234,179,8,0.8)]' },
        purple: { borderClass: 'border-purple-500', bgClass: 'bg-purple-500', shadowClassMobile: 'shadow-[0_0_8px_rgba(168,85,247,0.8)]' },
        blue: { borderClass: 'border-blue-500', bgClass: 'bg-blue-500', shadowClassMobile: 'shadow-[0_0_8px_rgba(59,130,246,0.8)]' },
        pink: { borderClass: 'border-pink-500', bgClass: 'bg-pink-500', shadowClassMobile: 'shadow-[0_0_8px_rgba(236,72,153,0.8)]' },
        gold: { borderClass: 'border-yellow-600', bgClass: 'bg-yellow-600', shadowClassMobile: 'shadow-[0_0_8px_rgba(202,138,4,0.8)]' },
        gray: { borderClass: 'border-gray-500', bgClass: 'bg-gray-500', shadowClassMobile: 'shadow-[0_0_8px_rgba(107,114,128,0.8)]' },
    };

    return (
        <>
            <header className={cn(
                "fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-3xl border-b border-white/10 z-[100] transition-all duration-500",
                sidebarCollapsed ? "md:left-20" : "md:left-0"
            )}>
                <div className="flex h-full items-center justify-between px-4 md:px-8 max-w-[1920px] mx-auto relative overflow-visible">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-400 via-transparent to-purple-500" />

                    <div className="flex items-center gap-4 xl:gap-8 flex-1">
                        <Link href="/main" className="flex items-center gap-2 group">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <Box className="w-8 h-8 text-cyan-500 absolute animate-pulse opacity-50" />
                                <Box className="w-6 h-6 text-cyan-400 relative z-10" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-orbitron leading-none">
                                    AGI WAR
                                </h1>
                                <div className="text-[8px] font-bold text-cyan-500/50 orbitron tracking-[0.2em] mt-0.5">
                                    LEGION COMMAND
                                </div>
                            </div>
                        </Link>

                        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
                            {navLinks.map((link) => {
                                const isActive = pathname.startsWith(link.path);
                                return (
                                    <Tooltip
                                        key={link.path}
                                        content={link.name}
                                        placement="bottom"
                                        className="orbitron uppercase tracking-tighter"
                                    >
                                        <Link
                                            href={link.path}
                                            className={cn(
                                                "relative px-4 py-2 rounded-lg text-[13px] font-black transition-all duration-300 group overflow-hidden orbitron tracking-wider",
                                                isActive ? "text-white" : "text-white/40 hover:text-white/80"
                                            )}
                                        >
                                            <span className="relative z-10">{link.name}</span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-nav"
                                                    className={cn(
                                                        "absolute inset-0 rounded-lg -z-10 bg-white/5 border-b-2",
                                                        link.color === 'cyan' && "border-cyan-500 shadow-[0_4px_10px_rgba(34,211,238,0.3)]",
                                                        link.color === 'green' && "border-green-500 shadow-[0_4px_10px_rgba(34,197,94,0.3)]",
                                                        link.color === 'yellow' && "border-yellow-500 shadow-[0_4px_10px_rgba(234,179,8,0.3)]",
                                                        link.color === 'amber' && "border-amber-500 shadow-[0_4px_10px_rgba(245,158,11,0.3)]",
                                                        link.color === 'purple' && "border-purple-500 shadow-[0_4px_10px_rgba(168,85,247,0.3)]",
                                                        link.color === 'pink' && "border-pink-500 shadow-[0_4px_10px_rgba(236,72,153,0.3)]"
                                                    )}
                                                />
                                            )}
                                            <div className={cn(
                                                "absolute bottom-0 left-0 w-full h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left opacity-50",
                                                link.color === 'cyan' && "bg-cyan-500",
                                                link.color === 'green' && "bg-green-500",
                                                link.color === 'yellow' && "bg-yellow-500",
                                                link.color === 'amber' && "bg-amber-500",
                                                link.color === 'purple' && "bg-purple-500",
                                                link.color === 'pink' && "bg-pink-500"
                                            )} />
                                        </Link>
                                    </Tooltip>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
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

                        <Tooltip
                            content={
                                <div className="flex flex-col gap-1 p-1">
                                    <span className="text-amber-400 font-black">{t('topbar.coinBalance')}</span>
                                    <span className="text-[10px] text-white/60">{t('topbar.coins.desc')}</span>
                                </div>
                            }
                            placement="bottom"
                        >
                            <div className="hidden lg:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 hover:border-amber-500/30 transition-all cursor-default">
                                <Box className="w-4 h-4 text-amber-500" />
                                <div className="text-xs font-black orbitron text-amber-400">
                                    {userCoins.toLocaleString()}
                                </div>
                            </div>
                        </Tooltip>

                        <Tooltip
                            placement="bottom"
                            allowClick={true}
                            className="!p-0 !bg-transparent !border-0 !shadow-none"
                            content={
                                <div className="bg-[#050510]/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 shadow-[0_0_50px_rgba(168,85,247,0.4)] w-80 relative overflow-hidden text-left">
                                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_100%)]" />
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-orbitron tracking-wider">
                                            {t('topbar.resourceMonitor')}
                                        </h3>
                                        {timeUntilNextRecharge !== 'MAX' && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-bold border border-blue-500/30">
                                                <Zap size={10} className="fill-current animate-pulse" />
                                                <span>{t('topbar.recharging')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-5 bg-black/40 rounded-xl p-3 border border-white/5 relative z-10">
                                        <div className="flex justify-between text-[10px] mb-1.5">
                                            <span className="text-white/60 font-bold uppercase tracking-wider">{t('topbar.storageCapacity')}</span>
                                            <span className="text-purple-400 font-mono font-bold">{Math.round((userTokens / maxTokens) * 100)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-black/80 rounded-full overflow-hidden border border-white/10">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                                                style={{ width: `${Math.min(100, (userTokens / maxTokens) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-3 border border-indigo-500/30 mb-4 flex items-center justify-between transition-colors relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-blue-300/80 uppercase tracking-widest font-bold mb-0.5">{t('topbar.nextRecharge')}</span>
                                            <span className="text-[10px] text-white/40">
                                                {t('topbar.rechargeRate', { amount: String(params.rateAmount), min: String(params.intervalMin) })}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-black text-white font-orbitron tabular-nums drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                                            {timeUntilNextRecharge}
                                        </div>
                                    </div>
                                    <div className="space-y-1 bg-white/5 rounded-lg p-3 border border-white/5 relative z-10">
                                        {activeSubscriptions && activeSubscriptions.length > 0 ? (
                                            <div className="flex justify-between items-center text-[10px] text-amber-300">
                                                <span className="flex items-center gap-1.5">
                                                    <Zap size={10} className="fill-current" />
                                                    {t('topbar.activeBoosts')}
                                                </span>
                                                <span className="font-mono font-bold">{t('topbar.factionsBoost', { count: String(activeSubscriptions.length) })}</span>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-white/30 text-center py-1 font-bold">
                                                {t('topbar.noActiveBoosts')}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-[10px] text-white/50 pt-1 border-t border-white/5 mt-1">
                                            <span>{t('topbar.levelBonus', { level: userLevel })}</span>
                                            <span className="font-mono text-green-400">{t('topbar.capacityBonus', { amount: ((userLevel - 1) * 100).toLocaleString() })}</span>
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-white/20 mt-3 text-center uppercase tracking-widest font-bold">
                                        {t('topbar.togglePersistence')}
                                    </p>
                                </div>
                            }
                        >
                            <div className="hidden lg:flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition-all cursor-help group">
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(168,85,247,0.4)] group-hover:scale-110 transition-transform duration-300">
                                        💎
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse" />
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="text-[9px] text-purple-300/80 font-bold tracking-wider uppercase mb-0.5 group-hover:text-purple-300 transition-colors hidden md:block text-right">
                                        {t('topbar.tokenBalance')}
                                    </div>
                                    <div className="flex items-baseline gap-1.5 font-orbitron">
                                        <span className="text-sm font-black text-white group-hover:text-purple-100 transition-colors">
                                            {userTokens.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-white/40 font-bold hidden md:inline">
                                            / <span className="text-purple-400">{maxTokens.toLocaleString()}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Tooltip>

                        <div className="h-8 w-px bg-white/10" />

                        <div
                            onMouseEnter={() => setIsNotificationOpen(true)}
                            onMouseLeave={() => setIsNotificationOpen(false)}
                            className="relative"
                        >
                            <button
                                className="relative w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-white/10 border border-white/5 rounded-lg transition-all group"
                            >
                                <Bell size={16} className={isNotificationOpen ? "text-white" : "text-white/40 group-hover:text-white transition-colors"} />
                                {unreadCount > 0 && (
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse" />
                                )}
                            </button>
                            <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
                        </div>

                        <Link
                            href="/settings"
                            className="w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-white/10 border border-white/5 rounded-lg transition-all group"
                        >
                            <Settings size={16} className="text-white/40 group-hover:text-white group-hover:rotate-90 transition-all" />
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="w-9 h-9 hidden md:flex items-center justify-center bg-black/40 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 rounded-lg transition-all group"
                        >
                            <LogOut size={16} className="text-white/40 group-hover:text-red-400 transition-colors" />
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </div>
            </header>



            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#050510] border-l border-cyan-500/30 z-[120] md:hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                        >
                            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-orbitron">
                                        AGI WAR
                                    </span>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1 text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

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
                                                    className={cn(
                                                        "relative flex items-center gap-3 px-5 py-3 transition-all duration-200 border-l-2",
                                                        pathname.startsWith(item.path)
                                                            ? "bg-white/5 text-white"
                                                            : "border-transparent text-gray-400 hover:text-white hover:bg-white/5",
                                                        pathname.startsWith(item.path) && colorMap[item.color]?.borderClass
                                                    )}
                                                >
                                                    <span className="text-lg relative z-10">{item.icon}</span>
                                                    <span className="text-sm font-medium font-orbitron tracking-wide relative z-10">{item.name}</span>
                                                    {pathname.startsWith(item.path) && (
                                                        <motion.div
                                                            layoutId="active-mobile-menu"
                                                            className={cn(
                                                                "absolute right-4 w-1.5 h-1.5 rounded-full",
                                                                colorMap[item.color]?.bgClass,
                                                                colorMap[item.color]?.shadowClassMobile
                                                            )}
                                                        />
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

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
