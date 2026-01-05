'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, ChevronRight, Zap, Target, Swords, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HoverBorderGradient } from '@/components/ui/aceternity/hover-border-gradient';

interface TutorialStep {
    targetId?: string;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    color: 'cyan' | 'purple' | 'red' | 'amber';
}

const STEPS: TutorialStep[] = [
    {
        title: "WELCOME COMMANDER",
        subtitle: "시스템 초기화 완료",
        description: "AI 대전에 오신 것을 환영합니다.\n이곳은 인류 최후의 AI 지휘 사령부입니다.",
        icon: <Terminal className="w-14 h-14 text-cyan-400" />,
        color: 'cyan'
    },
    {
        targetId: 'menu-inventory',
        title: "INVENTORY",
        subtitle: "카드 보관소",
        description: "전투에 사용할 AI 카드와 유닛들을 관리하는 곳입니다.\n가장 먼저 덱을 편성해야 합니다.",
        icon: <Target className="w-14 h-14 text-purple-400" />,
        color: 'purple'
    },
    {
        targetId: 'menu-battle',
        title: "BATTLE FIELD",
        subtitle: "작전 지역",
        description: "PVP 대전 및 스토리 미션을 수행하는 작전 지역입니다.\n승리하여 데이터 코인을 획득하세요.",
        icon: <Swords className="w-14 h-14 text-red-400" />,
        color: 'red'
    },
    {
        targetId: 'season-banner',
        title: "CAMPAIGN",
        subtitle: "시즌 캠페인",
        description: "메인 스토리가 진행되는 시즌 캠페인입니다.\nAI 전쟁의 진실을 파헤치세요.",
        icon: <Flag className="w-14 h-14 text-amber-400" />,
        color: 'amber'
    }
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function TutorialOverlay({ isOpen, onClose }: Props) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setCurrentStep(0);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    const step = STEPS[currentStep];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-lg bg-black border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                >
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />

                    {/* Header Bar */}
                    <div className="relative z-10 bg-white/5 border-b border-white/10 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Terminal size={18} className="text-cyan-400" />
                            <span className="font-mono text-xs text-cyan-400 tracking-[0.2em] uppercase">
                                SYSTEM_TUTORIAL // V.2.0
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="relative z-10 p-8 min-h-[380px] flex flex-col">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col items-center text-center"
                            >
                                {/* Icon Ring */}
                                <div className={cn(
                                    "mb-6 p-5 rounded-full border-2 bg-black/50 backdrop-blur-xl relative transition-all duration-500",
                                    step.color === 'cyan' && "border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]",
                                    step.color === 'purple' && "border-purple-500/30 shadow-[0_0_30px_rgba(192,132,252,0.2)]",
                                    step.color === 'red' && "border-red-500/30 shadow-[0_0_30px_rgba(248,113,113,0.2)]",
                                    step.color === 'amber' && "border-amber-500/30 shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                                )}>
                                    <div className={cn("absolute inset-0 rounded-full opacity-20 animate-ping", `bg-${step.color}-500`)} />
                                    {step.icon}
                                </div>

                                {/* Titles */}
                                <h2 className={cn(
                                    "text-2xl md:text-3xl font-black orbitron mb-2 uppercase tracking-wide",
                                    step.color === 'cyan' && "text-cyan-400",
                                    step.color === 'purple' && "text-purple-400",
                                    step.color === 'red' && "text-red-400",
                                    step.color === 'amber' && "text-amber-400"
                                )}>
                                    {step.title}
                                </h2>
                                <p className="font-mono text-xs text-white/50 tracking-[0.3em] mb-6 uppercase">
                                    {step.subtitle}
                                </p>

                                {/* Description */}
                                <p className="text-gray-300 leading-relaxed whitespace-pre-line max-w-sm">
                                    {step.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Progress & Controls */}
                        <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-6">
                            {/* Progress Indicators */}
                            <div className="flex justify-center gap-2">
                                {STEPS.map((s, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1 rounded-full transition-all duration-300",
                                            i === currentStep ? "w-8" : "w-2 bg-white/20",
                                            i === currentStep && s.color === 'cyan' && "bg-cyan-500",
                                            i === currentStep && s.color === 'purple' && "bg-purple-500",
                                            i === currentStep && s.color === 'red' && "bg-red-500",
                                            i === currentStep && s.color === 'amber' && "bg-amber-500"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-mono text-white/30 hover:text-white transition-colors"
                                >
                                    SKIP
                                </button>

                                <HoverBorderGradient
                                    onClick={handleNext}
                                    containerClassName="rounded-full"
                                    className="bg-black text-white flex items-center gap-2 px-8 py-3 font-bold orbitron text-sm tracking-widest"
                                >
                                    {currentStep === STEPS.length - 1 ? (
                                        <>START MISSION <Zap size={16} className="text-green-400" /></>
                                    ) : (
                                        <>NEXT <ChevronRight size={16} /></>
                                    )}
                                </HoverBorderGradient>
                            </div>
                        </div>
                    </div>

                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-2xl pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 rounded-br-2xl pointer-events-none" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
