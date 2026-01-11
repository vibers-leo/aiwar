'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { EncryptedText } from '@/components/ui/aceternity/encrypted-text';
import { TextGenerateEffect } from '@/components/ui/aceternity/text-generate-effect';

interface DialogueOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    dialogues: string[]; // Changed to array
    speakerName: string;
    characterImage?: string;
    type?: 'intro' | 'narrative' | 'boss';
}

export default function DialogueOverlay({
    isOpen,
    onClose,
    dialogues,
    speakerName,
    characterImage,
    type = 'intro'
}: DialogueOverlayProps) {
    const [displayText, setDisplayText] = useState('');
    const [isTypewriterFinished, setIsTypewriterFinished] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);

    // Get current dialogue with comprehensive safety check
    const currentDialogue = (dialogues && dialogues.length > 0 && dialogues[currentDialogueIndex]) ? dialogues[currentDialogueIndex] : '';

    // Extract speaker name from dialogue (format: "Name: text")
    const extractSpeaker = (text: string) => {
        if (!text || typeof text !== 'string') return speakerName;
        const match = text.match(/^([^:]+):/);
        return match ? match[1].trim() : speakerName;
    };

    const currentSpeaker = extractSpeaker(currentDialogue);
    const dialogueText = (currentDialogue && typeof currentDialogue === 'string')
        ? currentDialogue.replace(/^[^:]+:\s*/, '').replace(/^["']|["']$/g, '')
        : ''; // Remove "Name: " and quotes

    // Detect character types based on current speaker
    const isGemini = currentSpeaker.toLowerCase().includes('gemini') || currentSpeaker.includes('제미나이');
    const isChip = currentSpeaker.toLowerCase().includes('chip') || currentSpeaker.includes('칩');

    // Detect commander characters
    const isSam = currentSpeaker.toLowerCase().includes('sam') || currentSpeaker.includes('샘');
    const isDario = currentSpeaker.toLowerCase().includes('dario') || currentSpeaker.includes('다리오');
    const isElon = currentSpeaker.toLowerCase().includes('elon') || currentSpeaker.includes('일론');
    const isHassabis = currentSpeaker.toLowerCase().includes('hassabis') || currentSpeaker.includes('하사비스');
    const isCopilot = currentSpeaker.toLowerCase().includes('copilot') || currentSpeaker.includes('코파일럿');
    const isGrok = currentSpeaker.toLowerCase().includes('grok') || currentSpeaker.includes('그록');

    const isAlly = isGemini || isChip || isSam || isDario || isElon || isHassabis || isCopilot || isGrok;

    // Get display name with title for characters
    const getCharacterDisplayName = () => {
        if (isSam) return '샘 알트먼 - ChatGPT 군단장';
        if (isDario) return '다리오 아모데이 - Claude 군단장';
        if (isElon) return '일론 머스크 - Grok 군단장';
        if (isHassabis) return '데미스 하사비스 - Gemini 군단장';
        if (isGemini) return 'Gemini - AI 어시스턴트';
        if (isChip) return 'Chip - 싱귤래리티';
        if (isCopilot) return 'Copilot - 코딩 어시스턴트';
        if (isGrok) return 'Grok - AI 어시스턴트';
        return currentSpeaker; // For enemies, show extracted speaker name
    };

    const displayName = getCharacterDisplayName();

    // Track when effect is finished
    useEffect(() => {
        if (!isOpen) {
            setIsTypewriterFinished(false);
            setCurrentDialogueIndex(0);
            return;
        }

        // For Aceternity effects, set a timer based on dialogue length
        const estimatedDuration = isAlly ? dialogueText.length * 50 : 2000;
        const timeout = setTimeout(() => {
            setIsTypewriterFinished(true);
        }, estimatedDuration);

        return () => clearTimeout(timeout);
    }, [isOpen, dialogueText, isAlly, currentDialogueIndex]);

    const handleSkip = useCallback(() => {
        if (!isTypewriterFinished) {
            setIsTypewriterFinished(true);
        } else {
            // Move to next dialogue or close
            if (currentDialogueIndex < dialogues.length - 1) {
                setCurrentDialogueIndex(prev => prev + 1);
                setIsTypewriterFinished(false);
            } else {
                onClose();
            }
        }
    }, [isTypewriterFinished, currentDialogueIndex, dialogues, onClose]);

    if (!isOpen) return null;
    if (!dialogues || dialogues.length === 0) return null;

    // Map character images
    const defaultGeminiImage = '/assets/cards/gemini-character.png';
    const defaultChipImage = '/assets/cards/chip-character.png';
    const commanderImages: Record<string, string> = {
        sam: '/assets/cards/cmdr-chatgpt.png',
        dario: '/assets/cards/cmdr-claude.png',
        elon: '/assets/cards/cmdr-grok.png',
        hassabis: '/assets/cards/cmdr-gemini.png',
        copilot: '/assets/cards/copilot-character.png',  // 코파일럿도 캐릭터 카드 사용
        grok: '/assets/cards/grok-character.png',  // 그록은 캐릭터 카드 사용
    };

    const portraitImage = isGemini
        ? defaultGeminiImage
        : isChip
            ? defaultChipImage
            : isSam
                ? commanderImages.sam
                : isDario
                    ? commanderImages.dario
                    : isElon
                        ? commanderImages.elon
                        : isHassabis
                            ? commanderImages.hassabis
                            : isCopilot
                                ? commanderImages.copilot
                                : isGrok
                                    ? commanderImages.grok
                                    : characterImage;

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
                                    {!isAlly && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 0.5, 0] }}
                                            transition={{ duration: 0.3 }}
                                            className="absolute inset-0 bg-red-600/20 z-0 pointer-events-none"
                                        />
                                    )}

                                    /* Portrait with specialized animations */
                                    <motion.div
                                        key={portraitImage}
                                        initial={{
                                            x: isAlly ? -150 : 150,
                                            opacity: 0,
                                            scale: isAlly ? 1.0 : 1.4,
                                            filter: isAlly ? "blur(0px)" : "blur(10px) brightness(0.5)",
                                        }}
                                        animate={{
                                            x: isAlly ? -150 : 180,
                                            y: (!isAlly && type === 'boss') ? [0, -3, 3, -3, 0] : 0, // Only shake for bosses
                                            opacity: 1,
                                            scale: isAlly ? 1.1 : 1.5,
                                            filter: isAlly ? "blur(0px)" : "blur(0px) brightness(1)",
                                        }}
                                        transition={{
                                            x: { duration: 0.6, ease: "circOut" },
                                            y: { repeat: (!isAlly && type === 'boss') ? Infinity : 0, duration: 0.4, repeatType: "mirror" },
                                            duration: 0.6
                                        }}
                                        className={cn(
                                            "absolute bottom-0 h-[90%] aspect-square max-w-[800px]",
                                            isAlly ? "left-0" : "right-0"
                                        )}
                                    >
                                        {/* Glow Effect behind portrait - Pulsing for non-boss enemies */}
                                        <motion.div
                                            className={cn(
                                                "absolute inset-0 blur-[60px] rounded-full",
                                                isAlly ? (isChip ? "bg-yellow-400" : "bg-cyan-500") : "bg-red-500"
                                            )}
                                            animate={{
                                                opacity: isAlly ? 0.3 : [0.2, 0.4, 0.2],
                                                scale: isAlly ? 1 : [1, 1.05, 1]
                                            }}
                                            transition={{
                                                opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                                                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                                            }}
                                        />

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
                                isAlly ? (isChip ? "bg-yellow-600 border-yellow-400 text-white" : "bg-cyan-600 border-cyan-400 text-white") : "bg-red-600 border-red-400 text-white"
                            )}>
                                <span className="inline-block skew-x-[12deg] tracking-wider uppercase">
                                    {displayName}
                                </span>
                            </div>
                        </div>

                        {/* Main Dialogue Box */}
                        <div className={cn(
                            "w-full bg-zinc-900/90 backdrop-blur-xl border-2 p-8 rounded-tr-3xl rounded-b-3xl shadow-2xl relative min-h-[160px]",
                            isAlly ? (isChip ? "border-yellow-500/50" : "border-cyan-500/50") : "border-red-500/50"
                        )}>
                            {/* Decorative HUD Elements */}
                            <div className="absolute top-2 right-4 flex gap-1 opacity-50">
                                <div className="w-1 h-4 bg-cyan-400" />
                                <div className="w-1 h-3 bg-cyan-400/60" />
                                <div className="w-1 h-2 bg-cyan-400/30" />
                            </div>

                            {/* Dialogue Text with Reliable Animation */}
                            <div className="text-xl md:text-2xl font-medium leading-relaxed pr-12 min-h-[4rem]">
                                <motion.p
                                    key={`${currentDialogueIndex}-${isAlly}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className={cn(
                                        isAlly ? (isChip ? "text-yellow-100" : "text-gray-100") : "text-red-400"
                                    )}
                                >
                                    {dialogueText}
                                </motion.p>
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
