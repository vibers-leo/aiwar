
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Swords, Brain, Layers, AlertTriangle, Users, Plus, Play, Info } from 'lucide-react';
import CyberPageLayout from '@/components/CyberPageLayout';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/custom/Button';
import {
    listenToMiniGameRooms,
    createMiniGameRoom,
    joinMiniGameRoom,
    MiniGameRoom
} from '@/lib/realtime-minigame-service';
import { MiniGameMode } from '@/lib/minigame-system';
import { playClick, initAudio } from '@/lib/sound-effects';

// 게임 모드 데이터 (AI WAR 공식 사양 v1.0)
const GAME_MODES = [
    {
        id: 'sudden-death',
        title: '단판승부 (Sudden Death)',
        desc: '5장의 카드를 배치하여, 첫 번째 승패가 결정되는 라운드에서 즉시 승부가 납니다.',
        icon: <Skull className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-500" />,
        risk: 'High',
        reward: '상대 카드 1장 획득',
        color: 'red',
        minCards: 5
    },
    {
        id: 'double',
        title: '두장승부 (Two-Card)',
        desc: '6장의 카드로 3라운드 대결. 라운드마다 2장 중 1장을 선택하여 2선승제를 겨룹니다.',
        icon: <Swords className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-orange-500" />,
        risk: 'Medium',
        reward: '상대 카드 2장 획득',
        color: 'orange',
        minCards: 6
    },
    {
        id: 'tactics',
        title: '전술승부 (Tactics)',
        desc: '5장의 카드로 펼치는 3선승제 정면 승부. 가장 표준적인 전투 방식입니다.',
        icon: <Brain className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-500" />,
        risk: 'Medium',
        reward: '상대 카드 3장 혹은 경험치 획득',
        color: 'blue',
        minCards: 5
    },
    {
        id: 'strategy',
        title: '전략승부 (Strategy)',
        desc: '6장의 카드(5+1히든)를 사용하는 승점제 총력전. 3라운드 히든카드 대결이 핵심입니다.',
        icon: <Layers className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-500" />,
        risk: 'High',
        reward: '상대 카드 다량 획득',
        color: 'purple',
        minCards: 6
    }
];

export default function MiniGameLobby() {
    const router = useRouter();
    const { user, profile } = useUser();
    const [view, setView] = useState<'ai' | 'pvp'>('ai');
    const [hoveredMode, setHoveredMode] = useState<string | null>(null);
    const [rooms, setRooms] = useState<MiniGameRoom[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedMode, setSelectedMode] = useState<MiniGameMode>('sudden-death');

    // 사운드 초기화
    useEffect(() => {
        const initAudioContext = () => {
            initAudio();
            document.removeEventListener('click', initAudioContext);
        };
        document.addEventListener('click', initAudioContext);
        return () => document.removeEventListener('click', initAudioContext);
    }, []);

    // 실시간 방 목록 구독
    useEffect(() => {
        if (view === 'pvp') {
            const unsubscribe = listenToMiniGameRooms((updatedRooms) => {
                setRooms(updatedRooms);
            });
            return () => unsubscribe();
        }
    }, [view]);

    // 방 만들기 핸들러
    const handleCreateRoom = async () => {
        if (!user || !profile) return;
        playClick();
        setIsCreating(true);
        try {
            const roomId = await createMiniGameRoom(user.uid, profile.nickname || 'Unknown', selectedMode);
            router.push(`/minigame/${selectedMode}?roomId=${roomId}`);
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('방 생성에 실패했습니다.');
        } finally {
            setIsCreating(false);
        }
    };

    // 방 참가 핸들러
    const handleJoinRoom = async (room: MiniGameRoom) => {
        if (!user || !profile) return;
        playClick();
        try {
            const success = await joinMiniGameRoom(room.id, user.uid, profile.nickname || 'Unknown');
            if (success) {
                router.push(`/minigame/${room.mode}?roomId=${room.id}`);
            } else {
                alert('방이 꽉 찼거나 사라졌습니다.');
            }
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('참가에 실패했습니다.');
        }
    };

    return (
        <CyberPageLayout
            title="지하 투기장"
            englishTitle="UNDERGROUND ARENA"
            description="카드를 걸고 싸우는 무법지대. 승자가 모든 것을 가집니다."
            color="red"
        >
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 뷰 선택 탭 */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setView('ai')}
                        className={cn(
                            "flex-1 py-2.5 px-3 sm:py-4 sm:px-6 rounded-xl border-2 transition-all flex items-center justify-center gap-2 sm:gap-3 font-orbitron font-bold text-sm sm:text-base",
                            view === 'ai' ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]" : "bg-black/40 border-white/10 text-white/40 hover:border-white/20"
                        )}
                    >
                        <Skull className="w-5 h-5" />
                        AI BATTLE
                    </button>
                    <button
                        onClick={() => setView('pvp')}
                        className={cn(
                            "flex-1 py-2.5 px-3 sm:py-4 sm:px-6 rounded-xl border-2 transition-all flex items-center justify-center gap-2 sm:gap-3 font-orbitron font-bold text-sm sm:text-base",
                            view === 'pvp' ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]" : "bg-black/40 border-white/10 text-white/40 hover:border-white/20"
                        )}
                    >
                        <Users className="w-5 h-5" />
                        REAL-TIME PVP
                    </button>
                </div>

                {/* 경고 메시지 */}
                <div className="mb-8 sm:mb-12 p-4 sm:p-6 bg-red-900/20 border border-red-500/50 rounded-xl flex items-start gap-3 sm:gap-4 animate-pulse">
                    <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-base sm:text-xl font-bold text-red-500 mb-1 font-orbitron">WARNING: HIGH RISK ZONE</h3>
                        <p className="text-red-200/80 text-sm">
                            이곳은 정규 전장이 아닙니다. 패배 시 <span className="text-white font-bold underline">당신의 소중한 카드를 영구적으로 잃을 수 있습니다.</span>
                            <br />
                            신중하게 결정하십시오. 승리한다면 상대의 카드를 뺏어올 수 있습니다.
                        </p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {view === 'ai' ? (
                        <motion.div
                            key="ai-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8"
                        >
                            {GAME_MODES.map((mode) => (
                                <button
                                    onClick={() => router.push(`/minigame/${mode.id}`)}
                                    key={mode.id}
                                    className="text-left w-full"
                                >
                                    <motion.div
                                        className={cn(
                                            "relative h-48 sm:h-56 md:h-64 rounded-2xl border-2 overflow-hidden cursor-pointer transition-all group",
                                            hoveredMode === mode.id ? `border-${mode.color}-500 bg-${mode.color}-900/20` : "border-white/10 bg-black/40"
                                        )}
                                        onMouseEnter={() => setHoveredMode(mode.id)}
                                        onMouseLeave={() => setHoveredMode(null)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="absolute inset-0 p-4 sm:p-6 md:p-8 flex flex-col justify-between z-10">
                                            <div className="flex justify-between items-start">
                                                <div className={`p-4 rounded-full bg-${mode.color}-500/10 border border-${mode.color}-500/30`}>
                                                    {mode.icon}
                                                </div>
                                                <div className="text-right">
                                                    <span className={cn(
                                                        "text-xs font-bold px-2 py-1 rounded border",
                                                        mode.risk === 'High' ? "text-red-500 border-red-500 bg-red-500/10" :
                                                            mode.risk === 'Medium' ? "text-yellow-500 border-yellow-500 bg-yellow-500/10" :
                                                                "text-green-500 border-green-500 bg-green-500/10"
                                                    )}>
                                                        RISK: {mode.risk}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <h2 className={cn(
                                                    "text-lg sm:text-xl md:text-2xl font-black mb-1 sm:mb-2 font-orbitron",
                                                    hoveredMode === mode.id ? `text-${mode.color}-400` : "text-white"
                                                )}>
                                                    {mode.title}
                                                </h2>
                                                <p className="text-white/60 text-sm mb-4 line-clamp-2">
                                                    {mode.desc}
                                                </p>

                                                <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                                                    <span>REWARD:</span>
                                                    <span className={`text-${mode.color}-300 font-bold`}>{mode.reward}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </button>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="pvp-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* 방 만들기 섹션 */}
                            <div className="bg-blue-900/10 border border-blue-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-blue-400 font-orbitron mb-2 flex items-center gap-2">
                                        <Plus className="w-6 h-6" />
                                        CREATE NEW ARENA
                                    </h3>
                                    <p className="text-white/60 text-sm">모드를 선택하고 대결 상대를 기다리세요.</p>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <select
                                        value={selectedMode}
                                        onChange={(e) => setSelectedMode(e.target.value as MiniGameMode)}
                                        className="bg-black/60 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                                    >
                                        {GAME_MODES.map(m => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                        ))}
                                    </select>
                                    <Button
                                        onClick={handleCreateRoom}
                                        disabled={isCreating}
                                        className="bg-blue-600 hover:bg-blue-500 px-8 py-3 h-auto"
                                    >
                                        {isCreating ? 'CREATING...' : 'CREATE ROOM'}
                                    </Button>
                                </div>
                            </div>

                            {/* 방 리스트 섹션 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {rooms.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-black/20 rounded-2xl border-2 border-dashed border-white/10">
                                        <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                        <p className="text-white/40">현재 열려있는 방이 없습니다.</p>
                                        <p className="text-white/20 text-sm mt-2">먼저 방을 만들어 상대를 기다려보세요!</p>
                                    </div>
                                ) : (
                                    rooms.map((room) => (
                                        <motion.div
                                            key={room.id}
                                            layoutId={room.id}
                                            className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                                    {GAME_MODES.find(m => m.id === room.mode)?.icon || <Play />}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase",
                                                    room.status === 'waiting' ? "text-green-400 border-green-500/30 bg-green-500/5" : "text-yellow-400 border-yellow-500/30 bg-yellow-500/5"
                                                )}>
                                                    {room.status}
                                                </span>
                                            </div>

                                            <h4 className="font-bold text-lg mb-1 truncate text-white/90">
                                                {room.hostName}'s Arena
                                            </h4>
                                            <p className="text-xs text-blue-400 font-mono mb-4">
                                                {GAME_MODES.find(m => m.id === room.mode)?.title}
                                            </p>

                                            <div className="flex items-center justify-between gap-4 mt-6">
                                                <div className="flex -space-x-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold">H</div>
                                                    {room.guestId ? (
                                                        <div className="w-8 h-8 rounded-full bg-orange-600 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold">G</div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-[10px] text-white/40 border-dashed">?</div>
                                                    )}
                                                </div>
                                                <Button
                                                    onClick={() => handleJoinRoom(room)}
                                                    disabled={room.status !== 'waiting'}
                                                    size="sm"
                                                    className={cn(
                                                        "h-9 px-6",
                                                        room.status === 'waiting' ? "bg-blue-600 hover:bg-blue-500" : "bg-zinc-800 cursor-not-allowed"
                                                    )}
                                                >
                                                    {room.status === 'waiting' ? 'JOIN BATTLE' : 'IN PROGRESS'}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </CyberPageLayout>
    );
}
