'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, BattleMode } from '@/lib/types';
import { InventoryCard } from '@/lib/inventory-system';
import { StoryStage, getStoryStage, completeStage } from '@/lib/story-system';
import { generateEnemies, StageConfig } from '@/lib/stage-system';
import { Button } from '@/components/ui/custom/Button';
import { applyBattleResult, BattleResult, BattleParticipant, generateOpponentDeck } from '@/lib/pvp-battle-system';
import { useTranslation } from '@/context/LanguageContext';
import BattleDeckSelection from '@/components/battle/BattleDeckSelection';
import { useUser } from '@/context/UserContext';
import { Shield, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { BattleArena } from '@/components/BattleArena';
import DialogueOverlay from '@/components/story/DialogueOverlay';
import OpponentDeckReveal from '@/components/battle/OpponentDeckReveal';
import CardPlacementBoard, { RoundPlacement } from '@/components/battle/CardPlacementBoard';
import DoubleBattleArena from '@/components/battle/DoubleBattleArena';


// Shared Phase Type
type Phase =
    | 'intro'
    | 'deck-select'
    | 'opponent-reveal'  // NEW: Show opponent deck
    | 'placement'        // NEW: Tactical deployment
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
    const [cardPlacement, setCardPlacement] = useState<RoundPlacement | null>(null); // NEW: Tactical placement
    const [revealTimer, setRevealTimer] = useState(60); // NEW: Opponent deck reveal timer
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
    const [activeBattleDeck, setActiveBattleDeck] = useState<Card[]>([]);
    const [showTacticsTutorial, setShowTacticsTutorial] = useState(false);


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

        // [TUTORIAL] Check for Tactics tutorial
        if (stage.battleMode === 'tactics' && !localStorage.getItem('tutorial_tactics_shown')) {
            setShowTacticsTutorial(true);
        }

        // Load User Deck from Inventory
        if (!userLoading) {
            // InventoryCard now properly extends Card with guaranteed templateId
            setUserDeck(inventory || []);
        }

        // Load Enemies (Specific to Story Stage)
        const loadEnemies = () => {
            if (!stage) return;

            const targetCount = (stage.battleMode === 'strategy' || stage.battleMode === 'double') ? 6 : 5;

            // Use the new generator that respects stage patterns and boss boosts
            const opponent = generateOpponentDeck(
                level || 1,
                undefined,
                targetCount,
                stage.enemy.deckPattern,
                stage.difficulty === 'BOSS'
            );

            setEnemies(opponent.deck);
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
        setPhase('opponent-reveal');
    };

    // NEW: Handle opponent reveal completion
    const handleRevealComplete = () => {
        if (!storyStage) return;
        setPhase('placement');
    };

    // NEW: Handle placement completion
    const handlePlacementComplete = (placement: RoundPlacement) => {
        if (!storyStage) return;
        setCardPlacement(placement);

        // Convert placement to ordered array for BattleArena
        const orderedDeck: Card[] = [];
        const orderIndices: number[] = [];

        // Helper to find index in selectedHand
        const getIdx = (card: any) => selectedHand.findIndex(c => c.id === card?.id);

        if (storyStage.battleMode === 'double') {
            // For DoubleBattleArena, we pass the full deck
            setActiveBattleDeck(selectedHand);
        } else {
            // For BattleArena, we can pass the ordered deck or indices
            // Let's pass the selectedHand as playerDeck and use initialPlacement
            // But verify how BattleArena handles it. 
            // Actually, BattleArena.tsx uses selectedOrder to index into playerDeck.
            const rounds = [placement.round1, placement.round2, placement.round3, placement.round4, placement.round5].filter(Boolean);
            const indices = rounds.map(r => getIdx(r.main));

            setActiveBattleDeck(selectedHand);
            // We'll pass indices via a state or directly to BattleArena props
        }

        setPhase('battle');
    };



    if (!storyStage) return <div className="min-h-screen bg-black text-white flex items-center justify-center">{t('common.loading')}</div>;

    const maxSelect = (storyStage.battleMode === 'double' || storyStage.battleMode === 'strategy') ? 6 : 5;

    // UI RENDER
    return (
        <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col relative select-none">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
                <div className="absolute inset-0 opacity-20 bg-[url('/grid-pattern.svg')] bg-center bg-repeat" />
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
                                        storyStage.battleMode === 'strategy' ? t('battle.mode.strategyBattle') :
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
                    <DialogueOverlay
                        isOpen={phase === 'intro'}
                        onClose={startDeckSelection}
                        dialogues={(() => {
                            const d = storyStage.enemy.dialogue;
                            const isKo = language === 'ko';
                            const raw = [
                                isKo ? d.intro_ko : d.intro,
                                isKo ? d.appearance_ko : d.appearance,
                                isKo ? d.quote_ko : d.quote,
                                isKo ? d.start_ko : d.start
                            ].filter((text): text is string => !!text && text.trim().length > 0);

                            // Split by newline or literal \n string to handle consolidated lines
                            return raw.flatMap(text => text.split(/\\n|\n/))
                                .map(line => line.trim())
                                .filter(line => line.length > 0);
                        })()}
                        speakerName={language === 'ko' ? storyStage.enemy.name_ko : storyStage.enemy.name}
                        characterImage={storyStage.enemy.image}
                    />
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

                {/* 3. Opponent Reveal */}
                {phase === 'opponent-reveal' && (
                    <OpponentDeckReveal
                        opponentDeck={enemies}
                        opponentName={language === 'ko' ? storyStage.enemy.name_ko : storyStage.enemy.name}
                        opponentLevel={storyStage.step}
                        timer={revealTimer}
                        onTimerEnd={handleRevealComplete}
                        onBattleStart={handleRevealComplete}
                    />
                )}

                {/* 4. Card Placement */}
                {phase === 'placement' && (
                    <CardPlacementBoard
                        selectedCards={selectedHand}
                        opponentDeck={enemies}
                        battleMode={storyStage.battleMode as any}
                        onPlacementComplete={handlePlacementComplete}
                        onCancel={() => setPhase('deck-select')}
                    />
                )}

                {/* 5. Battle Animation (Unified BattleArena) */}
                {phase === 'battle' && (
                    storyStage.battleMode === 'double' ? (
                        <DoubleBattleArena
                            playerDeck={selectedHand}
                            enemyDeck={enemies}
                            onFinish={(res) => handleBattleFinish({
                                isWin: res.isWin,
                                playerWins: res.playerWins,
                                enemyWins: res.enemyWins,
                                rounds: res.rounds
                            })}
                        />
                    ) : (
                        <BattleArena
                            playerDeck={selectedHand}
                            enemyDeck={enemies}
                            opponent={{
                                name: language === 'ko' ? storyStage.enemy.name_ko : storyStage.enemy.name,
                                level: storyStage.step
                            }}
                            onFinish={handleBattleFinish}
                            title={language === 'ko' ? storyStage.title_ko : storyStage.title}
                            battleMode={storyStage.battleMode as any}
                            enemySelectionMode={storyStage.battleMode === 'strategy' ? 'random' : 'ordered'}
                            autoStartBattle={true}
                            initialPlacement={(() => {
                                if (!cardPlacement) return undefined;
                                const getIdx = (card: any) => selectedHand.findIndex(c => c.id === card?.id);
                                const rounds = [
                                    cardPlacement.round1.main,
                                    cardPlacement.round2.main,
                                    cardPlacement.round3.main,
                                    cardPlacement.round4.main,
                                    cardPlacement.round5.main
                                ].filter(Boolean).map(getIdx);
                                return rounds;
                            })()}
                        />
                    )
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

            {/* Tactics Tutorial Overlay */}
            <AnimatePresence>
                {showTacticsTutorial && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-6"
                    >
                        <div className="max-w-md w-full bg-zinc-900 border border-cyan-500/50 rounded-3xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                            <div className="text-cyan-400 text-xs font-black orbitron tracking-[0.3em] mb-2 uppercase text-center">Protocol: Tactics</div>
                            <h2 className="text-3xl font-black italic text-white mb-6 text-center italic">전술 승부 튜토리얼</h2>

                            <div className="space-y-4 mb-8">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <div className="text-cyan-400 font-bold mb-1 text-sm">RULE 01</div>
                                    <div className="text-gray-200">5장의 카드를 미리 1라운드부터 5라운드까지 배치합니다.</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <div className="text-cyan-400 font-bold mb-1 text-sm">RULE 02</div>
                                    <div className="text-gray-200">배치가 끝나면 수정할 수 없으며, 순서대로 자동 대결이 진행됩니다.</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <div className="text-cyan-400 font-bold mb-1 text-sm">RULE 03</div>
                                    <div className="text-gray-200 text-sm opacity-80 italic">상대의 타입을 미리 읽고 유리한 상성을 배치하는 것이 핵심 승리 전략입니다.</div>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl shadow-lg"
                                onPress={() => {
                                    setShowTacticsTutorial(false);
                                    localStorage.setItem('tutorial_tactics_shown', 'true');
                                }}
                            >
                                분석 완료
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
