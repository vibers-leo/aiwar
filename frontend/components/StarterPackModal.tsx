'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { Terminal, X, ChevronRight, Package, User, Zap } from 'lucide-react';
import GachaRevealModal from './GachaRevealModal';
import { Card } from '@/lib/types';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { cn } from '@/lib/utils';
import { HoverBorderGradient } from '@/components/ui/aceternity/hover-border-gradient';

export default function StarterPackModal() {
    const { starterPackAvailable, claimStarterPack, hideStarterPack } = useUser();
    useEscapeKey(starterPackAvailable, hideStarterPack);

    const [step, setStep] = useState<'welcome' | 'nickname' | 'confirm'>('welcome');
    const [nickname, setNickname] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);
    const [revealedCards, setRevealedCards] = useState<Card[]>([]);
    const [showReveal, setShowReveal] = useState(false);
    const [error, setError] = useState('');

    if (!starterPackAvailable) return null;

    const handleNext = () => {
        if (step === 'welcome') setStep('nickname');
        else if (step === 'nickname') {
            if (!nickname.trim()) {
                setError('닉네임을 입력해주세요.');
                return;
            }
            if (nickname.length < 2 || nickname.length > 10) {
                setError('2~10자 사이로 입력해주세요.');
                return;
            }
            setError('');
            setStep('confirm');
        }
    };

    const handleClaim = async () => {
        if (!nickname.trim()) return;

        setIsClaiming(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const cards = await claimStarterPack(nickname);

        if (cards && cards.length > 0) {
            setRevealedCards(cards);
            setShowReveal(true);
        } else {
            hideStarterPack();
        }
        setIsClaiming(false);
    };

    if (showReveal) {
        return (
            <GachaRevealModal
                isOpen={true}
                onClose={hideStarterPack}
                cards={revealedCards}
                packType="starter"
                bonusReward={{ type: 'coins', amount: 1000 }}
            />
        );
    }

    const stepConfig = {
        welcome: { icon: <Package className="w-16 h-16 text-cyan-400" />, color: 'cyan' },
        nickname: { icon: <User className="w-16 h-16 text-purple-400" />, color: 'purple' },
        confirm: { icon: <Zap className="w-16 h-16 text-amber-400" />, color: 'amber' },
    };

    const currentConfig = stepConfig[step];

    return (
        <AnimatePresence mode="wait">
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                <motion.div
                    key={step}
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
                                SUPPLY_DISTRIBUTION // V.2.0
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <button
                                onClick={hideStarterPack}
                                className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="relative z-10 p-8 min-h-[400px] flex flex-col">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col items-center text-center"
                            >
                                {/* Icon Ring */}
                                <div className={cn(
                                    "mb-8 p-6 rounded-full border-2 bg-black/50 backdrop-blur-xl relative transition-all duration-500",
                                    currentConfig.color === 'cyan' && "border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]",
                                    currentConfig.color === 'purple' && "border-purple-500/30 shadow-[0_0_30px_rgba(192,132,252,0.2)]",
                                    currentConfig.color === 'amber' && "border-amber-500/30 shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                                )}>
                                    <div className={cn("absolute inset-0 rounded-full opacity-20 animate-ping", `bg-${currentConfig.color}-500`)} />
                                    {currentConfig.icon}
                                </div>

                                {step === 'welcome' && (
                                    <>
                                        <h2 className="text-3xl font-black orbitron text-cyan-400 mb-2 uppercase tracking-wide">
                                            WELCOME COMMANDER
                                        </h2>
                                        <p className="font-mono text-xs text-white/50 tracking-[0.3em] mb-6 uppercase">
                                            신규 보급품 도착
                                        </p>
                                        <p className="text-gray-300 leading-relaxed mb-8">
                                            인류의 마지막 희망, 새로운 지휘관님을 환영합니다.<br />
                                            전장에서 사용할 특별 보급품이 도착했습니다.
                                        </p>
                                    </>
                                )}

                                {step === 'nickname' && (
                                    <>
                                        <h2 className="text-3xl font-black orbitron text-purple-400 mb-2 uppercase tracking-wide">
                                            IDENTIFY YOURSELF
                                        </h2>
                                        <p className="font-mono text-xs text-white/50 tracking-[0.3em] mb-6 uppercase">
                                            지휘관 식별 코드 입력
                                        </p>
                                        <div className="w-full max-w-xs mb-8">
                                            <input
                                                type="text"
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                placeholder="지휘관 닉네임 입력"
                                                className={cn(
                                                    "w-full h-14 px-6 bg-white/5 border rounded-xl text-center text-lg font-bold text-white focus:outline-none focus:ring-2 transition-all font-mono",
                                                    error ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20"
                                                )}
                                                maxLength={10}
                                                autoFocus
                                            />
                                            {error && <p className="text-red-400 text-xs mt-2 font-mono">{error}</p>}
                                        </div>
                                    </>
                                )}

                                {step === 'confirm' && (
                                    <>
                                        <h2 className="text-3xl font-black orbitron text-amber-400 mb-2 uppercase tracking-wide">
                                            CONFIRM DEPLOYMENT
                                        </h2>
                                        <p className="font-mono text-xs text-white/50 tracking-[0.3em] mb-6 uppercase">
                                            "{nickname}" 지휘관 보급 확인
                                        </p>
                                        <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-xs">
                                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                                                <div className="text-2xl mb-1">💰</div>
                                                <div className="text-gray-500 text-[9px] uppercase font-bold tracking-widest mb-1 font-mono">Currency</div>
                                                <div className="text-yellow-400 text-lg font-black orbitron">1,000</div>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                                                <div className="text-2xl mb-1">🃏</div>
                                                <div className="text-gray-500 text-[9px] uppercase font-bold tracking-widest mb-1 font-mono">Units</div>
                                                <div className="text-cyan-400 text-lg font-black orbitron">5 PACK</div>
                                            </div>
                                        </div>
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 text-left w-full">
                                            <p className="text-amber-200/80 text-xs leading-relaxed flex items-start gap-2 font-mono">
                                                <span className="shrink-0">⚠</span>
                                                <span>
                                                    보급팩: <strong>일반, 희귀, 에픽, 전설, 유니크</strong> 등급 유닛 각 1장 포함
                                                </span>
                                            </p>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Progress & Controls */}
                        <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-6">
                            {/* Progress Indicators */}
                            <div className="flex justify-center gap-2">
                                {['welcome', 'nickname', 'confirm'].map((s, i) => (
                                    <div
                                        key={s}
                                        className={cn(
                                            "h-1 rounded-full transition-all duration-300",
                                            step === s ? "w-8" : "w-2 bg-white/20",
                                            step === 'welcome' && s === step && "bg-cyan-500",
                                            step === 'nickname' && s === step && "bg-purple-500",
                                            step === 'confirm' && s === step && "bg-amber-500"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Action Button */}
                            <HoverBorderGradient
                                onClick={step === 'confirm' ? handleClaim : handleNext}
                                containerClassName="rounded-full w-full"
                                className={cn(
                                    "w-full bg-black text-white flex items-center justify-center gap-2 px-8 py-4 font-bold orbitron text-sm tracking-widest",
                                    isClaiming && "opacity-50 pointer-events-none"
                                )}
                            >
                                {isClaiming ? (
                                    <>CONNECTING... <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                                ) : step === 'confirm' ? (
                                    <>DEPLOY NOW <Zap size={16} className="text-amber-400" /></>
                                ) : (
                                    <>NEXT <ChevronRight size={16} /></>
                                )}
                            </HoverBorderGradient>
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
