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
        cyan: "from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-400",
        purple: "from-purple-500/10 to-transparent border-purple-500/20 text-purple-400",
        pink: "from-pink-500/10 to-transparent border-pink-500/20 text-pink-400",
        amber: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-400",
        yellow: "from-yellow-500/10 to-transparent border-yellow-500/20 text-yellow-400",
        green: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400",
        red: "from-red-500/10 to-transparent border-red-500/20 text-red-400",
        blue: "from-blue-500/10 to-transparent border-blue-500/20 text-blue-400",
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

            <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                {/* Left Sidebar (Desktop Only) */}
                {showLeftSidebar && (
                    <div className="hidden lg:block lg:col-span-3 space-y-6">
                        <LeftSidebar
                            icon={leftSidebarIcon}
                            title={title}
                            tips={leftSidebarTips}
                            gameConditions={leftSidebarGameConditions}
                        />
                    </div>
                )}

                {/* Main Content */}
                <div className={cn(
                    "space-y-8",
                    showLeftSidebar ? "lg:col-span-9" : "lg:col-span-12"
                )}>
                    {/* Page Title Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r", themeClasses[color])}>
                                    {englishTitle || 'SYSTEM / INTERFACE'}
                                </div>
                                <button
                                    onClick={() => setIsHelpOpen(true)}
                                    className="lg:hidden p-1 text-gray-400 hover:text-white"
                                >
                                    <HelpCircle size={16} />
                                </button>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase orbitron">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-gray-400 font-medium tracking-wide mt-2">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {description && (
                            <div className="max-w-md bg-white/5 p-4 rounded-2xl border-l-2 border-cyan-500 backdrop-blur-sm">
                                <p className="text-sm text-gray-300 leading-relaxed italic">
                                    "{description}"
                                </p>
                            </div>
                        )}
                    </div>

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
            >
                <ModalContent>
                    <ModalHeader className="border-cyan-500/30">
                        <div className="flex flex-col">
                            <span className="text-cyan-400 text-xs font-mono tracking-widest">HELP / TIPS</span>
                            <span className="text-white text-xl font-black italic orbitron">{title}</span>
                        </div>
                    </ModalHeader>
                    <ModalBody>
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

                            {/* Tips List */}
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
                    </ModalBody>
                </ModalContent>
            </Modal>
        </main>
    );
}
