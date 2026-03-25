'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import CyberPageLayout from '@/components/CyberPageLayout';
import GameCard from '@/components/GameCard';
import { getUserProfile } from '@/lib/firebase-db';
import { UserProfile } from '@/lib/firebase-db';
import { sendFriendRequest } from '@/lib/friend-system';
import { getRankTier } from '@/lib/ranking-utils';
import { getTierColor, getWinRateColor, formatRelativeTime, getUserMainDeck, getUserBattleHistory, BattleHistory } from '@/lib/user-profile-utils';
import { useUser } from '@/context/UserContext';
import { useAlert } from '@/context/AlertContext';
import { cn } from '@/lib/utils';
import { User, Trophy, Target, Clock, UserPlus, Swords, Share2, ArrowLeft, Shield } from 'lucide-react';
import { COMBO_DEFINITIONS } from '@/lib/synergy-utils';
import { InventoryCard } from '@/lib/inventory-system';
import { sendBattleInvitation } from '@/lib/battle-invitation-system';

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.uid as string;
    const { user, profile: myProfile } = useUser();
    const { showAlert } = useAlert();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [mainDeck, setMainDeck] = useState<InventoryCard[]>([]);
    const [battleHistory, setBattleHistory] = useState<BattleHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sendingRequest, setSendingRequest] = useState(false);

    const isMyProfile = user?.uid === userId;

    // 친구 추가 핸들러
    const handleAddFriend = async () => {
        if (!user?.uid || !myProfile || !profile) return;

        setSendingRequest(true);
        try {
            const result = await sendFriendRequest(
                user.uid,
                myProfile,
                userId,
                profile
            );

            if (result.success) {
                showAlert({
                    title: '성공',
                    message: '친구 요청을 보냈습니다!',
                    type: 'success'
                });
            } else {
                showAlert({
                    title: '오류',
                    message: result.message || '친구 요청에 실패했습니다.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Friend request error:', error);
            showAlert({
                title: '오류',
                message: '친구 요청 중 오류가 발생했습니다.',
                type: 'error'
            });
        } finally {
            setSendingRequest(false);
        }
    };

    useEffect(() => {
        async function loadProfile() {
            if (!userId) {
                setError('유효하지 않은 사용자 ID입니다.');
                setLoading(false);
                return;
            }

            const timeoutId = setTimeout(() => {
                setError('프로필 로딩 시간이 초과되었습니다. 네트워크 상태를 확인해 주세요.');
                setLoading(false);
            }, 10000);

            try {
                setLoading(true);
                const userProfile = await getUserProfile(userId);

                if (!userProfile) {
                    setError('사용자를 찾을 수 없습니다.');
                    setLoading(false);
                    clearTimeout(timeoutId);
                    return;
                }

                setProfile(userProfile);

                // Load main deck and battle history
                const [deck, history] = await Promise.all([
                    getUserMainDeck(userId),
                    getUserBattleHistory(userId, 10)
                ]);

                setMainDeck(deck);
                setBattleHistory(history);
                setLoading(false);
                clearTimeout(timeoutId);
            } catch (err) {
                console.error('Failed to load profile:', err);
                setError('프로필을 불러오는 중 오류가 발생했습니다.');
                setLoading(false);
                clearTimeout(timeoutId);
            }
        }

        loadProfile();
    }, [userId]);

    if (loading) {
        return (
            <CyberPageLayout title="프로필" englishTitle="USER PROFILE" description="로딩 중..." color="cyan">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </CyberPageLayout>
        );
    }

    if (error || !profile) {
        return (
            <CyberPageLayout title="오류" englishTitle="ERROR" description={error || '알 수 없는 오류'} color="red">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <div className="text-6xl">❌</div>
                    <p className="text-white/60">{error || '프로필을 불러올 수 없습니다.'}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2"
                    >
                        <ArrowLeft size={20} />
                        돌아가기
                    </button>
                </div>
            </CyberPageLayout>
        );
    }

    const tier = getRankTier(profile.rating || 1000);
    const winRate = profile.wins && (profile.wins + (profile.losses || 0)) > 0
        ? Math.round((profile.wins / (profile.wins + (profile.losses || 0))) * 100)
        : 0;

    return (
        <CyberPageLayout
            title={profile.nickname || `Player_${userId.slice(0, 4)}`}
            englishTitle="USER PROFILE"
            description={`${tier.icon} ${tier.tier} · Lv.${profile.level || 1}`}
            color="cyan"
        >
            <div className="max-w-5xl mx-auto space-y-6 pb-8">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-xl p-8"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className={cn(
                                "w-32 h-32 rounded-full overflow-hidden border-4 bg-gradient-to-br",
                                getTierColor(profile.rating || 1000)
                            )}>
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-black/40">
                                        <User size={48} className="text-white/60" />
                                    </div>
                                )}
                            </div>
                            {/* Level Badge */}
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-4 border-black flex items-center justify-center">
                                <span className="text-sm font-black text-white">{profile.level || 1}</span>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-black text-white orbitron mb-2">
                                {profile.nickname || `Player_${userId.slice(0, 4)}`}
                            </h2>
                            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                                <span className={cn("text-xl font-bold", tier.color)}>
                                    {tier.icon} {tier.tier}
                                </span>
                                <span className="text-white/40">·</span>
                                <span className="text-cyan-400 font-mono">
                                    Rating: {profile.rating || 1000}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            {!isMyProfile && (
                                <div className="flex gap-3 justify-center md:justify-start">
                                    <button
                                        onClick={handleAddFriend}
                                        disabled={sendingRequest}
                                        className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sendingRequest ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                                전송 중...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={18} />
                                                친구 추가
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!user?.uid || !myProfile || !profile) return;
                                            try {
                                                const result = await sendBattleInvitation(
                                                    user.uid,
                                                    myProfile.nickname || user.displayName || 'Player',
                                                    myProfile.avatarUrl || user.photoURL || '',
                                                    userId,
                                                    profile.nickname || `Player_${userId.slice(0, 4)}`,
                                                    'sudden-death',
                                                    myProfile.level || 1
                                                );

                                                if (result.success) {
                                                    showAlert({
                                                        title: '초대 전송',
                                                        message: '대전 초대를 보냈습니다. 상대방의 수락을 기다립니다.',
                                                        type: 'success'
                                                    });
                                                }
                                            } catch (error) {
                                                console.error('Invite error:', error);
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-all flex items-center gap-2"
                                    >
                                        <Swords size={18} />
                                        대전 신청
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            showAlert({
                                                title: '복사 완료',
                                                message: '프로필 링크가 클립보드에 복사되었습니다.',
                                                type: 'success'
                                            });
                                        }}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                                    >
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: '승리', value: profile.wins || 0, icon: Trophy, color: 'text-green-400' },
                        { label: '패배', value: profile.losses || 0, icon: Target, color: 'text-red-400' },
                        { label: '승률', value: `${winRate}%`, icon: Trophy, color: getWinRateColor(winRate) },
                        { label: '최고 레이팅', value: profile.rating || 1000, icon: Trophy, color: 'text-amber-400' }
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
                        >
                            <stat.icon className={cn("w-6 h-6 mx-auto mb-2", stat.color)} />
                            <p className={cn("text-2xl font-black orbitron", stat.color)}>{stat.value}</p>
                            <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Main Deck */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                >
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="text-amber-400" size={24} />
                        주력 덱
                    </h3>
                    {mainDeck.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {mainDeck.map((card, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.05 * i }}
                                >
                                    <GameCard card={card} />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-white/40">
                            <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                            <p>주력 덱이 설정되지 않았습니다.</p>
                        </div>
                    )}
                </motion.div>

                {/* Combo Badges */}
                {profile.comboBadges && profile.comboBadges.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="bg-white/5 border border-purple-500/30 rounded-xl p-6"
                    >
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Shield className="text-purple-400" size={24} />
                            콤보 도감 뱃지
                            <span className="ml-2 text-sm font-normal text-purple-400">{profile.comboBadges.length} / {COMBO_DEFINITIONS.length}</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {COMBO_DEFINITIONS.map(combo => {
                                const earned = profile.comboBadges!.includes(combo.id);
                                return (
                                    <div
                                        key={combo.id}
                                        title={combo.description}
                                        className={cn(
                                            "px-3 py-2 rounded-xl border text-sm font-bold transition-all",
                                            earned
                                                ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                                                : "bg-white/5 border-white/10 text-white/20 grayscale"
                                        )}
                                    >
                                        {combo.icon} {combo.name}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Battle History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                >
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="text-purple-400" size={24} />
                        최근 전투 기록
                    </h3>
                    {battleHistory.length > 0 ? (
                        <div className="space-y-2">
                            {battleHistory.map((battle, i) => (
                                <motion.div
                                    key={battle.battleId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 * i }}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg border",
                                        battle.result === 'win' ? "bg-green-500/10 border-green-500/30" :
                                            battle.result === 'loss' ? "bg-red-500/10 border-red-500/30" :
                                                "bg-white/5 border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "text-sm font-bold uppercase",
                                            battle.result === 'win' ? "text-green-400" :
                                                battle.result === 'loss' ? "text-red-400" :
                                                    "text-white/60"
                                        )}>
                                            {battle.result === 'win' ? '승리' : battle.result === 'loss' ? '패배' : '무승부'}
                                        </span>
                                        <span className="text-white/60">vs</span>
                                        <span className="text-white font-medium">{battle.opponentName}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={cn(
                                            "font-mono font-bold",
                                            battle.ratingChange > 0 ? "text-green-400" : "text-red-400"
                                        )}>
                                            {battle.ratingChange > 0 ? '+' : ''}{battle.ratingChange}
                                        </span>
                                        <span className="text-xs text-white/40">
                                            {formatRelativeTime(battle.timestamp)}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-white/40">
                            <Clock size={48} className="mx-auto mb-4 opacity-20" />
                            <p>전투 기록이 없습니다.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </CyberPageLayout>
    );
}
