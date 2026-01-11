'use client';

import { motion } from 'framer-motion';
import { Card } from '@/lib/types';
import GameCard from '@/components/GameCard';
import { Clock, Swords } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OpponentDeckRevealProps {
    opponentDeck: Card[];
    opponentName: string;
    opponentLevel: number;
    timer: number;
    onTimerEnd: () => void;
    onBattleStart: () => void;
}

export default function OpponentDeckReveal({
    opponentDeck,
    opponentName,
    opponentLevel,
    timer,
    onTimerEnd,
    onBattleStart
}: OpponentDeckRevealProps) {
    const [currentTimer, setCurrentTimer] = useState(timer);

    useEffect(() => {
        setCurrentTimer(timer);
    }, [timer]);

    useEffect(() => {
        if (currentTimer <= 0) {
            onTimerEnd();
            return;
        }

        const interval = setInterval(() => {
            setCurrentTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onTimerEnd();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentTimer, onTimerEnd]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8"
        >
            {/* 상대 정보 */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8 text-center"
            >
                <div className="bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-6 inline-block">
                    <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                        <Swords size={20} />
                        <span className="text-sm">상대 덱</span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-1">{opponentName}</h2>
                    <p className="text-white/60">Level {opponentLevel}</p>
                </div>
            </motion.div>

            {/* 상대 덱 카드 */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
                {opponentDeck.map((card, index) => (
                    <motion.div
                        key={card.id}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.1, type: 'spring' }}
                    >
                        <GameCard
                            card={card}
                            onClick={() => { }}
                            isSelected={false}
                        />
                    </motion.div>
                ))}
            </div>

            {/* 타이머 및 시작 버튼 */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center gap-4"
            >
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-xl border border-white/10">
                    <Clock className="text-cyan-400" size={24} />
                    <span className="text-2xl font-black text-white orbitron">
                        {Math.floor(currentTimer / 60)}:{(currentTimer % 60).toString().padStart(2, '0')}
                    </span>
                </div>

                <button
                    onClick={onBattleStart}
                    className="px-12 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-xl rounded-xl transition-all shadow-lg shadow-red-500/50 hover:shadow-red-500/70 hover:scale-105 flex items-center gap-3"
                >
                    <Swords size={24} />
                    BATTLE START!
                </button>

                <p className="text-white/40 text-sm">
                    {currentTimer}초 후 자동으로 전투가 시작됩니다
                </p>
            </motion.div>
        </motion.div>
    );
}
