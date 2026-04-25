'use client';

export const dynamic = 'force-dynamic';

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
import { useTranslation } from '@/context/LanguageContext';
import { saveBattleHistory } from '@/lib/user-profile-utils';

// Extended local phase for UI control
type LocalPhase = 'loading' | 'waiting' | 'vs-matchup' | 'deck-select' | 'ordering' | 'battle' | 'result' | 'error';

export default function RealtimeBattleRoomPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params?.roomId as string;
    const { showAlert } = useAlert();
    const { language } = useTranslation();

    const [room, setRoom] = useState<BattleRoom | null>(null);
    const [localPhase, setLocalPhase] = useState<LocalPhase>('loading');
    const [myCards, setMyCards] = useState<InventoryCard[]>([]);
    const [selectedCards, setSelectedCards] = useState<Card[]>([]);
    const [countdown, setCountdown] = useState(60); // [FIX] 20 -> 60 (More generous for deck selection)
    const [isConnected, setIsConnected] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [vsCountdown, setVsCountdown] = useState(30); // [FIX] 20 -> 30 (More time for vs-matchup intro)
    const [localWinner, setLocalWinner] = useState<string | null>(null);
    const [opponentDisconnected, setOpponentDisconnected] = useState(false);
    const [battleRewards, setBattleRewards] = useState<{ coins: number; ratingChange: number } | null>(null);

    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const listenerRef = useRef<(() => void) | null>(null);
    const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
    // [FIX] 스테일 클로저 방지: localPhase를 ref로도 추적
    const localPhaseRef = useRef<LocalPhase>('loading');

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
                    localPhaseRef.current = 'vs-matchup';
                    setLocalPhase('vs-matchup');
                } else {
                    localPhaseRef.current = 'waiting';
                    setLocalPhase('waiting');
                }

                // 실시간 리스너 설정
                const unsubscribe = listenToBattleRoom(roomId, async (updatedRoom) => {
                    setRoom(updatedRoom);

                    // 상대방 연결 끊김 감지 — [FIX] localPhaseRef.current 사용 (스테일 클로저 방지)
                    const isPlayer1 = updatedRoom.player1.playerId === playerId;
                    const opponentData = isPlayer1 ? updatedRoom.player2 : updatedRoom.player1;
                    const myData = isPlayer1 ? updatedRoom.player1 : updatedRoom.player2;
                    const currentPhase = localPhaseRef.current;

                    if (!opponentData.connected && currentPhase !== 'loading' && currentPhase !== 'waiting' && !updatedRoom.finished) {
                        console.warn('[PVP] Opponent disconnected at phase:', currentPhase);
                        setOpponentDisconnected(true);

                        // 15초 후 자동 승리 처리
                        if (!disconnectTimerRef.current) {
                            disconnectTimerRef.current = setTimeout(async () => {
                                const freshRoom = await getBattleRoom(roomId);
                                const freshOpp = freshRoom
                                    ? (freshRoom.player1.playerId === playerId ? freshRoom.player2 : freshRoom.player1)
                                    : null;

                                if (freshRoom && !freshRoom.finished && freshOpp && !freshOpp.connected) {
                                    console.log('[PVP] Auto-win triggered after 15s disconnect');
                                    await updateBattleRoom(roomId, {
                                        phase: 'finished',
                                        winner: playerId,
                                        finished: true
                                    });
                                    handleBattleFinish({
                                        isWin: true,
                                        playerWins: 1,
                                        enemyWins: 0,
                                        rounds: []
                                    });
                                }
                                disconnectTimerRef.current = null;
                            }, 15000);
                        }
                    }

                    // 상대 재접속 시 타이머 취소
                    if (opponentData.connected && disconnectTimerRef.current) {
                        clearTimeout(disconnectTimerRef.current);
                        disconnectTimerRef.current = null;
                        setOpponentDisconnected(false);
                    }

                    // [FIX] 'waiting' 상태에서 양쪽 연결 시 'vs-matchup'으로 전환
                    if (updatedRoom.phase === 'waiting' && updatedRoom.player1.connected && updatedRoom.player2.connected) {
                        console.log('[Flow] Both players connected! Transitioning to vs-matchup...');
                        // Player1만 phase 업데이트 (중복 방지)
                        if (isPlayer1) {
                            await updateBattleRoom(roomId, { phase: 'vs-matchup' as BattlePhase });
                        }
                        localPhaseRef.current = 'vs-matchup';
                        setLocalPhase('vs-matchup');
                        return;
                    }

                    // [FIX] Auto-transition to battle when both players are ready
                    if (updatedRoom.phase === 'deck-select' && myData.ready && opponentData.ready) {
                        console.log('[Flow] Both players ready detected in listener, transitioning to battle...');
                        if (isPlayer1) {
                            await updateBattleRoom(roomId, { phase: 'battle' });
                        }
                        return;
                    }

                    // 결과 교차 검증: 양쪽 결과가 모두 기록되면 mismatch 체크
                    const r = updatedRoom as any;
                    if (r.player1Result && r.player2Result && !r.resultMismatch) {
                        if (r.player1Result !== r.player2Result) {
                            console.error('[PVP] Result mismatch! P1:', r.player1Result, 'P2:', r.player2Result);
                            updateBattleRoom(roomId, { resultMismatch: true } as any);
                        }
                    }

                    // Phase synchronization logic
                    const roomPhase = updatedRoom.phase as LocalPhase;

                    if (roomPhase && roomPhase !== currentPhase) {
                        console.log(`[Flow] Phase synchronized: ${currentPhase} -> ${roomPhase}`);
                        localPhaseRef.current = roomPhase;
                        setLocalPhase(roomPhase);
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
            if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
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

    // 헬퍼: 모드별 필요한 카드 수
    const getRequiredCardCount = () => {
        if (!room) return 5;
        return (room.battleMode === 'strategy' || room.battleMode === 'double') ? 6 : 5;
    };

    // 카드 선택
    const handleCardClick = (card: InventoryCard) => {
        const isSelected = selectedCards.find(c => c.id === card.id);
        const requiredCount = getRequiredCardCount();

        if (isSelected) {
            setSelectedCards(prev => prev.filter(c => c.id !== card.id));
        } else if (selectedCards.length < requiredCount) {
            setSelectedCards(prev => [...prev, card as Card]);
        }
    };

    // 자동 선택
    const handleAutoSelect = async () => {
        const requiredCount = getRequiredCardCount();
        const topCards = [...myCards]
            .sort((a, b) => (b.stats?.totalPower || 0) - (a.stats?.totalPower || 0))
            .slice(0, requiredCount) as Card[];
        setSelectedCards(topCards);
        await handleConfirmDeck(topCards);
    };

    // 덱 확정
    const handleConfirmDeck = async (deckOverride?: Card[]) => {
        const deck = deckOverride || selectedCards;
        const requiredCount = getRequiredCardCount();

        if (deck.length !== requiredCount) {
            showAlert({
                title: '오류',
                message: language === 'ko' ? `카드 ${requiredCount}장을 선택해주세요.` : `Please select ${requiredCount} cards.`,
                type: 'warning'
            });
            return;
        }

        // ready:true만 쓰고, phase 전환은 리스너(isPlayer1 가드)에 위임
        await updatePlayerState(roomId, playerId, {
            selectedCards: deck,
            cardOrder: Array.from({ length: requiredCount }, (_, i) => i),
            ready: true
        });

        console.log('[Flow] Deck confirmed. Waiting for listener to detect both-ready...');
        localPhaseRef.current = 'ordering';
        setLocalPhase('ordering');
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

        // [FIX] PVP_REWARDS 중앙 설정에서 보상 계산 (하드코딩 제거)
        const rewardKey = isWin ? 'realtime-win' : 'realtime-loss';
        const pvpRewardConfig = PVP_REWARDS[rewardKey];
        const rewards = {
            coins: pvpRewardConfig.coins,
            experience: pvpRewardConfig.exp,
            ratingChange: pvpRewardConfig.rating,
            tokens: pvpRewardConfig.tokens || 0
        };

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
            rewards: rewards  // [FIX] PVP_REWARDS 중앙 설정 기반 보상
        };

        // 로컬 위너 설정 + 보상 저장 (결과 화면용)
        setLocalWinner(winnerId);
        setBattleRewards({ coins: rewards.coins, ratingChange: rewards.ratingChange });

        // 양쪽 모두 자기 계산 결과를 기록 (교차 검증용)
        const isPlayer1 = room.player1.playerId === playerId;
        const myResultKey = isPlayer1 ? 'player1Result' : 'player2Result';
        await updateBattleRoom(roomId, { [myResultKey]: winnerId } as any);

        // 승자만 phase:'finished' 기록 (중복 방지)
        if (isWin) {
            await updateBattleRoom(roomId, {
                phase: 'finished',
                winner: winnerId,
                finished: true
            });
        }

        // [FIX] 각 플레이어는 자신의 보상만 적용 (승자/패자 구분됨)
        await applyBattleResult(
            battleResult,
            myPlayerData.selectedCards,
            opponentData.selectedCards,
            true,   // isRanked: true (실시간 PVP)
            isGhost,
            true    // isRealtime: true
        );

        // [NEW] 전투 기록 저장
        if (user?.uid) {
            await saveBattleHistory(user.uid, {
                opponentId: opponentData.playerId,
                opponentName: opponentData.playerName,
                result: isWin ? 'win' : 'loss',
                ratingChange: rewards.ratingChange,
                battleMode: (room as any).battleMode || 'Ranked'
            });
        }

        localPhaseRef.current = 'result';
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

    const isWinner = localWinner ? (localWinner === playerId) : (room?.winner === playerId);

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            <BackgroundBeams className="opacity-20" />

            {/* 상대방 연결 끊김 배너 */}
            {opponentDisconnected && localPhase !== 'result' && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-red-600/90 backdrop-blur-sm px-4 py-3 text-center"
                >
                    <p className="text-white font-bold text-sm">
                        ⚠️ 상대방의 연결이 끊겼습니다. 잠시 후 승리 처리됩니다...
                    </p>
                </motion.div>
            )}

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
                            <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-black/50 backdrop-blur-sm rounded-2xl border border-white/10">
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="text-white/60 font-bold mr-2">{selectedCards.length}/{getRequiredCardCount()}</span>
                                    <div className={cn("grid gap-3 flex-1 max-w-sm", getRequiredCardCount() === 6 ? "grid-cols-6" : "grid-cols-5")}>
                                        {selectedCards.map((card, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-12 h-16 cursor-pointer"
                                                onClick={() => setSelectedCards(prev => prev.filter(c => c.id !== card.id))}
                                            >
                                                <GameCard card={card} />
                                            </motion.div>
                                        ))}
                                        {Array(Math.max(0, getRequiredCardCount() - selectedCards.length)).fill(null).map((_, i) => (
                                            <div key={`empty-${i}`} className="w-12 h-16 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-white/10">
                                                <span className="text-xs">{i + selectedCards.length + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

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
                                        disabled={selectedCards.length !== getRequiredCardCount()}
                                        className={cn(
                                            "px-6 py-2 font-bold rounded-lg flex items-center gap-2 transition",
                                            selectedCards.length === getRequiredCardCount()
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
                        battleMode={room?.battleMode as any}
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

                        {battleRewards && (
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                                    <p className="text-yellow-400 text-sm">코인</p>
                                    <p className="text-2xl font-black text-yellow-400">+{battleRewards.coins}</p>
                                </div>
                                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
                                    <p className="text-cyan-400 text-sm">레이팅</p>
                                    <p className="text-2xl font-black text-cyan-400">{battleRewards.ratingChange > 0 ? '+' : ''}{battleRewards.ratingChange}</p>
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
