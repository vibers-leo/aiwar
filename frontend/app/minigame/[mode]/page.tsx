
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, AlertTriangle, ArrowLeft, Trophy, XCircle, Users, Loader2, Volume2, VolumeX } from 'lucide-react';
import CyberPageLayout from '@/components/CyberPageLayout';
import { Card as CardType } from '@/lib/types';
import GameCard from '@/components/GameCard';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/custom/Button';
import { cn } from '@/lib/utils';
import {
    MiniGameMode,
    generateOpponentHand,
    determineWinner,
    GameResult,
    getHandType,
    HandType,
    MINI_GAME_MODE_NAMES
} from '@/lib/minigame-system';
import {
    listenToMiniGameRoom,
    submitCards,
    updatePhase,
    finishMiniGame,
    toggleReady,
    MiniGameRoom as RoomData
} from '@/lib/realtime-minigame-service';
import { handleMiniGameResultTransaction } from '@/lib/firebase-db';
import { playClick, playBet, playClash, playWin, playLose, toggleMute, getMuteState, initAudio } from '@/lib/sound-effects';

// 모드별 필요한 카드 수 (공식 지침 v1.0)
const MODE_REQ = {
    'sudden-death': 5,
    'tactics': 5,
    'double': 6,
    'strategy': 6
};

export default function MiniGameRoom() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId');
    const mode = params.mode as MiniGameMode;
    const { user, profile, level, inventory, refreshData } = useUser();

    // 실시간 방 상태
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const isHost = roomData?.hostId === user?.uid;
    const isGuest = roomData?.guestId === user?.uid;
    const isPVP = !!roomId;

    // 공통 게임 상태
    const [phase, setPhase] = useState<'select' | 'ready' | 'clash' | 'result'>('select');
    const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
    const [opponentCards, setOpponentCards] = useState<CardType[]>([]);
    const [results, setResults] = useState<{ result: GameResult, reason: string }[]>([]);
    const [finalResult, setFinalResult] = useState<GameResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
    const [isSoundMuted, setIsSoundMuted] = useState(false);

    const reqCards = MODE_REQ[mode as keyof typeof MODE_REQ] || 5;

    // 사운드 초기화
    useEffect(() => {
        setIsSoundMuted(getMuteState());

        const initAudioContext = () => {
            initAudio();
            document.removeEventListener('click', initAudioContext);
        };
        document.addEventListener('click', initAudioContext);

        return () => document.removeEventListener('click', initAudioContext);
    }, []);

    const handleToggleSound = () => {
        const muted = toggleMute();
        setIsSoundMuted(muted);
    };

    // 게임 상태 효과음
    useEffect(() => {
        if (phase === 'clash') {
            playClash();
        }
        if (phase === 'result' && finalResult) {
            if (finalResult === 'win') {
                setTimeout(playWin, 500);
            } else if (finalResult === 'lose') {
                setTimeout(playLose, 500);
            }
        }
    }, [phase, finalResult]);

    // 1. 실시간 방 구독 (PVP 전용)
    useEffect(() => {
        if (isPVP && roomId) {
            const unsubscribe = listenToMiniGameRoom(roomId, (data) => {
                setRoomData(data);

                // 페이즈 동기화
                if (data.phase !== phase) {
                    setPhase(data.phase);
                }

                // 상대방 카드 동기화
                if (isHost && data.guestCards?.length === reqCards) {
                    setOpponentCards(data.guestCards);
                } else if (isGuest && data.hostCards?.length === reqCards) {
                    setOpponentCards(data.hostCards);
                }
            });
            return () => unsubscribe();
        }
    }, [isPVP, roomId, isHost, isGuest, phase, reqCards]);

    // 2. 초기화: AI 패 생성 (AI 전용)
    useEffect(() => {
        if (!isPVP && mode) {
            setOpponentCards(generateOpponentHand(mode, level || 1));
        }
    }, [isPVP, mode, level]);

    // 3. 실시간 게임 진행 감시 (PVP 전용)
    useEffect(() => {
        if (isPVP && roomData && phase === 'ready') {
            // 양측 카드 모두 제출되었고 호스트인 경우 CLASH 시작
            if (isHost && roomData.hostCards?.length === reqCards && roomData.guestCards?.length === reqCards) {
                setTimeout(() => {
                    updatePhase(roomId!, 'clash');
                }, 2000);
            }
        }

        if (isPVP && phase === 'clash' && opponentCards.length === reqCards && !finalResult) {
            // CLASH 페이즈에 돌입하면 결과 계산
            processGameResult();
        }
    }, [isPVP, roomData, phase, isHost, reqCards, opponentCards, roomId]);

    // 카드 선택 핸들러
    const handleCardSelect = (card: CardType) => {
        if (phase !== 'select') return;
        playClick();

        // 선택 해제
        if (selectedCards.find(c => c.instanceId === card.instanceId)) {
            setSelectedCards(prev => prev.filter(c => c.instanceId !== card.instanceId));
            return;
        }

        // 새로 선택
        if (selectedCards.length < reqCards) {
            // 고급 카드 경고 (Legendary, Mythic)
            const isHighValueCard = card.rarity === 'legendary' || card.rarity === 'mythic';

            if (isHighValueCard) {
                const confirmed = window.confirm(
                    `⚠️ 경고: ${card.rarity?.toUpperCase()} 등급 카드입니다!\n\n` +
                    `카드: ${card.name}\n` +
                    `등급: ${card.rarity}\n\n` +
                    `이 카드를 사용하면 패배 시 영구적으로 잃게 됩니다.\n` +
                    `정말 선택하시겠습니까?`
                );

                if (!confirmed) return; // 취소 시 선택 안 함
            }

            setSelectedCards(prev => [...prev, card]);
        }
    };

    // 게임 시작 시퀀스
    const handleStartGame = async () => {
        if (selectedCards.length !== reqCards) return;
        playBet();

        // 최종 경고: 고급 카드 포함 여부 체크
        const highValueCards = selectedCards.filter(c => c.rarity === 'legendary' || c.rarity === 'mythic');

        if (highValueCards.length > 0) {
            const cardList = highValueCards.map(c => `- ${c.name} (${c.rarity})`).join('\n');
            const confirmed = window.confirm(
                `🚨 최종 확인\n\n` +
                `다음 고급 카드들이 포함되어 있습니다:\n${cardList}\n\n` +
                `패배 시 이 카드들을 영구적으로 잃게 됩니다!\n\n` +
                `정말 진행하시겠습니까?`
            );

            if (!confirmed) return; // 취소 시 게임 시작 안 함
        }

        if (isPVP) {
            // PVP: 카드 제출 및 준비 완료 보고
            setIsWaitingForOpponent(true);
            await submitCards(roomId!, isHost, selectedCards);

            // 상대방도 준비되었다면 ready로 전환 (호스트가 판단하거나 트리거 예정)
            // 여기서는 단순화하여 제출 즉시 'ready' 상태 업데이트 시도
            if (isHost) {
                updatePhase(roomId!, 'ready');
            }
        } else {
            // AI Battle: 즉시 시작
            setPhase('ready');
            setTimeout(() => {
                setPhase('clash');
                processGameResult();
            }, 3000);
        }
    };

    // 결과 처리 (공통 로직)
    const processGameResult = async () => {
        if (finalResult) return; // 이미 계산됨

        const roundResults = selectedCards.map((playerCard, i) => {
            return determineWinner(playerCard, opponentCards[i]);
        });
        setResults(roundResults);

        let final: GameResult = 'draw';
        const wins = roundResults.filter(r => r.result === 'win').length;
        const losses = roundResults.filter(r => r.result === 'lose').length;

        if (mode === 'sudden-death') {
            const decisiveRound = roundResults.find(r => r.result !== 'draw');
            final = decisiveRound ? decisiveRound.result : 'draw';
        } else if (mode === 'double') {
            if (wins >= 2) final = 'win';
            else if (losses >= 2) final = 'lose';
        } else if (mode === 'tactics' || mode === 'strategy') {
            if (wins >= 3) final = 'win';
            else if (losses >= 3) final = 'lose';
        }

        setFinalResult(final);

        // 실시간 결과 동기화 (호스트가 DB 정리)
        if (isPVP && isHost) {
            finishMiniGame(roomId!, final === 'win' ? user!.uid : (final === 'lose' ? roomData!.guestId! : 'draw'));
        }

        // DB 트랜잭션 처리 (카드 소멸/획득)
        if (final !== 'draw' && user?.uid) {
            setIsProcessing(true);
            try {
                const playerCardInstanceIds = selectedCards.map(c => c.instanceId);
                await handleMiniGameResultTransaction(
                    user.uid,
                    final,
                    playerCardInstanceIds,
                    opponentCards
                );
                if (refreshData) await refreshData();
                console.log(`MiniGame DB sync complete: ${final}`);
            } catch (e) {
                console.error("Game processing failed", e);
            } finally {
                setIsProcessing(false);
                setPhase('result');
            }
        } else {
            setPhase('result');
        }
    };

    const sortedInventory = [...inventory].sort((a, b) => {
        const rarityScore = { 'mythic': 5, 'legendary': 4, 'epic': 3, 'rare': 2, 'common': 1 };
        return (rarityScore[b.rarity as keyof typeof rarityScore] || 1) - (rarityScore[a.rarity as keyof typeof rarityScore] || 1);
    });

    return (
        <CyberPageLayout
            title={MINI_GAME_MODE_NAMES[mode as keyof typeof MINI_GAME_MODE_NAMES] || "BATTLE ARENA"}
            description={`${MINI_GAME_MODE_NAMES[mode as keyof typeof MINI_GAME_MODE_NAMES] || "배틀"}이 시작됩니다.`}
            color="red"
        >
            <div className="max-w-6xl mx-auto p-4 min-h-screen flex flex-col">
                {/* 사운드 토글 버튼 */}
                <div className="absolute top-6 right-6 z-40">
                    <Button
                        onClick={handleToggleSound}
                        variant="ghost"
                        size="sm"
                        className="text-white/60 hover:text-white p-3 bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/30 rounded-xl"
                    >
                        {isSoundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                </div>

                {/* PVP 시 대기 안내 */}
                {isPVP && !roomData?.guestId && (
                    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center p-6 backdrop-blur-md">
                        <Users className="w-20 h-20 text-blue-500 mb-6 animate-pulse" />
                        <h2 className="text-3xl font-black font-orbitron text-white mb-2 tracking-widest text-glow-blue">WAITING FOR CHALLENGER</h2>
                        <p className="text-blue-200/60 mb-8 max-w-sm">당신의 도전을 받아들일 운명적인 상대를 기다리고 있습니다...</p>
                        <div className="flex gap-4">
                            <Button onClick={() => router.push('/minigame')} variant="ghost">로비로 돌아가기</Button>
                        </div>
                    </div>
                )}

                {/* 상단: 상대 영역 */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-red-900/10 rounded-3xl border border-red-500/20 mb-4 relative overflow-hidden">
                    <div className="absolute top-4 left-4 text-red-500 font-bold font-orbitron flex items-center gap-2">
                        {isPVP ? <Users className="w-4 h-4" /> : <Skull className="w-4 h-4" />}
                        {isPVP ? (isHost ? roomData?.guestName : roomData?.hostName) : "THE ENEMY"}
                    </div>
                    <div className="flex gap-4">
                        {opponentCards.length > 0 ? opponentCards.map((card, i) => (
                            <motion.div key={card.instanceId || i} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="relative">
                                <div className={cn("w-40 h-56 rounded-xl transition-all duration-500 transform-style-3d", (phase === 'clash' || phase === 'result') ? "rotate-y-180" : "")}>
                                    <div className={cn("absolute inset-0 backface-hidden z-10", (phase === 'clash' || phase === 'result') ? "opacity-0" : "opacity-100")}>
                                        <div className="w-full h-full bg-slate-900 border-2 border-red-500 flex items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#333_10px,#333_20px)] rounded-xl shadow-xl">
                                            <Skull className="w-12 h-12 text-red-500 opacity-50 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className={cn("absolute inset-0 backface-hidden rotate-y-180", (phase === 'clash' || phase === 'result') ? "opacity-100" : "opacity-0")}>
                                        <GameCard card={card} />
                                        {results[i] && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 rounded-xl">
                                                {results[i].result === 'win' && <span className="text-4xl text-glow-red">☠️</span>}
                                                {results[i].result === 'lose' && <span className="text-4xl text-glow-blue">👑</span>}
                                                {results[i].result === 'draw' && <span className="text-4xl text-gray-400">🤝</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            // PVP 대기 중 더미 카드
                            Array(reqCards).fill(null).map((_, i) => (
                                <div key={i} className="w-40 h-56 rounded-xl border-2 border-white/5 bg-white/5 animate-pulse" />
                            ))
                        )}
                    </div>
                </div>

                {/* 중앙 피드백 */}
                <div className="h-24 flex items-center justify-center my-4">
                    <AnimatePresence mode='wait'>
                        {phase === 'select' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/60 text-lg font-bold font-orbitron uppercase tracking-widest">
                                {isWaitingForOpponent ? "WAITING FOR OPPONENT'S CHOICE..." : `SELECT ${reqCards} CARDS`}
                            </motion.div>
                        )}
                        {phase === 'ready' && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="text-6xl font-black text-red-500 font-orbitron text-glow-red">READY...</motion.div>}
                        {phase === 'clash' && <motion.div initial={{ scale: 3 }} animate={{ scale: 1 }} className="text-8xl font-black text-yellow-400 font-orbitron italic">CLASH!</motion.div>}
                        {phase === 'result' && (
                            <motion.div className={cn("text-5xl font-black font-orbitron px-8 py-2 rounded-xl border-4", finalResult === 'win' ? "text-green-400 border-green-500 bg-green-900/30" : finalResult === 'lose' ? "text-red-500 border-red-500 bg-red-900/30" : "text-gray-400 border-gray-500 bg-gray-900/30")}>
                                {finalResult === 'win' ? "VICTORY" : finalResult === 'lose' ? "DEFEAT" : "DRAW"}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 하단: 플레이어 영역 */}
                <div className="flex-1 flex flex-col p-6 bg-blue-900/10 rounded-3xl border border-blue-500/20 relative min-h-[400px]">
                    <div className="absolute top-4 left-4 text-blue-500 font-bold font-orbitron">COMMANDER: {profile?.nickname}</div>

                    {phase === 'select' && !isWaitingForOpponent ? (
                        <>
                            <div className="flex-1 overflow-x-auto py-4 space-x-4 custom-scrollbar">
                                {sortedInventory.map((card) => {
                                    const isSelected = selectedCards.find(c => c.instanceId === card.instanceId);
                                    const selectionIndex = selectedCards.findIndex(c => c.instanceId === card.instanceId);
                                    return (
                                        <div key={card.instanceId} onClick={() => handleCardSelect(card)} className={cn("inline-block w-36 h-52 transition-all cursor-pointer relative rounded-xl overflow-hidden", isSelected ? "ring-4 ring-blue-500 scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "opacity-60 hover:opacity-100 hover:scale-105")}>
                                            <div className="pointer-events-none"><GameCard card={card} /></div>
                                            <div className="absolute top-1 left-1 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center text-xs z-10">
                                                {getHandType(card) === 'rock' ? '✊' : getHandType(card) === 'scissors' ? '✌️' : '✋'}
                                            </div>
                                            {isSelected && <div className="absolute top-1 right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold border border-white z-20">{selectionIndex + 1}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-center mt-4">
                                <Button onClick={handleStartGame} disabled={selectedCards.length !== reqCards} className={cn("px-12 py-5 text-xl font-black font-orbitron transition-all", selectedCards.length === reqCards ? "bg-blue-600 hover:bg-blue-500 text-white animate-pulse" : "bg-zinc-800 text-white/20")}>
                                    {isPVP ? "LOCKED IN CHOICE" : "COMMENCE BATTLE"}
                                </Button>
                            </div>
                        </>
                    ) : (
                        // 선택된 카드 오버레이 (대기 중 및 전투 중)
                        <div className="flex justify-center items-center gap-4 h-full relative">
                            {isWaitingForOpponent && phase === 'select' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-30 rounded-2xl">
                                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                    <p className="text-blue-400 font-orbitron font-bold">TRANSMITTING DATA...</p>
                                </div>
                            )}
                            {selectedCards.map((card, i) => (
                                <motion.div key={card.instanceId} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="relative">
                                    <div className="w-40 h-56 rounded-xl shadow-2xl">
                                        <GameCard card={card} />
                                        {results[i] && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 rounded-xl">
                                                {results[i].result === 'win' && <span className="text-4xl text-glow-blue">👑</span>}
                                                {results[i].result === 'lose' && <span className="text-4xl text-glow-red">☠️</span>}
                                                {results[i].result === 'draw' && <span className="text-4xl text-gray-400">🤝</span>}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 결과 모달 */}
                {phase === 'result' && (
                    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)]">
                            <div className="p-10 text-center">
                                <div className={cn("inline-block p-5 rounded-full mb-6", finalResult === 'win' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                    {finalResult === 'win' ? <Trophy className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
                                </div>
                                <h2 className={cn("text-5xl font-black mb-4 font-orbitron", finalResult === 'win' ? "text-green-400 text-glow-green" : finalResult === 'lose' ? "text-red-500 text-glow-red" : "text-gray-400")}>
                                    {finalResult === 'win' ? "VICTORY" : finalResult === 'lose' ? "DEFEAT" : "DRAW"}
                                </h2>
                                <p className="text-white/60 mb-10 text-sm leading-relaxed">
                                    {finalResult === 'win' ? "상대방의 전력을 흡수하는 데 성공했습니다. 새로운 카드가 인벤토리에 추가됩니다." : finalResult === 'lose' ? "작전 실패로 보급로가 차단되었습니다. 선택한 카드가 데이터 파편으로 소멸되었습니다." : "양측의 전력이 팽팽합니다. 모든 카드가 회수되었습니다."}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button onClick={() => window.location.reload()} variant="ghost">AGAIN</Button>
                                    <Button onClick={() => router.push('/minigame')} variant="solid" className="bg-white text-black hover:bg-zinc-200">LOBBY</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </CyberPageLayout>
    );
}
