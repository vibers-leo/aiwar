'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Trophy, XCircle, Zap, Wifi, WifiOff, Clock, Link, Share2, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/custom/Button';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import {
    listenToClashRoom,
    getClashPlayer,
    submitBet,
    submitSelection,
    processClashResult,
    deleteClashRoom,
    sendHeartbeat,
    checkConnection,
    updatePlayerStatus,
    sendChatMessage,
    listenToChatMessages
} from '@/lib/card-clash-service';
import { ClashRoom, ClashCard, ClashPlayer, ChatMessage, QUICK_CHAT_EMOJIS } from '@/lib/card-clash-types';
import { playClick, playBet, playClash, playWin, playLose, playChat, toggleMute, getMuteState, initAudio } from '@/lib/sound-effects';


const MODE_REQ = {
    'sudden-death': 1,
    'double': 2,
    'tactics': 3,
    'strategy': 5
};

const TYPE_EMOJI = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️'
};

const RARITY_COLOR = {
    common: 'text-gray-400 border-gray-500',
    rare: 'text-blue-400 border-blue-500',
    epic: 'text-purple-400 border-purple-500',
    legendary: 'text-yellow-400 border-yellow-500'
};

export default function ClashBattle() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const { user, profile } = useUser();

    const [room, setRoom] = useState<ClashRoom | null>(null);
    const [player, setPlayer] = useState<ClashPlayer | null>(null);
    const [betCards, setBetCards] = useState<ClashCard[]>([]);
    const [selectedCards, setSelectedCards] = useState<ClashCard[]>([]);
    const [battleResults, setBattleResults] = useState<('win' | 'lose' | 'draw')[]>([]);
    const [finalWinner, setFinalWinner] = useState<string | null>(null);
    const [opponentConnected, setOpponentConnected] = useState(true);
    const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

    // 채팅 관련
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [showChat, setShowChat] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const isHost = room?.hostId === user?.uid;
    const isGuest = room?.guestId === user?.uid;
    const reqCards = room ? MODE_REQ[room.mode] : 1;
    const maxBet = player ? Math.max(1, Math.floor(player.cards.length * 0.1)) : 1;

    // 재대결 관련
    const rematchRequested = room?.rematchRequestedBy !== undefined && room?.rematchRequestedBy !== null;
    const iRequestedRematch = room?.rematchRequestedBy === user?.uid;
    const opponentRequestedRematch = rematchRequested && !iRequestedRematch;


    // 방 구독
    useEffect(() => {
        if (roomId) {
            const unsubscribe = listenToClashRoom(roomId, setRoom);
            return () => unsubscribe();
        }
    }, [roomId]);

    // 플레이어 정보 로드
    useEffect(() => {
        if (user) {
            getClashPlayer(user.uid).then(setPlayer);
        }
    }, [user]);

    // 채팅 메시지 구독
    useEffect(() => {
        if (roomId) {
            const unsubscribe = listenToChatMessages(roomId, setChatMessages);
            return () => unsubscribe();
        }
    }, [roomId]);

    // 채팅 자동 스크롤
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    // 사운드 초기화 및 상태 관리
    const [isSoundMuted, setIsSoundMuted] = useState(false);
    const [connectionError, setConnectionError] = useState(false);

    // 연결 타임아웃 감지
    useEffect(() => {
        if (room) return;
        const timer = setTimeout(() => {
            setConnectionError(true);
        }, 15000);
        return () => clearTimeout(timer);
    }, [room]);

    useEffect(() => {
        setIsSoundMuted(getMuteState());

        // 사용자 인터랙션 시작 시 오디오 초기화
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
        if (!room) return;

        if (room.status === 'revealing' && !finalWinner) {
            playClash();
        }

        if (room.status === 'finished' && room.winner) {
            if (room.winner === user?.uid) {
                setTimeout(playWin, 500);
            } else if (!room.disconnectDefeat) {
                setTimeout(playLose, 500);
            }
        }
    }, [room?.status, room?.winner]);

    // 채팅 효과음
    useEffect(() => {
        if (chatMessages.length > 0) {
            const lastMsg = chatMessages[chatMessages.length - 1];
            if (lastMsg.senderId !== user?.uid && Date.now() - lastMsg.timestamp < 2000) {
                playChat();
            }
        }
    }, [chatMessages]);



    // 하트비트 전송 (5초마다)
    useEffect(() => {
        if (!roomId || !user || room?.status === 'finished') return;

        // 즉시 한 번 전송
        sendHeartbeat(roomId, isHost);

        // 5초마다 전송
        heartbeatInterval.current = setInterval(() => {
            sendHeartbeat(roomId, isHost);
        }, 5000);

        return () => {
            if (heartbeatInterval.current) {
                clearInterval(heartbeatInterval.current);
            }
        };
    }, [roomId, user, isHost, room?.status]);

    // 상대방 연결 상태 체크 및 자동 패배 처리
    useEffect(() => {
        if (!room || !user || room.status === 'finished') return;

        const opponentHeartbeat = isHost ? room.guestLastHeartbeat : room.hostLastHeartbeat;
        const connected = checkConnection(opponentHeartbeat);
        setOpponentConnected(connected);

        // 연결 끊김 감지 후 20초 대기 후 자동 패배 처리
        if (!connected && opponentHeartbeat && room.status !== 'waiting') {
            const disconnectDuration = Date.now() - opponentHeartbeat;

            // 20초 이상 연결 끊김 시 자동 패배 처리
            if (disconnectDuration > 20000) {
                handleDisconnectDefeat();
            }
        }
    }, [room, isHost, user]);

    // 연결 끊김 자동 패배 처리
    const handleDisconnectDefeat = async () => {
        if (!room || !user || room.status === 'finished') return;

        const opponentId = isHost ? room.guestId! : room.hostId;
        const myBet = isHost ? room.hostBet : room.guestBet;
        const opponentBet = isHost ? room.guestBet : room.hostBet;

        // 베팅이 있는 경우에만 처리
        if (myBet.length === 0 && opponentBet.length === 0) return;

        try {
            const { processDisconnectDefeat } = await import('@/lib/card-clash-service');
            await processDisconnectDefeat(
                roomId,
                opponentId, // 연결 끊긴 플레이어 (패배)
                user.uid,   // 연결된 플레이어 (승리)
                opponentBet, // 패배자가 잃을 카드
                myBet       // 승리자 베팅 (반환됨)
            );

            // 플레이어 정보 새로고침
            if (user) {
                getClashPlayer(user.uid).then(setPlayer);
            }
        } catch (error) {
            console.error('Failed to process disconnect defeat:', error);
        }
    };

    // 배틀 결과 계산
    useEffect(() => {
        if (room?.status === 'revealing' && !finalWinner) {
            calculateBattleResult();
        }
    }, [room?.status]);

    const calculateBattleResult = () => {
        if (!room) return;

        const hostCards = room.hostSelected;
        const guestCards = room.guestSelected;
        const results: ('win' | 'lose' | 'draw')[] = [];

        for (let i = 0; i < reqCards; i++) {
            const h = hostCards[i];
            const g = guestCards[i];

            if (!h || !g) {
                results.push('draw');
                continue;
            }

            // 상성 판정
            if (
                (h.type === 'rock' && g.type === 'scissors') ||
                (h.type === 'scissors' && g.type === 'paper') ||
                (h.type === 'paper' && g.type === 'rock')
            ) {
                results.push(isHost ? 'win' : 'lose');
            } else if (h.type === g.type) {
                // 동일 타입: 파워 비교
                if (h.power > g.power) {
                    results.push(isHost ? 'win' : 'lose');
                } else if (h.power < g.power) {
                    results.push(isHost ? 'lose' : 'win');
                } else {
                    results.push('draw');
                }
            } else {
                results.push(isHost ? 'lose' : 'win');
            }
        }

        setBattleResults(results);

        // 최종 승자 결정
        const wins = results.filter(r => r === 'win').length;
        const losses = results.filter(r => r === 'lose').length;

        let winner: string | null = null;
        if (room.mode === 'sudden-death') {
            winner = results[0] === 'win' ? (isHost ? room.hostId : room.guestId!) :
                results[0] === 'lose' ? (isHost ? room.guestId! : room.hostId) : null;
        } else if (room.mode === 'double') {
            if (wins >= 2) winner = isHost ? room.hostId : room.guestId!;
            else if (losses >= 2) winner = isHost ? room.guestId! : room.hostId;
        } else if (room.mode === 'tactics') {
            if (wins >= 2) winner = isHost ? room.hostId : room.guestId!;
            else if (losses >= 2) winner = isHost ? room.guestId! : room.hostId;
        } else if (room.mode === 'strategy') {
            if (wins >= 3) winner = isHost ? room.hostId : room.guestId!;
            else if (losses >= 3) winner = isHost ? room.guestId! : room.hostId;
        }

        setFinalWinner(winner);

        // 호스트만 DB 정산
        if (isHost && winner) {
            const loserId = winner === room.hostId ? room.guestId! : room.hostId;
            const winnerGains = winner === room.hostId ? room.guestBet : room.hostBet;
            const loserLosses = winner === room.hostId ? room.guestBet : room.hostBet;

            processClashResult(roomId, winner, loserId, winnerGains, loserLosses)
                .then(() => console.log('Result processed'))
                .catch(console.error);
        }
    };

    const handleBetSubmit = async () => {
        playClick();
        if (betCards.length === 0 || betCards.length > maxBet) return;
        await submitBet(roomId, isHost, betCards);
    };

    const handleSelectionSubmit = async () => {
        playClick();
        if (selectedCards.length !== reqCards) return;
        await submitSelection(roomId, isHost, selectedCards);
    };

    const handleBetCardToggle = (card: ClashCard) => {
        playBet();
        if (betCards.find(c => c.id === card.id)) {
            setBetCards(prev => prev.filter(c => c.id !== card.id));
        } else if (betCards.length < maxBet) {
            setBetCards(prev => [...prev, card]);
        }
    };

    const handleSelectionToggle = (card: ClashCard) => {
        playClick();
        if (selectedCards.find(c => c.id === card.id)) {
            setSelectedCards(prev => prev.filter(c => c.id !== card.id));
        } else if (selectedCards.length < reqCards) {
            setSelectedCards(prev => [...prev, card]);
        }
    };

    // 재대결 요청
    const handleRequestRematch = async () => {
        playClick();
        if (!user || !room) return;
        const { requestRematch } = await import('@/lib/card-clash-service');
        await requestRematch(roomId, user.uid);
    };

    // 재대결 수락
    const handleAcceptRematch = async () => {
        playClick();
        if (!user || !room || !profile) return;
        const { acceptRematch } = await import('@/lib/card-clash-service');

        try {
            const newRoomId = await acceptRematch(
                roomId,
                room.hostId,
                room.hostName,
                room.guestId!,
                room.guestName!,
                room.mode
            );
            router.push(`/clash/battle/${newRoomId}`);
        } catch (error) {
            console.error('Failed to accept rematch:', error);
        }
    };

    // 재대결 취소
    const handleCancelRematch = async () => {
        const { cancelRematch } = await import('@/lib/card-clash-service');
        await cancelRematch(roomId);
    };

    // 채팅 메시지 전송
    const handleSendMessage = async (message: string) => {
        playClick();
        if (!user || !profile || !message.trim()) return;

        await sendChatMessage(roomId, user.uid, profile.nickname || 'Player', message.trim());
        setChatInput('');
    };

    // 빠른 채팅 (이모티콘)
    const handleQuickChat = async (emoji: string) => {
        playClick();
        if (!user || !profile) return;
        await sendChatMessage(roomId, user.uid, profile.nickname || 'Player', emoji);
    };

    // 초대 링크 복사
    const handleCopyInviteLink = () => {
        playClick();
        const link = `${window.location.origin}/clash/battle/${roomId}`;
        navigator.clipboard.writeText(link);
        alert('초대 링크가 복사되었습니다! 친구에게 공유하세요.');
    };

    // 승리 공유하기
    const handleShareVictory = () => {
        playWin(); // 자랑하기 효과음
        const winAmount = (isHost ? room?.guestBet : room?.hostBet)?.length || 0;
        const text = `[Card Clash] 배틀 승리! 🏆\n상대의 카드 ${winAmount}장을 획득했습니다!\n나에게 도전하려면 지금 접속하세요!\n${window.location.origin}/clash`;
        navigator.clipboard.writeText(text);
        alert('승리 메시지가 복사되었습니다!');
    };


    if (connectionError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex flex-col items-center justify-center text-center p-6 text-white">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
                <p className="text-white/60 mb-8">
                    방 정보를 불러오는 데 실패했습니다.<br />
                    잠시 후 다시 시도하거나 새로운 방을 만들어주세요.
                </p>
                <Button onClick={() => router.push('/clash')} className="text-black bg-white hover:bg-gray-200 font-bold px-8">
                    로비로 돌아가기
                </Button>
            </div>
        );
    }


    if (!room || !player) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            </div>
        );
    }

    // 대기 화면
    if (room.status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-6" />
                    <h2 className="text-3xl font-black font-orbitron mb-2">WAITING FOR OPPONENT</h2>
                    <p className="text-white/60 mb-8">방 코드: {roomId}</p>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleCopyInviteLink}
                            className="bg-purple-600 hover:bg-purple-500 w-full font-bold"
                        >
                            <Link className="w-4 h-4 mr-2" />
                            초대 링크 복사
                        </Button>

                        <Button onClick={() => router.push('/clash')} variant="ghost" className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            로비로 돌아가기
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-8">
                    <Button onClick={() => router.push('/clash')} variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Exit
                    </Button>
                    <div className="text-center">
                        <h1 className="text-2xl font-black font-orbitron">{room.mode.toUpperCase()}</h1>
                        <p className="text-sm text-white/60">{room.hostName} vs {room.guestName}</p>
                        {/* 연결 상태 표시 */}
                        <div className="flex items-center justify-center gap-2 mt-2">
                            {opponentConnected ? (
                                <div className="flex items-center gap-1 text-green-400 text-xs">
                                    <Wifi className="w-3 h-3" />
                                    <span>Connected</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-red-400 text-xs animate-pulse">
                                    <WifiOff className="w-3 h-3" />
                                    <span>Opponent Disconnected</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* 사운드 토글 */}
                        <Button
                            onClick={handleToggleSound}
                            variant="ghost"
                            size="sm"
                            className="text-white/60 hover:text-white p-2"
                        >
                            {isSoundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </Button>

                        {/* 채팅 토글 버튼 */}
                        <Button
                            onClick={() => {
                                playClick();
                                setShowChat(!showChat);
                            }}
                            variant="ghost"
                            size="sm"
                            className="relative"
                        >
                            💬 Chat
                            {chatMessages.length > 0 && !showChat && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                    {chatMessages.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* 채팅 패널 */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className="fixed right-0 top-0 bottom-0 w-96 bg-black/95 border-l border-white/10 backdrop-blur-xl z-50 flex flex-col"
                        >
                            {/* 채팅 헤더 */}
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-bold text-lg">💬 Chat</h3>
                                <Button
                                    onClick={() => setShowChat(false)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/60 hover:text-white"
                                >
                                    ✕
                                </Button>
                            </div>

                            {/* 빠른 채팅 (이모티콘) */}
                            <div className="p-3 border-b border-white/10">
                                <p className="text-xs text-white/40 mb-2">Quick Chat</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {QUICK_CHAT_EMOJIS.map((item) => (
                                        <button
                                            key={item.emoji}
                                            onClick={() => handleQuickChat(item.emoji)}
                                            className="p-2 text-2xl hover:bg-white/10 rounded-lg transition-all hover:scale-110"
                                            title={item.label}
                                        >
                                            {item.emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 채팅 메시지 목록 */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {chatMessages.length === 0 ? (
                                    <div className="text-center text-white/40 text-sm mt-8">
                                        채팅을 시작해보세요!
                                    </div>
                                ) : (
                                    chatMessages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex flex-col",
                                                msg.senderId === user?.uid ? "items-end" : "items-start"
                                            )}
                                        >
                                            <span className="text-xs text-white/40 mb-1">
                                                {msg.senderName}
                                            </span>
                                            <div
                                                className={cn(
                                                    "px-4 py-2 rounded-2xl max-w-[80%] break-words",
                                                    msg.senderId === user?.uid
                                                        ? "bg-gradient-to-r from-purple-600 to-blue-600"
                                                        : "bg-white/10",
                                                    msg.filtered && "border-2 border-orange-500/50"
                                                )}
                                            >
                                                <p className="text-sm">{msg.message}</p>
                                                {msg.filtered && (
                                                    <p className="text-xs text-orange-300 mt-1">
                                                        ⚠️ 필터링됨
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* 채팅 입력창 */}
                            <div className="p-4 border-t border-white/10">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage(chatInput);
                                    }}
                                    className="flex gap-2"
                                >
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="메시지 입력..."
                                        maxLength={100}
                                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!chatInput.trim()}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 px-6"
                                    >
                                        전송
                                    </Button>
                                </form>
                                <p className="text-xs text-white/30 mt-2">
                                    {chatInput.length}/100
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 연결 끊김 경고 모달 */}
                <AnimatePresence>
                    {!opponentConnected && room.status !== 'finished' && (room.status === 'betting' || room.status === 'selecting' || room.status === 'revealing') && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        >
                            <div className="bg-gradient-to-br from-red-900/90 to-orange-900/90 border-2 border-red-500 rounded-2xl p-8 max-w-md text-center shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                                <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4 animate-pulse" />
                                <h2 className="text-3xl font-black font-orbitron text-red-300 mb-4">
                                    CONNECTION LOST
                                </h2>
                                <p className="text-white/80 mb-6 leading-relaxed">
                                    상대방의 연결이 끊겼습니다.<br />
                                    <span className="text-red-300 font-bold">20초 이내</span>에 재연결되지 않으면<br />
                                    상대방은 <span className="text-red-400 font-bold">자동 패배</span> 처리됩니다.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                                    <Clock className="w-4 h-4 animate-spin" />
                                    <span>대기 중...</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 베팅 페이즈 */}
                {room.status === 'betting' && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-black mb-2">PLACE YOUR BET</h2>
                            <p className="text-white/60">
                                최대 {maxBet}장까지 베팅 가능 (보유: {player.cards.length}장)
                            </p>
                            {/* 상대방 베팅 상태 표시 */}
                            {(isHost ? room.guestBet.length > 0 : room.hostBet.length > 0) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 text-sm text-blue-300"
                                >
                                    <Clock className="w-4 h-4 animate-spin" />
                                    <span>상대방이 베팅을 완료했습니다</span>
                                </motion.div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {player.cards.map((card) => {
                                const isBet = betCards.find(c => c.id === card.id);
                                return (
                                    <button
                                        key={card.id}
                                        onClick={() => handleBetCardToggle(card)}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all text-left",
                                            isBet ? "border-purple-500 bg-purple-500/20 scale-105" : "border-white/10 bg-black/40 hover:border-white/30"
                                        )}
                                    >
                                        <div className="text-3xl mb-2">{TYPE_EMOJI[card.type]}</div>
                                        <h3 className="font-bold text-sm mb-1 truncate">{card.name}</h3>
                                        <p className={cn("text-xs font-bold", RARITY_COLOR[card.rarity])}>
                                            {card.rarity.toUpperCase()}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="text-center">
                            <Button
                                onClick={handleBetSubmit}
                                disabled={betCards.length === 0 || (isHost ? room.hostBet.length > 0 : room.guestBet.length > 0)}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 px-12 py-6 text-xl font-bold"
                            >
                                {(isHost ? room.hostBet.length > 0 : room.guestBet.length > 0) ? 'WAITING...' : `BET ${betCards.length} CARDS`}
                            </Button>
                        </div>
                    </div>
                )}

                {/* 선택 페이즈 */}
                {room.status === 'selecting' && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-black mb-2">SELECT YOUR CARDS</h2>
                            <p className="text-white/60">{reqCards}장을 선택하세요</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {(isHost ? room.hostBet : room.guestBet).map((card) => {
                                const isSelected = selectedCards.find(c => c.id === card.id);
                                return (
                                    <button
                                        key={card.id}
                                        onClick={() => handleSelectionToggle(card)}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all text-left relative",
                                            isSelected ? "border-blue-500 bg-blue-500/20 scale-105" : "border-white/10 bg-black/40 hover:border-white/30"
                                        )}
                                    >
                                        <div className="text-3xl mb-2">{TYPE_EMOJI[card.type]}</div>
                                        <h3 className="font-bold text-sm mb-1 truncate">{card.name}</h3>
                                        <p className={cn("text-xs font-bold", RARITY_COLOR[card.rarity])}>
                                            {card.rarity.toUpperCase()}
                                        </p>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                                                {selectedCards.findIndex(c => c.id === card.id) + 1}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="text-center">
                            <Button
                                onClick={handleSelectionSubmit}
                                disabled={selectedCards.length !== reqCards || (isHost ? room.hostSelected.length > 0 : room.guestSelected.length > 0)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-12 py-6 text-xl font-bold"
                            >
                                {(isHost ? room.hostSelected.length > 0 : room.guestSelected.length > 0) ? 'WAITING...' : 'CONFIRM SELECTION'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* 결과 페이즈 */}
                {room.status === 'revealing' && battleResults.length > 0 && (
                    <div className="space-y-8">
                        <div className="text-center mb-12">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={cn(
                                    "inline-block p-8 rounded-full mb-6",
                                    finalWinner === user?.uid ? "bg-green-500/20" : "bg-red-500/20"
                                )}
                            >
                                {finalWinner === user?.uid ? (
                                    <Trophy className="w-20 h-20 text-green-400" />
                                ) : (
                                    <XCircle className="w-20 h-20 text-red-400" />
                                )}
                            </motion.div>
                            <h2 className={cn(
                                "text-5xl font-black font-orbitron mb-4",
                                finalWinner === user?.uid ? "text-green-400" : "text-red-400"
                            )}>
                                {finalWinner === user?.uid ? "VICTORY!" : "DEFEAT"}
                            </h2>
                            <p className="text-white/60 text-lg mb-2">
                                {finalWinner === user?.uid
                                    ? `${(isHost ? room.guestBet : room.hostBet).length}장의 카드를 획득했습니다!`
                                    : `${(isHost ? room.hostBet : room.guestBet).length}장의 카드를 잃었습니다...`
                                }
                            </p>
                            {/* 연결 끊김 패배 표시 */}
                            {room.disconnectDefeat && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 text-sm text-orange-300"
                                >
                                    <WifiOff className="w-4 h-4" />
                                    <span>연결 끊김으로 인한 {finalWinner === user?.uid ? '승리' : '패배'}</span>
                                </motion.div>
                            )}

                            {/* 승리 공유 버튼 */}
                            {finalWinner === user?.uid && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-6"
                                >
                                    <Button
                                        onClick={handleShareVictory}
                                        variant="ghost"
                                        className="border border-green-500/50 text-green-400 hover:bg-green-500/10 px-6"
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        승리 자랑하기
                                    </Button>
                                </motion.div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-center">{isHost ? 'YOUR CARDS' : 'OPPONENT'}</h3>
                                <div className="space-y-2">
                                    {room.hostSelected.map((card, i) => (
                                        <div key={card.id} className={cn(
                                            "p-4 rounded-lg border-2 flex items-center justify-between",
                                            battleResults[i] === (isHost ? 'win' : 'lose') ? "border-green-500 bg-green-500/10" :
                                                battleResults[i] === (isHost ? 'lose' : 'win') ? "border-red-500 bg-red-500/10" :
                                                    "border-gray-500 bg-gray-500/10"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{TYPE_EMOJI[card.type]}</span>
                                                <div>
                                                    <p className="font-bold">{card.name}</p>
                                                    <p className="text-xs text-white/60">{card.rarity}</p>
                                                </div>
                                            </div>
                                            <span className="text-2xl">
                                                {battleResults[i] === (isHost ? 'win' : 'lose') ? '👑' :
                                                    battleResults[i] === (isHost ? 'lose' : 'win') ? '☠️' : '🤝'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold mb-4 text-center">{isGuest ? 'YOUR CARDS' : 'OPPONENT'}</h3>
                                <div className="space-y-2">
                                    {room.guestSelected.map((card, i) => (
                                        <div key={card.id} className={cn(
                                            "p-4 rounded-lg border-2 flex items-center justify-between",
                                            battleResults[i] === (isGuest ? 'win' : 'lose') ? "border-green-500 bg-green-500/10" :
                                                battleResults[i] === (isGuest ? 'lose' : 'win') ? "border-red-500 bg-red-500/10" :
                                                    "border-gray-500 bg-gray-500/10"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{TYPE_EMOJI[card.type]}</span>
                                                <div>
                                                    <p className="font-bold">{card.name}</p>
                                                    <p className="text-xs text-white/60">{card.rarity}</p>
                                                </div>
                                            </div>
                                            <span className="text-2xl">
                                                {battleResults[i] === (isGuest ? 'win' : 'lose') ? '👑' :
                                                    battleResults[i] === (isGuest ? 'lose' : 'win') ? '☠️' : '🤝'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-8 space-y-4">
                            {/* 재대결 요청 알림 */}
                            <AnimatePresence>
                                {opponentRequestedRematch && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-xl p-6 mb-4"
                                    >
                                        <h3 className="text-xl font-bold text-blue-300 mb-3">
                                            🔄 재대결 요청
                                        </h3>
                                        <p className="text-white/70 mb-4">
                                            상대방이 재대결을 요청했습니다!
                                        </p>
                                        <div className="flex gap-3 justify-center">
                                            <Button
                                                onClick={handleAcceptRematch}
                                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-8 py-3 font-bold"
                                            >
                                                ✓ 수락
                                            </Button>
                                            <Button
                                                onClick={() => router.push('/clash')}
                                                variant="ghost"
                                                className="border border-white/20 hover:bg-white/10 px-8 py-3"
                                            >
                                                거절
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 재대결 요청 버튼 */}
                            {!rematchRequested && (
                                <Button
                                    onClick={handleRequestRematch}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-12 py-4 text-lg font-bold"
                                >
                                    🔄 재대결 요청
                                </Button>
                            )}

                            {/* 재대결 요청 대기 중 */}
                            {iRequestedRematch && !room.rematchAccepted && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
                                >
                                    <div className="flex items-center justify-center gap-3 text-blue-300">
                                        <Clock className="w-5 h-5 animate-spin" />
                                        <span className="font-bold">재대결 요청 대기 중...</span>
                                    </div>
                                    <Button
                                        onClick={handleCancelRematch}
                                        variant="ghost"
                                        size="sm"
                                        className="mt-3 text-white/60 hover:text-white"
                                    >
                                        요청 취소
                                    </Button>
                                </motion.div>
                            )}

                            {/* 로비로 돌아가기 */}
                            <Button
                                onClick={() => router.push('/clash')}
                                variant="ghost"
                                className="border border-white/20 hover:bg-white/10 px-12 py-4 text-lg"
                            >
                                BACK TO LOBBY
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
