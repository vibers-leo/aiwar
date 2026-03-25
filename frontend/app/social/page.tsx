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
    Trophy,
    Copy,
    PlusCircle,
    RefreshCw,
    MessageCircle
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
import { ChatModal } from '@/components/ChatModal';
import { subscribeToUserChatRooms, ChatRoom } from '@/lib/chat-system';

export default function SocialPage() {
    const { user } = useUser();
    const { profile } = useUserProfile();
    const { showAlert, showConfirm } = useAlert();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'requests' | 'sent' | 'chats'>('friends');

    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [requests, setRequests] = useState<FriendUser[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendUser[]>([]);
    const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
    const [recommendedUsers, setRecommendedUsers] = useState<FriendUser[]>([]);
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const [selectedChatUser, setSelectedChatUser] = useState<FriendUser | null>(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Real-time friend listener
    useEffect(() => {
        if (!user || !db) return;

        const friendsRef = collection(db, 'users', user.uid, 'friends');
        const unsubscribe = onSnapshot(friendsRef, async (snapshot) => {
            const allRequests: FriendUser[] = [];
            const allSentRequests: FriendUser[] = [];
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

    // Real-time chat rooms listener
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToUserChatRooms(user.uid, (rooms) => {
            setChatRooms(rooms);
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

    // Debounced Search Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch();
            } else if (searchQuery === '') {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

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

    const handleOpenChat = (friend: FriendUser) => {
        setSelectedChatUser(friend);
        setIsChatModalOpen(true);
    };

    const handleOpenChatRoom = async (room: ChatRoom) => {
        if (!user) return;
        const targetUid = room.participants.find(id => id !== user.uid);
        if (!db || !targetUid) return;

        const targetRef = doc(db, 'users', targetUid);
        const targetSnap = await getDoc(targetRef);
        if (targetSnap.exists()) {
            const data = targetSnap.data();
            setSelectedChatUser({
                uid: targetUid,
                nickname: data.nickname || 'Unknown',
                avatarUrl: data.avatarUrl || '',
                level: data.level || 1,
                updatedAt: data.lastActive
            });
            setIsChatModalOpen(true);
        }
    };

    const isUserOnline = (lastActive: any) => {
        if (!lastActive) return false;
        const lastActiveDate = lastActive.toDate ? lastActive.toDate() : new Date(lastActive);
        const now = new Date();
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
                            { id: 'chats', name: 'CHATS', icon: <MessageSquare size={16} />, count: chatRooms.length },
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
                </div>

                <div className="lg:col-span-6 space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search users by nickname..."
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
                    </div>

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
                                        <p className="text-gray-500 text-sm">{t('friends.list.empty')}</p>
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
                                                        <Button onClick={() => handleBattleStepSync(friend)} size="sm" variant="light" className="h-10 w-10 p-0 text-cyan-400 hover:bg-cyan-500/10" title={t('friends.battle')}>
                                                            <Swords size={20} />
                                                        </Button>
                                                        <Button onClick={() => handleOpenChat(friend)} size="sm" variant="light" className="h-10 w-10 p-0 text-purple-400 hover:bg-purple-500/10" title="Chat">
                                                            <MessageSquare size={20} />
                                                        </Button>
                                                        <Link href={`/profile/${friend.uid}`}>
                                                            <Button size="sm" variant="light" className="h-10 w-10 p-0 text-white/50 hover:text-white hover:bg-white/5" title="View Profile">
                                                                <ExternalLink size={20} />
                                                            </Button>
                                                        </Link>
                                                        <Button onClick={() => handleRemove(friend.uid, friend.nickname)} size="sm" variant="light" className="h-10 w-10 p-0 text-red-500/40 hover:text-red-500 hover:bg-red-500/10" title={t('friends.remove')}>
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

                        {activeTab === 'chats' && (
                            <motion.div
                                key="chats"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <h2 className="text-xs font-bold text-white/50 tracking-widest uppercase">ACTIVE_CONVERSATIONS ({chatRooms.length})</h2>
                                </div>
                                {chatRooms.length === 0 ? (
                                    <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                                        <MessageSquare className="mx-auto text-white/10 mb-4" size={48} />
                                        <p className="text-gray-500 text-sm">No active chats.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {chatRooms.map(room => (
                                            <Card key={room.id} onClick={() => handleOpenChatRoom(room)} className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-all group cursor-pointer">
                                                <CardBody className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="w-12 h-12 border border-white/10" />
                                                        <div className="overflow-hidden">
                                                            <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                                                                ROOM: {room.id.split('_').slice(-1)[0].slice(0, 8)}...
                                                            </h4>
                                                            <p className="text-xs text-white/40 truncate max-w-[200px]">
                                                                {room.lastMessage || 'Click to start chatting'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-mono text-white/20 uppercase">
                                                            {room.lastTimestamp && new Date(room.lastTimestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
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
                                                        <Button onClick={() => handleAccept(req.uid)} size="sm" className="font-bold text-[10px] bg-green-500/20 text-green-400">
                                                            {t('friends.accept')}
                                                        </Button>
                                                        <Button onClick={() => removeFriend(user?.uid || '', req.uid)} size="sm" variant="ghost" className="font-bold text-[10px] text-red-400">
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
                                                            <p className="text-[10px] text-gray-500 uppercase leading-none">PENDING...</p>
                                                        </div>
                                                    </div>
                                                    <Button onClick={() => removeFriend(user?.uid || '', req.uid)} size="sm" variant="ghost" className="font-bold text-[10px] text-red-400">
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
                </div>

                <div className="lg:col-span-3 space-y-6">
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
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border-white/10 overflow-hidden">
                        <CardBody className="p-6 relative group cursor-pointer">
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
                </div>
            </div>

            <ChatModal
                isOpen={isChatModalOpen}
                onClose={() => setIsChatModalOpen(false)}
                targetUser={selectedChatUser ? {
                    uid: selectedChatUser.uid,
                    nickname: selectedChatUser.nickname,
                    avatarUrl: selectedChatUser.avatarUrl
                } : null}
            />
        </CyberPageLayout>
    );
}

