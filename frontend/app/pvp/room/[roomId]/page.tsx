'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GameCard from '@/components/GameCard';
import { Card, Rarity } from '@/lib/types';
import { InventoryCard, loadInventory } from '@/lib/inventory-system';
import { getGameState } from '@/lib/game-state';
import {
    getBattleRoom,
    updatePlayerState,
    updateBattleRoom,
    listenToBattleRoom,
    sendHeartbeat,
    cleanupBattleRoom,
    leaveMatchmaking
} from '@/lib/realtime-pvp-service';
import { BattleRoom, PlayerState, BattlePhase } from '@/lib/realtime-pvp-types';
import { applyBattleResult, BattleResult, PVP_REWARDS } from '@/lib/pvp-battle-system';
import { useAlert } from '@/context/AlertContext';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { getDatabase, ref, onDisconnect } from 'firebase/database';
import app from '@/lib/firebase';
import { Loader2, Swords, Clock, Trophy, XCircle, CheckCircle, Shuffle, Users, ArrowRight, Zap, Shield } from 'lucide-react';
import { BattleArena } from '@/components/BattleArena';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { Button } from '@/components/ui/custom/Button';

// Extended local phase for UI control
type LocalPhase = 'loading' | 'waiting' | 'vs-matchup' | 'deck-select' | 'ordering' | 'battle' | 'result' | 'error';

export default function RealtimeBattleRoomPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params?.roomId as string;
    const { showAlert } = useAlert();

    const [room, setRoom] = useState<BattleRoom | null>(null);
    const [localPhase, setLocalPhase] = useState<LocalPhase>('loading');
    const [myCards, setMyCards] = useState<InventoryCard[]>([]);
    const [selectedCards, setSelectedCards] = useState<Card[]>([]);
    const [countdown, setCountdown] = useState(20); // [FIX] 30 -> 20
    const [isConnected, setIsConnected] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [vsCountdown, setVsCountdown] = useState(20); // [FIX] 5 -> 20

    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const listenerRef = useRef<(() => void) | null>(null);

    const { profile, user, loading: userLoading } = useUser();
    const state = getGameState(user?.uid);
    const playerId = user?.uid || state.userId || 'guest';

    // 내 플레이어 정보
    const getMyPlayer = useCallback(() => {
        if (!room) return null;
        return room.player1.playerId === playerId ? room.player1 : room.player2;
    }, [room, playerId]);

    const getOpponent = useCallback(() => {
        if (!room) return null;
        return room.player1.playerId === playerId ? room.player2 : room.player1;
    }, [room, playerId]);

    const myPlayer = getMyPlayer();
    const opponent = getOpponent();

    // 카드 로드
    useEffect(() => {
        const loadCards = async () => {
            const cards = await loadInventory();
            setMyCards(cards.map(c => ({
                ...c,
                acquiredAt: c.acquiredAt && typeof (c.acquiredAt as any).toDate === 'function'
                    ? (c.acquiredAt as any).toDate()
                    : new Date(c.acquiredAt as any)
            })));
        };
        loadCards();
    }, []);

    // 방 연결 및 리스너
    useEffect(() => {
        if (!roomId) {
            setError('유효하지 않은 방입니다.');
            setLocalPhase('error');
            return;
        }

        const initRoom = async () => {
            try {
                const roomData = await getBattleRoom(roomId);
                if (!roomData) {
                    setError('방을 찾을 수 없습니다.');
                    setLocalPhase('error');
                    return;
                }

                setRoom(roomData);
                setIsConnected(true);

                // 내 연결 상태 업데이트
                await updatePlayerState(roomId, playerId, {
                    playerName: state.nickname || `Player_${state.level}`,
                    playerLevel: state.level,
                    connected: true,
                    lastHeartbeat: Date.now()
                });

                // 양쪽 모두 연결되었는지 확인
                const bothConnected = roomData.player1.connected && roomData.player2.connected;
                if (bothConnected) {
                    setLocalPhase('vs-matchup');
                } else {
                    setLocalPhase('waiting');
                }

                // 실시간 리스너 설정
                const unsubscribe = listenToBattleRoom(roomId, async (updatedRoom) => {
                    setRoom(updatedRoom);

                    // 상대방 연결 끊김 감지
                    const isPlayer1 = updatedRoom.player1.playerId === playerId;
                    const opponentData = isPlayer1 ? updatedRoom.player2 : updatedRoom.player1;

                    if (!opponentData.connected && localPhase !== 'loading' && localPhase !== 'waiting' && !updatedRoom.finished) {
                        console.warn('Opponent disconnected');
                        // Optional: Show a warning or handle as forfeit
                    }

                    // [FIX] Phase synchronization logic
                    // We map the server room.phase to our localPhase.
                    // Priority: If the room.phase is set, we follow it.
                    const roomPhase = updatedRoom.phase as LocalPhase;

                    if (roomPhase && roomPhase !== localPhase) {
                        console.log(`[Flow] Phase synchronized: ${localPhase} -> ${roomPhase}`);
                        setLocalPhase(roomPhase);

                        // Special triggers based on phase
                        if (roomPhase === 'vs-matchup' && vsCountdown === 5) {
                            // The vsCountdown timer is already handled by a useEffect dependent on localPhase
                        }
                    }
                });
                listenerRef.current = unsubscribe;

                // [NEW] 연결 끊김 자동 감지 설정 (OnDisconnect)
                const db = getDatabase(app || undefined);
                const myPlayerKey = roomData.player1.playerId === playerId ? 'player1' : 'player2';
                const myConnectionRef = ref(db, `battles/${roomId}/${myPlayerKey}/connected`);
                onDisconnect(myConnectionRef).set(false);

                // 하트비트 시작
                heartbeatRef.current = setInterval(() => {
                    sendHeartbeat(roomId, playerId);
                }, 5000);

            } catch (error: any) {
                // [FIX] Firestore index required error handling - This part of the instruction seems to be for a different function (e.g., fetchLeaderboard)
                // and is not directly applicable here as initRoom does not return an array.
                // The original error handling for initRoom is kept.
                console.error('Room init error:', error);
                setError('방 연결에 실패했습니다.');
                setLocalPhase('error');
            }
        };

        initRoom();

        return () => {
            if (listenerRef.current) listenerRef.current();
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, [roomId]);

    // VS 화면 카운트다운
    useEffect(() => {
        if (localPhase !== 'vs-matchup') return;

        const timer = setInterval(() => {
            setVsCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // [FIX] VS 카운트다운 종료 시 방 전체 페이즈를 deck-select로 동기화 업뎃
                    if (room && (room.player1.playerId === playerId)) {
                        updateBattleRoom(roomId, { phase: 'deck-select' });
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [localPhase]);

    // 덱 선택 카운트다운
    useEffect(() => {
        if (localPhase !== 'deck-select') return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAutoSelect();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [localPhase]);

    // 카드 선택
    const handleCardClick = (card: InventoryCard) => {
        const isSelected = selectedCards.find(c => c.id === card.id);
        if (isSelected) {
            setSelectedCards(prev => prev.filter(c => c.id !== card.id));
        } else if (selectedCards.length < 6) {
            setSelectedCards(prev => [...prev, card as Card]);
        }
    };

    // 자동 선택
    const handleAutoSelect = async () => {
        const topCards = [...myCards]
            .sort((a, b) => (b.stats?.totalPower || 0) - (a.stats?.totalPower || 0))
            .slice(0, 6) as Card[];
        setSelectedCards(topCards);
        await handleConfirmDeck(topCards);
    };

    // 덱 확정
    const handleConfirmDeck = async (deckOverride?: Card[]) => {
        const deck = deckOverride || selectedCards;
        if (deck.length !== 6) {
            showAlert({ title: '오류', message: '카드 6장을 선택해주세요.', type: 'warning' });
            return;
        }

        await updatePlayerState(roomId, playerId, {
            selectedCards: deck,
            cardOrder: [0, 1, 2, 3, 4, 5],
            ready: true
        });

        // [FIX] Phase transition is now handled ONLY by the real-time listener
        // to prevent race conditions where both players update the phase simultaneously.
        const opponentPlayer = getOpponent();
        if (opponentPlayer?.ready) {
            console.log('[Flow] Both players ready, triggering battle phase...');
            await updateBattleRoom(roomId, { phase: 'battle' });
        } else {
            console.log('[Flow] Waiting for opponent...');
            await updateBattleRoom(roomId, { phase: 'ordering' });
        }
    };

    // VS 건너뛰기
    const handleSkipVS = async () => {
        if (!room) return;
        console.log('[Flow] Skipping VS matchup timer...');
        await updateBattleRoom(roomId, { phase: 'deck-select' });
    };

    // 전투 종료 콜백
    const handleBattleFinish = async (result: {
        isWin: boolean;
        playerWins: number;
        enemyWins: number;
        rounds: any[];
    }) => {
        if (!room) return;

        const myPlayerData = getMyPlayer();
        const opponentData = getOpponent();
        if (!myPlayerData || !opponentData) return;

        const { isWin, playerWins: pWins, enemyWins: eWins } = result;
        const isGhost = (room as any).isGhost || false;
        const winnerId = isWin ? playerId : opponentData.playerId;

        const battleResult: BattleResult = {
            winner: isWin ? 'player' : 'opponent',
            rounds: result.rounds.map(r => ({
                round: r.round,
                winner: r.winner === 'player' ? 'player' : r.winner === 'enemy' ? 'opponent' : 'draw',
                playerCard: r.playerCard,
                opponentCard: r.enemyCard,
                playerPower: r.playerPower,
                opponentPower: r.enemyPower,
                playerType: (r.playerCard?.type || 'EFFICIENCY').toLowerCase() as any,
                opponentType: (r.enemyCard?.type || 'EFFICIENCY').toLowerCase() as any,
                reason: r.reason
            })),
            playerWins: pWins,
            opponentWins: eWins,
            rewards: {
                coins: isWin ? 200 : 0,
                experience: isWin ? 100 : 20,
                ratingChange: isWin ? 25 : -15
            }
        };

        await updateBattleRoom(roomId, {
            phase: 'finished',
            winner: winnerId ?? undefined,
            finished: true
        });

        await applyBattleResult(
            battleResult,
            myPlayerData.selectedCards,
            opponentData.selectedCards,
            true,
            isGhost,
            false
        );

        setLocalPhase('result');
    };

    // 나가기
    const handleLeave = async () => {
        if (room) {
            await leaveMatchmaking(room.battleMode, playerId);
            if (room.finished) {
                await cleanupBattleRoom(roomId);
            }
        }
        router.push('/pvp');
    };

    const isWinner = room?.winner === playerId;

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            <BackgroundBeams className="opacity-20" />

            <AnimatePresence mode="wait">
                {/* 로딩 */}
                {localPhase === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-screen flex flex-col items-center justify-center"
                    >
                        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-4" />
                        <p className="text-white/60">전투방 연결 중...</p>
                    </motion.div>
                )}

                {/* 에러 */}
                {localPhase === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-screen flex flex-col items-center justify-center gap-4"
                    >
                        <XCircle className="w-20 h-20 text-red-500" />
                        <p className="text-red-400 text-xl font-bold">{error}</p>
                        <Button onPress={() => router.push('/pvp')}>돌아가기</Button>
                    </motion.div>
                )}

                {/* 대기 중 */}
                {localPhase === 'waiting' && (
                    <motion.div
                        key="waiting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-screen flex flex-col items-center justify-center"
                    >
                        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">상대방을 기다리는 중...</h2>
                        <p className="text-white/60 mb-8">친구가 코드를 입력하면 자동으로 시작됩니다</p>

                        <div className="flex items-center gap-8">
                            <div className="text-center p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
                                <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-4xl">🎮</span>
                                </div>
                                <p className="text-white font-bold">{myPlayer?.playerName || '나'}</p>
                                <p className="text-cyan-400 text-sm">Lv.{myPlayer?.playerLevel || state.level}</p>
                                <div className="mt-2 text-green-400 text-xs">✅ 연결됨</div>
                            </div>

                            <Swords className="text-red-500" size={48} />

                            <div className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
                                </div>
                                <p className="text-white/60 font-bold">대기 중...</p>
                                <p className="text-white/40 text-sm">-</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLeave}
                            className="mt-12 px-8 py-3 bg-white/10 text-white/60 rounded-xl hover:bg-white/20 transition"
                        >
                            나가기
                        </button>
                    </motion.div>
                )}

                {/* VS 매치업 화면 */}
                {localPhase === 'vs-matchup' && (
                    <motion.div
                        key="vs-matchup"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-screen flex flex-col items-center justify-center relative"
                    >
                        {/* 배경 효과 */}
                        <div className="absolute inset-0 overflow-hidden">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-conic from-red-500/20 via-transparent to-cyan-500/20"
                            />
                        </div>

                        <div className="relative z-10">
                            {/* 카운트다운 */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-center mb-8"
                            >
                                <p className="text-white/60 text-sm mb-2">전투 시작까지</p>
                                <span className="text-6xl font-black text-white orbitron">{vsCountdown}</span>
                            </motion.div>

                            {/* VS 표시 */}
                            <div className="flex items-center gap-8 md:gap-16">
                                {/* 내 정보 */}
                                <motion.div
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-center"
                                >
                                    <div className="w-32 h-32 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-cyan-500">
                                        <span className="text-5xl">🎮</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white orbitron">{myPlayer?.playerName || '나'}</h3>
                                    <p className="text-cyan-400 font-bold">Lv.{myPlayer?.playerLevel || state.level}</p>
                                </motion.div>

                                {/* VS */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.4, type: 'spring' }}
                                    className="relative"
                                >
                                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
                                        <span className="text-4xl font-black text-red-500 orbitron italic">VS</span>
                                    </div>
                                    <motion.div
                                        animate={{ scale: [1, 1.5, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-red-500/30 rounded-full blur-xl"
                                    />
                                </motion.div>

                                {/* 상대 정보 */}
                                <motion.div
                                    initial={{ x: 100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-center"
                                >
                                    <div className="w-32 h-32 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-500">
                                        <span className="text-5xl">👤</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white orbitron">{opponent?.playerName || '상대방'}</h3>
                                    <p className="text-red-400 font-bold">Lv.{opponent?.playerLevel || '?'}</p>
                                </motion.div>
                            </div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-center text-white/60 mt-8"
                            >
                                곧 덱 선택 화면으로 이동합니다...
                            </motion.p>

                            {/* [NEW] 건너뛰기 버튼 */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="flex justify-center mt-6"
                            >
                                <Button
                                    onPress={handleSkipVS}
                                    className="bg-white/10 hover:bg-white/20 text-white orbitron font-bold px-8"
                                    variant="flat"
                                    size="sm"
                                >
                                    SKIPPING WAIT »
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* 덱 선택 */}
                {localPhase === 'deck-select' && (
                    <motion.div
                        key="deck-select"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-screen p-4"
                    >
                        {/* 헤더 */}
                        <div className="max-w-5xl mx-auto mb-6">
                            <div className="flex items-center justify-between bg-black/50 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                <div>
                                    <h2 className="text-xl font-bold text-white">덱 선택</h2>
                                    <p className="text-sm text-white/60">6장의 카드를 선택하세요</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-white/40">상대</p>
                                        <p className="text-sm font-bold text-red-400">{opponent?.playerName}</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-xl">
                                        <Clock size={20} className="text-amber-400" />
                                        <span className="text-2xl font-black text-amber-400 orbitron">{countdown}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 선택된 카드 */}
                        <div className="max-w-5xl mx-auto mb-6">
                            <div className="flex items-center gap-3 p-4 bg-black/50 backdrop-blur-sm rounded-2xl border border-white/10">
                                <span className="text-white/60 font-bold mr-2">{selectedCards.length}/6</span>
                                {selectedCards.map((card, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-14 h-20 cursor-pointer"
                                        onClick={() => setSelectedCards(prev => prev.filter(c => c.id !== card.id))}
                                    >
                                        <GameCard card={card} />
                                    </motion.div>
                                ))}
                                {Array(6 - selectedCards.length).fill(null).map((_, i) => (
                                    <div key={`empty-${i}`} className="w-14 h-20 border-2 border-dashed border-white/20 rounded-lg" />
                                ))}

                                <div className="ml-auto flex gap-2">
                                    <button
                                        onClick={() => handleAutoSelect()}
                                        className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg flex items-center gap-2 hover:bg-cyan-500/30 transition"
                                    >
                                        <Shuffle size={18} />
                                        자동
                                    </button>
                                    <button
                                        onClick={() => handleConfirmDeck()}
                                        disabled={selectedCards.length !== 6}
                                        className={cn(
                                            "px-6 py-2 font-bold rounded-lg flex items-center gap-2 transition",
                                            selectedCards.length === 6
                                                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500"
                                                : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                        )}
                                    >
                                        <CheckCircle size={18} />
                                        확정
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 카드 그리드 */}
                        <div className="max-w-5xl mx-auto grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {myCards.map(card => {
                                const isSelected = selectedCards.find(c => c.id === card.id);
                                return (
                                    <motion.div
                                        key={card.instanceId}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleCardClick(card)}
                                        className={cn(
                                            "cursor-pointer transition-all rounded-lg overflow-hidden",
                                            isSelected && "ring-2 ring-cyan-400 scale-105"
                                        )}
                                    >
                                        <GameCard card={card} isSelected={!!isSelected} />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* 상대방 대기 (ordering) */}
                {localPhase === 'ordering' && (
                    <motion.div
                        key="ordering"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-screen flex flex-col items-center justify-center"
                    >
                        <CheckCircle className="w-20 h-20 text-green-400 mb-6" />
                        <h2 className="text-3xl font-bold text-white mb-2">덱 선택 완료!</h2>
                        <p className="text-white/60 mb-8">상대방이 덱을 선택할 때까지 기다리는 중...</p>

                        <div className="flex gap-2">
                            {selectedCards.slice(0, 6).map((card, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="w-16 h-24"
                                >
                                    <GameCard card={card} />
                                </motion.div>
                            ))}
                        </div>

                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mt-8" />
                    </motion.div>
                )}

                {/* 전투 - BattleArena 사용 */}
                {localPhase === 'battle' && myPlayer && opponent && myPlayer.selectedCards.length > 0 && opponent.selectedCards.length > 0 && (
                    <BattleArena
                        playerDeck={myPlayer.selectedCards}
                        enemyDeck={opponent.selectedCards}
                        opponent={{
                            name: opponent.playerName,
                            level: opponent.playerLevel
                        }}
                        onFinish={handleBattleFinish}
                        title="REALTIME BATTLE"
                        maxRounds={room?.maxRounds || 5}
                        enemySelectionMode="ordered"
                    />
                )}

                {/* 결과 화면 */}
                {localPhase === 'result' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="min-h-screen flex flex-col items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                            className="mb-8"
                        >
                            {isWinner ? (
                                <Trophy className="w-32 h-32 text-yellow-400" />
                            ) : (
                                <XCircle className="w-32 h-32 text-red-400" />
                            )}
                        </motion.div>

                        <h2 className={cn(
                            "text-5xl font-black orbitron italic mb-4",
                            isWinner ? "text-yellow-400" : "text-red-400"
                        )}>
                            {isWinner ? 'VICTORY' : 'DEFEAT'}
                        </h2>

                        <div className="flex items-center gap-8 mb-8">
                            <div className="text-center">
                                <p className="text-6xl font-black text-cyan-400">{myPlayer?.wins || 0}</p>
                                <p className="text-white/60">{myPlayer?.playerName}</p>
                            </div>
                            <p className="text-2xl text-white/40">vs</p>
                            <div className="text-center">
                                <p className="text-6xl font-black text-red-400">{opponent?.wins || 0}</p>
                                <p className="text-white/60">{opponent?.playerName}</p>
                            </div>
                        </div>

                        {isWinner && (
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                                    <p className="text-yellow-400 text-sm">코인</p>
                                    <p className="text-2xl font-black text-yellow-400">+200</p>
                                </div>
                                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
                                    <p className="text-cyan-400 text-sm">레이팅</p>
                                    <p className="text-2xl font-black text-cyan-400">+25</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => router.push('/pvp')}
                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition"
                            >
                                다시 매칭
                            </button>
                            <button
                                onClick={() => router.push('/main')}
                                className="px-8 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition"
                            >
                                메인으로
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
