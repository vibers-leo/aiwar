'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SparklesCore } from '@/components/ui/aceternity/effects';

interface LeftSidebarProps {
    title: string;
    englishTitle?: string;
    icon?: React.ReactNode;
    tips?: string[];
    gameConditions?: React.ReactNode; // New: for game rules/conditions
    color?: 'red' | 'cyan' | 'purple' | 'green' | 'pink' | 'amber' | 'yellow' | 'blue';
    defaultExpanded?: boolean;
}

const colorThemes = {
    red: { border: 'border-red-500/20', text: 'text-red-400', accent: 'bg-red-500', sparkle: '#EF4444' },
    cyan: { border: 'border-cyan-500/20', text: 'text-cyan-400', accent: 'bg-cyan-500', sparkle: '#06B6D4' },
    purple: { border: 'border-purple-500/20', text: 'text-purple-400', accent: 'bg-purple-500', sparkle: '#A855F7' },
    green: { border: 'border-green-500/20', text: 'text-green-400', accent: 'bg-green-500', sparkle: '#22C55E' },
    pink: { border: 'border-pink-500/20', text: 'text-pink-400', accent: 'bg-pink-500', sparkle: '#EC4899' },
    amber: { border: 'border-amber-500/20', text: 'text-amber-400', accent: 'bg-amber-500', sparkle: '#F59E0B' },
    yellow: { border: 'border-yellow-500/20', text: 'text-yellow-400', accent: 'bg-yellow-500', sparkle: '#EAB308' },
    blue: { border: 'border-blue-500/20', text: 'text-blue-400', accent: 'bg-blue-500', sparkle: '#3B82F6' },
};

export default function LeftSidebar({
    title,
    englishTitle,
    icon,
    tips = [],
    gameConditions,
    color = 'cyan',
    defaultExpanded = true,
}: LeftSidebarProps) {
    const [isHovered, setIsHovered] = useState(false);
    const theme = colorThemes[color];

    return (
        <motion.div
            animate={{ width: isHovered ? '16vw' : '5vw' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "hidden lg:flex shrink-0 border-r flex-col relative z-20 bg-black/20 backdrop-blur-sm",
                theme.border,
                "hover:border-opacity-40 transition-colors"
            )}
        >
            {/* Sparkles Effect */}
            {isHovered && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <SparklesCore
                        id={`sidebar-sparkles-${color}`}
                        background="transparent"
                        minSize={0.3}
                        maxSize={1}
                        particleDensity={20}
                        particleColor={theme.sparkle}
                        speed={0.4}
                    />
                </div>
            )}

            {/* Content - Stop propagation to prevent toggle when clicking content */}
            <div
                className="flex-1 overflow-hidden relative z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon & Title Section */}
                <div className="p-6 pb-4">
                    <AnimatePresence mode="wait">
                        {isHovered ? (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Icon */}
                                {icon && (
                                    <div className={cn("mb-4", theme.text)}>
                                        {icon}
                                    </div>
                                )}

                                {/* Title - Larger, Bold, Italic with Glow */}
                                <h1 className={cn(
                                    "text-4xl font-black italic tracking-tight leading-tight mb-2",
                                    "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                                )}>
                                    {title}
                                </h1>

                                {/* English Subtitle */}
                                {englishTitle && (
                                    <p className={cn(
                                        "text-sm font-bold uppercase tracking-widest opacity-60",
                                        theme.text
                                    )}>
                                        {englishTitle}
                                    </p>
                                )}

                                {/* Decorative Line */}
                                <div className={cn("h-0.5 w-16 rounded-full mt-3", theme.accent)} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="collapsed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col items-center"
                            >
                                {/* Large Icon Only */}
                                {icon && (
                                    <div className={cn("w-10 h-10 flex items-center justify-center", theme.text)}>
                                        {icon}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Game Conditions Section */}
                {isHovered && gameConditions && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="px-6 pb-4 border-b border-white/5"
                    >
                        {gameConditions}
                    </motion.div>
                )}

                {/* Tips Section - with more spacing */}
                {isHovered && tips && tips.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="flex-1 overflow-y-auto px-6 pt-6 pb-6 space-y-3"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb size={14} className={theme.text} />
                            <h3 className={cn("text-xs font-black tracking-widest", theme.text)}>
                                TIPS
                            </h3>
                        </div>

                        {tips.map((tip, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-2 text-sm text-white/60 hover:text-white/90 transition-colors"
                            >
                                <span className={cn("font-bold shrink-0", theme.text)}>•</span>
                                <p className="leading-relaxed">{tip}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
