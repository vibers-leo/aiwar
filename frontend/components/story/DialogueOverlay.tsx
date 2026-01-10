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

                    {/* Character Portrait */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                        <AnimatePresence mode="wait">
                            {portraitImage && (
                                <motion.div
                                    key={portraitImage}
                                    initial={{ x: isGemini ? -100 : 100, opacity: 0, scale: 0.9 }}
                                    animate={{ x: isGemini ? -150 : 150, opacity: 1, scale: 1.1 }}
                                    exit={{ x: isGemini ? -200 : 200, opacity: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className={cn(
                                        "absolute bottom-0 h-[80%] aspect-square max-w-[500px]",
                                        isGemini ? "left-1/4" : "right-1/4"
                                    )}
                                >
                                    <Image
                                        src={portraitImage}
                                        alt={speakerName}
                                        fill
                                        className="object-contain drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                                        priority
                                    />
                                </motion.div>
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
