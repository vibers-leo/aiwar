'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { Card } from '@/lib/types';
import GachaRevealModal from '@/components/GachaRevealModal';
import {
    Terminal, Swords, Shield, Zap, Gift, ChevronRight, X, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';

interface TutorialStep {
    id: string;
    title: string;
    content: string;
    icon?: string;
    color?: string;
    highlight?: string;
    position?: 'top' | 'bottom' | 'center';
    action: 'next' | 'claim' | 'close';
    reward?: string;
}

const parseMarkdownTutorial = (md: string): TutorialStep[] => {
    const steps: TutorialStep[] = [];
    const rawSteps = md.split('# step:').filter(s => s.trim());

    rawSteps.forEach(raw => {
        const lines = raw.split('\n');
        const id = lines[0].trim();
        const step: any = { id };

        lines.slice(1).forEach(line => {
            if (line.startsWith('## title:')) step.title = line.replace('## title:', '').trim();
            else if (line.startsWith('## content:')) step.content = line.replace('## content:', '').trim();
            else if (line.startsWith('## icon:')) step.icon = line.replace('## icon:', '').trim();
            else if (line.startsWith('## color:')) step.color = line.replace('## color:', '').trim();
            else if (line.startsWith('## highlight:')) step.highlight = line.replace('## highlight:', '').trim();
            else if (line.startsWith('## position:')) step.position = line.replace('## position:', '').trim();
            else if (line.startsWith('## action:')) step.action = line.replace('## action:', '').trim();
            else if (line.startsWith('## reward:')) step.reward = line.replace('## reward:', '').trim();
        });

        if (step.id) steps.push(step);
    });

    return steps;
};

interface UnifiedTutorialModalProps {
    onClose?: () => void;
    onClaim?: () => void;
}

export default function UnifiedTutorialModal({ onClose, onClaim }: UnifiedTutorialModalProps) {
    const { user, claimStarterPack } = useUser();
    // Use the same tracking ID logic as TutorialManager for consistency
    const [trackingId, setTrackingId] = useState<string | null>(null);

    const [steps, setSteps] = useState<TutorialStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Reward State (deprecated if handled by onClaim, but keeping for safety in standalone use)
    const [claimedCards, setClaimedCards] = useState<Card[]>([]);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

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

            if (isCompleted && !onClose) { // Only auto-hide if NOT controlled by parent (legacy support)
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch('/data/tutorial.md');
                const text = await res.text();
                const parsedSteps = parseMarkdownTutorial(text);
                setSteps(parsedSteps);
                setIsVisible(true);
            } catch (e) {
                console.error("Failed to load tutorial:", e);
            } finally {
                setIsLoading(false);
            }
        };

        checkTutorialStatus();
    }, [user, onClose]);

    // Handle Highlight Effect
    useEffect(() => {
        if (!isVisible || !steps[currentStepIndex]) return;

        const step = steps[currentStepIndex];

        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight', 'relative', 'z-[60]');
        });

        if (step.highlight) {
            const el = document.querySelector(step.highlight);
            if (el) {
                el.classList.add('tutorial-highlight', 'relative', 'z-[60]');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return () => {
            document.querySelectorAll('.tutorial-highlight').forEach(el => {
                el.classList.remove('tutorial-highlight', 'relative', 'z-[60]');
            });
        };
    }, [currentStepIndex, isVisible, steps]);

    const handleAction = async () => {
        if (isProcessing) return;
        const step = steps[currentStepIndex];

        if (step.action === 'next') {
            if (currentStepIndex < steps.length - 1) {
                setCurrentStepIndex(prev => prev + 1);
            } else {
                completeTutorial();
            }
        } else if (step.action === 'claim') {
            if (onClaim) {
                onClaim();
            } else {
                setIsProcessing(true);
                try {
                    await handleClaimReward();
                } finally {
                    setIsProcessing(false);
                }
            }
        } else if (step.action === 'close') {
            completeTutorial();
        }
    };

    const handleClaimReward = async () => {
        if (!user) return;

        try {
            const cards = await claimStarterPack('신입 지휘관');
            if (cards && cards.length > 0) {
                setClaimedCards(cards);
                setShowRewardModal(true);
                setIsVisible(false);
            } else {
                completeTutorial();
            }
        } catch (e) {
            console.error("Reward Claim Error", e);
            completeTutorial();
        }
    };

    const handleRewardClose = () => {
        setShowRewardModal(false);
        completeTutorial();
    };

    const completeTutorial = () => {
        if (trackingId) {
            localStorage.setItem(`tutorial_completed_${trackingId}`, 'true');
        }
        setIsVisible(false);
        // Clean up DOM
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight', 'relative', 'z-[60]');
        });
        if (onClose) onClose();
    };

    const getIcon = (name?: string, color?: string) => {
        const props = { className: cn("w-14 h-14 relative z-10", color ? `text-${color}-400` : "text-white") };
        switch (name) {
            case 'Terminal': return <Terminal {...props} />;
            case 'Swords': return <Swords {...props} />;
            case 'Shield': return <Shield {...props} />;
            case 'Zap': return <Zap {...props} />;
            case 'Gift': return <Gift {...props} />;
            default: return <AlertCircle {...props} />;
        }
    };

    if (isLoading || (!isVisible && !showRewardModal)) return null;

    // Render Reward Modal if active
    if (showRewardModal) {
        return (
            <GachaRevealModal
                isOpen={true}
                cards={claimedCards}
                onClose={handleRewardClose}
                packType="premium" // Using premium pack style for starter
                bonusReward={{ type: 'coins', amount: 1000 }}
            />
        );
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return null;

    return (
        <AnimatePresence>
            {isVisible && currentStep && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    {/* Background Effects */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className={cn(
                            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] animate-pulse opacity-20",
                            currentStep.color === 'cyan' && "bg-cyan-500",
                            currentStep.color === 'purple' && "bg-purple-500",
                            currentStep.color === 'red' && "bg-red-500",
                            currentStep.color === 'amber' && "bg-amber-500"
                        )} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                            "relative w-full max-w-lg bg-black border rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]",
                            currentStep.color === 'cyan' && "border-cyan-500/20 shadow-cyan-500/10",
                            currentStep.color === 'purple' && "border-purple-500/20 shadow-purple-500/10",
                            currentStep.color === 'red' && "border-red-500/20 shadow-red-500/10",
                            currentStep.color === 'amber' && "border-amber-500/20 shadow-amber-500/10"
                        )}
                        style={{
                            marginTop: currentStep.position === 'top' ? '-20vh' : currentStep.position === 'bottom' ? '20vh' : '0'
                        }}
                    >
                        {/* Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />

                        {/* Scanlines */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

                        {/* Header Bar */}
                        <div className="relative z-10 bg-white/5 border-b border-white/10 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Terminal size={18} className={cn(
                                    currentStep.color === 'cyan' && "text-cyan-400",
                                    currentStep.color === 'purple' && "text-purple-400",
                                    currentStep.color === 'red' && "text-red-400",
                                    currentStep.color === 'amber' && "text-amber-400"
                                )} />
                                <span className={cn(
                                    "font-mono text-[10px] tracking-[0.2em] uppercase opacity-70",
                                    currentStep.color === 'cyan' && "text-cyan-400",
                                    currentStep.color === 'purple' && "text-purple-400",
                                    currentStep.color === 'red' && "text-red-400",
                                    currentStep.color === 'amber' && "text-amber-400"
                                )}>
                                    SYSTEM_TUTORIAL // STEP_{currentStepIndex + 1}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500/40" />
                                    <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                                    <div className="w-2 h-2 rounded-full bg-green-500/40" />
                                </div>
                                <button
                                    onClick={completeTutorial}
                                    className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="relative z-10 p-8 flex flex-col items-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStepIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col items-center text-center"
                                >
                                    {/* Icon Container with Glow */}
                                    <div className={cn(
                                        "mb-6 p-6 rounded-full border-2 bg-black/50 backdrop-blur-xl relative transition-all duration-500",
                                        currentStep.color === 'cyan' && "border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]",
                                        currentStep.color === 'purple' && "border-purple-500/30 shadow-[0_0_30px_rgba(192,132,252,0.2)]",
                                        currentStep.color === 'red' && "border-red-500/30 shadow-[0_0_30px_rgba(248,113,113,0.2)]",
                                        currentStep.color === 'amber' && "border-amber-500/30 shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                                    )}>
                                        <div className={cn(
                                            "absolute inset-0 rounded-full opacity-20 animate-ping",
                                            currentStep.color === 'cyan' && "bg-cyan-400",
                                            currentStep.color === 'purple' && "bg-purple-400",
                                            currentStep.color === 'red' && "bg-red-400",
                                            currentStep.color === 'amber' && "bg-amber-400"
                                        )} />
                                        {getIcon(currentStep.icon, currentStep.color)}
                                    </div>

                                    {/* Titles */}
                                    <h2 className={cn(
                                        "text-3xl font-black orbitron mb-2 uppercase tracking-wide",
                                        currentStep.color === 'cyan' && "text-cyan-400",
                                        currentStep.color === 'purple' && "text-purple-400",
                                        currentStep.color === 'red' && "text-red-400",
                                        currentStep.color === 'amber' && "text-amber-400"
                                    )}>
                                        {currentStep.title}
                                    </h2>
                                    <p className="font-mono text-[10px] text-white/40 tracking-[0.3em] mb-6 uppercase">
                                        OPERATION_PHASE // {currentStep.id}
                                    </p>

                                    {/* Description */}
                                    <div
                                        className="text-gray-300 text-sm leading-relaxed whitespace-pre-line max-w-sm mb-8"
                                        dangerouslySetInnerHTML={{ __html: currentStep.content }}
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {/* Controls */}
                            <div className="w-full space-y-6">
                                {/* Progress Bar */}
                                <div className="flex justify-center gap-2">
                                    {steps.map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-1 rounded-full transition-all duration-300",
                                                i === currentStepIndex ? "w-8" : "w-2 bg-white/10",
                                                i === currentStepIndex && currentStep.color === 'cyan' && "bg-cyan-500",
                                                i === currentStepIndex && currentStep.color === 'purple' && "bg-purple-500",
                                                i === currentStepIndex && currentStep.color === 'red' && "bg-red-500",
                                                i === currentStepIndex && currentStep.color === 'amber' && "bg-amber-500"
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center justify-between gap-4">
                                    <button
                                        onClick={completeTutorial}
                                        className="px-4 py-2 text-[10px] font-mono text-white/30 hover:text-white transition-colors"
                                    >
                                        SKIP_PROCEDURE
                                    </button>

                                    <div className="flex gap-2 flex-1 justify-end">
                                        {currentStepIndex > 0 && (
                                            <button
                                                onClick={() => setCurrentStepIndex(prev => prev - 1)}
                                                className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white/60 font-mono text-xs hover:bg-white/10 transition-colors"
                                            >
                                                PREV
                                            </button>
                                        )}
                                        <button
                                            onClick={handleAction}
                                            disabled={isProcessing}
                                            className={cn(
                                                "px-8 py-3 rounded-lg font-bold orbitron text-xs tracking-[0.2em] flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]",
                                                isProcessing ? "opacity-50 cursor-not-allowed bg-gray-800" :
                                                    currentStep.color === 'cyan' && "bg-cyan-500 text-black hover:bg-cyan-400",
                                                currentStep.color === 'purple' && "bg-purple-500 text-black hover:bg-purple-400",
                                                currentStep.color === 'red' && "bg-red-500 text-black hover:bg-red-400",
                                                currentStep.color === 'amber' && "bg-amber-500 text-black hover:bg-amber-400"
                                            )}
                                        >
                                            {isProcessing ? 'PROCESSING...' : currentStep.action === 'claim' ? 'CLAIM_SUPPLY' : 'NEXT_ENTRY'}
                                            {!isProcessing && <ChevronRight size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Corner Accents */}
                        <div className={cn(
                            "absolute top-0 left-0 w-12 h-12 border-t border-l pointer-events-none opacity-40",
                            currentStep.color === 'cyan' && "border-cyan-500",
                            currentStep.color === 'purple' && "border-purple-500",
                            currentStep.color === 'red' && "border-red-500",
                            currentStep.color === 'amber' && "border-amber-500"
                        )} />
                        <div className={cn(
                            "absolute bottom-0 right-0 w-12 h-12 border-b border-r pointer-events-none opacity-40",
                            currentStep.color === 'cyan' && "border-cyan-500",
                            currentStep.color === 'purple' && "border-purple-500",
                            currentStep.color === 'red' && "border-red-500",
                            currentStep.color === 'amber' && "border-amber-500"
                        )} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
