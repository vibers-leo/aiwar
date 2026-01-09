'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Loader2, Copy, Check, RefreshCw, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/custom/Button';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import app from '@/lib/firebase';

interface RealtimeMatchingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMatchFound: (roomId: string, opponentName: string) => void;
    battleMode: 'sudden-death' | 'tactics' | 'ambush';
    playerName: string;
    playerLevel: number;
}

export default function RealtimeMatchingModal({
    isOpen,
    onClose,
    onMatchFound,
    battleMode,
    playerName,
    playerLevel
}: RealtimeMatchingModalProps) {
    useEscapeKey(isOpen, onClose);

    const [mode, setMode] = useState<'select' | 'random' | 'friend-create' | 'friend-join'>('select');
    const [waitTime, setWaitTime] = useState(0);
    const [roomCode, setRoomCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // [FIX] Store unsubscribe functions in refs for cleanup
    const matchListenerRef = useRef<(() => void) | null>(null);
    const waitingRoomListenerRef = useRef<(() => void) | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 대기 시간 카운터
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (searching) {
            timer = setInterval(() => {
                setWaitTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [searching]);

    // 랜덤 매칭 시작
    const startRandomMatching = async () => {
        setMode('random');
        setSearching(true);
        setWaitTime(0);
        setError(null);

        try {
            const { joinMatchmaking, listenForMatch, leaveMatchmaking, findMatch } = await import('@/lib/realtime-pvp-service');
            const { getGameState } = await import('@/lib/game-state');

            const state = getGameState();
            const result = await joinMatchmaking(battleMode, playerName, playerLevel, 0);

            if (!result.success) {
                setError(result.message);
                setSearching(false);
                return;
            }

            // [FIX] 매칭 리스너 설정 및 ref에 저장
            const unsubscribe = listenForMatch(battleMode, state.userId, (matchResult) => {
                if (matchResult.success && matchResult.roomId) {
                    // 리스너 정리
                    if (matchListenerRef.current) {
                        matchListenerRef.current();
                        matchListenerRef.current = null;
                    }
                    // 타임아웃 정리
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                    setSearching(false);
                    onMatchFound(matchResult.roomId, matchResult.opponentName || '상대방');
                }
            });
            matchListenerRef.current = unsubscribe;

            // [NEW] 매칭 폴링: 3초마다 findMatch 호출하여 상대 검색
            const pollInterval = setInterval(async () => {
                try {
                    const matchFound = await findMatch(battleMode, state.userId, playerLevel);
                    if (matchFound.success && matchFound.roomId) {
                        clearInterval(pollInterval);
                        // 리스너 정리
                        if (matchListenerRef.current) {
                            matchListenerRef.current();
                            matchListenerRef.current = null;
                        }
                        // 타임아웃 정리
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                            timeoutRef.current = null;
                        }
                        setSearching(false);
                        onMatchFound(matchFound.roomId, matchFound.opponentName || '상대방');
                    }
                } catch (pollErr) {
                    console.warn('Polling error:', pollErr);
                }
            }, 3000);

            // [FIX] 60초 후 타임아웃 (ref에 저장)
            timeoutRef.current = setTimeout(async () => {
                clearInterval(pollInterval);
                // 리스너 정리
                if (matchListenerRef.current) {
                    matchListenerRef.current();
                    matchListenerRef.current = null;
                }
                await leaveMatchmaking(battleMode, state.userId);
                setSearching(false);
                setError('매칭 시간 초과. 다시 시도해주세요.');
            }, 60000);

        } catch (err) {
            console.error('Matching error:', err);
            setError('매칭 중 오류가 발생했습니다.');
            setSearching(false);
        }
    };

    // 방 코드 생성 (친구 초대)
    const createRoom = async () => {
        setMode('friend-create');
        setError(null);
        setSearching(true);

        try {
            const { getGameState } = await import('@/lib/game-state');
            const { getDatabase, ref, set, push, onValue, off } = await import('firebase/database');

            const state = getGameState();
            const db = getDatabase(app || undefined);

            // 6자리 랜덤 코드 생성
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomCode(code);

            // Firebase에 대기실 생성
            const waitingRoomRef = ref(db, `waitingRooms/${code}`);
            await set(waitingRoomRef, {
                hostId: state.userId,
                hostName: playerName,
                hostLevel: playerLevel,
                battleMode: battleMode,
                createdAt: Date.now(),
                status: 'waiting'
            });

            // [FIX] 상대방 입장 리스너 (ref에 저장)
            const unsubscribe = onValue(waitingRoomRef, async (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (data.status === 'matched' && data.roomId) {
                        // 리스너 정리
                        if (waitingRoomListenerRef.current) {
                            waitingRoomListenerRef.current();
                            waitingRoomListenerRef.current = null;
                        }
                        // 타임아웃 정리
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                            timeoutRef.current = null;
                        }
                        setSearching(false);
                        onMatchFound(data.roomId, data.guestName || '친구');
                    }
                }
            });
            waitingRoomListenerRef.current = unsubscribe;

            // [FIX] 5분 후 만료 (ref에 저장)
            timeoutRef.current = setTimeout(async () => {
                // 리스너 정리
                if (waitingRoomListenerRef.current) {
                    waitingRoomListenerRef.current();
                    waitingRoomListenerRef.current = null;
                }
                const { remove } = await import('firebase/database');
                await remove(waitingRoomRef);
                setSearching(false);
                setError('대기 시간 초과. 다시 시도해주세요.');
            }, 5 * 60 * 1000);

        } catch (err) {
            console.error('Room creation error:', err);
            setError('방 생성 중 오류가 발생했습니다.');
            setSearching(false);
        }
    };

    // 방 코드로 참가
    const joinRoom = async () => {
        if (inputCode.length !== 6) {
            setError('6자리 코드를 입력해주세요.');
            return;
        }

        setSearching(true);
        setError(null);

        try {
            const { getGameState } = await import('@/lib/game-state');
            const { getDatabase, ref, get, update, remove } = await import('firebase/database');
            const { updateBattleRoom } = await import('@/lib/realtime-pvp-service');

            const state = getGameState();
            const db = getDatabase(app || undefined);

            // 대기실 찾기
            const waitingRoomRef = ref(db, `waitingRooms/${inputCode}`);
            const snapshot = await get(waitingRoomRef);

            if (!snapshot.exists()) {
                setError('존재하지 않는 방 코드입니다.');
                setSearching(false);
                return;
            }

            const waitingRoom = snapshot.val();

            // 전투방 생성
            const { push } = await import('firebase/database');
            const battlesRef = ref(db, 'battles');
            const newRoomRef = push(battlesRef);
            const roomId = newRoomRef.key!;

            // 전투방 데이터 설정
            const { set } = await import('firebase/database');
            await set(newRoomRef, {
                roomId,
                battleMode: waitingRoom.battleMode,
                phase: 'deck-select',
                player1: {
                    playerId: waitingRoom.hostId,
                    playerName: waitingRoom.hostName,
                    playerLevel: waitingRoom.hostLevel,
                    selectedCards: [],
                    cardOrder: [],
                    ready: false,
                    wins: 0,
                    roundResults: [],
                    connected: true,
                    lastHeartbeat: Date.now()
                },
                player2: {
                    playerId: state.userId,
                    playerName: playerName,
                    playerLevel: playerLevel,
                    selectedCards: [],
                    cardOrder: [],
                    ready: false,
                    wins: 0,
                    roundResults: [],
                    connected: true,
                    lastHeartbeat: Date.now()
                },
                currentRound: 0,
                maxRounds: 5,
                winsNeeded: 3,
                finished: false,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            // 대기실 상태 업데이트 (호스트에게 알림)
            await update(waitingRoomRef, {
                status: 'matched',
                roomId: roomId,
                guestId: state.userId,
                guestName: playerName
            });

            setSearching(false);
            onMatchFound(roomId, waitingRoom.hostName);

        } catch (err) {
            console.error('Join room error:', err);
            setError('방 참가 중 오류가 발생했습니다.');
            setSearching(false);
        }
    };

    // 코드 복사
    const copyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // [FIX] 취소 - 모든 리스너와 타임아웃 정리
    const handleCancel = async () => {
        // 매칭 리스너 정리
        if (matchListenerRef.current) {
            matchListenerRef.current();
            matchListenerRef.current = null;
        }

        // 대기실 리스너 정리
        if (waitingRoomListenerRef.current) {
            waitingRoomListenerRef.current();
            waitingRoomListenerRef.current = null;
        }

        // 타임아웃 정리
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Firebase에서 매칭 큐 제거
        if (searching) {
            try {
                const { leaveMatchmaking } = await import('@/lib/realtime-pvp-service');
                const { getGameState } = await import('@/lib/game-state');
                const state = getGameState();
                await leaveMatchmaking(battleMode, state.userId);
            } catch (err) {
                console.error('Failed to leave matchmaking:', err);
            }
        }

        // 상태 초기화
        setSearching(false);
        setMode('select');
        setError(null);
        setWaitTime(0);
        onClose();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const modeNames = {
        'sudden-death': '단판 승부',
        'tactics': '전술 승부',
        'ambush': '전략 승부'
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleCancel}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl w-full max-w-md overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="bg-gradient-to-r from-red-600/30 to-orange-600/30 p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white">실시간 대전</h2>
                                <p className="text-sm text-white/60">{modeNames[battleMode]}</p>
                            </div>
                            <button onClick={handleCancel} className="p-2 hover:bg-white/10 rounded-lg transition">
                                <X className="text-white/60" size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* 모드 선택 화면 */}
                        {mode === 'select' && (
                            <div className="space-y-4">
                                <button
                                    onClick={startRandomMatching}
                                    className="w-full p-6 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/30 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                                            <RefreshCw className="text-cyan-400" size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">랜덤 매칭</h3>
                                            <p className="text-sm text-white/60">비슷한 레벨의 상대와 자동 매칭</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={createRoom}
                                    className="w-full p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                            <Users className="text-purple-400" size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">친구와 대전</h3>
                                            <p className="text-sm text-white/60">코드를 공유하여 친구 초대</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setMode('friend-join')}
                                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-center"
                                >
                                    <p className="text-white/80">초대 코드로 참가</p>
                                </button>

                                {/* [NEW] 참가비 공지 */}
                                <div className="mt-6 flex flex-col items-center gap-2 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                                    <div className="flex items-center gap-2 text-yellow-400">
                                        <Award size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">대전 입장 정보</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5 w-full text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                            <span className="text-white/70">참가비: </span>
                                            <span className="font-bold text-yellow-500 text-sm">50 코인 + 50 토큰</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            <span className="text-white/70">요구사항: </span>
                                            <span className="font-bold text-blue-400">최소 6장 보유 (여분 1장 포함)</span>
                                        </div>
                                        <div className="ml-3.5 text-[10px] text-white/40 leading-tight">
                                            * 대전 참여를 위해 기본 덱(5장) 외에 소모용 여분 카드(일반/희귀)가 1장 이상 필요합니다.
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-medium text-yellow-500/60 mt-2">매칭 시작 시 참가비가 즉시 차감됩니다.</p>
                                </div>
                            </div>
                        )}

                        {/* 랜덤 매칭 대기 화면 */}
                        {mode === 'random' && (
                            <div className="text-center py-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    className="w-20 h-20 mx-auto mb-6"
                                >
                                    <Loader2 className="w-full h-full text-cyan-400" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-white mb-2">상대를 찾는 중...</h3>
                                <p className="text-3xl font-black text-cyan-400 orbitron mb-4">{formatTime(waitTime)}</p>
                                <p className="text-sm text-white/60 mb-6">비슷한 레벨의 상대를 찾고 있습니다</p>

                                {error && (
                                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                <Button onClick={handleCancel} color="secondary" className="w-full">
                                    취소
                                </Button>
                            </div>
                        )}

                        {/* 친구 초대 - 방 생성 */}
                        {mode === 'friend-create' && (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 mx-auto mb-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                                    <Users className="text-purple-400" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">친구에게 코드를 공유하세요</h3>

                                <div className="bg-black/50 border border-white/20 rounded-xl p-4 mb-4">
                                    <p className="text-4xl font-black text-purple-400 orbitron tracking-widest">{roomCode}</p>
                                </div>

                                <button
                                    onClick={copyCode}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-lg mx-auto mb-6 transition",
                                        copied ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white hover:bg-white/20"
                                    )}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? '복사됨!' : '코드 복사'}
                                </button>

                                <p className="text-sm text-white/60 mb-6">상대가 입장하면 자동으로 시작됩니다</p>

                                <Button onClick={handleCancel} color="secondary" className="w-full">
                                    취소
                                </Button>
                            </div>
                        )}

                        {/* 친구 초대 - 코드 입력 */}
                        {mode === 'friend-join' && (
                            <div className="py-4">
                                <h3 className="text-xl font-bold text-white mb-4 text-center">초대 코드 입력</h3>

                                <input
                                    type="text"
                                    value={inputCode}
                                    onChange={e => setInputCode(e.target.value.toUpperCase())}
                                    maxLength={6}
                                    placeholder="6자리 코드"
                                    className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-center text-3xl font-black text-white orbitron tracking-widest uppercase mb-4"
                                />

                                {error && (
                                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                                        <p className="text-red-400 text-sm text-center">{error}</p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button onClick={() => setMode('select')} color="secondary" className="flex-1">
                                        뒤로
                                    </Button>
                                    <Button
                                        onClick={joinRoom}
                                        color="primary"
                                        className="flex-1"
                                        disabled={inputCode.length !== 6 || searching}
                                    >
                                        {searching ? <Loader2 className="animate-spin" size={18} /> : '참가'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
