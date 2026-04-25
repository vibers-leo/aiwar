'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import CyberPageLayout from '@/components/CyberPageLayout';
import { fetchLeaderboard, saveUserProfile } from '@/lib/firebase-db';
import { RankingEntry } from '@/lib/ranking-types';
import { getCurrentSeason, getRankTier, getRatingToNextTier } from '@/lib/ranking-utils';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { useAlert } from '@/context/AlertContext';
import { sendFriendRequest } from '@/lib/friend-system';
import { Modal, ModalBody, ModalHeader, ModalFooter } from '@/components/ui/custom/Modal';
import { Button } from '@/components/ui/custom/Button';
import { UserPlus, MessageCircle, User } from 'lucide-react';
import { Avatar } from '@/components/ui/custom/Avatar';
import { ChatModal } from '@/components/ChatModal';

export default function RankingPage() {
    const router = useRouter();
    const { user, profile, loading } = useUser();
    const { showAlert, showConfirm } = useAlert();
    const [rankings, setRankings] = useState<RankingEntry[]>([]);
    const [myRank, setMyRank] = useState<RankingEntry | null>(null);
    const [currentSeason, setCurrentSeason] = useState<any>(null);
    const [filter, setFilter] = useState<'top10' | 'top50' | 'top100' | 'all'>('top50');
    const [sortConfig, setSortConfig] = useState<{ key: keyof RankingEntry; direction: 'asc' | 'desc' }>({ key: 'rating', direction: 'desc' });

    // User Action Modal State
    const [selectedUser, setSelectedUser] = useState<RankingEntry | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                // 1. Get Season Info
                const season = getCurrentSeason();
                setCurrentSeason(season);

                // 2. Get Leaderboard Data (top 50)
                const userProfiles = await fetchLeaderboard(50);

                // Map UserProfile to RankingEntry
                const mappedRankings: RankingEntry[] = (userProfiles as any[]).map((p, index) => ({
                    rank: index + 1,
                    playerId: p.uid || 'unknown',
                    playerName: p.nickname || p.displayName || `Commander #${p.uid?.slice(0, 4) || '????'}`,
                    avatarUrl: p.avatarUrl || '',
                    level: p.level || 1,
                    rating: p.rating || p.pvpStats?.currentRating || 1000,
                    highestRating: p.highestRating || p.pvpStats?.highestRating || 1000,
                    wins: p.wins || p.pvpStats?.wins || 0,
                    losses: p.losses || p.pvpStats?.losses || 0,
                    winRate: p.winRate || p.pvpStats?.winRate || 0
                }));

                setRankings(mappedRankings);

                if (user) {
                    const mine = mappedRankings.find(r => r.playerId === user.uid);
                    if (mine) {
                        setMyRank(mine);
                        // Persist rank to profile if it's new or changed
                        if (profile?.rank !== mine.rank) {
                            console.log(`Updating user rank: ${profile?.rank} -> ${mine.rank}`);
                            saveUserProfile({ rank: mine.rank }, user.uid).catch(e => console.error("Failed to save rank", e));
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load ranking data:", error);

                // Set defaults to break the loading state even on failure
                if (!currentSeason) {
                    setCurrentSeason(getCurrentSeason());
                }
            }
        }
        loadData();
    }, [user]);

    // Sorting Handler
    const handleSort = (key: keyof RankingEntry) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    // User Interaction Handlers
    const handleUserClick = (entry: RankingEntry) => {
        if (entry.playerId === 'unknown') return;
        // If it's me, go to profile directly or show limited options? Let's show specific modal or just go profile.
        if (user && entry.playerId === user.uid) {
            router.push(`/profile/${user.uid}`);
            return;
        }

        setSelectedUser(entry);
        setIsActionModalOpen(true);
    };

    const handleAddFriend = async () => {
        if (!user || !profile || !selectedUser) return;

        try {
            // Reconstruct minimal profile data for target
            const targetUser = {
                uid: selectedUser.playerId,
                nickname: selectedUser.playerName,
                avatarUrl: selectedUser.avatarUrl || '',
                level: selectedUser.level
            };

            const result = await sendFriendRequest(user.uid, profile, selectedUser.playerId, targetUser);
            if (result.success) {
                showAlert({ title: "Friend Request", message: "Friend request sent successfully!", type: 'success' });
            } else {
                showAlert({ title: "Request Failed", message: result.message || "Failed to send request.", type: 'error' });
            }
        } catch (error) {
            console.error(error);
            showAlert({ title: "Error", message: "An unexpected error occurred.", type: 'error' });
        } finally {
            setIsActionModalOpen(false);
        }
    };

    const handleSendMessage = () => {
        setIsActionModalOpen(false);
        setIsChatModalOpen(true);
    };

    const handleViewProfile = () => {
        if (selectedUser) {
            router.push(`/profile/${selectedUser.playerId}`);
            setIsActionModalOpen(false);
        }
    };

    // Derived State: Filtered & Sorted
    const processedRankings = [...rankings]
        .filter(r => {
            if (filter === 'top10') return r.rank <= 10;
            if (filter === 'top50') return r.rank <= 50;
            if (filter === 'top100') return r.rank <= 100;
            return true;
        })
        .sort((a, b) => {
            const { key, direction } = sortConfig;
            // Handle special cases
            let valA = a[key] ?? 0;
            let valB = b[key] ?? 0;

            // If sorting by Rank, lower is better (so 'desc' sort should technically be reversed for intuitive UI? 
            // Actually usually "Rank 1" is top. So Ascending = 1, 2, 3. Descending = 100, 99...
            // User requested "1순위부터" (From 1st rank). So Default should be 1, 2, 3.
            // My default is { key: 'rating', direction: 'desc' }, which gives Rank 1 first.

            if (typeof valA === 'string' && typeof valB === 'string') {
                return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            // Numeric sort
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

    if (!loading && !user) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center p-8 bg-black/40 border border-cyan-500/30 rounded-xl max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-2">로그인이 필요해요</h2>
                    <p className="text-gray-400 mb-6">이 기능을 사용하려면 먼저 로그인해 주세요.</p>
                    <button onClick={() => router.push('/')} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors">
                        로그인하기
                    </button>
                </div>
            </div>
        );
    }

    if (!currentSeason) {
        return (
            <CyberPageLayout title="글로벌 랭킹" englishTitle="GLOBAL LEADERBOARD" description="로딩 중..." color="pink">
                <div className="text-center py-20 text-white/30 font-mono">LOADING_DATA...</div>
            </CyberPageLayout>
        );
    }

    // Use server rank data if available, otherwise fall back to profile data
    const displayRating = myRank?.rating || profile?.rating || 1000;
    const displayTier = getRankTier(displayRating);
    const displayRank = myRank ? `#${myRank.rank}` : (profile?.rank ? `#${profile.rank}` : 'Unranked');

    // Calculate Win Rate safely
    const profileWins = profile?.wins || 0;
    const profileLosses = profile?.losses || 0;
    const profileTotal = profileWins + profileLosses;
    const profileWinRate = profileTotal > 0 ? Math.round((profileWins / profileTotal) * 100) : 0;

    const displayWinRate = myRank ? `${myRank.winRate}%` : `${profileWinRate}%`;

    const tableHeaders = [
        { label: 'RANK', key: 'rank' as keyof RankingEntry, className: '' },
        { label: 'PLAYER', key: 'playerName' as keyof RankingEntry, className: '' },
        { label: 'LEVEL', key: 'level' as keyof RankingEntry, className: 'hidden sm:table-cell' },
        { label: 'TIER', key: 'rating' as keyof RankingEntry, className: 'hidden xs:table-cell' }, // Sort tier by rating
        { label: 'RATING', key: 'rating' as keyof RankingEntry, className: '' },
        { label: 'RECORD', key: 'wins' as keyof RankingEntry, className: 'hidden sm:table-cell' },
        { label: 'WIN_RATE', key: 'winRate' as keyof RankingEntry, className: 'hidden sm:table-cell' }
    ];

    return (
        <CyberPageLayout
            title="글로벌 랭킹"
            englishTitle="GLOBAL LEADERBOARD"
            description="시즌 랭킹을 확인하고 상위 랭커들과 경쟁하세요."
            color="pink"
            showLeftSidebar={true}
            leftSidebarIcon={<Trophy size={32} className="text-pink-400" />}
            leftSidebarGameConditions={
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-pink-500 text-lg">🏆</span>
                        <h3 className="text-pink-400 font-bold orbitron tracking-wider text-sm">RANKING GUIDE</h3>
                    </div>
                    <div className="space-y-3">
                        {[
                            "모든 지휘관은 <span class='text-white font-bold'>1000점</span>에서 시작합니다.",
                            "<span class='text-cyan-400 font-bold'>PVP 대전</span> 승리 시 레이팅이 상승하며, 패배 시 하락합니다.",
                            "<span class='text-green-400 font-bold'>AI 트레이닝</span>을 통해서도 실력을 쌓고 레이팅을 올릴 수 있습니다.",
                            "시즌 종료 시 순위에 따라 <span class='text-amber-400 font-bold'>한정판 스킨</span>과 <span class='text-amber-400 font-bold'>명예 칭호</span>가 주어집니다.",
                            "상위 100명의 지휘관은 명예의 전당에 <span class='text-purple-400 font-bold'>실시간</span>으로 기록됩니다."
                        ].map((text, i) => (
                            <div key={i} className="flex items-start gap-3 text-xs text-gray-400 leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mt-1.5 shrink-0" />
                                <p dangerouslySetInnerHTML={{ __html: text }} />
                            </div>
                        ))}
                    </div>
                </div>
            }
        >
            {/* Season Info */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl p-4 sm:p-6 mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold orbitron text-white">{currentSeason.name}</h2>
                        <p className="text-sm text-white/40 font-mono">{new Date(currentSeason.startDate).toLocaleDateString()} ~ {new Date(currentSeason.endDate).toLocaleDateString()}</p>
                    </div>
                    <span className={cn("px-3 py-1 rounded text-[10px] font-mono uppercase", currentSeason.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40")}>
                        {currentSeason.status === 'active' ? 'ACTIVE' : currentSeason.status === 'upcoming' ? 'UPCOMING' : 'ENDED'}
                    </span>
                </div>
            </motion.div>

            {/* My Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'MY_RANK', value: displayRank, color: 'text-amber-400' },
                    { label: 'TIER', value: `${displayTier.icon} ${displayTier.tier}`, color: displayTier.color },
                    { label: 'RATING', value: displayRating, color: 'text-cyan-400' },
                    { label: 'WIN_RATE', value: displayWinRate, color: 'text-green-400' }
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                        <p className={cn("text-2xl font-black orbitron", stat.color)}>{stat.value}</p>
                        <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 relative z-20 overflow-x-auto pb-2 scrollbar-hide">
                {(['top10', 'top50', 'top100', 'all'] as const).map(f => (
                    <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-4 py-2 rounded text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap",
                            filter === f ? "bg-pink-500/20 border border-pink-500/50 text-pink-400" : "bg-white/5 border border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                        )}
                    >
                        {f === 'top10' ? 'TOP_10' : f === 'top50' ? 'TOP_50' : f === 'top100' ? 'TOP_100' : 'ALL'}
                    </button>
                ))}
            </div>

            {/* Top 3 Podium */}
            {rankings.length >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="flex items-end justify-center gap-3 sm:gap-6">
                        {/* 2등 */}
                        {(() => {
                            const entry = rankings[1];
                            const tier = getRankTier(entry.rating);
                            return (
                                <div
                                    onClick={() => handleUserClick(entry)}
                                    className="flex flex-col items-center cursor-pointer group"
                                >
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-gray-400/30 to-gray-600/20 border-2 border-gray-400/40 flex items-center justify-center text-2xl sm:text-3xl mb-2 group-hover:border-gray-300/60 transition-all">
                                        🥈
                                    </div>
                                    <p className="text-white font-bold text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[100px] text-center">{entry.playerName}</p>
                                    <p className={cn("text-xs font-bold", tier.color)}>{tier.icon} {entry.rating}</p>
                                    <p className="text-[10px] text-white/30 font-mono">{entry.wins}승 {entry.losses}패</p>
                                    <div className="w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-t from-gray-500/20 to-transparent rounded-t-lg mt-2 flex items-end justify-center pb-2">
                                        <span className="text-gray-400 font-black orbitron text-lg">2</span>
                                    </div>
                                </div>
                            );
                        })()}
                        {/* 1등 */}
                        {(() => {
                            const entry = rankings[0];
                            const tier = getRankTier(entry.rating);
                            return (
                                <div
                                    onClick={() => handleUserClick(entry)}
                                    className="flex flex-col items-center cursor-pointer group -mt-4"
                                >
                                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-amber-400/40 to-amber-600/20 border-2 border-amber-400/50 flex items-center justify-center text-3xl sm:text-4xl mb-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all">
                                        🥇
                                    </div>
                                    <p className="text-amber-400 font-bold text-sm sm:text-base truncate max-w-[80px] sm:max-w-[120px] text-center">{entry.playerName}</p>
                                    <p className={cn("text-xs font-bold", tier.color)}>{tier.icon} {entry.rating}</p>
                                    <p className="text-[10px] text-white/30 font-mono">{entry.wins}승 {entry.losses}패</p>
                                    <div className="w-20 sm:w-24 h-28 sm:h-32 bg-gradient-to-t from-amber-500/20 to-transparent rounded-t-lg mt-2 flex items-end justify-center pb-2">
                                        <span className="text-amber-400 font-black orbitron text-xl">1</span>
                                    </div>
                                </div>
                            );
                        })()}
                        {/* 3등 */}
                        {(() => {
                            const entry = rankings[2];
                            const tier = getRankTier(entry.rating);
                            return (
                                <div
                                    onClick={() => handleUserClick(entry)}
                                    className="flex flex-col items-center cursor-pointer group"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-orange-700/30 to-orange-900/20 border-2 border-orange-700/40 flex items-center justify-center text-xl sm:text-2xl mb-2 group-hover:border-orange-600/60 transition-all">
                                        🥉
                                    </div>
                                    <p className="text-white font-bold text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[100px] text-center">{entry.playerName}</p>
                                    <p className={cn("text-xs font-bold", tier.color)}>{tier.icon} {entry.rating}</p>
                                    <p className="text-[10px] text-white/30 font-mono">{entry.wins}승 {entry.losses}패</p>
                                    <div className="w-20 sm:w-24 h-14 sm:h-16 bg-gradient-to-t from-orange-700/20 to-transparent rounded-t-lg mt-2 flex items-end justify-center pb-2">
                                        <span className="text-orange-600 font-black orbitron text-lg">3</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </motion.div>
            )}

            {/* Ranking Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden min-h-[250px] sm:min-h-[400px] overflow-x-auto">
                {processedRankings.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                {tableHeaders.map((header) => (
                                    <th
                                        key={header.label}
                                        onClick={() => handleSort(header.key)}
                                        className={cn("px-3 sm:px-4 py-3 text-[10px] font-mono text-white/40 uppercase tracking-widest text-left cursor-pointer hover:text-cyan-400 hover:bg-white/5 transition-all select-none", header.className)}
                                        title={`Sort by ${header.label}`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {header.label}
                                            {sortConfig.key === header.key ? (
                                                <span className="text-pink-400 text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                            ) : (
                                                <span className="text-white/10 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">▼</span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {processedRankings.map((entry, i) => {
                                const isMe = entry.playerId === user?.uid;
                                const tier = getRankTier(entry.rating);
                                return (
                                    <tr
                                        key={entry.playerId}
                                        onClick={() => handleUserClick(entry)}
                                        className={cn(
                                            "border-t border-white/5 transition-all cursor-pointer",
                                            "hover:bg-white/10 hover:scale-[1.005]",
                                            isMe && "bg-pink-500/10 hover:bg-pink-500/20"
                                        )}
                                    >
                                        <td className="px-3 sm:px-4 py-3 text-sm"><span className={cn("font-bold", entry.rank <= 3 ? "text-amber-400" : "text-white")}>{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}</span></td>
                                        <td className="px-3 sm:px-4 py-3 text-white font-medium text-sm">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <span className="truncate max-w-[80px] sm:max-w-none">{entry.playerName}</span>
                                                {isMe && <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 text-[10px] font-bold shrink-0">ME</span>}
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-amber-400 text-sm font-mono">LV.{entry.level}</td>
                                        <td className="hidden xs:table-cell px-3 sm:px-4 py-3"><span className={cn("text-xs font-bold px-2 py-0.5 rounded bg-white/5", tier.color)}>{tier.icon} {tier.tier}</span></td>
                                        <td className="px-3 sm:px-4 py-3 text-cyan-400 font-bold font-orbitron text-sm">{entry.rating}</td>
                                        <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-sm font-mono"><span className="text-green-400">{entry.wins}W</span> <span className="text-red-400">{entry.losses}L</span></td>
                                        <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-sm font-mono"><span className={cn("font-bold", entry.winRate >= 60 ? "text-green-400" : entry.winRate >= 50 ? "text-amber-400" : "text-white/40")}>{entry.winRate}%</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[250px] sm:h-[400px] text-white/30">
                        <div className="text-4xl mb-4">🌪️</div>
                        <p>랭킹 데이터가 없습니다.</p>
                    </div>
                )}
            </div>

            {/* PvP CTA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
                <Link href="/pvp" className="inline-block px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-bold orbitron hover:opacity-90 transition-all">
                    START_PVP ⚔️
                </Link>
            </motion.div>


            {/* User Action Modal */}
            <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} size="sm">
                <ModalHeader className="flex flex-col items-center gap-2 pt-6 border-none">
                    <Avatar src={selectedUser?.avatarUrl} className="w-20 h-20 border-2 border-pink-500 shadow-lg mb-2" />
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white orbitron">{selectedUser?.playerName}</h3>
                        <p className="text-sm text-white/50 font-mono">Rank {selectedUser?.rank} • Level {selectedUser?.level}</p>
                    </div>
                </ModalHeader>
                <ModalBody className="py-2">
                    <div className="flex flex-col gap-3 px-4">
                        <Button onClick={handleAddFriend} variant="flat" className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 h-10 w-full justify-start pl-6 gap-3 font-bold">
                            <UserPlus size={18} /> Add Friend
                        </Button>
                        <Button onClick={handleSendMessage} variant="flat" className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 h-10 w-full justify-start pl-6 gap-3 font-bold">
                            <MessageCircle size={18} /> Send Message
                        </Button>
                        <Button onClick={handleViewProfile} variant="flat" className="bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 h-10 w-full justify-start pl-6 gap-3 font-bold">
                            <User size={18} /> View Profile
                        </Button>
                    </div>
                </ModalBody>
                <ModalFooter className="border-none justify-center pb-6">
                    <Button onClick={() => setIsActionModalOpen(false)} variant="ghost" className="text-white/30 text-xs">
                        CLOSE
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Chat Modal */}
            <ChatModal
                isOpen={isChatModalOpen}
                onClose={() => setIsChatModalOpen(false)}
                targetUser={selectedUser ? {
                    uid: selectedUser.playerId,
                    nickname: selectedUser.playerName,
                    avatarUrl: selectedUser.avatarUrl
                } : null}
            />
        </CyberPageLayout >
    );
}
