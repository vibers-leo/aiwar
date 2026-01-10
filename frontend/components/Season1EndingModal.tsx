'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { season1Ending, markEndingWatched, season1Reward, type EndingScene } from '@/data/season1-ending';
import { replaceUserName } from '@/data/tutorial-scenarios';
import { getCharacterPortrait, getCharacterName, getCharacterStyle } from '@/lib/character-portraits';
import { ChevronRight, X, Sparkles, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Season1EndingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    userId: string;
}

export default function Season1EndingModal({ isOpen, onClose, userName, userId }: Season1EndingModalProps) {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [showSeason2Teaser, setShowSeason2Teaser] = useState(false);

    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const currentScene = season1Ending[currentSceneIndex];
    const currentDialogue = currentScene?.dialogues[currentDialogueIndex];

    // Typing Effect
    useEffect(() => {
        if (!currentDialogue || !isOpen) return;

        const fullText = replaceUserName(currentDialogue.text, userName || '지휘관');

        if (currentDialogue.effect === 'typing') {
            setIsTyping(true);
            setDisplayedText('');
            let charIndex = 0;

            typingIntervalRef.current = setInterval(() => {
                if (charIndex < fullText.length) {
                    setDisplayedText(fullText.substring(0, charIndex + 1));
                    charIndex++;
                } else {
                    setIsTyping(false);
                    if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                    }
                }
            }, 30);

            return () => {
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                }
            };
        } else {
            setDisplayedText(fullText);
            setIsTyping(false);
        }
    }, [currentDialogue, isOpen, userName]);

    // BGM Change Effect (Scene 3)
    useEffect(() => {
        if (currentScene?.id === 'ending_3_ominous') {
            // Trigger lighting flicker effect
            document.body.classList.add('ending-flicker');
            setTimeout(() => {
                document.body.classList.remove('ending-flicker');
            }, 2000);
        }
    }, [currentScene]);

    const handleNextDialogue = () => {
        if (isTyping && typingIntervalRef.current) {
            // Skip typing animation
            clearInterval(typingIntervalRef.current);
            setDisplayedText(replaceUserName(currentDialogue.text, userName || '지휘관'));
            setIsTyping(false);
            return;
        }

        if (currentDialogueIndex < currentScene.dialogues.length - 1) {
            setCurrentDialogueIndex(prev => prev + 1);
        } else {
            // End of scene
            if (currentScene.id === 'ending_2_reward') {
                // Show reward after Scene 2
                setShowReward(true);
            } else if (currentSceneIndex < season1Ending.length - 1) {
                setCurrentSceneIndex(prev => prev + 1);
                setCurrentDialogueIndex(0);
            } else {
                // End of all scenes
                handleEndingComplete();
            }
        }
    };

    const handleRewardClose = () => {
        setShowReward(false);
        // Proceed to next scene
        setCurrentSceneIndex(prev => prev + 1);
        setCurrentDialogueIndex(0);
    };

    const handleEndingComplete = () => {
        markEndingWatched(userId);
        setShowSeason2Teaser(true);
    };

    const handleFinalClose = () => {
        setShowSeason2Teaser(false);
        onClose();
    };

    if (!isOpen) return null;

    // Season 2 Teaser
    if (showSeason2Teaser) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="mb-8"
                    >
                        <h1 className="text-6xl font-black orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4">
                            SEASON 2
                        </h1>
                        <h2 className="text-4xl font-bold text-white mb-2">도원결의 편</h2>
                        <p className="text-xl text-gray-400 font-mono">The Oath of the Peach Garden</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="text-2xl text-cyan-400 font-bold mb-8"
                    >
                        COMING SOON
                    </motion.div>

                    <button
                        onClick={handleFinalClose}
                        className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold orbitron rounded-lg hover:opacity-80 transition-opacity"
                    >
                        로비로 돌아가기
                    </button>
                </motion.div>
            </div>
        );
    }

    // Reward Modal
    if (showReward) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-purple-900/50 to-cyan-900/50 border-2 border-cyan-500 rounded-2xl p-8 max-w-md w-full mx-4"
                >
                    <div className="text-center mb-6">
                        <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-black orbitron text-cyan-400 mb-2">
                            {season1Reward.title}
                        </h2>
                        <p className="text-gray-400 text-sm">시즌 1 완료를 축하합니다!</p>
                    </div>

                    <div className="space-y-3 mb-6">
                        {season1Reward.items.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center justify-between bg-black/50 p-3 rounded-lg"
                            >
                                <span className="text-white font-medium">
                                    {item.type === 'coins' && '💰 코인'}
                                    {item.type === 'tokens' && '⚡ 토큰'}
                                    {item.type === 'title' && '🏆 칭호'}
                                    {item.type === 'card_pack' && '🎴 카드팩'}
                                </span>
                                <span className="text-cyan-400 font-bold">
                                    {'amount' in item && `+${item.amount}`}
                                    {'name' in item && item.name}
                                    {'count' in item && `x${item.count}`}
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    <button
                        onClick={handleRewardClose}
                        className="w-full px-6 py-3 bg-cyan-500 text-black font-bold orbitron rounded-lg hover:bg-cyan-400 transition-colors"
                    >
                        수령 완료
                    </button>
                </motion.div>
            </div>
        );
    }

    const characterStyle = currentDialogue && currentDialogue.speaker !== 'system'
        ? getCharacterStyle(currentDialogue.speaker)
        : null;

    // Determine background darkness
    const isDarkBackground = currentScene?.background === 'lobby-dark';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={cn(
                    "fixed inset-0 z-[100] flex items-center justify-center transition-colors duration-1000",
                    isDarkBackground ? "bg-black" : "bg-black/80"
                )}>
                    {/* Flicker Effect Overlay */}
                    {isDarkBackground && (
                        <motion.div
                            animate={{ opacity: [0, 0.3, 0, 0.2, 0] }}
                            transition={{ duration: 0.5, repeat: 2 }}
                            className="absolute inset-0 bg-red-500/20 pointer-events-none"
                        />
                    )}

                    {/* Close Button */}
                    <button
                        onClick={handleFinalClose}
                        className="absolute top-4 right-4 z-[110] text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                    >
                        <X size={24} />
                    </button>

                    {/* Main Content Container */}
                    <div className="relative z-[105] w-full h-full flex flex-col">
                        {/* Character Portrait */}
                        {currentDialogue && currentDialogue.speaker !== 'system' && (
                            <motion.div
                                key={currentDialogue.speaker}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="absolute left-8 bottom-[200px] md:bottom-[180px] w-32 h-32 md:w-40 md:h-40"
                            >
                                <div className={cn(
                                    "relative w-full h-full rounded-full border-4 overflow-hidden shadow-2xl",
                                    characterStyle?.borderColor,
                                    characterStyle?.glowColor
                                )}>
                                    <Image
                                        src={getCharacterPortrait(currentDialogue.speaker)}
                                        alt={getCharacterName(currentDialogue.speaker)}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Dialogue Box (Bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "relative bg-black/90 backdrop-blur-xl border rounded-2xl p-6 md:p-8 max-w-4xl mx-auto",
                                    characterStyle?.borderColor || "border-white/20"
                                )}
                            >
                                {/* Speaker Name or System Message */}
                                {currentDialogue && (
                                    <div className={cn(
                                        "font-bold orbitron text-sm md:text-base mb-3 tracking-wide",
                                        currentDialogue.speaker === 'system'
                                            ? "text-yellow-400 text-center"
                                            : characterStyle?.color || "text-white"
                                    )}>
                                        {currentDialogue.speaker === 'system'
                                            ? '[ 시스템 메시지 ]'
                                            : getCharacterName(currentDialogue.speaker)}
                                    </div>
                                )}

                                {/* Dialogue Text */}
                                <div className="text-white text-base md:text-lg leading-relaxed mb-6 min-h-[60px]">
                                    {displayedText}
                                    {isTyping && (
                                        <motion.span
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                            className="inline-block ml-1"
                                        >
                                            ▊
                                        </motion.span>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between">
                                    {/* Progress Indicator */}
                                    <div className="flex gap-1">
                                        {currentScene?.dialogues.map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "h-1 rounded-full transition-all",
                                                    i === currentDialogueIndex ? "w-6 bg-cyan-500" : "w-2 bg-white/20"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        onClick={handleNextDialogue}
                                        className="px-6 py-3 rounded-lg font-bold orbitron text-sm flex items-center gap-2 transition-all bg-cyan-500 text-black hover:bg-cyan-400"
                                    >
                                        {currentDialogueIndex < currentScene.dialogues.length - 1 ? '다음' : '계속'}
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                                {/* Scene Progress */}
                                <div className="mt-4 text-center text-xs text-gray-500 font-mono">
                                    ENDING SCENE {currentSceneIndex + 1} / {season1Ending.length} - {currentScene.subtitle}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* CSS for flicker effect */}
                    <style jsx global>{`
            @keyframes ending-flicker {
              0%, 100% { filter: brightness(1); }
              25% { filter: brightness(0.7); }
              50% { filter: brightness(1.2); }
              75% { filter: brightness(0.8); }
            }
            
            .ending-flicker {
              animation: ending-flicker 0.5s ease-in-out 3;
            }
          `}</style>
                </div>
            )}
        </AnimatePresence>
    );
}
