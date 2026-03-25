'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { InventoryCard } from '@/lib/inventory-system';
import GachaRevealModal from '@/components/GachaRevealModal';
import GlitchEffect from '@/components/effects/GlitchEffect';
import { tutorialScenarios, sceneOrder, replaceUserName, type TutorialScene, type DialogueLine } from '@/data/tutorial-scenarios';
import { getCharacterPortrait, getCharacterName, getCharacterStyle } from '@/lib/character-portraits';
import {
    ChevronRight, X, Volume2, VolumeX, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

import { updateNickname } from '@/lib/firebase-db';
import { useUserProfile } from '@/hooks/useUserProfile';

interface UnifiedTutorialModalProps {
    onClose?: () => void;
    onClaim?: () => void;
}

export default function UnifiedTutorialModal({ onClose, onClaim }: UnifiedTutorialModalProps) {
    const { user, claimStarterPack } = useUser();
    const { reload: reloadProfile } = useUserProfile();
    const [trackingId, setTrackingId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');

    // Scene and Dialogue State
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Nickname Input State (for Scene 2)
    const [nicknameInput, setNicknameInput] = useState('');

    // Reward State
    const [claimedCards, setClaimedCards] = useState<InventoryCard[]>([]);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Get current scene and dialogue
    const currentScene = tutorialScenarios[currentSceneIndex];
    const currentDialogue = currentScene?.dialogues[currentDialogueIndex];

    useEffect(() => {
        if (!user) return;

        // Resolve Tracking ID
        let id = user.uid;
        const sessionStr = localStorage.getItem('auth-session');
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                if (session?.user?.id) id = session.user.id;
            } catch (e) { }
        }
        setTrackingId(id);

        const checkTutorialStatus = async () => {
            const isCompleted = localStorage.getItem(`tutorial_completed_${id}`);

            if (isCompleted && !onClose) {
                setIsLoading(false);
                return;
            }

            setIsVisible(true);
            setIsLoading(false);
        };

        checkTutorialStatus();
    }, [user, onClose]);

    // Typing Effect
    useEffect(() => {
        if (!currentDialogue || !isVisible) return;

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
    }, [currentDialogue, isVisible, userName]);

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
            // End of scene, check action
            handleSceneAction();
        }
    };

    const handleSceneAction = async () => {
        const action = currentScene.action;

        if (action?.type === 'input') {
            // Scene 2: Nickname input - don't proceed until nickname is entered
            return;
        } else if (action?.type === 'claim') {
            // Scene 3: Claim starter pack
            if (onClaim) {
                onClaim();
            } else {
                await handleClaimReward();
            }
        } else if (action?.type === 'battle') {
            // Scene 4: Battle tutorial - for now just proceed
            proceedToNextScene();
        } else if (action?.type === 'highlight') {
            // Scene 5: Highlight story button and complete
            completeTutorial();
        } else {
            // Default: next scene
            proceedToNextScene();
        }
    };

    const handleNicknameSubmit = async () => {
        if (!nicknameInput.trim() || !user) return;

        // [FIX] Save nickname to Firebase immediately
        setIsProcessing(true);
        try {
            await updateNickname(nicknameInput.trim(), user.uid);
            await reloadProfile(); // Sync global state

            setUserName(nicknameInput.trim());
            proceedToNextScene();
        } catch (e) {
            console.error("Nickname Save Failed", e);
            // Optionally show error to user
        } finally {
            setIsProcessing(false);
        }
    };

    const proceedToNextScene = () => {
        if (currentSceneIndex < tutorialScenarios.length - 1) {
            setCurrentSceneIndex(prev => prev + 1);
            setCurrentDialogueIndex(0);
        } else {
            completeTutorial();
        }
    };

    const handleClaimReward = async () => {
        if (!user) return;

        setIsProcessing(true);
        try {
            const cards = await claimStarterPack('신입 지휘관');
            if (cards && cards.length > 0) {
                setClaimedCards(cards);
                setShowRewardModal(true);
                setIsVisible(false);
            } else {
                proceedToNextScene();
            }
        } catch (e) {
            console.error("Reward Claim Error", e);
            proceedToNextScene();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRewardClose = () => {
        setShowRewardModal(false);
        proceedToNextScene();
    };

    const completeTutorial = () => {
        if (trackingId) {
            localStorage.setItem(`tutorial_completed_${trackingId}`, 'true');
        }
        setIsVisible(false);

        // Highlight story button if Scene 5
        if (currentScene?.action?.type === 'highlight' && currentScene.action.target) {
            const element = document.querySelector(currentScene.action.target);
            if (element) {
                element.classList.add('tutorial-highlight-pulse');
                setTimeout(() => {
                    element.classList.remove('tutorial-highlight-pulse');
                }, 5000);
            }
        }

        if (onClose) onClose();
    };

    if (isLoading || (!isVisible && !showRewardModal)) return null;

    // Render Reward Modal if active
    if (showRewardModal) {
        return (
            <GachaRevealModal
                isOpen={true}
                cards={claimedCards}
                onClose={handleRewardClose}
                packType="premium"
                bonusReward={{ type: 'coins', amount: 1000 }}
            />
        );
    }

    if (!currentScene) return null;

    const characterStyle = currentDialogue ? getCharacterStyle(currentDialogue.speaker) : null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center">
                    {/* Background with optional glitch effect */}
                    {currentScene.backgroundEffect === 'glitch' ? (
                        <div className="absolute inset-0">
                            <GlitchEffect intensity="high" color="red">
                                <div className="w-full h-full bg-black" />
                            </GlitchEffect>
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                    )}

                    {/* Close Button */}
                    <button
                        onClick={completeTutorial}
                        className="absolute top-4 right-4 z-[210] text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                    >
                        <X size={24} />
                    </button>

                    {/* Mute Button */}
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="absolute top-4 right-16 z-[110] text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    {/* Main Content Container */}
                    <div className="relative z-[205] w-full h-full flex flex-col">
                        {/* Character Portrait (if exists) */}
                        {currentDialogue && currentDialogue.speaker !== 'system' && (
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="absolute left-8 bottom-[200px] md:bottom-[180px] w-32 h-32 md:w-40 md:h-40"
                            >
                                <div className={cn(
                                    "relative w-full h-full rounded-full border-4 overflow-hidden shadow-2xl bg-black",
                                    characterStyle?.borderColor,
                                    characterStyle?.glowColor
                                )}>
                                    <Image
                                        src={getCharacterPortrait(currentDialogue.speaker.replace(/\*\*/g, '')) || '/assets/icon-192x192.png'}
                                        alt={getCharacterName(currentDialogue.speaker.replace(/\*\*/g, ''))}
                                        fill
                                        className="object-cover"
                                        onError={(e) => {
                                            // Fallback if image fails to load
                                            e.currentTarget.src = '/assets/icons/icon-512x512.png';
                                        }}
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
                                    "relative bg-black/80 backdrop-blur-xl border rounded-2xl p-6 md:p-8 max-w-4xl mx-auto",
                                    characterStyle?.borderColor || "border-white/20"
                                )}
                            >
                                {/* Speaker Name */}
                                {currentDialogue && currentDialogue.speaker !== 'system' && (
                                    <div className={cn(
                                        "font-bold orbitron text-sm md:text-base mb-3 tracking-wide",
                                        characterStyle?.color || "text-white"
                                    )}>
                                        {getCharacterName(currentDialogue.speaker.replace(/\*\*/g, ''))}
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

                                {/* Scene 2: Nickname Input */}
                                {currentScene.id === 'scene_2_syncing' && currentDialogueIndex === currentScene.dialogues.length - 1 && (
                                    <div className="mb-6">
                                        <input
                                            type="text"
                                            value={nicknameInput}
                                            onChange={(e) => setNicknameInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleNicknameSubmit()}
                                            placeholder="지휘관 명을 입력하세요"
                                            className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono"
                                            maxLength={20}
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between">
                                    {/* Progress Indicator */}
                                    <div className="flex gap-1">
                                        {currentScene.dialogues.map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "h-1 rounded-full transition-all",
                                                    i === currentDialogueIndex ? "w-6 bg-cyan-500" : "w-2 bg-white/20"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    {/* Next/Action Button */}
                                    {currentScene.id === 'scene_2_syncing' && currentDialogueIndex === currentScene.dialogues.length - 1 ? (
                                        <button
                                            onClick={handleNicknameSubmit}
                                            disabled={!nicknameInput.trim()}
                                            className={cn(
                                                "px-6 py-3 rounded-lg font-bold orbitron text-sm flex items-center gap-2 transition-all",
                                                nicknameInput.trim()
                                                    ? "bg-cyan-500 text-black hover:bg-cyan-400"
                                                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                            )}
                                        >
                                            등록
                                            <ChevronRight size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleNextDialogue}
                                            disabled={isProcessing}
                                            className={cn(
                                                "px-6 py-3 rounded-lg font-bold orbitron text-sm flex items-center gap-2 transition-all",
                                                characterStyle?.bgColor && characterStyle?.color
                                                    ? `${characterStyle.bgColor} ${characterStyle.color} hover:opacity-80`
                                                    : "bg-cyan-500 text-black hover:bg-cyan-400"
                                            )}
                                        >
                                            {isProcessing ? '처리 중...' :
                                                currentDialogueIndex < currentScene.dialogues.length - 1 ? '다음' :
                                                    currentScene.action?.buttonText || '계속'}
                                            {!isProcessing && <ChevronRight size={16} />}
                                        </button>
                                    )}
                                </div>

                                {/* Scene Progress */}
                                <div className="mt-4 text-center text-xs text-gray-500 font-mono">
                                    SCENE {currentSceneIndex + 1} / {tutorialScenarios.length} - {currentScene.subtitle}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* CSS for highlight pulse */}
                    <style jsx global>{`
                        @keyframes tutorial-pulse {
                            0%, 100% {
                                box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7);
                            }
                            50% {
                                box-shadow: 0 0 0 20px rgba(34, 211, 238, 0);
                            }
                        }
                        
                        .tutorial-highlight-pulse {
                            animation: tutorial-pulse 2s ease-in-out infinite;
                            position: relative;
                            z-index: 60;
                        }
                    `}</style>
                </div>
            )}
        </AnimatePresence>
    );
}
