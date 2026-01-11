'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/lib/types';
import GameCard from '@/components/GameCard';
import { Trophy, Swords } from 'lucide-react';
import { determineRoundWinner } from '@/lib/pvp-battle-system';

interface DoubleBattleArenaProps {
    playerDeck: Card[];
    enemyDeck: Card[];
    onFinish: (result: { isWin: boolean; playerWins: number; enemyWins: number; rounds: any[] }) => void;
}

type RoundPhase = 'selection' | 'reveal' | 'result';

export default function DoubleBattleArena({
    playerDeck,
    enemyDeck,
    onFinish
}: DoubleBattleArenaProps) {
    const [currentRound, setCurrentRound] = useState(1);
    const [phase, setPhase] = useState<RoundPhase>('selection');
    const [playerWins, setPlayerWins] = useState(0);
    const [enemyWins, setEnemyWins] = useState(0);
    const [rounds, setRounds] = useState<any[]>([]);

    // 현재 라운드의 카드 (2장씩)
    const getRoundCards = (round: number) => {
        const baseIndex = (round - 1) * 2;
        return {
            player: [playerDeck[baseIndex], playerDeck[baseIndex + 1]],
            enemy: [enemyDeck[baseIndex], enemyDeck[baseIndex + 1]]
        };
    };

    const [selectedPlayerCard, setSelectedPlayerCard] = useState<Card | null>(null);
    const [selectedEnemyCard, setSelectedEnemyCard] = useState<Card | null>(null);
    const [roundWinner, setRoundWinner] = useState<'player' | 'enemy' | 'draw' | null>(null);

    const roundCards = getRoundCards(currentRound);

    // 카드 선택 처리
    const handleCardSelect = (card: Card) => {
        if (phase !== 'selection') return;
        setSelectedPlayerCard(card);

        // AI는 랜덤 선택
        const enemyChoice = roundCards.enemy[Math.random() > 0.5 ? 0 : 1];
        setSelectedEnemyCard(enemyChoice);

        // 공개 단계로 전환
        setTimeout(() => {
            setPhase('reveal');

            // 승자 판정
            const winner = determineRoundWinner(card, enemyChoice);
            setRoundWinner(winner);

            const roundResult = {
                round: currentRound,
                playerCard: card,
                enemyCard: enemyChoice,
                winner
            };
            setRounds(prev => [...prev, roundResult]);

            // 점수 업데이트
            if (winner === 'player') {
                setPlayerWins(prev => prev + 1);
            } else if (winner === 'opponent') {
                setEnemyWins(prev => prev + 1);
            }

            // 결과 표시 후 다음 라운드 또는 종료
            setTimeout(() => {
                const newPlayerWins = winner === 'player' ? playerWins + 1 : playerWins;
                const newEnemyWins = winner === 'opponent' ? enemyWins + 1 : enemyWins;

                // 2선승제 체크
                if (newPlayerWins >= 2 || newEnemyWins >= 2 || currentRound >= 3) {
                    onFinish({
                        isWin: newPlayerWins > newEnemyWins,
                        playerWins: newPlayerWins,
                        enemyWins: newEnemyWins,
                        rounds: [...rounds, roundResult]
                    });
                } else {
                    // 다음 라운드
                    setCurrentRound(prev => prev + 1);
                    setPhase('selection');
                    setSelectedPlayerCard(null);
                    setSelectedEnemyCard(null);
                    setRoundWinner(null);
                }
            }, 3000);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
            {/* 라운드 정보 */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-black text-white orbitron mb-2">
                    ROUND {currentRound} / 3
                </h1>
                <div className="flex items-center justify-center gap-8 text-2xl font-bold">
                    <div className="text-cyan-400">YOU: {playerWins}</div>
                    <div className="text-white/40">-</div>
                    <div className="text-red-400">ENEMY: {enemyWins}</div>
                </div>
            </motion.div>

            {/* 선택 단계 */}
            {phase === 'selection' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-4xl"
                >
                    <div className="bg-white/5 border border-cyan-500/30 rounded-2xl p-8 mb-8">
                        <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                            <Swords size={20} />
                            출전 카드를 선택하세요 (2장 중 1장)
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            {roundCards.player.map((card, index) => (
                                <motion.div
                                    key={card.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCardSelect(card)}
                                    className="cursor-pointer"
                                >
                                    <GameCard
                                        card={card}
                                        onClick={() => handleCardSelect(card)}
                                        isSelected={false}
                                        showLevel={true}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* 적 카드 (뒷면) */}
                    <div className="bg-white/5 border border-red-500/30 rounded-2xl p-8">
                        <h2 className="text-xl font-bold text-red-400 mb-4">적 카드</h2>
                        <div className="grid grid-cols-2 gap-6">
                            {roundCards.enemy.map((card, index) => (
                                <div key={card.id} className="relative">
                                    <div className="w-full aspect-[2/3] bg-gradient-to-br from-red-900/50 to-black border-2 border-red-500/30 rounded-xl flex items-center justify-center">
                                        <span className="text-6xl">🎴</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 공개 및 결과 단계 */}
            {(phase === 'reveal' || phase === 'result') && selectedPlayerCard && selectedEnemyCard && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-12"
                >
                    {/* 플레이어 카드 */}
                    <div className="flex flex-col items-center">
                        <p className="text-cyan-400 font-bold mb-4">YOUR CARD</p>
                        <GameCard
                            card={selectedPlayerCard}
                            onClick={() => { }}
                            isSelected={roundWinner === 'player'}
                            showLevel={true}
                        />
                        {roundWinner === 'player' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="mt-4 text-2xl font-black text-yellow-400 flex items-center gap-2"
                            >
                                <Trophy size={24} />
                                WIN!
                            </motion.div>
                        )}
                    </div>

                    {/* VS */}
                    <div className="text-6xl font-black text-white/20">VS</div>

                    {/* 적 카드 */}
                    <div className="flex flex-col items-center">
                        <p className="text-red-400 font-bold mb-4">ENEMY CARD</p>
                        <GameCard
                            card={selectedEnemyCard}
                            onClick={() => { }}
                            isSelected={roundWinner === 'opponent'}
                            showLevel={true}
                        />
                        {roundWinner === 'opponent' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="mt-4 text-2xl font-black text-red-400 flex items-center gap-2"
                            >
                                <Trophy size={24} />
                                WIN!
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
