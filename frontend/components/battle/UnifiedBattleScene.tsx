'use client';

/**
 * UnifiedBattleScene - 통합 전투 씬 컴포넌트
 * 
 * PVP와 스토리 모드에서 동일하게 사용되는 전투 애니메이션 UI.
 * 카드 뒷면 → 충돌 → 공개 → 라운드 결과 흐름을 담당합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import GameCard from '@/components/GameCard';
import { Card } from '@/lib/types';
import { Trophy, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameSound } from '@/hooks/useGameSound';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';

export interface BattleRoundData {
    round: number;
    playerCard: Card;
    opponentCard: Card;
    winner: 'player' | 'opponent' | 'draw';
    playerPower: number;
    opponentPower: number;
    reason?: string;
}

export interface UnifiedBattleSceneProps {
    rounds: BattleRoundData[];
    onBattleComplete: (result: {
        isWin: boolean;
        playerWins: number;
        enemyWins: number;
        rounds: BattleRoundData[];
    }) => void;
    playerLabel?: string;
    opponentLabel?: string;
    autoStart?: boolean;
}

type AnimationPhase = 'idle' | 'ready' | 'clash' | 'reveal';

export default function UnifiedBattleScene({
    rounds,
    onBattleComplete,
    playerLabel = '내 카드',
    opponentLabel = '상대 카드',
    autoStart = true
}: UnifiedBattleSceneProps) {
    const { playSound } = useGameSound();

    const [currentRound, setCurrentRound] = useState(0);
    const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
    const [playerWins, setPlayerWins] = useState(0);
    const [opponentWins, setOpponentWins] = useState(0);
    const [battleEnded, setBattleEnded] = useState(false);

    // 라운드 애니메이션 실행
    const playRoundAnimation = useCallback(async (roundIndex: number) => {
        const round = rounds[roundIndex];
        if (!round) return;

        // 1. Ready (카드 뒷면 표시)
        setAnimationPhase('ready');
        playSound('card_draw', 'sfx');
        await new Promise(r => setTimeout(r, 1000));

        // 2. Clash (충돌)
        setAnimationPhase('clash');
        playSound('card_clash', 'sfx');
        await new Promise(r => setTimeout(r, 800));

        // 3. Reveal (공개)
        setAnimationPhase('reveal');

        // 승패 사운드
        if (round.winner === 'player') {
            playSound('round_win', 'sfx');
            setPlayerWins(prev => prev + 1);
        } else if (round.winner === 'opponent') {
            playSound('round_lose', 'sfx');
            setOpponentWins(prev => prev + 1);
        } else {
            playSound('round_draw', 'sfx');
        }

        await new Promise(r => setTimeout(r, 2000));

        // 다음 라운드 또는 종료
        if (roundIndex < rounds.length - 1) {
            setCurrentRound(roundIndex + 1);
            setAnimationPhase('idle');
        } else {
            // 전투 종료
            setBattleEnded(true);
        }
    }, [rounds, playSound]);

    // 자동 시작
    useEffect(() => {
        if (autoStart && rounds.length > 0 && animationPhase === 'idle' && !battleEnded) {
            const timer = setTimeout(() => {
                playRoundAnimation(currentRound);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [autoStart, rounds, currentRound, animationPhase, battleEnded, playRoundAnimation]);

    // 전투 종료 처리
    useEffect(() => {
        if (battleEnded) {
            const finalPlayerWins = rounds.filter(r => r.winner === 'player').length;
            const finalOpponentWins = rounds.filter(r => r.winner === 'opponent').length;
            const isWin = finalPlayerWins > finalOpponentWins;

            // 최종 결과 사운드
            playSound(isWin ? 'battle_win' : 'battle_lose', 'sfx');

            // 콜백 호출
            setTimeout(() => {
                onBattleComplete({
                    isWin,
                    playerWins: finalPlayerWins,
                    enemyWins: finalOpponentWins,
                    rounds
                });
            }, 1500);
        }
    }, [battleEnded, rounds, onBattleComplete, playSound]);

    const currentRoundData = rounds[currentRound];
    if (!currentRoundData) return null;

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
                <BackgroundBeams className="opacity-30" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-5xl px-4">
                {/* 라운드 정보 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-5xl font-black text-white mb-4 orbitron tracking-wider">
                        ROUND {currentRoundData.round}
                    </h2>
                    <div className="flex items-center justify-center gap-6 text-3xl font-bold">
                        <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                            {playerWins}
                        </span>
                        <span className="text-white/30 text-xl">vs</span>
                        <span className="text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                            {opponentWins}
                        </span>
                    </div>
                </motion.div>

                {/* 카드 대결 영역 */}
                <div className="flex items-center justify-center gap-8 mb-8">
                    {/* 내 카드 */}
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{
                            x: animationPhase === 'clash' ? [0, 50, 0, 50, 0] : 0,
                            scale: animationPhase === 'reveal' && currentRoundData.winner === 'player' ? 1.05 :
                                animationPhase === 'reveal' && currentRoundData.winner === 'opponent' ? 0.95 : 1,
                            opacity: 1
                        }}
                        transition={{
                            x: { duration: 0.8, times: [0, 0.2, 0.5, 0.7, 1] },
                            duration: 0.4
                        }}
                        className="text-center relative"
                    >
                        {/* 카드 뒷면 or 앞면 */}
                        <AnimatePresence mode="wait">
                            {animationPhase !== 'reveal' ? (
                                <motion.div
                                    key="back"
                                    initial={{ rotateY: 0 }}
                                    exit={{ rotateY: 90 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-[180px] h-[270px] relative rounded-xl overflow-hidden border-4 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                                >
                                    <Image
                                        src="/assets/cards/card-back-sci-fi.png"
                                        alt="Card Back"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                                        <div className="text-cyan-400 font-bold bg-black/60 mx-auto inline-block px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                                            {playerLabel}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="front"
                                    initial={{ rotateY: -90 }}
                                    animate={{ rotateY: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={cn(
                                        "transition-all duration-500",
                                        currentRoundData.winner === 'opponent' && "grayscale opacity-60"
                                    )}
                                >
                                    <GameCard card={currentRoundData.playerCard} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 승리 표시 */}
                        {animationPhase === 'reveal' && currentRoundData.winner === 'player' && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-4 -right-4 z-50"
                            >
                                <div className="bg-yellow-500 rounded-full p-2 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                                    <Trophy className="w-6 h-6 text-white" />
                                </div>
                            </motion.div>
                        )}
                        {animationPhase === 'reveal' && currentRoundData.winner === 'opponent' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                            >
                                <XCircle className="w-24 h-24 text-red-500/80" />
                            </motion.div>
                        )}
                    </motion.div>

                    {/* VS */}
                    <div className="text-center w-32">
                        <motion.div
                            animate={animationPhase === 'clash' ? {
                                scale: [1, 1.5, 1],
                                color: ['#ffffff', '#ff0000', '#ffffff']
                            } : {}}
                            transition={{ duration: 0.4 }}
                            className="text-6xl font-black text-white/40 orbitron"
                        >
                            VS
                        </motion.div>

                        {/* 승패 결과 */}
                        <AnimatePresence>
                            {animationPhase === 'reveal' && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="mt-4"
                                >
                                    {currentRoundData.winner === 'player' && (
                                        <div className="text-2xl text-green-400 font-black drop-shadow-lg orbitron">WIN!</div>
                                    )}
                                    {currentRoundData.winner === 'opponent' && (
                                        <div className="text-2xl text-red-500 font-black drop-shadow-lg orbitron">LOSE</div>
                                    )}
                                    {currentRoundData.winner === 'draw' && (
                                        <div className="text-2xl text-yellow-400 font-black drop-shadow-lg orbitron">DRAW</div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 상대 카드 */}
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{
                            x: animationPhase === 'clash' ? [0, -50, 0, -50, 0] : 0,
                            scale: animationPhase === 'reveal' && currentRoundData.winner === 'opponent' ? 1.05 :
                                animationPhase === 'reveal' && currentRoundData.winner === 'player' ? 0.95 : 1,
                            opacity: 1
                        }}
                        transition={{
                            x: { duration: 0.8, times: [0, 0.2, 0.5, 0.7, 1] },
                            duration: 0.4
                        }}
                        className="text-center relative"
                    >
                        {/* 카드 뒷면 or 앞면 */}
                        <AnimatePresence mode="wait">
                            {animationPhase !== 'reveal' ? (
                                <motion.div
                                    key="back"
                                    initial={{ rotateY: 0 }}
                                    exit={{ rotateY: -90 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-[180px] h-[270px] relative rounded-xl overflow-hidden border-4 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                                >
                                    <Image
                                        src="/assets/cards/card-back-sci-fi.png"
                                        alt="Card Back"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                                        <div className="text-red-400 font-bold bg-black/60 mx-auto inline-block px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                                            {opponentLabel}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="front"
                                    initial={{ rotateY: 90 }}
                                    animate={{ rotateY: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={cn(
                                        "transition-all duration-500",
                                        currentRoundData.winner === 'player' && "grayscale opacity-60"
                                    )}
                                >
                                    <GameCard card={currentRoundData.opponentCard} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 승리 표시 */}
                        {animationPhase === 'reveal' && currentRoundData.winner === 'opponent' && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-4 -left-4 z-50"
                            >
                                <div className="bg-red-500 rounded-full p-2 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                                    <Trophy className="w-6 h-6 text-white" />
                                </div>
                            </motion.div>
                        )}
                        {animationPhase === 'reveal' && currentRoundData.winner === 'player' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                            >
                                <XCircle className="w-24 h-24 text-red-500/80" />
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* 진행 상태 */}
                <div className="flex justify-center gap-2 mt-8">
                    {rounds.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "w-3 h-3 rounded-full transition-all duration-300",
                                idx < currentRound ? (
                                    rounds[idx].winner === 'player' ? "bg-cyan-500" :
                                        rounds[idx].winner === 'opponent' ? "bg-red-500" : "bg-yellow-500"
                                ) : idx === currentRound ? "bg-white animate-pulse" : "bg-white/20"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
