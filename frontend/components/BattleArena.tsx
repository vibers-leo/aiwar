'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Shuffle, ChevronUp, ChevronDown, Swords, Trophy, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/custom/Button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';
import { hasTypeAdvantage, TYPE_ADVANTAGE_MULTIPLIER } from '@/lib/type-system';
import { getCardName } from '@/data/card-translations';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';

interface BattleRound {
    playerCard: any;
    enemyCard: any;
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
    playerDeck: any[];
    enemyDeck: any[];
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
}

export function BattleArena({
    playerDeck,
    enemyDeck,
    opponent,
    onFinish,
    title,
    strategyTime = 20,
    maxRounds = 5,
    enemySelectionMode = 'ordered'
}: BattleArenaProps) {
    const { t, language } = useTranslation();
    const lang = (language as 'ko' | 'en') || 'ko';

    // Game State
    const [status, setStatus] = useState<'strategy' | 'battling' | 'finished'>('strategy');
    const [timer, setTimer] = useState(strategyTime);
    const [selectedOrder, setSelectedOrder] = useState<number[]>(() =>
        Array.from({ length: Math.min(playerDeck.length, maxRounds) }, (_, i) => i)
    );

    // Battle Animation State
    const [currentRound, setCurrentRound] = useState(0);
    const [rounds, setRounds] = useState<BattleRound[]>([]);
    const [playerWins, setPlayerWins] = useState(0);
    const [enemyWins, setEnemyWins] = useState(0);
    const [showingBattle, setShowingBattle] = useState(false);
    const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);

    // 카드 상태
    const [alivePlayerCards, setAlivePlayerCards] = useState<boolean[]>(() =>
        new Array(playerDeck.length).fill(true)
    );
    const [aliveEnemyCards, setAliveEnemyCards] = useState<boolean[]>(() =>
        new Array(enemyDeck.length).fill(true)
    );
    const [currentBattleCards, setCurrentBattleCards] = useState<{ player: number, enemy: number } | null>(null);

    // 로그 추가 함수
    const addBattleLog = useCallback((message: string, type: BattleLog['type'] = 'system') => {
        const id = Math.random().toString(36).substring(2, 9);
        setBattleLogs(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setBattleLogs(prev => prev.filter(log => log.id !== id));
        }, 6000);
    }, []);

    // 타이머
    useEffect(() => {
        if (status !== 'strategy') return;
        if (timer <= 0) {
            startBattle();
            return;
        }
        const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [status, timer]);

    const moveCardUp = (index: number) => {
        if (index === 0) return;
        const newOrder = [...selectedOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setSelectedOrder(newOrder);
    };

    const moveCardDown = (index: number) => {
        if (index === 4) return;
        const newOrder = [...selectedOrder];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        setSelectedOrder(newOrder);
    };

    const shuffleOrder = () => {
        const newOrder = [...selectedOrder].sort(() => Math.random() - 0.5);
        setSelectedOrder(newOrder);
    };

    const determineWinner = (playerCard: any, enemyCard: any) => {
        const pType = playerCard.type;
        const eType = enemyCard.type;
        const pBase = playerCard.stats?.totalPower || 0;
        const eBase = enemyCard.stats?.totalPower || 0;

        let pMultiplier = 1.0;
        let eMultiplier = 1.0;

        if (hasTypeAdvantage(pType, eType)) {
            pMultiplier = TYPE_ADVANTAGE_MULTIPLIER;
        } else if (hasTypeAdvantage(eType, pType)) {
            eMultiplier = TYPE_ADVANTAGE_MULTIPLIER;
        }

        const pFinal = Math.floor(pBase * pMultiplier);
        const eFinal = Math.floor(eBase * eMultiplier);

        if (pFinal > eFinal) {
            return { winner: 'player' as const, reason: pMultiplier > 1 ? 'ADVANTAGE' : 'STRENGTH', pFinal, eFinal };
        } else if (eFinal > pFinal) {
            return { winner: 'enemy' as const, reason: eMultiplier > 1 ? 'ADVANTAGE' : 'STRENGTH', pFinal, eFinal };
        }
        return { winner: 'draw' as const, reason: 'DRAW', pFinal, eFinal };
    };

    const startBattle = async () => {
        setStatus('battling');

        const orderedPlayerDeck = selectedOrder.map(i => playerDeck[i]);
        // AI 선택 모드에 따라 적 덱 결정
        const actualEnemyDeck = enemySelectionMode === 'random'
            ? [...enemyDeck].sort(() => Math.random() - 0.5)
            : [...enemyDeck];

        const battleRounds: BattleRound[] = [];

        for (let i = 0; i < maxRounds; i++) {
            const playerCard = orderedPlayerDeck[i];
            const enemyCard = actualEnemyDeck[i];
            if (!playerCard || !enemyCard) break;

            const { winner, reason, pFinal, eFinal } = determineWinner(playerCard, enemyCard);
            battleRounds.push({ playerCard, enemyCard, winner, reason, playerPower: pFinal, enemyPower: eFinal });
        }

        setRounds(battleRounds);

        for (let i = 0; i < battleRounds.length; i++) {
            await playRoundAnimation(i, battleRounds[i]);
        }

        const pWins = battleRounds.filter(r => r.winner === 'player').length;
        const eWins = battleRounds.filter(r => r.winner === 'enemy').length;
        const isWin = pWins > eWins;

        setStatus('finished');
        onFinish({ isWin, playerWins: pWins, enemyWins: eWins, rounds: battleRounds });
    };

    const playRoundAnimation = async (roundIndex: number, round: BattleRound) => {
        return new Promise<void>((resolve) => {
            setCurrentRound(roundIndex + 1);
            setCurrentBattleCards({ player: roundIndex, enemy: roundIndex });
            setShowingBattle(true);

            addBattleLog(t('pvp.log.roundStart').replace('{n}', (roundIndex + 1).toString()), 'system');

            if (round.reason === 'ADVANTAGE') {
                const advName = (round.winner === 'player' ? round.playerCard.name : round.enemyCard.name) || 'Unknown Unit';
                addBattleLog(t('pvp.log.advantage').replace('{name}', advName).replace('{m}', '1.3'), 'advantage');
            }

            addBattleLog(t('pvp.log.clash')
                .replace('{pName}', round.playerCard.name || 'Unknown Unit')
                .replace('{pPower}', round.playerPower.toString())
                .replace('{eName}', round.enemyCard.name || 'Unknown Unit')
                .replace('{ePower}', round.enemyPower.toString()),
                'system'
            );

            setTimeout(() => {
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

                setShowingBattle(false);
                setCurrentBattleCards(null);

                if (round.winner === 'player') {
                    addBattleLog(t('pvp.log.roundWinner').replace('{name}', round.playerCard.name || 'Unknown Unit'), 'winner');
                } else if (round.winner === 'enemy') {
                    addBattleLog(t('pvp.log.roundWinner').replace('{name}', round.enemyCard.name || 'Unknown Unit'), 'enemy');
                } else {
                    addBattleLog(t('pvp.log.roundDraw'), 'draw');
                }

                setTimeout(resolve, 500);
            }, 1500);
        });
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
        switch (type) {
            case 'EFFICIENCY': return '✊';
            case 'COST': return '✌️';
            case 'CREATIVITY': return '✋';
            default: return '❓';
        }
    };

    return (
        <div className="h-full w-full bg-[#050505] relative overflow-hidden flex flex-col">
            <BackgroundBeams className="opacity-35" />

            {/* Combat Log - Enhanced styling */}
            <div className="fixed bottom-32 left-8 z-50 flex flex-col gap-2.5 max-w-md pointer-events-none">
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

            <div className="max-w-6xl mx-auto w-full relative z-10 flex-1 flex flex-col pt-2">
                {status === 'finished' ? null : status === 'strategy' ? (
                    <>
                        <div className="text-center mb-1">
                            <div className="flex items-center justify-center gap-2">
                                <Clock size={20} className={timer <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'} />
                                <span className={`text-4xl font-black orbitron ${timer <= 5 ? 'text-red-500' : 'text-white'}`}>{timer}</span>
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
                            <div className="grid grid-cols-5 gap-2">
                                {enemyDeck.map((card, index) => (
                                    <motion.div
                                        key={card.id || index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn("bg-black/40 border rounded-xl p-2 text-center transition-all duration-300", getTypeGlow(card.type))}
                                    >
                                        <div className="text-lg mb-0.5 filter drop-shadow-md">{getTypeIcon(card.type)}</div>
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
                            <div className="grid grid-cols-5 gap-2">
                                {selectedOrder.map((cardIndex, position) => {
                                    const card = playerDeck[cardIndex];
                                    return (
                                        <motion.div
                                            key={card.id || cardIndex}
                                            layout
                                            className={cn("bg-black/40 border rounded-xl p-2 text-center relative group overflow-hidden transition-all duration-300", getTypeGlow(card.type))}
                                        >
                                            <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => moveCardUp(position)} disabled={position === 0} className="w-5 h-5 bg-white/10 rounded text-white text-[9px] flex items-center justify-center disabled:opacity-20"><ChevronUp size={12} /></button>
                                                <button onClick={() => moveCardDown(position)} disabled={position === 4} className="w-5 h-5 bg-white/10 rounded text-white text-[9px] flex items-center justify-center disabled:opacity-20"><ChevronDown size={12} /></button>
                                            </div>
                                            <div className="text-lg mb-0.5">{getTypeIcon(card.type)}</div>
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
                        <div className="text-center mb-4 pt-2">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl inline-flex items-center gap-8 shadow-2xl mx-auto">
                                <div className="text-center min-w-[60px]">
                                    <p className="text-[8px] text-gray-500 font-bold orbitron uppercase tracking-[0.2em] mb-0.5">{t('pvp.battle.round')}</p>
                                    <p className="text-2xl font-black text-white orbitron italic">{currentRound}/5</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[8px] text-blue-400 font-bold orbitron uppercase tracking-widest">{t('pvp.battle.playerScore')}</p>
                                        <p className="text-3xl font-black text-white orbitron">{playerWins}</p>
                                    </div>
                                    <div className="text-lg font-black text-gray-700 font-mono">VS</div>
                                    <div className="text-left">
                                        <p className="text-[8px] text-red-500 font-bold orbitron uppercase tracking-widest">{t('pvp.battle.enemyScore')}</p>
                                        <p className="text-3xl font-black text-white orbitron">{enemyWins}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-5 gap-2 h-16">
                            {enemyDeck.map((card, index) => (
                                <AnimatePresence key={card.id || index}>
                                    {aliveEnemyCards[index] && (
                                        <motion.div
                                            initial={{ opacity: 1, scale: 1 }}
                                            animate={{
                                                opacity: 1,
                                                scale: currentBattleCards?.enemy === index ? 1.05 : 1,
                                                y: currentBattleCards?.enemy === index && showingBattle ? 30 : 0,
                                            }}
                                            exit={{ opacity: 0, scale: 0.5, rotate: 15, filter: 'blur(8px)' }}
                                            className={cn("bg-black/40 border border-red-500/20 rounded-xl flex flex-col items-center justify-center p-1", currentBattleCards?.enemy === index ? "border-red-500 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "opacity-40")}
                                        >
                                            <div className="text-lg">{getTypeIcon(card.type)}</div>
                                            <div className="text-[9px] font-black text-red-400 orbitron">{(card.stats?.totalPower || 0)}</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            ))}
                        </div>

                        <div className="flex-1 flex items-center justify-center py-4">
                            <AnimatePresence>
                                {showingBattle && currentBattleCards !== null && (
                                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1, filter: 'blur(15px)' }} className="flex items-center gap-6">
                                        {/* Player Card */}
                                        <motion.div animate={{ x: [0, 30, 0], scale: [1, 1.05, 1] }} transition={{ duration: 0.6, repeat: 2 }} className={cn("relative p-6 rounded-[2rem] border-2 bg-black/60 backdrop-blur-3xl min-w-[160px] text-center", getTypeGlow(rounds[currentBattleCards.player].playerCard.type))}>
                                            <div className="text-4xl mb-3">{getTypeIcon(rounds[currentBattleCards.player].playerCard.type)}</div>
                                            <div className="text-[10px] font-bold text-gray-400 mb-0.5 truncate max-w-[120px] mx-auto">{getCardName(rounds[currentBattleCards.player].playerCard.templateId || rounds[currentBattleCards.player].playerCard.id || '', rounds[currentBattleCards.player].playerCard.name || '', lang)}</div>
                                            <div className="text-2xl font-black text-blue-500 orbitron">{rounds[currentBattleCards.player].playerPower}</div>
                                            <h2 className="text-[7px] font-black text-white/20 orbitron mt-1 tracking-[0.2em]">{t('pvp.battle.commanderUnit')}</h2>
                                        </motion.div>

                                        <div className="relative">
                                            <Zap size={24} fill="white" className="text-white" />
                                        </div>

                                        {/* Enemy Card */}
                                        <motion.div animate={{ x: [0, -30, 0], scale: [1, 1.05, 1] }} transition={{ duration: 0.6, repeat: 2 }} className={cn("relative p-6 rounded-[2rem] border-2 bg-black/60 backdrop-blur-3xl min-w-[160px] text-center", getTypeGlow(rounds[currentBattleCards.enemy].enemyCard.type))}>
                                            <div className="text-4xl mb-3">{getTypeIcon(rounds[currentBattleCards.enemy].enemyCard.type)}</div>
                                            <div className="text-[10px] font-bold text-gray-400 mb-0.5 truncate max-w-[120px] mx-auto">{getCardName(rounds[currentBattleCards.enemy].enemyCard.templateId || rounds[currentBattleCards.enemy].enemyCard.id || '', rounds[currentBattleCards.enemy].enemyCard.name || '', lang)}</div>
                                            <div className="text-2xl font-black text-red-500 orbitron">{rounds[currentBattleCards.enemy].enemyPower}</div>
                                            <h2 className="text-[7px] font-black text-white/20 orbitron mt-1 tracking-[0.2em]">{t('pvp.battle.enemyModel')}</h2>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-5 gap-2 h-16 mb-4">
                            {selectedOrder.map(i => playerDeck[i]).map((card, index) => (
                                <AnimatePresence key={card.id || index}>
                                    {alivePlayerCards[index] && (
                                        <motion.div
                                            initial={{ opacity: 1, scale: 1 }}
                                            animate={{
                                                opacity: 1,
                                                scale: currentBattleCards?.player === index ? 1.05 : 1,
                                                y: currentBattleCards?.player === index && showingBattle ? -30 : 0,
                                            }}
                                            exit={{ opacity: 0, scale: 0.5, rotate: -15, filter: 'blur(8px)' }}
                                            className={cn("bg-black/40 border border-blue-500/20 rounded-xl flex flex-col items-center justify-center p-1", currentBattleCards?.player === index ? "border-blue-500 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "opacity-40")}
                                        >
                                            <div className="text-lg">{getTypeIcon(card.type)}</div>
                                            <div className="text-[10px] font-black text-blue-400 orbitron">{(card.stats?.totalPower || 0)}</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
