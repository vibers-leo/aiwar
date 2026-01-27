'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User, HelpCircle, Lightbulb, ShieldAlert } from 'lucide-react';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import Link from 'next/link';
import LeftSidebar from './LeftSidebar';
import { Modal, ModalContent, ModalHeader, ModalBody } from './ui/custom/Modal';
import { Button } from './ui/custom/Button';

interface CyberPageLayoutProps {
    children: React.ReactNode;
    title: string;
    englishTitle?: string;
    subtitle?: string;
    description?: string;
    color?: 'cyan' | 'purple' | 'pink' | 'amber' | 'yellow' | 'green' | 'red' | 'blue';
    showBack?: boolean;
    backPath?: string;
    action?: React.ReactNode;
    // Left Sidebar Props
    showLeftSidebar?: boolean;
    leftSidebarIcon?: React.ReactNode;
    leftSidebarTips?: string[];
    leftSidebarGameConditions?: React.ReactNode;
}

export default function CyberPageLayout({
    children,
    title,
    englishTitle,
    subtitle,
    description,
    color = 'cyan',
    showBack = true,
    backPath,
    action,
    showLeftSidebar = true,
    leftSidebarIcon,
    leftSidebarTips,
    leftSidebarGameConditions
}: CyberPageLayoutProps) {
    const router = useRouter();
    const { profile } = useUserProfile();
    const [isHelpOpen, setIsHelpOpen] = React.useState(false);

    // Color theme mapping
    const themeClasses = {
        cyan: "from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-400 bg-cyan-500/20",
        purple: "from-purple-500/10 to-transparent border-purple-500/20 text-purple-400 bg-purple-500/20",
        pink: "from-pink-500/10 to-transparent border-pink-500/20 text-pink-400 bg-pink-500/20",
        amber: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-400 bg-amber-500/20",
        yellow: "from-yellow-500/10 to-transparent border-yellow-500/20 text-yellow-400 bg-yellow-500/20",
        green: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400 bg-emerald-500/20",
        red: "from-red-500/10 to-transparent border-red-500/20 text-red-400 bg-red-500/20",
        blue: "from-blue-500/10 to-transparent border-blue-500/20 text-blue-400 bg-blue-500/20",
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col">
            <BackgroundBeams className="opacity-40" />

            {/* Header / Navigation */}
            <header className="relative z-50 border-b border-white/5 bg-black/40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {showBack && (
                            <button
                                onClick={() => backPath ? router.push(backPath) : router.back()}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                            >
                                <ArrowLeft size={20} className="text-gray-400 group-hover:text-white" />
                            </button>
                        )}
                        <Link href="/main" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-black italic text-sm shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                AW
                            </div>
                            <span className="font-black italic tracking-tighter text-xl hidden sm:block group-hover:text-cyan-400 transition-colors">AIWAR</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        {action}
                        <div className="h-8 w-[1px] bg-white/10 mx-1" />
                        <Link href="/profile" className="flex items-center gap-3 pl-2 py-1 pr-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all group">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-bold text-white/40 leading-none mb-1">COMMANDER</p>
                                <p className="text-xs font-bold text-white leading-none">{profile?.nickname || 'Guest'}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                                {profile?.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={16} className="text-gray-500" />
                                )}
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex w-full relative z-10">
                {/* Left Sidebar (Desktop Only) - Outside max-width container to stick to the left edge */}
                {showLeftSidebar && (
                    <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] flex-none">
                        <LeftSidebar
                            icon={leftSidebarIcon}
                            title={title}
                            tips={leftSidebarTips}
                            gameConditions={leftSidebarGameConditions}
                            color={color}
                        />
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto w-full space-y-8">
                        {/* Page Title Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn("px-2.5 py-1 rounded text-[10px] font-bold tracking-[0.2em] uppercase bg-gradient-to-r", themeClasses[color])}>
                                        {englishTitle || 'SYSTEM / INTERFACE'}
                                    </div>
                                </div>
                                <h1 className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter text-white uppercase orbitron drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="text-gray-400 font-medium tracking-widest mt-4 flex items-center gap-2 uppercase text-sm">
                                        <span className={cn("w-2 h-2 rounded-full", themeClasses[color])} />
                                        {subtitle}
                                    </p>
                                )}
                            </div>

                            {description && (
                                <div className="max-w-md bg-white/5 p-5 rounded-2xl border-l-2 border-cyan-500 backdrop-blur-sm border-t border-r border-b border-white/5">
                                    <p className="text-sm text-gray-300 leading-relaxed italic">
                                        "{description}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Page Content */}
                        <div className="relative">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                {children}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Info Button - Floating at bottom left */}
            {showLeftSidebar && (
                <button
                    onClick={() => setIsHelpOpen(true)}
                    className="lg:hidden fixed bottom-24 left-6 z-[60] w-14 h-14 bg-cyan-500 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.6)] flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all group"
                >
                    <HelpCircle size={28} className="group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">!</span>
                    </div>
                </button>
            )}

            {/* Help/Info Modal for Mobile */}
            <Modal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            >
                <ModalContent>
                    <ModalHeader className="border-cyan-500/30">
                        <div className="flex flex-col">
                            <span className="text-cyan-400 text-xs font-mono tracking-widest">SYSTEM / INFORMATION</span>
                            <span className="text-white text-xl font-black italic orbitron">{title}</span>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-6 pt-2 pb-6">
                            {/* Game Conditions */}
                            {leftSidebarGameConditions && (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-2 mb-4 text-cyan-400">
                                        <ShieldAlert size={18} />
                                        <h3 className="text-sm font-bold tracking-widest uppercase">RULES & CONDITIONS</h3>
                                    </div>
                                    <div className="text-white/80 leading-relaxed">
                                        {leftSidebarGameConditions}
                                    </div>
                                </div>
                            )}

                            {/* Tips List */}
                            {leftSidebarTips && leftSidebarTips.length > 0 && (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-2 mb-4 text-amber-400">
                                        <Lightbulb size={18} />
                                        <h3 className="text-sm font-bold tracking-widest uppercase">STRATEGY TIPS</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {leftSidebarTips.map((tip, idx) => (
                                            <div key={idx} className="flex gap-3 text-sm text-white/70">
                                                <span className="text-amber-500 font-bold mt-0.5">•</span>
                                                <p className="leading-relaxed">{tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button
                                fullWidth
                                onPress={() => setIsHelpOpen(false)}
                                className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400 h-12 font-bold tracking-[0.2em]"
                            >
                                ACKNOWLEDGE
                            </Button>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </main>
    );
}
