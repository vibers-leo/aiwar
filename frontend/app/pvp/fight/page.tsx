'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gameStorage } from '@/lib/game-storage';
import { updatePvPStats, savePvPStats, getPvPStats, savePvPHistory, calculatePvPRewards } from '@/lib/pvp-utils';
import { Button } from '@/components/ui/custom/Button';
import { Progress } from '@/components/ui/custom/Progress';
import { Chip } from '@/components/ui/custom/Chip';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Shuffle, ChevronUp, ChevronDown, Swords, Trophy, XCircle, Zap, Shield, Sword } from 'lucide-react';
import botData from '@/data/pvp-bots.json';
import { generateCard, cn } from '@/lib/utils';
import { Suspense } from 'react';
import { useUser } from '@/context/UserContext';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { useTranslation } from '@/context/LanguageContext';
import { hasTypeAdvantage, TYPE_ADVANTAGE_MULTIPLIER } from '@/lib/type-system';
import { getCardName } from '@/data/card-translations';
import { BattleArena } from '@/components/BattleArena';

export const dynamic = 'force-dynamic';

const STRATEGY_TIME = 20; // 20초로 상향
const RATING_CHANGE = 50;

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

function PvPFightContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const opponentId = searchParams.get('opponentId');
    const { addCoins, addExperience, user } = useUser();
    const { t, language } = useTranslation();
    const lang = (language as 'ko' | 'en') || 'ko';

    // Game State
    const [status, setStatus] = useState<'loading' | 'strategy' | 'battling' | 'finished'>('loading');
    const [playerDeck, setPlayerDeck] = useState<any[]>([]);
    const [enemyDeck, setEnemyDeck] = useState<any[]>([]);
    const [opponent, setOpponent] = useState<any>(null);
    const [battleResult, setBattleResult] = useState<any>(null);

    useEffect(() => {
        if (!opponentId) {
            router.push('/pvp');
            return;
        }
        initializeBattle(opponentId);
    }, [opponentId]);

    const initializeBattle = async (botId: string) => {
        const allCards = await gameStorage.getCards();
        let pDeck = allCards.sort((a, b) => (b.stats?.totalPower || 0) - (a.stats?.totalPower || 0)).slice(0, 5);

        while (pDeck.length < 5) {
            pDeck.push(generateCard());
        }

        const bot = botData.bots.find(b => b.id === botId);
        if (!bot) {
            router.back();
            return;
        }

        setOpponent(bot);

        const eDeck = bot.selectedCards.map(() => {
            const card = generateCard();
            if (card.stats) card.stats.totalPower += bot.level * 5;
            return card;
        });

        setPlayerDeck(pDeck);
        setEnemyDeck(eDeck);
        setStatus('strategy');
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                    <Swords size={64} className="text-purple-500" />
                </motion.div>
            </div>
        );
    }

    const handleBattleFinish = async (result: {
        isWin: boolean;
        playerWins: number;
        enemyWins: number;
        rounds: any[];
    }) => {
        const { isWin, playerWins: pWins, enemyWins: eWins } = result;

        const stats = getPvPStats();
        const ratingChange = isWin ? RATING_CHANGE : -RATING_CHANGE;
        const newRating = Math.max(0, stats.currentRating + ratingChange);

        const rewards = {
            coins: isWin ? 100 : 20,
            experience: isWin ? 50 : 10,
            ratingChange
        };

        const newStats = updatePvPStats(stats, isWin ? 'win' : 'lose', newRating);
        savePvPStats(newStats);
        savePvPHistory(`match-${Date.now()}`, opponent?.name || 'Unknown', opponent?.level || 1, isWin ? 'win' : 'lose', ratingChange, rewards);

        // [FIX] Firebase에 PVP 통계 동기화 (랭킹 반영)
        try {
            if (user?.uid) {
                const { saveUserProfile } = await import('@/lib/firebase-db');
                const winRate = newStats.totalMatches > 0
                    ? Math.round((newStats.wins / newStats.totalMatches) * 100)
                    : 0;

                await saveUserProfile({
                    rating: newRating,
                    wins: newStats.wins,
                    losses: newStats.losses,
                    winRate: winRate
                }, user.uid);
                console.log(`[PVP] Rating synced to Firebase: ${newRating} (${newStats.wins}W ${newStats.losses}L, ${winRate}%)`);
            }
        } catch (error) {
            console.error('[PVP] Failed to sync rating to Firebase:', error);
        }

        await addCoins(rewards.coins);
        await addExperience(rewards.experience);

        setBattleResult({
            isWin,
            playerWins: pWins,
            enemyWins: eWins,
            ratingChange,
            rewards
        });
        setStatus('finished');
    };

    if (status === 'strategy' || status === 'battling') {
        return (
            <BattleArena
                playerDeck={playerDeck}
                enemyDeck={enemyDeck}
                opponent={{
                    name: opponent?.name || 'Enemy',
                    level: opponent?.level || 1
                }}
                onFinish={handleBattleFinish}
                title={t('page.pvp.title')}
            />
        );
    }

    // 결과 화면
    if (status === 'finished' && battleResult) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#050505] p-2 overflow-hidden">
                <BackgroundBeams className="opacity-35" />
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 w-full max-w-sm text-center"
                >
                    <motion.div
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
                        transition={{ repeat: 3, duration: 0.8 }}
                        className="mb-4"
                    >
                        {battleResult.isWin ? (
                            <div className="relative inline-block">
                                <Trophy size={80} className="mx-auto text-yellow-500" />
                                <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full" />
                            </div>
                        ) : (
                            <XCircle size={80} className="mx-auto text-red-500 opacity-60" />
                        )}
                    </motion.div>

                    <h1 className={cn(
                        "text-4xl font-black orbitron italic mb-1 tracking-[0.1em]",
                        battleResult.isWin ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-red-500/60'
                    )}>
                        {battleResult.isWin ? t('pvp.battle.victory') : t('pvp.battle.defeat')}
                    </h1>
                    <p className="text-[8px] font-black orbitron text-gray-500 tracking-[0.3em] mb-4">ARENA_CONTRACT_SUCCESS</p>

                    <div className="text-2xl text-white orbitron font-black mb-4 p-3 bg-white/5 rounded-2xl border border-white/5 inline-block px-8">
                        {battleResult.playerWins} <span className="text-gray-600 px-2">-</span> {battleResult.enemyWins}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-black/40 backdrop-blur-xl rounded-xl p-3 border border-white/5">
                            <div className="text-[8px] text-gray-500 orbitron uppercase mb-0.5">Rating</div>
                            <div className={cn("text-lg font-black orbitron", battleResult.ratingChange >= 0 ? 'text-green-400' : 'text-red-400')}>
                                {battleResult.ratingChange >= 0 ? '+' : ''}{battleResult.ratingChange}
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-xl rounded-xl p-3 border border-white/5">
                            <div className="text-[8px] text-gray-500 orbitron uppercase mb-0.5">Coins</div>
                            <div className="text-lg font-black orbitron text-yellow-400">+{battleResult.rewards.coins}</div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-xl rounded-xl p-3 border border-white/5">
                            <div className="text-[8px] text-gray-500 orbitron uppercase mb-0.5">EXP</div>
                            <div className="text-lg font-black orbitron text-purple-400">+{battleResult.rewards.experience}</div>
                        </div>
                    </div>

                    <Button
                        fullWidth
                        size="md"
                        onPress={() => router.push('/pvp')}
                        className="h-12 font-black orbitron text-sm bg-white text-black hover:bg-gray-200 rounded-xl shadow-lg"
                    >
                        {t('pvp.battle.return')}
                    </Button>
                </motion.div>
            </div>
        );
    }

    return null;
}

export default function PvPFightPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
            <PvPFightContent />
        </Suspense>
    );
}
