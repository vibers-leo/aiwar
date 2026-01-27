'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    UserPlus,
    UserCheck,
    UserX,
    MessageSquare,
    Swords,
    Users,
    User as UserIcon,
    Bell,
    Settings,
    ShieldAlert,
    ExternalLink,
    Trophy
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    getRecommendedUsers,
    FriendUser
} from '@/lib/friend-system';
import { Copy, PlusCircle, RefreshCw } from 'lucide-react';
import { sendBattleInvitation } from '@/lib/battle-invitation-system';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar } from '@/components/ui/custom/Avatar';
import { Button } from '@/components/ui/custom/Button';
import { Input } from '@/components/ui/custom/Input';
import { Card, CardBody } from '@/components/ui/custom/Card';
import { ResetTimer } from '@/components/ResetTimer';
import { useTranslation } from '@/context/LanguageContext';
import Link from 'next/link';
import CyberPageLayout from '@/components/CyberPageLayout';
import { useAlert } from '@/context/AlertContext';

export default function SocialPage() {
    const { user } = useUser();
    const { profile } = useUserProfile();
    const { showAlert, showConfirm } = useAlert();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'requests' | 'sent'>('friends');

    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [requests, setRequests] = useState<FriendUser[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendUser[]>([]);
    const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
    const [recommendedUsers, setRecommendedUsers] = useState<FriendUser[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Real-time friend listener
    useEffect(() => {
        if (!user || !db) return;

        const friendsRef = collection(db, 'users', user.uid, 'friends');
        const unsubscribe = onSnapshot(friendsRef, async (snapshot) => {
            const allRequests: FriendUser[] = [];
            const allSentRequests: FriendUser[] = [];

            // We'll collect UIDs to fetch actual presence
            const acceptedFriends: FriendUser[] = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data() as FriendUser;
                const friendData = { ...data, uid: doc.id };

                if (data.status === 'accepted') {
                    acceptedFriends.push(friendData);
                } else if (data.status === 'pending_received') {
                    allRequests.push(friendData);
                } else if (data.status === 'pending_sent') {
                    allSentRequests.push(friendData);
                }
            });

            // Fetch real-time presence for accepted friends
            const friendsWithPresence = await Promise.all(acceptedFriends.map(async (f) => {
                if (!db) return f;
                try {
                    const userDoc = await getDoc(doc(db, 'users', f.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        return { ...f, updatedAt: userData.lastActive || f.updatedAt };
                    }
                } catch (e) {
                    console.warn(`Failed to fetch presence for ${f.uid}`, e);
                }
                return f;
            }));

            setFriends(friendsWithPresence);
            setRequests(allRequests);
            setSentRequests(allSentRequests);
        });

        return () => unsubscribe();
    }, [user]);

    // Fetch recommendations
    useEffect(() => {
        if (!user) return;
        getRecommendedUsers(user.uid).then(setRecommendedUsers);
    }, [user, refreshKey]);

    const handleCopyId = () => {
        if (user?.uid) {
            navigator.clipboard.writeText(user.uid);
            showAlert({ title: "Copied!", message: "User ID copied to clipboard.", type: "success" });
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchUsers(searchQuery);
            const filtered = results.filter(u => u.uid !== user?.uid);
            setSearchResults(filtered);
            setActiveTab('search');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendRequest = async (targetUser: FriendUser) => {
        if (!user || !profile) return;
        const result = await sendFriendRequest(user.uid, profile, targetUser.uid, targetUser);
        if (result.success) {
            showAlert({ title: t('common.confirm'), message: t('friends.requestSent'), type: 'success' });
        } else {
            showAlert({ title: t('common.confirm'), message: result.message || 'Request failed', type: 'error' });
        }
    };

    const handleAccept = async (friendId: string) => {
        if (!user) return;
        await acceptFriendRequest(user.uid, friendId);
    };

    const handleRemove = (friendId: string, nickname: string) => {
        showConfirm({
            title: t('friends.remove'),
            message: t('friends.removeConfirm', { name: nickname }),
            onConfirm: async () => {
                if (!user) return;
                await removeFriend(user.uid, friendId);
                showAlert({ title: t('common.confirm'), message: t('friends.removeSuccess'), type: 'success' });
            }
        });
    };

    const handleBattleStepSync = async (friend: FriendUser) => {
        if (!user || !profile) return;
        showConfirm({
            title: t('friends.battle'),
            message: t('friends.battleConfirm', { name: friend.nickname }),
            onConfirm: async () => {
                const result = await sendBattleInvitation(
                    user.uid,
                    profile.nickname || 'Unknown',
                    profile.avatarUrl || '',
                    friend.uid,
                    friend.nickname
                );
                if (result.success) {
                    showAlert({ title: t('common.confirm'), message: t('pvp.modal.searching'), type: 'success' });
                } else {
                    showAlert({ title: t('common.confirm'), message: result.message || 'Challenge failed', type: 'error' });
                }
            }
        });
    };

    // Helper to determine online status
    const isUserOnline = (lastActive: any) => {
        if (!lastActive) return false;
        const lastActiveDate = lastActive.toDate ? lastActive.toDate() : new Date(lastActive);
        const now = new Date();
        // Online if active in the last 10 minutes
        return (now.getTime() - lastActiveDate.getTime()) < 10 * 60 * 1000;
    };

    return (
        <CyberPageLayout
            title={t('friends.title')}
            englishTitle="FRIENDS"
            subtitle={t('friends.list.empty').replace('.', '')}
            color="purple"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
                {/* Left Sidebar: My Profile Summary + Tabs */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="bg-purple-900/10 border-purple-500/20 backdrop-blur-xl">
                        <CardBody className="p-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="relative">
                                    <Avatar src={profile?.avatarUrl} className="w-24 h-24 border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]" />
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-black border border-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                        {profile?.level || 1}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white italic orbitron tracking-tighter truncate max-w-[200px]">
                                        {profile?.nickname || 'Commander'}
                                    </h3>
                                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mt-1 opacity-70">RANK PREVIEW: #77</p>
                                </div>
                                <div className="w-full flex gap-2">
                                    <Link href={user ? `/profile/${user.uid}` : '#'} className="flex-1">
                                        <Button variant="ghost" size="sm" fullWidth className="text-[10px] border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                                            MY PROFILE
                                        </Button>
                                    </Link>
                                    <Button onClick={handleCopyId} variant="ghost" size="sm" className="w-8 border-purple-500/30 hover:bg-purple-500/10 text-purple-400" title="Copy User ID">
                                        <Copy size={12} />
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <div className="space-y-2">
                        {[
                            { id: 'friends', name: t('friends.tab.list', { n: friends.length }), icon: <Users size={16} />, count: 0 },
                            { id: 'requests', name: t('friends.tab.requests', { n: requests.length }), icon: <Bell size={16} />, count: requests.length },
                            { id: 'sent', name: `SENT (${sentRequests.length})`, icon: <Bell size={16} />, count: 0 },
                            { id: 'search', name: t('friends.tab.search'), icon: <Search size={16} />, count: 0 },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all orbitron text-xs font-bold ${activeTab === tab.id
                                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                    : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {tab.icon}
                                    {tab.name}
                                </div>
                                {tab.count > 0 && (
                                    <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div >

                {/* Main Content Area */}
                < div className="lg:col-span-6 space-y-6" >
                    {/* Search Bar - Permanent in main area */}
                    < div className="relative group" >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                        <Link href="/factions" className="hidden" /> {/* SEO dummy */}
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder={t('friends.search.placeholder')}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-12 pr-28 text-sm text-white focus:outline-none focus:border-purple-500/50 backdrop-blur-xl transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Button
                                onClick={handleSearch}
                                isLoading={isSearching}
                                size="sm"
                                color="secondary"
                                className="font-bold px-6 h-10 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                            >
                                {t('friends.search.button')}
                            </Button>
                        </div>
                    </div >

                    <AnimatePresence mode="wait">
                        {activeTab === 'friends' && (
                            <motion.div
                                key="friends"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <h2 className="text-xs font-bold text-white/50 tracking-widest">{t('friends.online')} ({friends.length})</h2>
                                </div>
                                {friends.length === 0 ? (
                                    <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                                        <Users className="mx-auto text-white/10 mb-4" size={48} />
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            {t('friends.list.empty')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {friends.map(friend => (
                                            <Card key={friend.uid} className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all group overflow-hidden">
                                                <CardBody className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <Avatar src={friend.avatarUrl} className="w-12 h-12 border border-white/10" />
                                                            {isUserOnline(friend.updatedAt) ? (
                                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                                                            ) : (
                                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-500 rounded-full border-2 border-black" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-white truncate max-w-[150px] italic">{friend.nickname}</h4>
                                                                {isUserOnline(friend.updatedAt) ? (
                                                                    <span className="text-[10px] text-green-400 uppercase">{t('friends.online')}</span>
                                                                ) : (
                                                                    <span className="text-[10px] text-white/30 uppercase">{t('friends.offline')}</span>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-white/30 mt-0.5">LV.{friend.level || 1} • COMMANDER</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            onClick={() => handleBattleStepSync(friend)}
                                                            size="sm"
                                                            variant="light"
                                                            className="h-10 w-10 p-0 text-cyan-400 hover:bg-cyan-500/10"
                                                            title={t('friends.battle')}
                                                        >
                                                            <Swords size={20} />
                                                        </Button>
                                                        <Link href={`/profile/${friend.uid}`}>
                                                            <Button size="sm" variant="light" className="h-10 w-10 p-0 text-white/50 hover:text-white hover:bg-white/5" title="View Profile">
                                                                <ExternalLink size={20} />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            onClick={() => handleRemove(friend.uid, friend.nickname)}
                                                            size="sm"
                                                            variant="light"
                                                            className="h-10 w-10 p-0 text-red-500/40 hover:text-red-500 hover:bg-red-500/10"
                                                            title={t('friends.remove')}
                                                        >
                                                            <UserX size={20} />
                                                        </Button>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'requests' && (
                            <motion.div
                                key="requests"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <h2 className="text-xs font-bold text-white/50 tracking-widest">{t('friends.tab.requests', { n: requests.length })}</h2>
                                </div>
                                {requests.length === 0 ? (
                                    <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                                        <Bell className="mx-auto text-white/10 mb-4" size={48} />
                                        <p className="text-gray-500 text-sm">{t('friends.requests.empty')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {requests.map(req => (
                                            <Card key={req.uid} className="bg-white/5 border-white/10">
                                                <CardBody className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar src={req.avatarUrl} className="w-12 h-12" />
                                                        <div>
                                                            <h4 className="font-bold text-white">{req.nickname}</h4>
                                                            <p className="text-[10px] text-gray-500 uppercase leading-none">{t('friends.wantsToBeFriends')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleAccept(req.uid)}
                                                            size="sm"
                                                            className="font-bold text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/40"
                                                        >
                                                            {t('friends.accept')}
                                                        </Button>
                                                        <Button
                                                            onClick={() => removeFriend(user?.uid || '', req.uid)}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="font-bold text-[10px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                        >
                                                            {t('friends.decline')}
                                                        </Button>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'search' && (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <h2 className="text-xs font-bold text-white/50 tracking-widest">{t('friends.tab.search')} ({searchResults.length})</h2>
                                </div>
                                {searchResults.length === 0 ? (
                                    <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                                        <Search className="mx-auto text-white/10 mb-4" size={48} />
                                        <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                            {t('friends.search.noResults')}
                                        </p>

                                        {/* Recommendations Fallback */}
                                        {recommendedUsers.length > 0 && (
                                            <div className="mt-8 px-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-xs font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-2">
                                                        <RefreshCw size={12} /> RECOMMENDED
                                                    </h3>
                                                    <button onClick={() => setRefreshKey(k => k + 1)} className="text-[10px] text-white/40 hover:text-white">Refresh</button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                                                    {recommendedUsers.map(rec => {
                                                        const isFriend = friends.some(f => f.uid === rec.uid);
                                                        const isRequested = requests.some(r => r.uid === rec.uid);
                                                        const isSent = sentRequests.some(s => s.uid === rec.uid);

                                                        if (isFriend) return null;

                                                        return (
                                                            <div key={rec.uid} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar src={rec.avatarUrl} className="w-10 h-10" />
                                                                    <div>
                                                                        <div className="text-sm font-bold text-white">{rec.nickname}</div>
                                                                        <div className="text-[10px] text-white/40">LV.{rec.level}</div>
                                                                    </div>
                                                                </div>
                                                                {isSent ? (
                                                                    <span className="text-[10px] text-white/40">SENT</span>
                                                                ) : isRequested ? (
                                                                    <Button size="sm" onClick={() => handleAccept(rec.uid)} className="h-7 text-[10px] bg-green-500/20 text-green-400">ACCEPT</Button>
                                                                ) : (
                                                                    <Button size="sm" onClick={() => handleSendRequest(rec)} className="h-7 w-7 p-0 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                                                        <PlusCircle size={14} />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {searchResults.map(result => {
                                            const isFriend = friends.some(f => f.uid === result.uid);
                                            const isAlreadyRequested = requests.some(r => r.uid === result.uid);

                                            return (
                                                <Card key={result.uid} className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all">
                                                    <CardBody className="p-5 flex flex-col items-center text-center space-y-4">
                                                        <Avatar src={result.avatarUrl} className="w-20 h-20 border border-white/10 shadow-lg" />
                                                        <div>
                                                            <h4 className="font-bold text-white italic text-lg">{result.nickname}</h4>
                                                            <p className="text-[10px] text-gray-500">레벨 {result.level || 1} • 지휘관</p>
                                                        </div>
                                                        <div className="w-full pt-2 flex gap-2">
                                                            <Link href={`/profile/${result.uid}`} className="flex-1">
                                                                <Button variant="ghost" size="sm" fullWidth className="text-[10px] border-white/10">
                                                                    View Profile
                                                                </Button>
                                                            </Link>
                                                            {!isFriend && !isAlreadyRequested && (
                                                                <Button
                                                                    onClick={() => handleSendRequest(result)}
                                                                    size="sm"
                                                                    color="primary"
                                                                    className="flex-1 font-bold text-[10px]"
                                                                >
                                                                    {t('friends.tab.search')}
                                                                </Button>
                                                            )}
                                                            {isFriend && (
                                                                <div className="flex-1 flex items-center justify-center bg-purple-500/20 rounded-lg border border-purple-500/30 text-[10px] text-purple-400 font-bold orbitron">
                                                                    {t('friends.online').toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                        {activeTab === 'sent' && (
                            <motion.div
                                key="sent"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <h2 className="text-xs font-bold text-white/50 tracking-widest">SENT REQUESTS ({sentRequests.length})</h2>
                                </div>
                                {sentRequests.length === 0 ? (
                                    <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                                        <Bell className="mx-auto text-white/10 mb-4" size={48} />
                                        <p className="text-gray-500 text-sm">No sent requests.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {sentRequests.map(req => (
                                            <Card key={req.uid} className="bg-white/5 border-white/10">
                                                <CardBody className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar src={req.avatarUrl} className="w-12 h-12" />
                                                        <div>
                                                            <h4 className="font-bold text-white">{req.nickname}</h4>
                                                            <p className="text-[10px] text-gray-500 uppercase leading-none orbitron">PENDING...</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => removeFriend(user?.uid || '', req.uid)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="font-bold text-[10px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                    >
                                                        CANCEL
                                                    </Button>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div >

                {/* Right Panel: Recommendations / Stats */}
                < div className="lg:col-span-3 space-y-6" >
                    <Card className="bg-black/40 border-white/5">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <ShieldAlert size={18} className="text-cyan-400" />
                                <h3 className="text-xs font-bold text-white tracking-widest uppercase">{t('social.infoFeed')}</h3>
                            </div>
                            <div className="mb-6 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                                <ResetTimer className="justify-center" />
                            </div>
                            <div className="space-y-4">
                                <div className="p-3 bg-white/5 rounded-xl border-l-2 border-cyan-500">
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        <span className="text-cyan-400 font-bold">SYSTEM:</span> {t('social.systemMessage')}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border-l-2 border-purple-500">
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        <span className="text-purple-400 font-bold">TIP:</span> {t('social.tipMessage')}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border-l-2 border-amber-500">
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        <span className="text-amber-400 font-bold">SECURE:</span> {t('social.securityMessage')}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border-white/10 overflow-hidden">
                        <CardBody className="p-6 relative group cursor-pointer">
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 space-y-4">
                                <Trophy className="text-amber-400" size={32} />
                                <div>
                                    <h3 className="text-sm font-black text-white tracking-tight italic">{t('social.globalRanking')}</h3>
                                    <p className="text-[10px] text-white/50 mt-1">{t('social.globalRankingDesc')}</p>
                                </div>
                                <Link href="/ranking">
                                    <Button fullWidth size="sm" variant="ghost" className="text-[10px] border-white/20 hover:bg-white/10 mt-2">
                                        {t('social.viewLeaderboard')}
                                    </Button>
                                </Link>
                            </div>
                        </CardBody>
                    </Card>
                </div >
            </div >
        </CyberPageLayout >
    );
}
