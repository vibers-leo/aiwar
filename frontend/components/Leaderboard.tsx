import React, { useEffect, useState } from 'react';
import { fetchLeaderboard, UserProfile } from '@/lib/firebase-db';
import { Trophy, Medal, Crown } from 'lucide-react';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaders();
    }, []);

    const loadLeaders = async () => {
        setLoading(true);
        const data = await fetchLeaderboard(10);
        setLeaders(data);
        setLoading(false);
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
            case 2: return <Medal className="w-5 h-5 text-gray-400" />;
            case 3: return <Medal className="w-5 h-5 text-amber-600" />;
            default: return <span className="text-gray-500 font-bold w-5 text-center">{rank}</span>;
        }
    };

    const getRowStyle = (rank: number) => {
        if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30 text-yellow-100";
        if (rank === 2) return "bg-gray-400/10 border-gray-400/30 text-gray-100";
        if (rank === 3) return "bg-amber-600/10 border-amber-600/30 text-amber-100";
        return "bg-black/40 border-white/5 text-gray-300";
    };

    return (
        <div className="w-full max-w-sm bg-black/80 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-white text-lg">Top Commanders</h3>
            </div>

            {loading ? (
                <div className="space-y-2 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 bg-white/5 rounded-lg w-full" />
                    ))}
                </div>
            ) : leaders.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                    No ranked commanders yet.
                </div>
            ) : (
                <div className="space-y-2">
                    {leaders.map((user, index) => {
                        const rank = index + 1;
                        return (
                            <div
                                key={user.uid || index}
                                className={`flex items-center gap-3 p-2 rounded-lg border ${getRowStyle(rank)} transition-colors`}
                            >
                                <div className="flex-shrink-0 flex items-center justify-center w-8">
                                    {getRankIcon(rank)}
                                </div>

                                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-white/10">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs">?</div>
                                    )}
                                </div>

                                <div className="flex-grow min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {user.nickname || `Commander ${user.uid?.slice(0, 4)}`}
                                    </div>
                                    <div className="text-xs opacity-70 flex gap-2">
                                        <span>Lv.{user.level || 1}</span>
                                        <span>•</span>
                                        <span className={user.wins ? 'text-green-400' : ''}>
                                            Win Rate {user.wins ? Math.round((user.wins / ((user.wins || 0) + (user.losses || 0))) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-shrink-0 font-mono text-cyan-400 font-bold">
                                    {user.rating || 1000}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
