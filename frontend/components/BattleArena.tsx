'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Shuffle, ChevronUp, ChevronDown, Swords, Trophy, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/custom/Button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';
import { hasTypeAdvantage, TYPE_ADVANTAGE_MULTIPLIER, resolveBattleResult } from '@/lib/type-system';
import { Card } from '@/lib/types';
import UnitFrame from '@/components/battle/UnitFrame';
import { getCardName } from '@/data/card-translations';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { getCardCharacterImage } from '@/lib/card-images';
import { useGameSound } from '@/hooks/useGameSound';

interface BattleRound {
    playerCard: Card;
    enemyCard: Card;
    winner: 'player' | 'enemy' | 'draw';
    reason: string;
    playerPower: number;
    enemyPower: number;
}

interface BattleLog {
    id: string;
    message: string;
    type: 'system' | 'player' | 'enemy' | 'winner' | 'draw' | 'advantage';
}

interface BattleArenaProps {
    playerDeck: Card[];
    enemyDeck: Card[];
    opponent: {
        name: string;
        level: number;
        avatarUrl?: string;
    };
    onFinish: (result: {
        isWin: boolean;
        playerWins: number;
        enemyWins: number;
        rounds: BattleRound[];
    }) => void;
    title?: string;
    strategyTime?: number;
    maxRounds?: number;
    enemySelectionMode?: 'ordered' | 'random';
    battleMode?: 'sudden-death' | 'tactics' | 'strategy' | 'double';
    autoStartBattle?: boolean;
    initialPlacement?: number[];
    // [NEW] Result Screen Props
    manualResult?: boolean; // If true, overlay won't auto-dismiss
    rewards?: { coins: number; exp: number };
    nextLabel?: string;
}

export function BattleArena({
    playerDeck,
    enemyDeck,
    opponent,
    onFinish,
    title,
    strategyTime = 20,
    maxRounds: maxRoundsProp = 5,
    enemySelectionMode = 'ordered',
    battleMode = 'tactics',
    autoStartBattle = false,
    initialPlacement,
    manualResult = false,
    rewards,
    nextLabel
}: BattleArenaProps) {
    const maxRounds = (battleMode === 'strategy' || battleMode === 'tactics' || battleMode === 'sudden-death') ? 5 : (battleMode === 'double' ? 3 : maxRoundsProp);
    const winsNeeded = battleMode === 'sudden-death' ? 1 : (battleMode === 'tactics' ? 3 : (battleMode === 'strategy' ? 3 : 2));
    const { t, language } = useTranslation();
    const lang = (language as 'ko' | 'en') || 'ko';

    // [NEW] Use Game Sound Hook (Fixed: playSfx is an alias)
    const { playSound } = useGameSound();
    const playSfx = useCallback((name: string) => playSound(name, 'sfx'), [playSound]);

    // Game State
    const [status, setStatus] = useState<'strategy' | 'battling' | 'finished'>('strategy');
    const [timer, setTimer] = useState(strategyTime);
    const [selectedOrder, setSelectedOrder] = useState<number[]>(() =>
        initialPlacement || Array.from({ length: Math.min(playerDeck.length, Math.max(maxRounds, playerDeck.length)) }, (_, i) => i)
    );

    // Battle Animation State
    const [currentRound, setCurrentRound] = useState(0);
    const [rounds, setRounds] = useState<BattleRound[]>([]);
    const [playerWins, setPlayerWins] = useState(0);
    const [enemyWins, setEnemyWins] = useState(0);
    const [playerPoints, setPlayerPoints] = useState(0);
    const [enemyPoints, setEnemyPoints] = useState(0);
    const [showingBattle, setShowingBattle] = useState(false);
    const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);

    // [NEW] Battle Phase State
    const [battlePhase, setBattlePhase] = useState<'standby' | 'clash' | 'reveal'>('standby');
    // [NEW] Result Overlay State
    const [showResult, setShowResult] = useState(false);
    const [battleResultData, setBattleResultData] = useState<{ isWin: boolean; playerWins: number; enemyWins: number; rounds: BattleRound[] } | null>(null);

    // [RESTORED] Card & Battle Logic States
    const [alivePlayerCards, setAlivePlayerCards] = useState<boolean[]>(() =>
        new Array(playerDeck.length).fill(true)
    );
    const [aliveEnemyCards, setAliveEnemyCards] = useState<boolean[]>(() =>
        new Array(enemyDeck.length).fill(true)
    );
    const [currentBattleCards, setCurrentBattleCards] = useState<{ player: number, enemy: number } | null>(null);

    // [RESTORED] Battle Log & Timer Logic
    const addBattleLog = useCallback((message: string, type: BattleLog['type'] = 'system') => {
        const id = Math.random().toString(36).substring(2, 9);
        // Limit logs to last 8 to prevent overflow
        setBattleLogs(prev => {
            const newLogs = [...prev, { id, message, type }];
            if (newLogs.length > 8) return newLogs.slice(newLogs.length - 8);
            return newLogs;
        });

        setTimeout(() => {
            setBattleLogs(prev => prev.filter(log => log.id !== id));
        }, 6000);
    }, []);

    useEffect(() => {
        if (status !== 'strategy') return;

        if (autoStartBattle) {
            startBattle();
            return;
        }

        if (timer <= 0) {
            startBattle();
            return;
        }
        const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [status, timer, autoStartBattle]);

    const moveCardUp = (index: number) => {
        if (index === 0) return;
        const newOrder = [...selectedOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setSelectedOrder(newOrder);
    };

    const moveCardDown = (index: number) => {
        if (index >= selectedOrder.length - 1) return;
        const newOrder = [...selectedOrder];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        setSelectedOrder(newOrder);
    };

    const shuffleOrder = () => {
        const newOrder = [...selectedOrder].sort(() => Math.random() - 0.5);
        setSelectedOrder(newOrder);
    };


    const determineWinner = (playerCard: Card, enemyCard: Card) => {
        const res = resolveBattleResult(playerCard, enemyCard);
        const winner = (res.winner === 'player1' ? 'player' : res.winner === 'player2' ? 'enemy' : 'draw') as 'player' | 'enemy' | 'draw';
        const pFinal = playerCard.stats?.totalPower || 0;
        const eFinal = enemyCard.stats?.totalPower || 0;
        return { winner, reason: res.reason, pFinal, eFinal };
    };

    const startBattle = async () => {
        setStatus('battling');

        let orderedPlayerDeck = selectedOrder.map(i => playerDeck[i]);
        let actualEnemyDeck = enemySelectionMode === 'random'
            ? [...enemyDeck].sort(() => Math.random() - 0.5)
            : [...enemyDeck];

        if (battleMode === 'strategy' && orderedPlayerDeck.length >= 6) {
            const hiddenCard = orderedPlayerDeck[5];
            const otherCards = orderedPlayerDeck.slice(0, 5);
            orderedPlayerDeck = [otherCards[0], otherCards[1], hiddenCard, otherCards[2], otherCards[3]];
        } else if (battleMode === 'double' && orderedPlayerDeck.length >= 6) {
            orderedPlayerDeck = [orderedPlayerDeck[0], orderedPlayerDeck[2], orderedPlayerDeck[4]];
        }

        if (battleMode === 'strategy' && actualEnemyDeck.length >= 6) {
            const hiddenCard = actualEnemyDeck[5];
            const otherCards = actualEnemyDeck.slice(0, 5);
            actualEnemyDeck = [otherCards[0], otherCards[1], hiddenCard, otherCards[2], otherCards[3]];
        } else if (battleMode === 'double' && actualEnemyDeck.length >= 6) {
            actualEnemyDeck = [actualEnemyDeck[0], actualEnemyDeck[2], actualEnemyDeck[4]];
        }

        const battleRounds: BattleRound[] = [];
        let pPts = 0; // Points
        let ePts = 0;
        let pW = 0; // Wins count
        let eW = 0;

        for (let i = 0; i < maxRounds; i++) {
            const playerCard = orderedPlayerDeck[i];
            const enemyCard = actualEnemyDeck[i];
            if (!playerCard || !enemyCard) break;

            const { winner, reason, pFinal, eFinal } = determineWinner(playerCard, enemyCard);
            const roundData: BattleRound = { playerCard, enemyCard, winner, reason, playerPower: pFinal, enemyPower: eFinal };
            battleRounds.push(roundData);

            const roundPoints = (battleMode === 'strategy' && i === 2) ? 2 : 1;
            if (winner === 'player') {
                pPts += roundPoints;
                pW++;
            } else if (winner === 'enemy') {
                ePts += roundPoints;
                eW++;
            }

            if (pPts >= winsNeeded || ePts >= winsNeeded) break;
        }

        setRounds(battleRounds);

        for (let i = 0; i < battleRounds.length; i++) {
            const round = battleRounds[i];
            await playRoundAnimation(i, round);

            const roundPoints = (battleMode === 'strategy' && i === 2) ? 2 : 1;
            if (round.winner === 'player') {
                setPlayerWins(prev => prev + 1);
                setPlayerPoints(prev => prev + roundPoints);
            } else if (round.winner === 'enemy') {
                setEnemyWins(prev => prev + 1);
                setEnemyPoints(prev => prev + roundPoints);
            }
        }

        const finalPPts = pPts;
        const finalEPts = ePts;
        const isWin = finalPPts > finalEPts;

        setStatus('finished');

        // [NEW] Show Result Overlay & Play Sound
        const resultData = { isWin, playerWins: pW, enemyWins: eW, rounds: battleRounds };
        setBattleResultData(resultData);
        setShowResult(true);

        if (isWin) {
            playSfx('victory');
        } else {
            playSfx('defeat');
        }

        // Delay finish to show the overlay
        // [MODIFIED] If manualResult is true, we WAIT for user interaction.
        const delay = manualResult ? 999999999 : 4000;

        if (!manualResult) {
            setTimeout(() => {
                onFinish(resultData);
            }, delay);
        }
    };

    const playRoundAnimation = async (roundIndex: number, round: BattleRound) => {
        return new Promise<void>((resolve) => {
            setCurrentRound(roundIndex + 1);
            setCurrentBattleCards({ player: roundIndex, enemy: roundIndex });
            setShowingBattle(true);
            setBattlePhase('standby');

            addBattleLog(t('pvp.log.roundStart').replace('{n}', (roundIndex + 1).toString()), 'system');

            // 1. Clash Phase Start (0.8s)
            setTimeout(() => {
                setBattlePhase('clash');
                // [SFX] Clash Impact - Sync with animation hits (approx 0.3s and 0.8s into the clash)
                setTimeout(() => playSfx('attack'), 300);
                setTimeout(() => playSfx('attack'), 800);
            }, 800);

            // 2. Reveal Phase (Clash finishes at 2.5s)
            setTimeout(() => {
                setBattlePhase('reveal');

                // [SFX] Result Sound
                if (round.winner === 'player') {
                    playSfx('success'); // or 'victory'
                } else if (round.winner === 'enemy') {
                    playSfx('error'); // or 'defeat'
                } else {
                    playSfx('click'); // draw sound
                }

                if (round.reason === 'ADVANTAGE') {
                    const advName = (round.winner === 'player' ? round.playerCard.name : round.enemyCard.name) || 'Unknown Unit';
                    addBattleLog(t('pvp.log.advantage').replace('{name}', advName).replace('{m}', '1.3'), 'advantage');
                }

                if (round.winner === 'player') {
                    setPlayerWins(prev => prev + 1);
                    setAliveEnemyCards(prev => {
                        const next = [...prev];
                        next[roundIndex] = false;
                        return next;
                    });
                } else if (round.winner === 'enemy') {
                    setEnemyWins(prev => prev + 1);
                    setAlivePlayerCards(prev => {
                        const next = [...prev];
                        next[roundIndex] = false;
                        return next;
                    });
                }

                if (round.winner === 'player') {
                    addBattleLog(t('pvp.log.roundWinner').replace('{name}', round.playerCard.name || 'Unknown Unit'), 'winner');
                } else if (round.winner === 'enemy') {
                    addBattleLog(t('pvp.log.roundWinner').replace('{name}', round.enemyCard.name || 'Unknown Unit'), 'enemy');
                } else {
                    addBattleLog(t('pvp.log.roundDraw'), 'draw');
                }

                // 3. Resolve Round (After Reveal lingers 2s)
                setTimeout(() => {
                    setShowingBattle(false);
                    setCurrentBattleCards(null);
                    setBattlePhase('standby');
                    resolve();
                }, 2000);
            }, 2500);
        });
    };

    const playerCardVariants = {
        standby: { x: 0, rotate: 0, scale: 1 },
        clash: {
            // [Start -> Pull Back -> SMASH! -> Bounce -> Pull Back -> SMASH! -> Return]
            x: [0, -40, 60, 10, -40, 60, 0],
            rotate: [0, -10, 5, 0, -10, 5, 0],
            scale: [1, 0.9, 1.2, 1, 0.9, 1.2, 1],
            transition: {
                duration: 1.2,
                // Creating a snappy rhythm: Slow pull back, instant hit
                times: [0, 0.25, 0.35, 0.45, 0.7, 0.8, 1],
                ease: "easeInOut" as const
            }
        },
        reveal: { x: 0, rotate: 0, scale: 1.15, transition: { type: "spring" as const, bounce: 0.5 } }
    };

    const enemyCardVariants = {
        standby: { x: 0, rotate: 0, scale: 1 },
        clash: {
            x: [0, 40, -60, -10, 40, -60, 0],
            rotate: [0, 10, -5, 0, 10, -5, 0],
            scale: [1, 0.9, 1.2, 1, 0.9, 1.2, 1],
            transition: {
                duration: 1.2,
                times: [0, 0.25, 0.35, 0.45, 0.7, 0.8, 1],
                ease: "easeInOut" as const
            }
        },
        reveal: { x: 0, rotate: 0, scale: 1.15, transition: { type: "spring" as const, bounce: 0.5 } }
    };

    const getTypeGlow = (type: string | undefined) => {
        switch (type) {
            case 'EFFICIENCY': return 'shadow-[0_0_20px_rgba(239,68,68,0.5)] border-red-500/50';
            case 'COST': return 'shadow-[0_0_20px_rgba(245,158,11,0.5)] border-amber-500/50';
            case 'CREATIVITY': return 'shadow-[0_0_20px_rgba(59,130,246,0.5)] border-blue-500/50';
            default: return 'border-white/10';
        }
    };

    const getTypeIcon = (type: string | undefined) => {
        const icon = (() => {
            switch (type) {
                case 'EFFICIENCY': return '✊';
                case 'COST': return '✌️';
                case 'CREATIVITY': return '✋';
                default: return '❓';
            }
        })();
        return (
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition-transform">
                {icon}
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-[#050505] relative overflow-hidden flex flex-col px-2 md:px-0">
            <BackgroundBeams className="opacity-35" />

            {/* Combat Log - Enhanced styling */}
            <div className="fixed bottom-[35%] md:bottom-32 left-4 md:left-8 z-50 flex flex-col gap-2.5 max-w-[80vw] md:max-w-md pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {battleLogs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -30, scale: 0.85 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 30, scale: 0.8, filter: 'blur(12px)' }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className={cn(
                                "px-5 py-2.5 rounded-xl backdrop-blur-lg border-2 shadow-xl text-xs font-bold orbitron tracking-tight",
                                log.type === 'system' ? "bg-black/70 border-white/20 text-gray-200" :
                                    log.type === 'advantage' ? "bg-yellow-500/20 border-yellow-400/50 text-yellow-300 shadow-yellow-500/20" :
                                        log.type === 'player' ? "bg-blue-500/20 border-blue-400/50 text-blue-300 shadow-blue-500/20" :
                                            log.type === 'enemy' ? "bg-red-500/20 border-red-400/50 text-red-300 shadow-red-500/20" :
                                                log.type === 'winner' ? "bg-green-500/25 border-green-400/60 text-green-300 shadow-green-500/30" :
                                                    "bg-gray-500/20 border-gray-400/40 text-gray-300"
                            )}
                        >
                            {log.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="max-w-6xl mx-auto w-full relative z-10 flex-1 flex flex-col pt-2 overflow-y-auto no-scrollbar">
                {status === 'finished' ? null : status === 'strategy' ? (
                    <>
                        <div className="text-center mb-1">
                            <div className="flex items-center justify-center gap-2">
                                <Clock size={20} className={timer <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'} />
                                <span className={`text-3xl md:text-4xl font-black orbitron ${timer <= 5 ? 'text-red-500' : 'text-white'}`}>{timer}</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white orbitron italic tracking-widest leading-none">
                                    {title || t('page.pvp.title')}
                                </h1>
                                <p className="text-gray-500 text-[10px] orbitron uppercase tracking-[0.3em] mt-1">{t('pvp.strategy.hint')}</p>
                            </div>
                        </div>

                        <div className="mb-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1 h-3 bg-red-500"></div>
                                <h2 className="text-[10px] font-black text-white orbitron tracking-tighter uppercase">{t('pvp.battle.enemyArchitecture')}</h2>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                                {enemyDeck.map((card, index) => (
                                    <motion.div
                                        key={card.id || index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn("bg-black/40 border rounded-xl p-2 text-center transition-all duration-300 w-[31%] md:w-[15%] max-w-[120px]", getTypeGlow(card.type))}
                                    >
                                        <div className="flex justify-center mb-1 drop-shadow-md">{getTypeIcon(card.type)}</div>
                                        <div className="text-[8px] font-bold text-gray-400 truncate mb-0.5">{getCardName(card.templateId || card.id || '', card.name || '', lang)}</div>
                                        <div className="text-base font-black text-red-500 orbitron leading-none">{(card.stats?.totalPower || 0)}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="py-1 flex items-center justify-center">
                            <Swords size={24} className="text-yellow-500" />
                        </div>

                        <div className="mt-1 text-center flex-1 flex flex-col justify-end">
                            <div className="flex items-center justify-between mb-1 px-2">
                                <span className="text-[10px] font-bold text-blue-400 orbitron uppercase tracking-widest">{t('pvp.battle.formation')}</span>
                                <Button size="sm" variant="flat" onPress={shuffleOrder} startContent={<Shuffle size={12} />} className="bg-white/5 hover:bg-white/10 text-[9px] orbitron h-7">
                                    {t('pvp.battle.randomize')}
                                </Button>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                                {selectedOrder.map((cardIndex, position) => {
                                    const card = playerDeck[cardIndex];
                                    return (
                                        <motion.div
                                            key={card.id || cardIndex}
                                            layout
                                            className={cn("bg-black/40 border rounded-xl p-2 text-center relative group overflow-hidden transition-all duration-300 w-[31%] md:w-[15%] max-w-[120px]", getTypeGlow(card.type))}
                                        >
                                            <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => moveCardUp(position)} disabled={position === 0} className="w-5 h-5 bg-white/10 rounded text-white text-[9px] flex items-center justify-center disabled:opacity-20"><ChevronUp size={12} /></button>
                                                <button onClick={() => moveCardDown(position)} disabled={position >= selectedOrder.length - 1} className="w-5 h-5 bg-white/10 rounded text-white text-[9px] flex items-center justify-center disabled:opacity-20"><ChevronDown size={12} /></button>
                                            </div>
                                            <div className="flex justify-center mb-1">{getTypeIcon(card.type)}</div>
                                            <div className="text-[8px] font-bold text-gray-400 truncate mb-0.5">{getCardName(card.templateId || card.id || '', card.name || '', lang)}</div>
                                            <div className="text-base font-black text-blue-500 orbitron leading-none">{(card.stats?.totalPower || 0)}</div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-2 text-center pb-2">
                            <Button size="md" onPress={startBattle} className="h-10 px-12 font-black orbitron text-sm bg-white text-black hover:bg-gray-200 transition-all shadow-xl rounded-xl" startContent={<Zap size={16} fill="currentColor" />}>
                                {t('pvp.battle.initiate')}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex-1 flex flex-col justify-center gap-6 min-h-0 py-4">
                            {/* Scoreboard & Status */}
                            <div className="flex flex-col items-center gap-4">
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-black/60 backdrop-blur-2xl border border-white/10 px-4 md:px-10 py-3 md:py-5 rounded-[2rem] md:rounded-[2.5rem] flex items-center gap-4 md:gap-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-t-white/20"
                                >
                                    <div className="text-center">
                                        <p className="text-[8px] md:text-[10px] text-blue-400 font-black orbitron tracking-[0.3em] mb-1">COMMANDER</p>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <span className="text-2xl md:text-4xl font-black text-white orbitron italic">{playerWins}</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: winsNeeded }).map((_, i) => (
                                                    <div key={`p-dot-${i}`} className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full", i < playerWins ? "bg-blue-500 shadow-[0_0_10px_#3b82f6]" : "bg-white/10")} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="text-[8px] md:text-[10px] text-gray-500 font-black orbitron tracking-[0.5em] mb-1">ROUND</div>
                                        <div className="text-lg md:text-2xl font-black text-white orbitron italic opacity-50">{currentRound}<span className="text-xs ml-1">/{maxRounds}</span></div>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-[8px] md:text-[10px] text-red-500 font-black orbitron tracking-[0.3em] mb-1">HOSTILE</p>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="flex gap-1">
                                                {Array.from({ length: winsNeeded }).map((_, i) => (
                                                    <div key={`e-dot-${i}`} className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full", i < enemyWins ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-white/10")} />
                                                ))}
                                            </div>
                                            <span className="text-2xl md:text-4xl font-black text-white orbitron italic">{enemyWins}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Main Battle Scene */}
                            <div className="flex-1 flex items-center justify-center relative">
                                <AnimatePresence mode="wait">
                                    {showingBattle && currentBattleCards !== null && rounds[currentRound - 1] ? (
                                        <motion.div
                                            key={`battle-${currentRound}`}
                                            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                                            className="flex items-center gap-2 md:gap-20 relative w-full justify-center"
                                        >
                                            {/* Player Cinematic Card */}
                                            <motion.div
                                                variants={playerCardVariants}
                                                initial="standby"
                                                animate={battlePhase}
                                                className={cn(
                                                    "relative w-28 h-42 sm:w-32 sm:h-48 md:w-48 md:h-72 rounded-[1.5rem] md:rounded-[2rem] border-2 bg-black/80 backdrop-blur-3xl overflow-hidden shadow-2xl transition-all duration-300",
                                                    battlePhase === 'reveal' ? getTypeGlow(rounds[currentRound - 1].playerCard.type) : "border-white/10"
                                                )}
                                            >
                                                {/* Image always visible for player */}
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center opacity-70"
                                                    style={{ backgroundImage: `url(${getCardCharacterImage(rounds[currentRound - 1].playerCard.templateId, rounds[currentRound - 1].playerCard.name, rounds[currentRound - 1].playerCard.rarity)})` }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                                                {/* Info only visible in Reveal phase */}
                                                <motion.div
                                                    animate={{ opacity: battlePhase === 'reveal' ? 1 : 0 }}
                                                    className="absolute inset-0"
                                                >
                                                    <div className="absolute top-4 left-4 flex gap-1 bg-black/50 p-1.5 rounded-full backdrop-blur-md border border-white/10">
                                                        {getTypeIcon(rounds[currentRound - 1].playerCard.type)}
                                                    </div>
                                                    <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                                                        <div className="text-[10px] font-bold text-gray-400 mb-1 truncate drop-shadow-lg">
                                                            {getCardName(rounds[currentRound - 1].playerCard.templateId || '', rounds[currentRound - 1].playerCard.name || '', lang)}
                                                        </div>
                                                        <div className="text-4xl font-black text-white orbitron italic drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                                            {rounds[currentRound - 1].playerPower}
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* Winner Indicator */}
                                                {battlePhase === 'reveal' && rounds[currentRound - 1].winner === 'player' && (
                                                    <motion.div initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-blue-500/20 backdrop-blur-[2px]">
                                                        <div className="text-5xl font-black text-blue-400 orbitron italic drop-shadow-lg rotate-[-15deg]">WIN</div>
                                                    </motion.div>
                                                )}
                                            </motion.div>

                                            {/* VS Symbol or Clash Effect */}
                                            <div className="relative flex items-center justify-center">
                                                {battlePhase !== 'clash' && (
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                        className="absolute w-40 h-40 bg-white/5 rounded-full blur-3xl"
                                                    />
                                                )}
                                                {battlePhase === 'clash' ? (
                                                    <div className="absolute z-20">
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: [1, 1.5, 0], opacity: [1, 0] }}
                                                            transition={{ duration: 0.5, repeat: 2 }}
                                                            className="text-6xl font-black text-yellow-500"
                                                        >
                                                            💥
                                                        </motion.div>
                                                    </div>
                                                ) : (
                                                    <div className="text-4xl font-black text-white/20 orbitron italic z-10">VS</div>
                                                )}
                                            </div>

                                            {/* Enemy Cinematic Card - Backside logic */}
                                            <motion.div
                                                variants={enemyCardVariants}
                                                initial="standby"
                                                animate={battlePhase}
                                                className={cn(
                                                    "relative w-28 h-42 sm:w-32 sm:h-48 md:w-48 md:h-72 rounded-[1.5rem] md:rounded-[2rem] border-2 bg-black/80 backdrop-blur-3xl overflow-hidden shadow-2xl transition-all duration-300",
                                                    battlePhase === 'reveal' ? getTypeGlow(rounds[currentRound - 1].enemyCard.type) : "border-red-500/20"
                                                )}
                                            >
                                                {/* Front (Visible only on Reveal) */}
                                                <motion.div
                                                    animate={{ opacity: battlePhase === 'reveal' ? 1 : 0 }}
                                                    className="absolute inset-0 z-10"
                                                >
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center opacity-70"
                                                        style={{ backgroundImage: `url(${getCardCharacterImage(rounds[currentRound - 1].enemyCard.templateId, rounds[currentRound - 1].enemyCard.name, rounds[currentRound - 1].enemyCard.rarity)})` }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                                    <div className="absolute top-4 right-4 flex gap-1 bg-black/50 p-1.5 rounded-full backdrop-blur-md border border-white/10">
                                                        {getTypeIcon(rounds[currentRound - 1].enemyCard.type)}
                                                    </div>
                                                    <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                                                        <div className="text-[10px] font-bold text-gray-400 mb-1 truncate drop-shadow-lg">
                                                            {getCardName(rounds[currentRound - 1].enemyCard.templateId || '', rounds[currentRound - 1].enemyCard.name || '', lang)}
                                                        </div>
                                                        <div className="text-4xl font-black text-white orbitron italic drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                                            {rounds[currentRound - 1].enemyPower}
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* Back (Visible on Standby/Clash) */}
                                                <motion.div
                                                    animate={{ opacity: battlePhase === 'reveal' ? 0 : 1 }}
                                                    className="absolute inset-0 bg-zinc-900 flex items-center justify-center"
                                                >
                                                    <div className="text-red-900/40 text-6xl font-black">?</div>
                                                    <div className="absolute inset-0 border-4 border-red-900/20 rounded-[1.8rem]" />
                                                </motion.div>

                                                {/* Winner Indicator */}
                                                {battlePhase === 'reveal' && rounds[currentRound - 1].winner === 'enemy' && (
                                                    <motion.div initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-[2px] z-20">
                                                        <div className="text-5xl font-black text-red-500 orbitron italic drop-shadow-lg rotate-[15deg]">WIN</div>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        </motion.div>
                                    ) : (
                                        <div className="text-[10px] text-gray-600 font-bold orbitron animate-pulse tracking-[1em]">IDLE_SEQUENCE</div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Formation Visualizers */}
                            <div className="flex flex-col md:flex-row justify-between items-center md:items-end px-4 md:px-10 pb-4 md:pb-8 gap-4 overflow-x-auto no-scrollbar w-full">
                                {/* Player Hand */}
                                <div className="flex gap-2">
                                    {selectedOrder.map((cardIndex, i) => {
                                        const card = playerDeck[cardIndex];
                                        const isDead = !alivePlayerCards[i];
                                        const isCurrent = currentBattleCards?.player === i;
                                        return (
                                            <div key={i} className={cn(
                                                "w-12 h-16 md:w-14 md:h-20 rounded-xl border-2 transition-all duration-500 overflow-hidden relative",
                                                isCurrent ? "border-blue-500 scale-110 -translate-y-4 shadow-[0_0_20px_rgba(59,130,246,0.4)]" :
                                                    isDead ? "border-white/5 opacity-20 grayscale" : "border-white/10 bg-white/5"
                                            )}>
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center opacity-30"
                                                    style={{ backgroundImage: `url(${getCardCharacterImage(card.templateId, card.name, card.rarity)})` }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center text-xs opacity-50">
                                                    {getTypeIcon(card.type)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Enemy Hand */}
                                <div className="flex gap-2">
                                    {enemyDeck.map((card, i) => {
                                        const isDead = !aliveEnemyCards[i];
                                        const isCurrent = currentBattleCards?.enemy === i;
                                        return (
                                            <div key={i} className={cn(
                                                "w-12 h-16 md:w-14 md:h-20 rounded-xl border-2 transition-all duration-500 overflow-hidden relative",
                                                isCurrent ? "border-red-500 scale-110 -translate-y-4 shadow-[0_0_20px_rgba(239,68,68,0.4)]" :
                                                    isDead ? "border-white/5 opacity-20 grayscale" : "border-white/10 bg-white/5"
                                            )}>
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center opacity-30"
                                                    style={{ backgroundImage: `url(${getCardCharacterImage(card.templateId, card.name, card.rarity)})` }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center text-xs opacity-50">
                                                    {getTypeIcon(card.type)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* [NEW] Enhanced Result Overlay */}
            <AnimatePresence>
                {showResult && battleResultData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
                    >
                        <div className="text-center relative w-full max-w-lg px-4">
                            {/* Animated Background */}
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: 0.2 }}
                                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                                className={cn(
                                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]",
                                    battleResultData.isWin ? "bg-blue-600" : "bg-red-600"
                                )}
                            />

                            {/* Main Title with Icon */}
                            <motion.div
                                initial={{ scale: 0.8, y: -20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                transition={{ type: "spring", bounce: 0.6 }}
                                className="mb-8 relative"
                            >
                                <div className="flex justify-center mb-4">
                                    {battleResultData.isWin ? (
                                        <Trophy size={80} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                                    ) : (
                                        <XCircle size={80} className="text-red-500 opacity-80" />
                                    )}
                                </div>
                                <h1 className={cn(
                                    "text-4xl md:text-7xl font-black italic tracking-tighter orbitron",
                                    battleResultData.isWin
                                        ? "text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                                        : "text-transparent bg-clip-text bg-gradient-to-b from-red-100 to-red-600 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                                )}>
                                    {battleResultData.isWin ? t('pvp.battle.victory') : t('pvp.battle.defeat')}
                                </h1>
                                <p className="text-xs font-bold text-gray-500 orbitron tracking-[0.5em] mt-2">
                                    {battleResultData.isWin ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
                                </p>
                            </motion.div>

                            {/* Score Box */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-md"
                            >
                                <div className="flex items-center justify-center gap-12">
                                    <div className="text-center">
                                        <div className="text-xs text-blue-400 font-bold orbitron tracking-widest mb-2">PLAYER</div>
                                        <div className="text-5xl font-black text-white orbitron shadow-blue-500/20">{battleResultData.playerWins}</div>
                                    </div>
                                    <div className="h-12 w-px bg-white/10 transform rotate-12" />
                                    <div className="text-center">
                                        <div className="text-xs text-red-400 font-bold orbitron tracking-widest mb-2">ENEMY</div>
                                        <div className="text-5xl font-black text-white orbitron shadow-red-500/20">{battleResultData.enemyWins}</div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Rewards Section (If manual and passed via parent) */}
                            {rewards && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="grid grid-cols-2 gap-4 mb-8"
                                >
                                    <div className="bg-black/40 p-4 rounded-xl border border-yellow-500/20">
                                        <div className="text-[10px] text-yellow-500 orbitron uppercase mb-1">COINS</div>
                                        <div className="text-xl font-black text-white orbitron">+{rewards.coins}</div>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-xl border border-purple-500/20">
                                        <div className="text-[10px] text-purple-500 orbitron uppercase mb-1">EXP</div>
                                        <div className="text-xl font-black text-white orbitron">+{rewards.exp}</div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Action Button */}
                            {manualResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Button
                                        size="lg"
                                        onPress={() => onFinish(battleResultData)}
                                        className={cn(
                                            "w-full h-14 font-black orbitron text-sm rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95",
                                            battleResultData.isWin ? "bg-white text-black hover:bg-gray-200" : "bg-white/10 text-white hover:bg-white/20"
                                        )}
                                    >
                                        {nextLabel || (battleResultData.isWin ? "PROCEED" : "RETRY")}
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


