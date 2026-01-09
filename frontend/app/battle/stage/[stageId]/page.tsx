'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, BattleMode } from '@/lib/types';
import { InventoryCard } from '@/lib/inventory-system';
import { StoryStage, getStoryStage, completeStage } from '@/lib/story-system';
import { generateEnemies, StageConfig } from '@/lib/stage-system';
import { Button } from '@/components/ui/custom/Button';
import { applyBattleResult, BattleResult, BattleParticipant } from '@/lib/pvp-battle-system';
import { useTranslation } from '@/context/LanguageContext';
import BattleDeckSelection from '@/components/battle/BattleDeckSelection';
import { useUser } from '@/context/UserContext';
import { Shield, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { BattleArena } from '@/components/BattleArena';


// Shared Phase Type
type Phase =
    | 'intro'
    | 'deck-select'
    | 'battle'
    | 'result';

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
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
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




    const handleResultConfirm = async () => {
        if (battleResult?.winner === 'player') {
            if (storyStage) {
                // Pass manual rewards to bypass PVP "practice mode" penalties
                const manualRewards = {
                    coins: storyStage.rewards.coins,
                    experience: storyStage.rewards.experience
                };
                await applyBattleResult(battleResult, activeBattleDeck, enemies, false, false, false, manualRewards);
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
        setActiveBattleDeck(preparedDeck);
        setPhase('battle');
    };

    const startDeckSelection = () => {
        setPhase('deck-select');
    };

    const confirmDeck = (selected: Card[]) => {
        setSelectedHand(selected);
        handleStartBattle(selected);
    };



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


            {/* Header - Only layout for non-battle phases */}
            {phase !== 'battle' && (
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
                        battleMode={storyStage.battleMode as any}
                        enemySelectionMode={storyStage.battleMode === 'ambush' ? 'random' : 'ordered'}
                    />
                )}


                {/* 5. Result (PVP Sync Aesthetic) */}
                {phase === 'result' && battleResult && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-4 overflow-hidden"
                    >
                        <BackgroundBeams className="opacity-35" />
                        <div className="relative z-10 w-full max-w-md text-center">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
                                transition={{ repeat: 3, duration: 0.8 }}
                                className="mb-6"
                            >
                                {battleResult.winner === 'player' ? (
                                    <div className="relative inline-block">
                                        <span className="text-8xl block mb-2">🏆</span>
                                        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full" />
                                    </div>
                                ) : (
                                    <span className="text-8xl block mb-2 opacity-60">😢</span>
                                )}
                            </motion.div>

                            <h1 className={cn(
                                "text-5xl font-black orbitron italic mb-2 tracking-[0.1em]",
                                battleResult.winner === 'player' ? 'text-white' : 'text-red-500/60'
                            )}>
                                {battleResult.winner === 'player' ? t('pvp.battle.victory') : t('pvp.battle.defeat')}
                            </h1>
                            <p className="text-[10px] font-black orbitron text-gray-500 tracking-[0.4em] mb-8">MISSION_SEQUENCE_COMPLETE</p>

                            <div className="text-3xl text-white orbitron font-black mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 inline-block px-12">
                                {battleResult.playerWins} <span className="text-gray-600 px-3">-</span> {battleResult.opponentWins}
                            </div>

                            {battleResult.winner === 'player' && (
                                <div className="grid grid-cols-2 gap-4 mb-10">
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                        <div className="text-[10px] text-gray-500 orbitron uppercase mb-1">Coins</div>
                                        <div className="text-2xl font-black orbitron text-yellow-400">+{battleResult.rewards.coins}</div>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                        <div className="text-[10px] text-gray-500 orbitron uppercase mb-1">EXP</div>
                                        <div className="text-2xl font-black orbitron text-cyan-400">+{battleResult.rewards.experience}</div>
                                    </div>
                                </div>
                            )}

                            <Button
                                size="lg"
                                onPress={handleResultConfirm}
                                className={cn(
                                    "w-full h-16 font-black orbitron text-lg rounded-2xl shadow-2xl transition-all",
                                    battleResult.winner === 'player' ? "bg-white text-black hover:bg-gray-200" : "bg-white/10 text-white hover:bg-white/20"
                                )}
                            >
                                {battleResult.winner === 'player' ? t('battle.common.nextStage').toUpperCase() : t('battle.common.retryMission').toUpperCase()}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
