'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, BattleMode } from '@/lib/types';
import { InventoryCard } from '@/lib/inventory-system';
import { getStoryStage, completeStage, StoryStage } from '@/lib/story-system';
import { generateEnemies, StageConfig } from '@/lib/stage-system';
import { simulateBattle, BattleResult, BattleParticipant, applyBattleResult, determineRoundWinner } from '@/lib/pvp-battle-system';
import { useGameSound } from '@/hooks/useGameSound';
import { Button } from '@/components/ui/custom/Button';
import CardPlacementBoard, { RoundPlacement as BoardPlacement } from '@/components/battle/CardPlacementBoard';
import { useTranslation } from '@/context/LanguageContext';
import BattleDeckSelection from '@/components/battle/BattleDeckSelection';
import { useUser } from '@/context/UserContext';
import { Zap, Shield, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import GameCard from '@/components/GameCard';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { BattleArena } from '@/components/BattleArena';

interface BattleLog {
    id: string;
    message: string;
    type: 'system' | 'player' | 'enemy' | 'winner' | 'draw' | 'advantage';
}

// Shared Phase Type
type Phase =
    | 'intro' // Story specific: Dialogue
    | 'deck-select' // Unified
    | 'card-placement' // Unified
    | 'battle' // Unified
    | 'double-battle' // Interactive for Double Mode
    | 'result'; // Unified

export default function StageBattlePage() {
    const params = useParams();
    const router = useRouter();
    // const { playSound } = useGameSound(); // Removed unused

    const { t, language } = useTranslation();
    const { inventory, loading: userLoading, level, user, trackMissionEvent } = useUser(); // [Updated] Added user & trackMissionEvent

    // Stage Data
    const [storyStage, setStoryStage] = useState<StoryStage | null>(null);
    const [enemies, setEnemies] = useState<Card[]>([]);

    // User State
    const [userDeck, setUserDeck] = useState<InventoryCard[]>([]);

    // Battle State
    const [phase, setPhase] = useState<Phase>('intro');
    const [selectedHand, setSelectedHand] = useState<InventoryCard[]>([]); // Current selection in deck-select
    // const [cardPlacement, setCardPlacement] = useState<BoardPlacement | null>(null); // Removed unused
    // const [animating, setAnimating] = useState(false); // Removed unused
    const [animationPhase, setAnimationPhase] = useState<'idle' | 'ready' | 'clash' | 'reveal'>('idle');
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
    const [currentRound, setCurrentRound] = useState(0);

    // Mini Card States
    const [alivePlayerCards, setAlivePlayerCards] = useState<boolean[]>([true, true, true, true, true]);
    const [aliveEnemyCards, setAliveEnemyCards] = useState<boolean[]>([true, true, true, true, true]);

    // Double Battle State (Shared from PVP)
    const [doubleBattleState, setDoubleBattleState] = useState<{
        round: number;
        phase: 'ready' | 'choice' | 'clash' | 'result';
        timer: number;
        playerSelection: Card | null;
        opponentSelection: Card | null;
        roundWinner: 'player' | 'opponent' | 'draw' | null;
        playerWins: number;
        opponentWins: number;
        history: { round: number; winner: string }[];
    }>({
        round: 1,
        phase: 'ready',
        timer: 3,
        playerSelection: null,
        opponentSelection: null,
        roundWinner: null,
        playerWins: 0,
        opponentWins: 0,
        history: []
    });

    const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);

    // ⚠️ Active Deck for Battle (Ordered)
    const [activeBattleDeck, setActiveBattleDeck] = useState<Card[]>([]);


    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Load Stage
        const stageId = Array.isArray(params.stageId) ? params.stageId[0] : params.stageId || '';
        const stage = getStoryStage(stageId);

        if (!stage) {
            router.push('/story');
            return;
        }
        setStoryStage(stage);

        // Load User Deck from Inventory
        if (!userLoading) {
            // InventoryCard now properly extends Card with guaranteed templateId
            setUserDeck(inventory || []);
        }

        // Load Enemies (Specific to Story Stage)
        const loadEnemies = () => {
            const stageConfig: StageConfig = {
                stageId: 0,
                chapter: parseInt(stage.id.split('-')[1]),
                stageInChapter: stage.step,
                playerHandSize: 5,
                battleCardCount: 3,
                enemyPowerBonus: 0,
                rewardMultiplier: 1,
                isBoss: stage.difficulty === 'BOSS',
                enemyPattern: 'random',
                description: stage.description
            };

            const generatedEnemies = generateEnemies(stageConfig, 100);

            // Adjust count based on battle mode
            let targetCount = 5;
            if (stage.battleMode === 'ambush' || stage.battleMode === 'double') targetCount = 6;

            while (generatedEnemies.length < targetCount) {
                generatedEnemies.push({ ...generatedEnemies[0], id: `enemy-extra-${generatedEnemies.length}` });
            }

            const enemyCards = generatedEnemies.slice(0, targetCount).map((e: { id?: string; name: string; attribute: string; power: number }, i: number) => ({
                id: `enemy-${i}`,
                instanceId: `enemy-instance-${i}-${Date.now()}`,
                templateId: e.id || `enemy-${i}`,
                name: language === 'ko' ? e.name : e.name,
                type: (e.attribute === 'rock' ? 'EFFICIENCY' : e.attribute === 'scissors' ? 'CREATIVITY' : 'FUNCTION') as 'EFFICIENCY' | 'CREATIVITY' | 'FUNCTION',
                stats: { totalPower: e.power, efficiency: e.power, creativity: e.power, function: e.power },
                rarity: 'common' as const,
                level: stage.step,
                image: '/assets/cards/default-enemy.png',
                ownerId: 'system',
                experience: 0,
                acquiredAt: new Date(),
                isLocked: false
            }));
            setEnemies(enemyCards);
        };
        loadEnemies();

    }, [params.stageId, router, language, inventory, userLoading]);

    // --- Actions ---
    // --- UI Helpers & Battle Logic ---

    const getTypeGlow = (type: string | undefined) => {
        switch (type) {
            case 'EFFICIENCY': return 'shadow-[0_0_20px_rgba(239,68,68,0.5)] border-red-500/50';
            case 'COST': return 'shadow-[0_0_20px_rgba(245,158,11,0.5)] border-amber-500/50';
            case 'CREATIVITY': return 'shadow-[0_0_20px_rgba(59,130,246,0.5)] border-blue-500/50';
            case 'FUNCTION': return 'shadow-[0_0_20px_rgba(168,85,247,0.5)] border-purple-500/50';
            default: return 'border-white/10';
        }
    };

    const getTypeIcon = (type: string | undefined) => {
        switch (type) {
            case 'EFFICIENCY': return '✊';
            case 'COST': return '✌️';
            case 'CREATIVITY': return '✋';
            case 'FUNCTION': return '✂️';
            default: return '❓';
        }
    };

    const addBattleLog = useCallback((message: string, type: BattleLog['type'] = 'system') => {
        const id = Math.random().toString(36).substring(2, 9);
        setBattleLogs(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setBattleLogs(prev => prev.filter(log => log.id !== id));
        }, 6000);
    }, []);

    const finishDoubleBattle = useCallback((finalState: typeof doubleBattleState) => {
        // Calculate Winner
        let finalWinner: 'player' | 'opponent' = 'opponent';
        if (finalState.playerWins > finalState.opponentWins) finalWinner = 'player';
        else if (finalState.playerWins === finalState.opponentWins) finalWinner = 'opponent'; // Draw is loss in PVE?

        const result: BattleResult = {
            winner: finalWinner,
            rounds: [],
            playerWins: finalState.playerWins,
            opponentWins: finalState.opponentWins,
            rewards: {
                coins: finalWinner === 'player' ? storyStage!.rewards.coins : 0,
                experience: finalWinner === 'player' ? storyStage!.rewards.experience : 10,
                ratingChange: 0
            }
        };

        addBattleLog(t('battle.log.roundStart', { n: 1 }), 'system');
        setBattleResult(result);
        setPhase('result');
    }, [storyStage, t, addBattleLog]);

    const resolveDoubleBattleRound = useCallback(async () => {
        if (activeBattleDeck.length === 0) return;

        setDoubleBattleState(prev => {
            const baseIdx = (prev.round - 1) * 2;
            const aiCard1 = enemies[baseIdx];
            const aiCard2 = enemies[baseIdx + 1];

            // Simple AI: Random
            const aiSelection = Math.random() > 0.5 ? aiCard1 : (aiCard2 || aiCard1);

            let playerSel = prev.playerSelection;
            const myCard1 = activeBattleDeck[baseIdx];
            const myCard2 = activeBattleDeck[baseIdx + 1];

            // Default random if not selected
            if (!playerSel) {
                playerSel = Math.random() > 0.5 ? myCard1 : (myCard2 || myCard1);
            }

            const winner = determineRoundWinner(playerSel, aiSelection);

            return {
                ...prev,
                playerSelection: playerSel,
                opponentSelection: aiSelection,
                roundWinner: winner,
                phase: 'clash',
                playerWins: prev.playerWins + (winner === 'player' ? 1 : 0),
                opponentWins: prev.opponentWins + (winner === 'opponent' ? 1 : 0),
                history: [...prev.history, { round: prev.round, winner }]
            };
        });

        // Clash Effect Duration
        await new Promise(r => setTimeout(r, 2500));

        setDoubleBattleState(prev => {
            if (prev.round >= 3) {
                finishDoubleBattle(prev);
                return prev;
            }
            return {
                ...prev,
                round: prev.round + 1,
                phase: 'ready',
                timer: 3,
                playerSelection: null,
                opponentSelection: null,
                roundWinner: null
            };
        });
    }, [activeBattleDeck, enemies, finishDoubleBattle]);

    const handleDoubleBattleSelection = (card: Card) => {
        if (doubleBattleState.phase !== 'choice') return;
        setDoubleBattleState(prev => ({ ...prev, playerSelection: card }));
    };

    const startDoubleBattle = useCallback(() => {
        setDoubleBattleState({
            round: 1,
            phase: 'ready',
            timer: 3,
            playerSelection: null,
            opponentSelection: null,
            roundWinner: null,
            playerWins: 0,
            opponentWins: 0,
            history: []
        });
        setPhase('double-battle');
        // Initial setup for first round
        setDoubleBattleState(prev => ({ ...prev, round: 1, phase: 'ready', timer: 3 }));
    }, []);

    // --- Generic Battle Animation ---
    const runBattleAnimation = async (result: BattleResult) => {
        setAlivePlayerCards(new Array(5).fill(true));
        setAliveEnemyCards(new Array(5).fill(true));

        for (let i = 0; i < result.rounds.length; i++) {
            const round = result.rounds[i];
            setCurrentRound(i + 1);

            // Log Round Start
            addBattleLog(t('pvp.log.roundStart', { n: i + 1 }), 'system');

            setAnimationPhase('ready');
            // setAnimating(true); // Removed
            await new Promise(resolve => setTimeout(resolve, 800));

            // Log Clash
            const pPower = round.playerPower || round.playerCard.stats.totalPower;
            const oPower = round.opponentPower || round.opponentCard.stats.totalPower;
            const pMult = round.playerMultiplier || 1.0;
            const oMult = round.opponentMultiplier || 1.0;

            const pLog = `${round.playerCard.name} (${pPower}${pMult > 1 ? ' ⚡️UP' : ''})`;
            const oLog = `${round.opponentCard.name} (${oPower}${oMult > 1 ? ' ⚠️UP' : ''})`;

            addBattleLog(`${pLog} vs ${oLog}`, 'system');

            setAnimationPhase('clash');
            await new Promise(resolve => setTimeout(resolve, 1500));

            setAnimationPhase('reveal');

            // Update Alive States & Log Winner
            if (round.winner === 'player') {
                setAliveEnemyCards(prev => {
                    const next = [...prev];
                    next[i] = false;
                    return next;
                });
                const advantageMsg = pMult > 1 ? t('battle.log.advantage') + "! " : "";
                addBattleLog(advantageMsg + t('battle.log.victory', { name: String(round.playerCard.name) }), 'winner');
            } else if (round.winner === 'opponent') {
                setAlivePlayerCards(prev => {
                    const next = [...prev];
                    next[i] = false;
                    return next;
                });
                const advantageMsg = oMult > 1 ? t('battle.log.enemyAdvantage') + "! " : "";
                addBattleLog(advantageMsg + t('battle.log.victory', { name: String(round.opponentCard.name) }), 'enemy');
            } else {
                addBattleLog(t('battle.log.draw'), 'draw');
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            setAnimationPhase('idle');
            // setAnimating(false); // Removed
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Final Result Log
        const isWin = result.winner === 'player';
        addBattleLog(
            isWin
                ? t('battle.log.finalVictory')
                : t('battle.log.finalDefeat'),
            isWin ? 'winner' : 'enemy'
        );

        setPhase('result');
    };

    const handleResultConfirm = async () => {
        if (battleResult?.winner === 'player') {
            if (storyStage) {
                // Pass manual rewards to bypass PVP "practice mode" penalties
                const manualRewards = {
                    coins: storyStage.rewards.coins,
                    experience: storyStage.rewards.experience
                };
                await applyBattleResult(battleResult, activeBattleDeck, enemies, false, false, manualRewards);
                await completeStage(storyStage.id.split('-')[1] === '1' ? 'chapter-1' : storyStage.id.split('-')[1] === '2' ? 'chapter-2' : 'chapter-3', storyStage.id, user?.uid);

                // [NEW] Track Mission Event
                trackMissionEvent('battle-win', 1);
            }
            const chapterNum = storyStage?.id.split('-')[1] || '1';
            router.push(`/story/chapter-${chapterNum}`);
        } else {
            setPhase('intro');
            setBattleResult(null);
            // setCardPlacement(null); // Removed
            setSelectedHand([]);
            setActiveBattleDeck([]);
        }
    };

    const handleBattleFinish = async (result: {
        isWin: boolean;
        playerWins: number;
        enemyWins: number;
        rounds: any[];
    }) => {
        if (!storyStage) return;
        const { isWin, playerWins: pWins, enemyWins: eWins } = result;

        const res: BattleResult = {
            winner: isWin ? 'player' : 'opponent',
            rounds: result.rounds.map(r => ({
                round: r.round,
                winner: r.winner === 'player' ? 'player' : r.winner === 'enemy' ? 'opponent' : 'draw',
                playerCard: r.playerCard,
                opponentCard: r.enemyCard,
                playerPower: r.playerPower,
                opponentPower: r.enemyPower,
                playerType: (r.playerCard.type || 'EFFICIENCY').toLowerCase() as any,
                opponentType: (r.enemyCard.type || 'EFFICIENCY').toLowerCase() as any,
                reason: r.reason
            })),
            playerWins: pWins,
            opponentWins: eWins,
            rewards: {
                coins: isWin ? storyStage.rewards.coins : 0,
                experience: isWin ? storyStage.rewards.experience : 10,
                ratingChange: 0
            }
        };

        setBattleResult(res);
        setPhase('result');

        if (isWin) {
            trackMissionEvent('battle-win', 1);
        }
    };

    // --- Actions ---

    const handleStartBattle = (preparedDeck: Card[]) => {
        if (!storyStage) return;
        setActiveBattleDeck(preparedDeck); // SAVE DECK for View/Interaction

        const player: BattleParticipant = {
            name: `Player_${level}`,
            level: level,
            deck: preparedDeck,
            cardOrder: [0, 1, 2, 3, 4, 5], // Simple index order
        };

        const opponent: BattleParticipant = {
            name: language === 'ko' ? storyStage.enemy.name_ko : storyStage.enemy.name,
            level: storyStage.step,
            deck: enemies,
            cardOrder: [0, 1, 2, 3, 4, 5],
        };

        if (storyStage.battleMode === 'double') {
            startDoubleBattle();
        } else if (storyStage.battleMode === 'tactics' || storyStage.battleMode === 'sudden-death' || storyStage.battleMode === 'ambush') {
            // [NEW] Use Unified BattleArena for standard modes
            setPhase('battle');
        } else {
            // Legacy / Special modes (Ambush, etc.)
            const result = simulateBattle(player, opponent, storyStage.battleMode as BattleMode);
            setBattleResult(result);
            setCurrentRound(0);
            setPhase('battle');
            runBattleAnimation(result);
        }
    };

    const handlePlacementComplete = (placement: BoardPlacement) => {
        if (!storyStage) return;
        // setCardPlacement(placement); // Removed

        // Flatten BoardPlacement to Card List for Battle Logic
        let playerBattleDeck: Card[] = [];
        if (storyStage.battleMode === 'sudden-death') {
            playerBattleDeck = [placement.round1.main, placement.round2.main, placement.round3.main, placement.round4.main, placement.round5.main].filter((c): c is Card => !!c);
        } else if (storyStage.battleMode === 'double' || storyStage.battleMode === 'ambush') {
            // Re-constructing deck for Double Battle / Ambush logic
            if (storyStage.battleMode === 'double') {
                // Double Battle needs 6 cards in sequence: R1(2), R2(2), R3(2)
                playerBattleDeck = [
                    placement.round1.main, placement.round1.hidden,
                    placement.round2.main, placement.round2.hidden,
                    placement.round3.main, placement.round3.hidden
                ].filter((c): c is Card => !!c);
            } else {
                // Ambush: R1, R2, R3, R4, R5, R3(Hidden Ambush)
                playerBattleDeck = [
                    placement.round1.main,
                    placement.round2.main,
                    placement.round3.main,
                    placement.round4.main,
                    placement.round5.main,
                    placement.round3.hidden // The Ambush Card
                ].filter((c): c is Card => !!c);
            }
        } else {
            // Tactics & Standard
            playerBattleDeck = [placement.round1.main, placement.round2.main, placement.round3.main, placement.round4.main, placement.round5.main].filter((c): c is Card => !!c);
        }

        handleStartBattle(playerBattleDeck);
    };

    const startDeckSelection = () => {
        setPhase('deck-select');
    };

    const confirmDeck = (selected: Card[]) => {
        setSelectedHand(selected);
        setPhase('card-placement');
    };

    // Auto-transition: Ready -> Choice
    useEffect(() => {
        if (phase === 'double-battle' && doubleBattleState.phase === 'ready') {
            const t = setTimeout(() => {
                setDoubleBattleState(prev => ({ ...prev, phase: 'choice', timer: 3 }));
            }, 1500);
            return () => clearTimeout(t);
        }
    }, [phase, doubleBattleState.phase, doubleBattleState.round]);


    // Auto-timer: Choice -> Resolve
    useEffect(() => {
        if (phase === 'double-battle' && doubleBattleState.phase === 'choice') {
            if (activeBattleDeck.length === 0) return;

            if (doubleBattleState.timer > 0) {
                const timerId = setTimeout(() => {
                    setDoubleBattleState(prev => ({ ...prev, timer: prev.timer - 1 }));
                }, 1000);
                return () => clearTimeout(timerId);
            } else {
                resolveDoubleBattleRound();
            }
        }
    }, [phase, doubleBattleState.phase, doubleBattleState.timer, activeBattleDeck, resolveDoubleBattleRound]);

    const CombatLogDisplay = () => (
        <div className="fixed bottom-32 left-8 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
            <AnimatePresence mode="popLayout">
                {battleLogs.map((log) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.8, filter: 'blur(10px)' }}
                        className={cn(
                            "px-4 py-2 rounded-xl backdrop-blur-md border shadow-lg text-[11px] font-bold orbitron tracking-tight",
                            log.type === 'system' ? "bg-black/60 border-white/10 text-gray-300" :
                                log.type === 'advantage' ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" :
                                    log.type === 'player' ? "bg-blue-500/20 border-blue-500/40 text-blue-400" :
                                        log.type === 'enemy' ? "bg-red-500/20 border-red-500/40 text-red-400" :
                                            log.type === 'winner' ? "bg-green-500/20 border-green-500/40 text-green-400" :
                                                "bg-gray-500/20 border-gray-500/40 text-gray-400"
                        )}
                    >
                        {log.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );

    if (!storyStage) return <div className="min-h-screen bg-black text-white flex items-center justify-center">{t('common.loading')}</div>;

    const maxSelect = (storyStage.battleMode === 'double' || storyStage.battleMode === 'ambush') ? 6 : 5;

    // UI RENDER
    return (
        <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col relative select-none">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
                <div className="absolute inset-0 opacity-20 bg-[url('/assets/grid.png')] bg-center bg-repeat" />
                <BackgroundBeams className="opacity-35" />
            </div>

            <CombatLogDisplay />

            {/* Header - Only layout for non-battle phases */}
            {phase !== 'battle' && phase !== 'double-battle' && (
                <div className="relative z-10 p-4 flex justify-between items-start shrink-0">
                    <Button variant="ghost" className="text-white hover:text-cyan-400 gap-2" onPress={() => router.back()} startContent={<ArrowLeft size={16} />}>
                        {t('battle.common.back')}
                    </Button>
                    <div className="text-right">
                        <h1 className="text-2xl font-black italic orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                            {language === 'ko' ? storyStage.title_ko : storyStage.title.toUpperCase()}
                        </h1>
                        <div className="flex items-center justify-end gap-2 text-xs text-gray-400 font-mono mt-1">
                            <span className={cn(
                                "px-2 py-0.5 rounded text-white font-bold",
                                storyStage.difficulty === 'EASY' ? 'bg-green-600' :
                                    storyStage.difficulty === 'NORMAL' ? 'bg-blue-600' : 'bg-red-600'
                            )}>
                                {storyStage.difficulty === 'EASY' ? t('battle.difficulty.easy') :
                                    storyStage.difficulty === 'NORMAL' ? t('battle.difficulty.normal') : t('battle.difficulty.boss')}
                            </span>
                            <span className="bg-white/10 px-2 py-0.5 rounded">
                                {storyStage.battleMode === 'sudden-death' ? t('battle.mode.suddenDeath') :
                                    storyStage.battleMode === 'double' ? t('battle.mode.twoCardBattle') :
                                        storyStage.battleMode === 'ambush' ? t('battle.mode.strategyBattle') :
                                            t('battle.mode.tacticalDuel')}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 relative z-10 flex flex-col min-h-0">

                {/* 1. Intro (Dialogue) */}
                {phase === 'intro' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            className="w-full bg-zinc-900/80 border border-red-500/30 rounded-2xl p-8 mb-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                            <h3 className="text-red-400 font-bold mb-2 text-sm tracking-widest flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                {t('battle.common.enemyEncounter')}
                            </h3>
                            <div className="flex gap-6 items-center">
                                <div className="w-24 h-24 bg-red-900/20 rounded-full border-2 border-red-500 flex items-center justify-center text-4xl shrink-0">
                                    👿
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-white italic mb-2">
                                        {language === 'ko' ? storyStage.enemy.name_ko : storyStage.enemy.name}
                                    </div>
                                    <p className="text-xl text-gray-300">
                                        &quot;{language === 'ko' ? (storyStage.enemy.dialogue.start_ko || storyStage.enemy.dialogue.intro_ko) : (storyStage.enemy.dialogue.start || storyStage.enemy.dialogue.intro)}&quot;
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                        <Button size="lg" className="w-full text-xl py-8 font-black bg-cyan-600 hover:bg-cyan-500 rounded-2xl" onPress={startDeckSelection}>
                            {t('battle.common.prepareBattle')}
                        </Button>
                    </div>
                )}

                {/* 2. Deck Selection */}
                {phase === 'deck-select' && (
                    <BattleDeckSelection
                        availableCards={userDeck}
                        maxSelection={maxSelect}
                        currentSelection={selectedHand}
                        onSelectionChange={setSelectedHand}
                        onConfirm={confirmDeck}
                        onCancel={() => setPhase('intro')}
                    />
                )}

                {/* 4. Battle Animation (Unified BattleArena) */}
                {phase === 'battle' && (
                    <BattleArena
                        playerDeck={activeBattleDeck}
                        enemyDeck={enemies}
                        opponent={{
                            name: language === 'ko' ? storyStage.enemy.name_ko : storyStage.enemy.name,
                            level: storyStage.step
                        }}
                        onFinish={handleBattleFinish}
                        title={language === 'ko' ? storyStage.title_ko : storyStage.title}
                        maxRounds={storyStage.battleMode === 'sudden-death' ? 1 : 5}
                        enemySelectionMode={storyStage.battleMode === 'ambush' ? 'random' : 'ordered'}
                    />
                )}

                {/* 4-B. Double Battle Interactive (PVP Sync) */}
                {phase === 'double-battle' && doubleBattleState && (
                    <motion.div
                        key="double-battle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
                    >
                        {/* Round Indicator */}
                        <div className="absolute top-8 text-4xl font-black text-white orbitron">
                            ROUND {doubleBattleState.round} / 3
                        </div>

                        {/* Score */}
                        <div className="absolute top-20 flex gap-12 text-2xl font-bold">
                            <div className="text-cyan-400">YOU: {doubleBattleState.playerWins}</div>
                            <div className="text-red-400">ENEMY: {doubleBattleState.opponentWins}</div>
                        </div>

                        {/* Opponent Cards (Top) - Hidden unless revealed */}
                        <div className="flex justify-center gap-8 mb-12">
                            {[0, 1].map(offset => {
                                const idx = (doubleBattleState.round - 1) * 2 + offset;
                                const card = enemies[idx];
                                if (!card) return null;

                                const isSelected = doubleBattleState.opponentSelection?.id === card.id;
                                const isRevealed = doubleBattleState.phase === 'clash';

                                return (
                                    <motion.div
                                        key={`opp-${idx}`}
                                        animate={{
                                            y: isSelected && isRevealed ? 50 : 0,
                                            scale: isSelected && isRevealed ? 1.2 : 1,
                                            opacity: isRevealed && !isSelected ? 0.3 : 1
                                        }}
                                        className="relative"
                                    >
                                        <div className={cn(
                                            "w-48 h-64 rounded-xl border-2 transition-all overflow-hidden",
                                            isRevealed && isSelected ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]" : "border-white/20"
                                        )}>
                                            {isRevealed && isSelected || doubleBattleState.phase === 'choice' ? (
                                                <GameCard card={card} /> // Show card during choice (if we want to be nice) or strictly hidden? PVP keeps opp hidden.
                                            ) : (
                                                // Card Back
                                                <div className="w-full h-full bg-slate-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#333_10px,#333_20px)] flex items-center justify-center">
                                                    <span className="text-4xl">👹</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Timer / VS Status */}
                        <div className="my-8 h-24 flex items-center justify-center">
                            {doubleBattleState.phase === 'ready' && (
                                <div className="text-3xl text-white/50 animate-pulse">준비하세요...</div>
                            )}
                            {doubleBattleState.phase === 'choice' && (
                                <div className="text-6xl font-black text-yellow-400 orbitron animate-ping">
                                    {doubleBattleState.timer}
                                </div>
                            )}
                            {doubleBattleState.phase === 'clash' && (
                                <div className="text-5xl font-black text-white orbitron">
                                    {doubleBattleState.roundWinner === 'player' ?
                                        <span className="text-cyan-400">WIN!</span> :
                                        doubleBattleState.roundWinner === 'opponent' ?
                                            <span className="text-red-400">LOSE!</span> :
                                            <span className="text-gray-400">DRAW</span>
                                    }
                                </div>
                            )}
                        </div>

                        {/* Player Cards (Bottom) - Choice */}
                        <div className="flex justify-center gap-8 mt-4">
                            {[0, 1].map(offset => {
                                const idx = (doubleBattleState.round - 1) * 2 + offset;
                                const card = activeBattleDeck[idx];
                                if (!card) return null;

                                const isSelected = doubleBattleState.playerSelection?.id === card.id;
                                const isPhaseChoice = doubleBattleState.phase === 'choice';
                                const isRevealed = doubleBattleState.phase === 'clash';

                                return (
                                    <motion.div
                                        key={`player-${idx}`}
                                        whileHover={isPhaseChoice ? { scale: 1.05, y: -20 } : {}}
                                        whileTap={isPhaseChoice ? { scale: 0.95 } : {}}
                                        animate={{
                                            y: isRevealed && isSelected ? -50 : 0,
                                            scale: isRevealed && isSelected ? 1.2 : 1,
                                            opacity: isRevealed && !isSelected ? 0.3 : 1,
                                            filter: isPhaseChoice && doubleBattleState.playerSelection && !isSelected ? 'grayscale(100%)' : 'none'
                                        }}
                                        className={cn(
                                            "cursor-pointer transition-all",
                                            isSelected ? "ring-4 ring-cyan-400 rounded-xl" : ""
                                        )}
                                        onClick={() => handleDoubleBattleSelection(card)}
                                    >
                                        <div className="w-48 h-64 pointer-events-none">
                                            <GameCard card={card} />
                                        </div>
                                        {isPhaseChoice && (
                                            <div className="mt-4 text-center">
                                                <span className={cn(
                                                    "px-4 py-2 rounded-full font-bold",
                                                    isSelected ? "bg-cyan-500 text-white" : "bg-white/10 text-white/50"
                                                )}>
                                                    {isSelected ? "선택됨" : "선택"}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Instruction Text */}
                        {doubleBattleState.phase === 'choice' && (
                            <div className="absolute bottom-10 text-white/60 animate-bounce">
                                카드를 선택하여 하나빼기 승부!
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 5. Result (PVP Sync) */}
                {phase === 'result' && battleResult && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="max-w-2xl mx-auto py-12"
                    >
                        <div className={cn(
                            "text-center mb-8 p-12 rounded-2xl border-2 bg-black/80 backdrop-blur-xl",
                            battleResult.winner === 'player'
                                ? "bg-green-500/10 border-green-500/50"
                                : "bg-red-500/10 border-red-500/50"
                        )}>
                            <div className="text-8xl mb-4">
                                {battleResult.winner === 'player' ? '🏆' : '😢'}
                            </div>
                            <h2 className={cn(
                                "text-5xl font-black mb-4 orbitron",
                                battleResult.winner === 'player' ? "text-green-400" : "text-red-400"
                            )}>
                                {battleResult.winner === 'player' ? t('pvp.battle.victory') : t('pvp.battle.defeat')}
                            </h2>
                            <div className="text-2xl font-bold text-white/60 mb-8 orbitron">
                                {battleResult.playerWins} : {battleResult.opponentWins}
                            </div>

                            {/* 보상 */}
                            {battleResult.winner === 'player' && (
                                <div className="bg-black/40 rounded-xl p-6 mb-6 border border-white/5">
                                    <h3 className="text-lg font-bold text-white mb-4">{t('battle.common.rewards')}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* <Coins className="text-yellow-400" size={24} /> */}
                                            <span className="text-2xl font-bold text-yellow-400">
                                                +{battleResult.rewards.coins} Coins
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2">
                                            {/* <TrendingUp className="text-cyan-400" size={24} /> */}
                                            <span className="text-2xl font-bold text-cyan-400">
                                                +{battleResult.rewards.experience} EXP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 버튼 */}
                            <div className="flex gap-4 justify-center">
                                <Button
                                    size="lg"
                                    onPress={handleResultConfirm}
                                    className={cn(
                                        "px-8 py-6 font-bold text-xl rounded-xl transition-all shadow-lg",
                                        battleResult.winner === 'player'
                                            ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                                            : "bg-white/10 hover:bg-white/20 text-white"
                                    )}
                                >
                                    {battleResult.winner === 'player'
                                        ? t('battle.common.nextStage')
                                        : t('battle.common.retryMission')}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
