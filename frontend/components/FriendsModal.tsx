'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, UserCheck, UserX, MessageSquare, Swords, Users } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    FriendUser
} from '@/lib/friend-system';
import { sendBattleInvitation } from '@/lib/battle-invitation-system';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar } from '@/components/ui/custom/Avatar';
import { Button } from '@/components/ui/custom/Button';
import { Input } from '@/components/ui/custom/Input';
import { useAlert } from '@/context/AlertContext';
import { useTranslation } from '@/context/LanguageContext';

interface FriendsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'list' | 'search' | 'requests' | 'sent';

export default function FriendsModal({ isOpen, onClose }: FriendsModalProps) {
    const { user } = useUser();
    const { profile } = useUserProfile();
    const { showAlert, showConfirm } = useAlert();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('list');

    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [requests, setRequests] = useState<FriendUser[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendUser[]>([]);
    const [searchResults, setSearchResults] = useState<FriendUser[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // 실시간 친구 목록 리스너
    useEffect(() => {
        if (!user || !isOpen || !db) return;

        const friendsRef = collection(db, 'users', user.uid, 'friends');
        // const q = query(friendsRef, orderBy('updatedAt', 'desc')); // updatedAt이 없는 경우 에러 방지 위해 단순 조회

        const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
            const allFriends: FriendUser[] = [];
            const allRequests: FriendUser[] = [];
            const allSentRequests: FriendUser[] = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data() as FriendUser;
                const friendData = { ...data, uid: doc.id };

                if (data.status === 'accepted') {
                    allFriends.push(friendData);
                } else if (data.status === 'pending_received') {
                    allRequests.push(friendData);
                } else if (data.status === 'pending_sent') {
                    allSentRequests.push(friendData);
                }
            });

            setFriends(allFriends);
            setRequests(allRequests);
            setSentRequests(allSentRequests);
        });

        return () => unsubscribe();
    }, [user, isOpen]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchUsers(searchQuery);
            // 나 자신 제외
            const filtered = results.filter(u => u.uid !== user?.uid);

            // 이미 친구이거나 요청 중인 상태 확인은 로컬에서 체크 불가능할 수 있음 (searchUsers가 status를 안 가져옴)
            // 하지만 UI에서 친구 목록과 비교하여 버튼 상태를 바꿀 수 있음
            setSearchResults(filtered);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendRequest = async (targetUser: FriendUser) => {
        if (!user || !profile) return;

        // 이미 친구인지 확인
        const isAlreadyFriend = friends.some(f => f.uid === targetUser.uid);
        if (isAlreadyFriend) {
            showAlert({ title: '알림', message: '이미 친구입니다.', type: 'info' });
            return;
        }

        const result = await sendFriendRequest(user.uid, profile, targetUser.uid, targetUser);
        if (result.success) {
            showAlert({ title: t('common.confirm'), message: t('friends.requestSent'), type: 'success' });
        } else {
            showAlert({ title: t('common.confirm'), message: result.message || 'Request Failed', type: 'error' });
        }
    };

    const handleAccept = async (friendId: string) => {
        if (!user) return;
        const result = await acceptFriendRequest(user.uid, friendId);
        if (result.success) {
            // Toast or silent success
        }
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

    const handleBattleChallenge = async (friend: FriendUser) => {
        if (!user || !profile) return;

        showConfirm({
            title: t('friends.battle'),
            message: t('friends.battleConfirm', { name: friend.nickname }),
            onConfirm: async () => {
                const result = await sendBattleInvitation(
                    user.uid,
                    profile.nickname || 'Unknown User',
                    profile.avatarUrl || '',
                    friend.uid,
                    friend.nickname
                );

                if (result.success) {
                    showAlert({ title: t('common.confirm'), message: t('pvp.modal.searching'), type: 'success' });
                    onClose();
                } else {
                    showAlert({ title: t('common.confirm'), message: result.message || 'Challenge Failed', type: 'error' });
                }
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-white/10 w-full max-w-md h-[600px] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 orbitron">
                        <Users className="text-cyan-400" size={20} />
                        {t('friends.title')}
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-black/20 p-1 mx-4 mt-4 rounded-lg">
                    {(['list', 'search', 'requests', 'sent'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all orbitron ${activeTab === tab
                                ? 'bg-zinc-700 text-white shadow-sm'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab === 'list' && t('friends.tab.list', { n: friends.length })}
                            {tab === 'search' && t('friends.tab.search')}
                            {tab === 'requests' && t('friends.tab.requests', { n: requests.length })}
                            {tab === 'sent' && `SENT (${sentRequests.length})`}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'list' && (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-2"
                            >
                                {friends.length === 0 ? (
                                    <div className="text-center py-10 text-white/30 text-sm">
                                        {t('friends.list.empty')}
                                    </div>
                                ) : (
                                    friends.map(friend => (
                                        <div key={friend.uid} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={friend.avatarUrl || '/avatars/default.png'} className="w-10 h-10 border border-white/20" />
                                                <div>
                                                    <div className="font-bold text-white text-sm">{friend.nickname}</div>
                                                    <div className="text-[10px] text-green-400 font-mono">● {t('friends.online')}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleBattleChallenge(friend)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-cyan-400"
                                                    title={t('friends.battle')}
                                                >
                                                    <Swords size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemove(friend.uid, friend.nickname)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-red-400"
                                                    title={t('friends.remove')}
                                                >
                                                    <UserX size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'search' && (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                            >
                                <div className="flex gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder={t('friends.search.placeholder')}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <Button onClick={handleSearch} isLoading={isSearching} size="sm" color="primary">
                                        {t('friends.search.button')}
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {searchResults.map(result => {
                                        const isFriend = friends.some(f => f.uid === result.uid);
                                        const isRequested = sentRequests.some(r => r.uid === result.uid);
                                        const isReceived = requests.some(r => r.uid === result.uid);

                                        return (
                                            <div key={result.uid} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={result.avatarUrl || '/avatars/default.png'} className="w-10 h-10" />
                                                    <div className="font-bold text-white text-sm">{result.nickname}</div>
                                                </div>
                                                {!isFriend && !isRequested && !isReceived && (
                                                    <button
                                                        onClick={() => handleSendRequest(result)}
                                                        className="p-2 bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-400 rounded-lg transition-colors"
                                                    >
                                                        <UserPlus size={18} />
                                                    </button>
                                                )}
                                                {isRequested && (
                                                    <span className="text-[10px] text-amber-500 font-bold px-3 orbitron">SENT</span>
                                                )}
                                                {isReceived && (
                                                    <span className="text-[10px] text-cyan-500 font-bold px-3 orbitron">RECEIVED</span>
                                                )}
                                                {isFriend && (
                                                    <span className="text-xs text-green-500 font-bold px-3 orbitron">FRIEND</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {searchResults.length === 0 && !isSearching && searchQuery && (
                                        <div className="text-center text-white/30 text-xs py-4">{t('friends.search.noResults')}</div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'requests' && (
                            <motion.div
                                key="requests"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-2"
                            >
                                {requests.length === 0 ? (
                                    <div className="text-center py-10 text-white/30 text-sm">
                                        {t('friends.requests.empty')}
                                    </div>
                                ) : (
                                    requests.map(req => (
                                        <div key={req.uid} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={req.avatarUrl || '/avatars/default.png'} className="w-10 h-10" />
                                                <div>
                                                    <div className="font-bold text-white text-sm">{req.nickname}</div>
                                                    <div className="text-[10px] text-white/50">{t('friends.wantsToBeFriends')}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAccept(req.uid)}
                                                    className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded text-[10px] font-bold transition-colors"
                                                >
                                                    {t('friends.accept')}
                                                </button>
                                                <button
                                                    onClick={() => removeFriend(user?.uid || '', req.uid)}
                                                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded text-[10px] font-bold transition-colors"
                                                >
                                                    {t('friends.decline')}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'sent' && (
                            <motion.div
                                key="sent"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-2"
                            >
                                {sentRequests.length === 0 ? (
                                    <div className="text-center py-10 text-white/30 text-sm">
                                        No sent requests.
                                    </div>
                                ) : (
                                    sentRequests.map(req => (
                                        <div key={req.uid} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={req.avatarUrl || '/avatars/default.png'} className="w-10 h-10" />
                                                <div>
                                                    <div className="font-bold text-white text-sm">{req.nickname}</div>
                                                    <div className="text-[10px] text-white/40 orbitron">PENDING...</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFriend(user?.uid || '', req.uid)}
                                                className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded text-[10px] font-bold transition-all"
                                            >
                                                CANCEL
                                            </button>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
