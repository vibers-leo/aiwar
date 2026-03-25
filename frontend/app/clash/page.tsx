'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Trophy, Swords, Play, Info, Sparkles, ArrowRight, ShieldCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/custom/Button';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import {
    initializeClashPlayer,
    getClashPlayer,
    createClashRoom,
    joinClashRoom,
    listenToClashRooms
} from '@/lib/card-clash-service';
import { ClashPlayer, ClashRoom } from '@/lib/card-clash-types';

const MODES = [
    { id: 'sudden-death', name: '단판승부', desc: '1장으로 즉시 결판', icon: <Zap className="w-6 h-6" />, color: 'red' },
    { id: 'double', name: '2장승부', desc: '2선승제', icon: <Swords className="w-6 h-6" />, color: 'orange' },
    { id: 'tactics', name: '전술승부', desc: '3선승제', icon: <Trophy className="w-6 h-6" />, color: 'blue' },
    { id: 'strategy', name: '전략승부', desc: '5선승제', icon: <Sparkles className="w-6 h-6" />, color: 'purple' }
];

export default function CardClashLobby() {
    const router = useRouter();
    const { user, profile, loading: isAuthLoading, handleSignOut } = useUser();
    const [clashPlayer, setClashPlayer] = useState<ClashPlayer | null>(null);
    const [rooms, setRooms] = useState<ClashRoom[]>([]);
    const [selectedMode, setSelectedMode] = useState<ClashRoom['mode']>('sudden-death');
    const [isInitializing, setIsInitializing] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // 플레이어 초기화
    useEffect(() => {
        if (isAuthLoading) return;

        if (user && profile) {
            initPlayer();
        } else {
            setIsInitializing(false);
        }
    }, [user, profile, isAuthLoading]);

    // 방 목록 구독
    useEffect(() => {
        const unsubscribe = listenToClashRooms(setRooms);
        return () => unsubscribe();
    }, []);

    const initPlayer = async () => {
        if (!user || !profile) return;
        setIsInitializing(true);
        try {
            const player = await initializeClashPlayer(user.uid, profile.nickname || 'Player');
            setClashPlayer(player);
        } catch (error) {
            console.error('Failed to initialize player:', error);
        } finally {
            setIsInitializing(false);
        }
    };

    const handleCreateRoom = async () => {
        if (!user || !profile) return;
        setIsCreating(true);
        try {
            const roomId = await createClashRoom(user.uid, profile.nickname || 'Player', selectedMode);
            if (!roomId) throw new Error("Room ID is empty");
            router.push(`/clash/battle/${roomId}`);
        } catch (error: any) {
            console.error('Failed to create room:', error);
            alert(`방 생성 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinRoom = async (room: ClashRoom) => {
        if (!user || !profile) return;
        try {
            const success = await joinClashRoom(room.id, user.uid, profile.nickname || 'Player');
            if (success) {
                router.push(`/clash/battle/${room.id}`);
            } else {
                alert('방이 꽉 찼거나 사라졌습니다.');
            }
        } catch (error) {
            console.error('Failed to join room:', error);
        }
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/60 font-mono">Initializing Card Clash...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-3">
                        <Swords className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-4xl font-black font-orbitron bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                        CARD CLASH
                    </h1>
                    <p className="text-white/60 mb-8 font-medium">
                        Rock • Paper • Scissors • War
                    </p>

                    <div className="space-y-4">
                        <Button
                            onClick={() => router.push('/login?redirect=/clash')}
                            className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-gray-200 rounded-xl"
                        >
                            로그인하여 시작하기 <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>

                        <div className="pt-4 border-t border-white/10">
                            <p className="text-xs text-white/40 mb-3">아직 계정이 없으신가요?</p>
                            <Button
                                onClick={() => router.push('/signup?redirect=/clash')}
                                variant="ghost"
                                className="text-white/60 hover:text-white"
                            >
                                무료 회원가입
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/30">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Powered by AGI WAR Engine</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white">
            {/* 헤더 */}
            <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black font-orbitron tracking-wider bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            CARD CLASH
                        </h1>
                        <p className="text-xs text-white/40 font-mono mt-1">Rock • Paper • Scissors • War</p>
                    </div>
                    {clashPlayer && (
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-sm text-white/60">Cards</p>
                                <p className="text-2xl font-bold text-purple-400">{clashPlayer.cards.length}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-white/60">W/L</p>
                                <p className="text-lg font-bold">
                                    <span className="text-green-400">{clashPlayer.wins}</span>
                                    <span className="text-white/40 mx-1">/</span>
                                    <span className="text-red-400">{clashPlayer.losses}</span>
                                </p>
                            </div>
                            <Button
                                onClick={() => handleSignOut()}
                                variant="ghost"
                                size="sm"
                                className="text-white/40 hover:text-white hover:bg-white/10"
                            >
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* 안내 배너 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-8 mb-12"
                >
                    <div className="flex items-start gap-4">
                        <Info className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-xl font-bold mb-2 text-purple-300">How to Play</h3>
                            <ul className="space-y-2 text-white/70 text-sm">
                                <li>• 각 대전마다 <span className="text-white font-bold">보유 카드의 10% 이내</span>로 베팅 (최소 1장)</li>
                                <li>• 가위바위보 상성으로 승부를 가립니다</li>
                                <li>• 승자가 패자의 베팅 카드를 모두 가져갑니다</li>
                                <li>• 레이팅 없이 순수 카드 쟁탈전을 즐기세요!</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* 방 만들기 */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-8 mb-8">
                    <h2 className="text-2xl font-black font-orbitron mb-6 flex items-center gap-3">
                        <Play className="w-7 h-7 text-purple-400" />
                        CREATE BATTLE
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {MODES.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id as ClashRoom['mode'])}
                                className={cn(
                                    "p-6 rounded-xl border-2 transition-all text-left",
                                    selectedMode === mode.id
                                        ? `border-${mode.color}-500 bg-${mode.color}-500/10`
                                        : "border-white/10 bg-white/5 hover:border-white/20"
                                )}
                            >
                                <div className={`mb-3 ${selectedMode === mode.id ? `text-${mode.color}-400` : 'text-white/40'}`}>
                                    {mode.icon}
                                </div>
                                <h3 className="font-bold mb-1">{mode.name}</h3>
                                <p className="text-xs text-white/50">{mode.desc}</p>
                            </button>
                        ))}
                    </div>
                    <Button
                        onClick={handleCreateRoom}
                        disabled={isCreating || !clashPlayer}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 h-14 text-lg font-bold"
                    >
                        {isCreating ? 'CREATING...' : 'CREATE ROOM'}
                    </Button>
                </div>

                {/* 방 목록 */}
                <div>
                    <h2 className="text-2xl font-black font-orbitron mb-6 flex items-center gap-3">
                        <Users className="w-7 h-7 text-blue-400" />
                        ACTIVE BATTLES
                    </h2>
                    {rooms.length === 0 ? (
                        <div className="bg-black/20 border-2 border-dashed border-white/10 rounded-2xl p-20 text-center">
                            <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40">현재 열려있는 방이 없습니다</p>
                            <p className="text-white/20 text-sm mt-2">먼저 방을 만들어보세요!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rooms.map((room) => (
                                <motion.div
                                    key={room.id}
                                    layoutId={room.id}
                                    className="bg-black/40 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg">{room.hostName}'s Room</h3>
                                            <p className="text-xs text-purple-400 font-mono mt-1">
                                                {MODES.find(m => m.id === room.mode)?.name}
                                            </p>
                                        </div>
                                        <span className={cn(
                                            "text-xs px-2 py-1 rounded-full border font-bold",
                                            room.status === 'waiting' ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                                        )}>
                                            {room.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={() => handleJoinRoom(room)}
                                        disabled={room.status !== 'waiting'}
                                        size="sm"
                                        className={cn(
                                            "w-full",
                                            room.status === 'waiting' ? "bg-purple-600 hover:bg-purple-500" : "bg-zinc-800 cursor-not-allowed"
                                        )}
                                    >
                                        {room.status === 'waiting' ? 'JOIN BATTLE' : 'IN PROGRESS'}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
