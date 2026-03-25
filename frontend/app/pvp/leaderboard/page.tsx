'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { getLeaderboardData } from '@/lib/firebase-db';
import { getPvPStats } from '@/lib/pvp-utils';
import { UserProfile } from '@/lib/firebase-db';
import { Loader2, Trophy, Crown } from 'lucide-react';

interface RankEntry {
    id: string;
    name: string;
    level: number;
    rating: number;
    isMe: boolean;
}

const TIER_LABELS = [
    { min: 2000, label: 'GRANDMASTER', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
    { min: 1600, label: 'MASTER',      color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    { min: 1400, label: 'DIAMOND',     color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30' },
    { min: 1200, label: 'PLATINUM',    color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
    { min: 1000, label: 'GOLD',        color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { min: 0,    label: 'SILVER',      color: 'text-gray-300',   bg: 'bg-white/5 border-white/10' },
];

function getTier(rating: number) {
    return TIER_LABELS.find(t => rating >= t.min) || TIER_LABELS[TIER_LABELS.length - 1];
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
    const router = useRouter();
    const { user, profile } = useUser();
    const [ranking, setRanking] = useState<RankEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [myRank, setMyRank] = useState<number>(0);

    useEffect(() => {
        loadLeaderboard();
    }, [user, profile]);

    const loadLeaderboard = async () => {
        setIsLoading(true);
        try {
            // Firebase에서 실제 플레이어 데이터 로드
            const firebasePlayers = await getLeaderboardData(50);
            const myStats = getPvPStats();

            const entries: RankEntry[] = firebasePlayers
                .filter(p => p.uid && p.nickname)
                .map(p => ({
                    id: p.uid!,
                    name: p.nickname!,
                    level: p.level || 1,
                    rating: p.rating || 1000,
                    isMe: p.uid === user?.uid,
                }));

            // 현재 유저가 없으면 로컬 스탯으로 추가
            if (!entries.some(e => e.isMe) && user) {
                entries.push({
                    id: user.uid,
                    name: profile?.nickname || '나',
                    level: profile?.level || 1,
                    rating: myStats.currentRating,
                    isMe: true,
                });
            }

            // Rating 내림차순 정렬
            entries.sort((a, b) => b.rating - a.rating);

            setRanking(entries);
            const rank = entries.findIndex(e => e.isMe) + 1;
            setMyRank(rank);
        } catch (e) {
            console.error('[Leaderboard] Failed to load:', e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-white/60 hover:text-white text-xl"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-2">
                            <Trophy className="text-yellow-400" size={28} />
                            랭킹 리더보드
                        </h1>
                        <p className="text-white/40 text-sm mt-0.5">실시간 PVP 레이팅 기준</p>
                    </div>
                    <button
                        onClick={loadLeaderboard}
                        className="ml-auto p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-white/40 hover:text-white"
                        title="새로고침"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : '↻'}
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-cyan-400" size={40} />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* 상위 10위 */}
                        {ranking.slice(0, 10).map((player, idx) => {
                            const rank = idx + 1;
                            const tier = getTier(player.rating);
                            return (
                                <div
                                    key={player.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                        player.isMe
                                            ? 'border-cyan-500/60 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                                            : `${tier.bg} border`
                                    }`}
                                >
                                    {/* 순위 */}
                                    <div className="w-10 text-center">
                                        {rank <= 3 ? (
                                            <span className="text-2xl">{RANK_MEDALS[rank - 1]}</span>
                                        ) : (
                                            <span className="text-lg font-black text-white/40">{rank}</span>
                                        )}
                                    </div>

                                    {/* 플레이어 정보 */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${player.isMe ? 'text-cyan-300' : 'text-white'}`}>
                                                {player.name}
                                                {player.isMe && <span className="ml-1 text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-mono">나</span>}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-white/40 text-xs">Lv.{player.level}</span>
                                            <span className={`text-xs font-bold ${tier.color}`}>{tier.label}</span>
                                        </div>
                                    </div>

                                    {/* 레이팅 */}
                                    <div className="text-right">
                                        <div className={`text-xl font-black ${rank === 1 ? 'text-yellow-300' : 'text-white'}`}>
                                            {player.rating.toLocaleString()}
                                        </div>
                                        <div className="text-white/30 text-xs">MMR</div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* 유저가 10위 밖 */}
                        {myRank > 10 && (
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <p className="text-white/30 text-xs text-center mb-3">— 내 순위 —</p>
                                {(() => {
                                    const me = ranking.find(e => e.isMe);
                                    if (!me) return null;
                                    const tier = getTier(me.rating);
                                    return (
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-cyan-500/60 bg-cyan-500/10">
                                            <div className="w-10 text-center">
                                                <span className="text-lg font-black text-white/40">{myRank}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-cyan-300">{me.name} <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-mono">나</span></div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-white/40 text-xs">Lv.{me.level}</span>
                                                    <span className={`text-xs font-bold ${tier.color}`}>{tier.label}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-black text-white">{me.rating.toLocaleString()}</div>
                                                <div className="text-white/30 text-xs">MMR</div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {ranking.length === 0 && (
                            <div className="py-20 text-center text-white/30">
                                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>아직 랭킹 데이터가 없습니다</p>
                                <p className="text-xs mt-1">실시간 PVP를 플레이하면 랭킹에 등재됩니다</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
