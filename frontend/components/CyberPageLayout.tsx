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
import { Modal } from './ui/custom/Modal';

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

const colorConfig = {
    cyan: {
        text: 'text-cyan-400',
        glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
        border: 'border-cyan-500/30',
        bg: 'bg-cyan-500/10',
        line: 'bg-cyan-500',
    },
    purple: {
        text: 'text-purple-400',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
        border: 'border-purple-500/30',
        bg: 'bg-purple-500/10',
        line: 'bg-purple-500',
    },
    pink: {
        text: 'text-pink-400',
        glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
        border: 'border-pink-500/30',
        bg: 'bg-pink-500/10',
        line: 'bg-pink-500',
    },
    amber: {
        text: 'text-amber-400',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/10',
        line: 'bg-amber-500',
    },
    yellow: {
        text: 'text-yellow-400',
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
        border: 'border-yellow-500/30',
        bg: 'bg-yellow-500/10',
        line: 'bg-yellow-500',
    },
    green: {
        text: 'text-green-400',
        glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
        border: 'border-green-500/30',
        bg: 'bg-green-500/10',
        line: 'bg-green-500',
    },
    red: {
        text: 'text-red-400',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        border: 'border-red-500/30',
        bg: 'bg-red-500/10',
        line: 'bg-red-500',
    },
    blue: {
        text: 'text-blue-400',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10',
        line: 'bg-blue-500',
    },
};

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
    leftSidebarTips = [],
    leftSidebarGameConditions,
}: CyberPageLayoutProps) {
    const router = useRouter();
    const colors = colorConfig[color];
    const { profile } = useUserProfile();
    const [isHelpOpen, setIsHelpOpen] = React.useState(false);

    const handleBack = () => {
        if (backPath) {
            router.push(backPath);
        } else {
            router.back();
        }
    };

    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden flex">
            {/* Left Sidebar - Hidden on mobile/tablet */}
            {showLeftSidebar && (
                <div className="hidden lg:flex">
                    <LeftSidebar
                        title={title}
                        englishTitle={englishTitle}
                        icon={leftSidebarIcon}
                        tips={leftSidebarTips}
                        gameConditions={leftSidebarGameConditions}
                        color={color}
                    />
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Grid Background */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

                {/* Top Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-cyan-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.01] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

                {/* Background Beams */}
                <div className="absolute inset-0 pointer-events-none opacity-30">
                    <BackgroundBeams />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-8 w-full">
                    {/* Page Header */}
                    <motion.header
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-10"
                    >
                        {/* Show title in header when sidebar is disabled OR on mobile */}
                        <div className={cn("flex items-center justify-between mb-6", showLeftSidebar ? "lg:hidden" : "")}>
                            <div className="flex items-center gap-4">
                                {/* Accent Line */}
                                <div className={cn("w-1 h-12 rounded-full", colors.line, colors.glow)} />

                                <div>
                                    {/* Subtitle */}
                                    {subtitle && (
                                        <p className={cn("text-[10px] font-mono uppercase tracking-[0.3em] mb-1", colors.text)}>
                                            {subtitle}
                                        </p>
                                    )}
                                    {/* Title */}
                                    <div className="flex items-baseline gap-3">
                                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white font-sans">
                                            {title}
                                        </h1>
                                        {englishTitle && (
                                            <span className="text-sm md:text-lg font-bold orbitron text-white/30 tracking-widest uppercase">
                                                {englishTitle}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions + Help + Back Button */}
                            <div className="flex items-center gap-2 md:gap-3">
                                {action}

                                {showLeftSidebar && (
                                    <button
                                        onClick={() => setIsHelpOpen(true)}
                                        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                                    >
                                        <HelpCircle size={20} />
                                    </button>
                                )}

                                {showBack && (
                                    <button
                                        onClick={handleBack}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all group"
                                    >
                                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                        <span className="text-[9px] font-mono uppercase tracking-widest hidden xs:block">BACK</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Show minimal header row when sidebar is enabled (Desktop Only) */}
                        {showLeftSidebar && (
                            <div className="hidden lg:flex items-center justify-between">
                                {/* Left: Description */}
                                {description && (
                                    <p className="text-sm text-white/40 max-w-4xl leading-relaxed text-left">
                                        {description}
                                    </p>
                                )}

                                {/* Right: Actions + Back Button */}
                                <div className="flex items-center gap-3">
                                    {action}

                                    {showBack && (
                                        <button
                                            onClick={handleBack}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all group"
                                        >
                                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                            <span className="text-[9px] font-mono uppercase tracking-widest">BACK</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Description below title when sidebar is disabled OR on mobile */}
                        <div className={cn("mt-4", showLeftSidebar ? "lg:hidden" : "")}>
                            {description && (
                                <p className="text-sm text-white/40 max-w-4xl leading-relaxed pl-5 border-l border-white/10 text-left">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Separator Line */}
                        <div className="mt-4 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                    </motion.header>

                    {/* Page Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </div>
            </div>

            {/* Help Modal for Mobile */}
            <Modal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={title}
                subtitle="HELP / TIPS"
            >
                <div className="space-y-6 pt-2">
                    {/* Game Conditions */}
                    {leftSidebarGameConditions && (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-2 mb-4 text-cyan-400">
                                <ShieldAlert size={18} />
                                <h3 className="text-sm font-bold tracking-widest uppercase">RULES</h3>
                            </div>
                            <div className="text-white/80">
                                {leftSidebarGameConditions}
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    {leftSidebarTips && leftSidebarTips.length > 0 && (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-2 mb-4 text-amber-400">
                                <Lightbulb size={18} />
                                <h3 className="text-sm font-bold tracking-widest uppercase">TIPS</h3>
                            </div>
                            <div className="space-y-3">
                                {leftSidebarTips.map((tip, idx) => (
                                    <div key={idx} className="flex gap-3 text-sm text-white/70">
                                        <span className="text-amber-500 font-bold">•</span>
                                        <p>{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        fullWidth
                        onPress={() => setIsHelpOpen(false)}
                        className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400 mt-4"
                    >
                        CONFIRM
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
