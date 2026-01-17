'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, BattleMode } from '@/lib/types';
import { InventoryCard } from '@/lib/inventory-system';
import { StoryStage, getStoryStage, completeStage } from '@/lib/story-system';
import { generateEnemies, StageConfig } from '@/lib/stage-system';
import { Button } from '@/components/ui/custom/Button';
import { applyBattleResult, BattleResult, BattleParticipant, generateOpponentDeck, simulateBattle } from '@/lib/pvp-battle-system';
import { useTranslation } from '@/context/LanguageContext';
import BattleDeckSelection from '@/components/battle/BattleDeckSelection';
import { useUser } from '@/context/UserContext';
import { Shield, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import UnifiedBattleScene, { BattleRoundData } from '@/components/battle/UnifiedBattleScene';
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
    const [battleRounds, setBattleRounds] = useState<BattleRoundData[]>([]); // NEW: Pre-calculated battle rounds


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

    // --- UI Helpers & Battle Logic ---
    // handleResultConfirm removed - now handled directly in handleBattleFinish


    const handleBattleFinish = async (result: {
        isWin: boolean;
        playerWins: number;
        enemyWins: number;
        rounds: any[];
    }) => {
        if (!storyStage) return;
        const { isWin, playerWins: pWins, enemyWins: eWins } = result;

        if (isWin) {
            // Construct minimal BattleResult for applyBattleResult utility
            const res: BattleResult = {
                winner: 'player',
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
                    coins: storyStage.rewards.coins,
                    experience: storyStage.rewards.experience,
                    ratingChange: 0
                }
            };

            // Apply rewards
            const manualRewards = {
                coins: storyStage.rewards.coins,
                experience: storyStage.rewards.experience
            };
            await applyBattleResult(res, activeBattleDeck, enemies, false, false, false, manualRewards);

            // Mark stage as complete
            const chapterId = storyStage.id.startsWith('1-') ? 'chapter-1' :
                storyStage.id.startsWith('2-') ? 'chapter-2' :
                    storyStage.id.startsWith('3-') ? 'chapter-3' :
                        storyStage.id.startsWith('4-') ? 'chapter-4' : 'chapter-5';
            await completeStage(chapterId, storyStage.id, user?.uid);

            // Track mission
            trackMissionEvent('battle-win', 1);

            // Navigate back to chapter map
            const chapterNum = storyStage.id.split('-')[0] || '1';
            router.push(`/story/chapter-${chapterNum}`);
        } else {
            // Defeat: Show result screen before retry
            setBattleResult({
                winner: 'opponent',
                rounds: result.rounds.map(r => ({
                    round: r.round,
                    winner: r.winner === 'player' ? 'player' : r.winner === 'enemy' ? 'opponent' : 'draw',
                    playerCard: r.playerCard,
                    opponentCard: r.enemyCard || r.opponentCard,
                    playerPower: r.playerPower,
                    opponentPower: r.enemyPower || r.opponentPower,
                    playerType: (r.playerCard?.type || 'EFFICIENCY').toLowerCase() as any,
                    opponentType: ((r.enemyCard || r.opponentCard)?.type || 'EFFICIENCY').toLowerCase() as any,
                })),
                playerWins: pWins,
                opponentWins: eWins,
                rewards: { coins: 0, experience: 0, ratingChange: 0 }
            });
            setPhase('result'); // Show defeat result screen
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

    // NEW: Handle placement completion - Now pre-calculates battle results
    const handlePlacementComplete = (placement: RoundPlacement) => {
        if (!storyStage) return;
        setCardPlacement(placement);

        // Get card order from placement
        const getIdx = (card: any) => selectedHand.findIndex(c => c.id === card?.id);
        const placementRounds = [placement.round1, placement.round2, placement.round3, placement.round4, placement.round5].filter(Boolean);
        const playerOrder = placementRounds.map(r => getIdx(r.main)).filter(idx => idx !== -1);

        if (storyStage.battleMode === 'double') {
            // For DoubleBattleArena, we pass the full deck
            setActiveBattleDeck(selectedHand);
            setPhase('battle');
        } else {
            // NEW: Pre-calculate battle using simulateBattle
            const player: BattleParticipant = {
                name: '플레이어',
                level: level || 1,
                deck: selectedHand,
                cardOrder: playerOrder.length > 0 ? playerOrder : [0, 1, 2, 3, 4]
            };

            const opponent: BattleParticipant = {
                name: language === 'ko' ? storyStage.enemy.name_ko : storyStage.enemy.name,
                level: storyStage.step,
                deck: enemies,
                cardOrder: [0, 1, 2, 3, 4] // Enemy uses default order
            };

            const result = simulateBattle(player, opponent, storyStage.battleMode as any || 'tactics');

            // Convert to BattleRoundData format
            const rounds: BattleRoundData[] = result.rounds.map(r => ({
                round: typeof r.round === 'string' ? parseInt(r.round) : r.round,
                playerCard: r.playerCard,
                opponentCard: r.opponentCard,
                winner: r.winner,
                playerPower: r.playerPower || r.playerCard.stats?.totalPower || 0,
                opponentPower: r.opponentPower || r.opponentCard.stats?.totalPower || 0,
                reason: undefined
            }));

            setBattleRounds(rounds);
            setActiveBattleDeck(selectedHand);
            setPhase('battle');
        }
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
                        onCancel={() => {
                            // Navigate back to chapter map
                            const chapterNum = storyStage.id.split('-')[0] || '1';
                            router.push(`/story/chapter-${chapterNum}`);
                        }}
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

                {/* 5. Battle Animation (Unified PVP Style) */}
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
                        <UnifiedBattleScene
                            rounds={battleRounds}
                            onBattleComplete={(res) => handleBattleFinish({
                                isWin: res.isWin,
                                playerWins: res.playerWins,
                                enemyWins: res.enemyWins,
                                rounds: res.rounds.map(r => ({
                                    round: r.round,
                                    playerCard: r.playerCard,
                                    enemyCard: r.opponentCard,
                                    winner: r.winner === 'player' ? 'player' : r.winner === 'opponent' ? 'enemy' : 'draw',
                                    playerPower: r.playerPower,
                                    enemyPower: r.opponentPower,
                                    reason: r.reason || ''
                                }))
                            })}
                            playerLabel="내 카드"
                            opponentLabel={language === 'ko' ? storyStage.enemy.name_ko : storyStage.enemy.name}
                            autoStart={true}
                        />
                    )
                )}


                {/* 6. Result Screen (Defeat) */}
                {phase === 'result' && battleResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="min-h-screen flex flex-col items-center justify-center py-12"
                    >
                        <div className="max-w-lg w-full bg-zinc-900/90 border border-red-500/50 rounded-3xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center">
                            {/* Defeat Title */}
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="text-red-400 text-xs font-black orbitron tracking-[0.3em] mb-2 uppercase">
                                    MISSION FAILED
                                </div>
                                <h2 className="text-4xl font-black text-red-500 mb-4 orbitron">
                                    패배
                                </h2>
                            </motion.div>

                            {/* Score */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: 'spring' }}
                                className="flex items-center justify-center gap-8 my-8"
                            >
                                <div className="text-center">
                                    <div className="text-5xl font-black text-cyan-400">{battleResult.playerWins}</div>
                                    <div className="text-sm text-gray-400 mt-1">승리</div>
                                </div>
                                <div className="text-3xl text-gray-600 font-bold">vs</div>
                                <div className="text-center">
                                    <div className="text-5xl font-black text-red-500">{battleResult.opponentWins}</div>
                                    <div className="text-sm text-gray-400 mt-1">패배</div>
                                </div>
                            </motion.div>

                            {/* Enemy Quote */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8"
                            >
                                <p className="text-gray-300 italic">
                                    "{language === 'ko' ? storyStage?.enemy.dialogue.win_ko : storyStage?.enemy.dialogue.win}"
                                </p>
                            </motion.div>

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="flex gap-4 justify-center"
                            >
                                <Button
                                    onClick={() => {
                                        setPhase('intro');
                                        setBattleResult(null);
                                        setSelectedHand([]);
                                        setActiveBattleDeck([]);
                                        setBattleRounds([]);
                                    }}
                                    className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    재도전
                                </Button>
                                <Button
                                    onClick={() => {
                                        const chapterNum = storyStage?.id.split('-')[0] || '1';
                                        router.push(`/story/chapter-${chapterNum}`);
                                    }}
                                    variant="ghost"
                                    className="px-8 py-3 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded-xl"
                                >
                                    포기
                                </Button>
                            </motion.div>
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
