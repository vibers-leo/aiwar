
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useGameSound } from '@/hooks/useGameSound';
import { EncryptedText } from '@/components/ui/aceternity/encrypted-text';

interface DialogueOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel?: () => void; // NEW: Cancel/Back handler
    dialogues: string[];
    speakerName: string;
    characterImage?: string;
    type?: 'intro' | 'narrative' | 'boss';
}

export default function DialogueOverlay({
    isOpen,
    onClose,
    onCancel,
    dialogues,
    speakerName,
    characterImage,
    type = 'intro'
}: DialogueOverlayProps) {
    const [isTypewriterFinished, setIsTypewriterFinished] = useState(false);
    const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const { playSound, stopBGM } = useGameSound();

    // Get current dialogue with comprehensive safety check
    const currentDialogue = (dialogues && dialogues.length > 0 && dialogues[currentDialogueIndex]) ? dialogues[currentDialogueIndex] : '';

    // Extract speaker name from dialogue (format: "Name: text")
    const extractSpeaker = (text: string) => {
        let extracted = speakerName;
        if (text && typeof text === 'string') {
            const match = text.match(/^([^:]+):/);
            if (match) {
                extracted = match[1];
            }
        }
        // Clean up bold markers and quotes from the speaker name
        return extracted.replace(/['"*]/g, '').trim();
    };

    const currentSpeaker = extractSpeaker(currentDialogue);

    // [FIX] remove bold markers from body text
    const dialogueText = (currentDialogue && typeof currentDialogue === 'string')
        ? currentDialogue.replace(/^[^:]+:\s*/, '').replace(/^["']|["']$/g, '').replace(/\*\*/g, '')
        : '';

    // Debugging character detection
    // console.log(`[DialogueOverlay] Speaker: "${currentSpeaker}", Raw: "${dialogues[currentDialogueIndex]}"`);

    // Detect character types based on current speaker
    const speakerLower = currentSpeaker.toLowerCase();
    const isGemini = speakerLower.includes('gemini') || currentSpeaker.includes('제미나이');
    const isChip = speakerLower.includes('chip') || currentSpeaker.includes('칩');

    // Detect commander characters
    const isSam = speakerLower.includes('sam') || currentSpeaker.includes('샘');
    const isDario = speakerLower.includes('dario') || currentSpeaker.includes('다리오');
    const isElon = speakerLower.includes('elon') || currentSpeaker.includes('일론');
    const isHassabis = speakerLower.includes('hassabis') || currentSpeaker.includes('하사비스');
    const isCopilot = speakerLower.includes('copilot') || currentSpeaker.includes('코파일럿');
    // [FIX] 'grok' short string might match inside other words, but usually safe as name
    const isGrok = speakerLower.includes('grok') || currentSpeaker.includes('그록');

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

    // Effect 1: Handle BGM (Mount/Unmount/Open state)
    useEffect(() => {
        if (isOpen) {
            // Play BGM when overlay opens
            playSound('bgm_story', 'bgm');
        } else {
            stopBGM();
        }

        return () => {
            stopBGM();
        };
    }, [isOpen, playSound, stopBGM]);

    // Effect: ESC key to cancel
    useEffect(() => {
        if (!isOpen || !onCancel) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                playSound('click');
                stopBGM();
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel, playSound, stopBGM]);

    // Effect 2: Typewriter Logic (No TTS)
    useEffect(() => {
        if (!isOpen) {
            setIsTypewriterFinished(false);
            setCurrentDialogueIndex(0);
            setDisplayedText('');
            return;
        }

        // Reset state for new dialogue
        setDisplayedText('');
        setIsTypewriterFinished(false);

        let currentIndex = 0;
        const speed = isAlly ? 30 : 50; // Enemies type slightly slower/heavier

        const intervalId = setInterval(() => {
            if (currentIndex < dialogueText.length) {
                const char = dialogueText[currentIndex];
                if (char !== undefined) {
                    setDisplayedText((prev) => prev + char);
                }
                currentIndex++;
            } else {
                clearInterval(intervalId);
                setIsTypewriterFinished(true);
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [isOpen, currentDialogueIndex, dialogueText, isAlly]);

    const handleSkip = useCallback((e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        playSound('click');

        if (!isTypewriterFinished) {
            // Instant finish
            setDisplayedText(dialogueText);
            setIsTypewriterFinished(true);
        } else {
            // Move to next dialogue or close
            if (currentDialogueIndex < dialogues.length - 1) {
                setCurrentDialogueIndex(prev => prev + 1);
                // Typewriter effect will reset via useEffect dependency on currentDialogueIndex
            } else {
                stopBGM();
                onClose();
            }
        }
    }, [isTypewriterFinished, currentDialogueIndex, dialogues, onClose, stopBGM, playSound, dialogueText]);

    if (!isOpen) return null;
    if (!dialogues || dialogues.length === 0) return null;

    // Map character images
    const defaultGeminiImage = '/assets/cards/gemini-character.png';
    const defaultChipImage = '/assets/characters/chip.mp4';
    const commanderImages: Record<string, string> = {
        sam: '/assets/cards/cmdr-chatgpt.png',
        dario: '/assets/cards/cmdr-claude.png',
        elon: '/assets/cards/cmdr-grok.png',
        hassabis: '/assets/cards/cmdr-gemini.png',
        copilot: '/assets/cards/copilot-character.png',
        grok: '/assets/cards/grok-character.png',
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

    // Handle cancel/back
    const handleCancel = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        playSound('click');
        stopBGM();
        if (onCancel) {
            onCancel();
        }
    }, [onCancel, playSound, stopBGM]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[1000] flex items-end justify-center pointer-events-auto"
                    onClick={handleSkip}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Cancel/Back Button */}
                    {onCancel && (
                        <motion.button
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            onClick={handleCancel}
                            className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-red-500/20 border border-white/20 hover:border-red-500/50 rounded-lg text-white/70 hover:text-white transition-all group"
                        >
                            <X size={18} className="group-hover:text-red-400" />
                            <span className="text-sm font-medium">나가기</span>
                        </motion.button>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                        <AnimatePresence mode="wait">
                            {portraitImage && (
                                <div className="relative w-full h-full flex items-center justify-center">
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

                                    {!isAlly && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 0.5, 0] }}
                                            transition={{ duration: 0.3 }}
                                            className="absolute inset-0 bg-red-600/20 z-0 pointer-events-none"
                                        />
                                    )}

                                    <motion.div
                                        key={portraitImage}
                                        initial={{
                                            x: isAlly ? -150 : 150,
                                            opacity: 0,
                                            scale: isAlly ? 1.1 : 1.4,
                                            filter: isAlly ? "blur(0px)" : "blur(10px) brightness(0.5)",
                                        }}
                                        animate={{
                                            x: isAlly ? -150 : 180,
                                            y: (!isAlly && type === 'boss') ? [0, -3, 3, -3, 0] : 0,
                                            opacity: 1,
                                            scale: isAlly ? 1.2 : 1.5,
                                            filter: isAlly ? "blur(0px)" : "blur(0px) brightness(1)",
                                        }}
                                        transition={{
                                            x: { duration: 0.6, ease: "circOut" },
                                            y: { repeat: (!isAlly && type === 'boss') ? Infinity : 0, duration: 0.4, repeatType: "mirror" },
                                            duration: 0.6
                                        }}
                                        className={cn(
                                            "absolute bottom-0 h-[60%] md:h-full aspect-square max-w-[1000px]",
                                            isAlly ? "left-[-10%] md:left-0" : "right-[-10%] md:right-0"
                                        )}
                                    >
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

                                        {portraitImage.endsWith('.mp4') ? (
                                            <video
                                                src={portraitImage}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className={cn(
                                                    "h-full w-full object-contain z-10",
                                                    !isGemini && "drop-shadow-[0_0_50px_rgba(239,68,68,0.4)]"
                                                )}
                                            />
                                        ) : (
                                            <Image
                                                src={portraitImage}
                                                alt={speakerName}
                                                fill
                                                sizes="(max-width: 1024px) 100vw, 50vw"
                                                className={cn(
                                                    "object-contain z-10",
                                                    !isGemini && "drop-shadow-[0_0_50px_rgba(239,68,68,0.4)]"
                                                )}
                                                priority
                                            />
                                        )}
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        className="relative w-full max-w-5xl px-6 pb-12 z-10"
                    >
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

                        <div className={cn(
                            "w-full bg-zinc-900/90 backdrop-blur-xl border-2 p-4 md:p-8 rounded-tr-3xl rounded-b-3xl shadow-2xl relative min-h-[140px] md:min-h-[160px]",
                            isAlly ? (isChip ? "border-yellow-500/50" : "border-cyan-500/50") : "border-red-500/50"
                        )}>
                            <div className="text-base md:text-2xl font-medium leading-relaxed pr-8 md:pr-12 min-h-[3rem] md:min-h-[4rem]">
                                {isAlly ? (
                                    <p className={cn(
                                        "whitespace-pre-wrap",
                                        isChip ? "text-yellow-100" : "text-gray-100"
                                    )}>
                                        {displayedText}
                                        {!isTypewriterFinished && <span className="animate-pulse inline-block ml-1">|</span>}
                                    </p>
                                ) : (
                                    <EncryptedText
                                        key={dialogueText}
                                        text={dialogueText}
                                        className="text-red-400"
                                        duration={Math.min(3000, dialogueText.length * 50)}
                                        onComplete={() => setIsTypewriterFinished(true)}
                                    />
                                )}
                            </div>

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
