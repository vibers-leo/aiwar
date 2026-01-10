'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface DialogueOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    dialogue: string;
    speakerName: string;
    characterImage?: string;
    type?: 'intro' | 'narrative' | 'boss';
}

export default function DialogueOverlay({
    isOpen,
    onClose,
    dialogue,
    speakerName,
    characterImage,
    type = 'intro'
}: DialogueOverlayProps) {
    const [displayText, setDisplayText] = useState('');
    const [isTypewriterFinished, setIsTypewriterFinished] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Typewriter effect
    useEffect(() => {
        if (!isOpen) {
            setDisplayText('');
            setCurrentIndex(0);
            setIsTypewriterFinished(false);
            return;
        }

        if (currentIndex < dialogue.length) {
            const timeout = setTimeout(() => {
                setDisplayText(prev => prev + dialogue[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, 30); // 30ms per character
            return () => clearTimeout(timeout);
        } else {
            setIsTypewriterFinished(true);
        }
    }, [isOpen, dialogue, currentIndex]);

    const handleSkip = useCallback(() => {
        if (!isTypewriterFinished) {
            setDisplayText(dialogue);
            setCurrentIndex(dialogue.length);
            setIsTypewriterFinished(true);
        } else {
            onClose();
        }
    }, [isTypewriterFinished, dialogue, onClose]);

    if (!isOpen) return null;

    // Detect if speaker is Gemini
    const isGemini = speakerName.toLowerCase().includes('gemini') || speakerName.includes('제미나이');
    const defaultGeminiImage = '/assets/cards/gemini-character.png';
    const portraitImage = isGemini ? defaultGeminiImage : characterImage;

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[1000] flex items-end justify-center pointer-events-auto"
                    onClick={handleSkip}
                >
                    {/* Background Blur Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Character Portraits */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                        <AnimatePresence mode="wait">
                            {portraitImage && (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Backdrop Text for Atmosphere */}
                                    {!isGemini && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 2 }}
                                            animate={{ opacity: [0, 0.2, 0.1], scale: [2, 0.9, 1] }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                                        >
                                            <h1 className="text-[25vw] font-black orbitron uppercase tracking-[0.2em] text-red-600/30 italic blur-sm">
                                                WARNING
                                            </h1>
                                        </motion.div>
                                    )}

                                    {/* Screen Flash Effect for Hostiles */}
                                    {!isGemini && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 0.5, 0] }}
                                            transition={{ duration: 0.3 }}
                                            className="absolute inset-0 bg-red-600/20 z-0 pointer-events-none"
                                        />
                                    )}

                                    {/* Portrait with specialized animations */}
                                    <motion.div
                                        key={portraitImage}
                                        initial={{
                                            x: isGemini ? -150 : 150,
                                            opacity: 0,
                                            scale: isGemini ? 1.0 : 1.4,
                                            filter: isGemini ? "blur(0px)" : "blur(10px) brightness(0.5)",
                                        }}
                                        animate={{
                                            x: isGemini ? -150 : 180,
                                            y: !isGemini ? [0, -5, 5, -5, 0] : 0, // Screen shake / Rumble
                                            opacity: 1,
                                            scale: isGemini ? 1.1 : 1.5,
                                            filter: isGemini ? "blur(0px)" : "blur(0px) brightness(1)",
                                        }}
                                        transition={{
                                            x: { duration: 0.6, ease: "circOut" },
                                            y: { repeat: !isGemini ? Infinity : 0, duration: 0.15, repeatType: "mirror" },
                                            duration: 0.6
                                        }}
                                        className={cn(
                                            "absolute bottom-0 h-[90%] aspect-square max-w-[800px]",
                                            isGemini ? "left-0" : "right-0"
                                        )}
                                    >
                                        {/* Glow Effect behind portrait */}
                                        <div className={cn(
                                            "absolute inset-0 blur-[60px] opacity-30 rounded-full",
                                            isGemini ? "bg-cyan-500" : "bg-red-500"
                                        )} />

                                        <Image
                                            src={portraitImage}
                                            alt={speakerName}
                                            fill
                                            className={cn(
                                                "object-contain z-10",
                                                !isGemini && "drop-shadow-[0_0_50px_rgba(239,68,68,0.4)]"
                                            )}
                                            priority
                                        />

                                        {/* Glitch Overlay for Hostiles */}
                                        {!isGemini && (
                                            <motion.div
                                                animate={{
                                                    opacity: [0, 0.4, 0],
                                                    x: [0, 10, -10, 0]
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 0.2,
                                                    repeatDelay: 2
                                                }}
                                                className="absolute inset-0 z-20 mix-blend-screen overflow-hidden"
                                            >
                                                <Image
                                                    src={portraitImage}
                                                    alt="glitch"
                                                    fill
                                                    className="object-contain opacity-50 sepia(100%) hue-rotate(320deg)"
                                                />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Dialogue Box Container */}
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        className="relative w-full max-w-5xl px-6 pb-12 z-10"
                    >
                        {/* Speaker Name Label */}
                        <div className="flex mb-[-2px] ml-4">
                            <div className={cn(
                                "px-8 py-2 font-black orbitron italic skew-x-[-12deg] border-t border-x relative",
                                isGemini ? "bg-cyan-600 border-cyan-400 text-white" : "bg-red-600 border-red-400 text-white"
                            )}>
                                <span className="inline-block skew-x-[12deg] tracking-wider uppercase">
                                    {speakerName}
                                </span>
                            </div>
                        </div>

                        {/* Main Dialogue Box */}
                        <div className={cn(
                            "w-full bg-zinc-900/90 backdrop-blur-xl border-2 p-8 rounded-tr-3xl rounded-b-3xl shadow-2xl relative min-h-[160px]",
                            isGemini ? "border-cyan-500/50" : "border-red-500/50"
                        )}>
                            {/* Decorative HUD Elements */}
                            <div className="absolute top-2 right-4 flex gap-1 opacity-50">
                                <div className="w-1 h-4 bg-cyan-400" />
                                <div className="w-1 h-3 bg-cyan-400/60" />
                                <div className="w-1 h-2 bg-cyan-400/30" />
                            </div>

                            {/* Dialogue Text */}
                            <div className="text-xl md:text-2xl font-medium leading-relaxed text-gray-100 pr-12">
                                {displayText}
                                {!isTypewriterFinished && (
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                        className="inline-block w-3 h-6 bg-cyan-400 ml-1 translate-y-1"
                                    />
                                )}
                            </div>

                            {/* Prompt to continue */}
                            <AnimatePresence>
                                {isTypewriterFinished && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute bottom-4 right-8 flex items-center gap-2 text-cyan-400 font-bold"
                                    >
                                        <span className="text-xs orbitron animate-pulse">CLICK_TO_CONTINUE</span>
                                        <ChevronRight className="w-5 h-5 animate-bounce-x" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
