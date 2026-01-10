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
    FriendUser
} from '@/lib/friend-system';
import { sendBattleInvitation } from '@/lib/battle-invitation-system';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar } from '@/components/ui/custom/Avatar';
import { Button } from '@/components/ui/custom/Button';
import { Input } from '@/components/ui/custom/Input';
import { Card, CardBody } from '@/components/ui/custom/Card';
import { useAlert } from '@/context/AlertContext';
import CyberPageLayout from '@/components/CyberPageLayout';
import Link from 'next/link';
import { ResetTimer } from '@/components/ResetTimer';

export default function SocialPage() {
    const { user } = useUser();
    const { profile } = useUserProfile();
    const { showAlert, showConfirm } = useAlert();
    const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'requests'>('friends');

    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [requests, setRequests] = useState<FriendUser[]>([]);
    const [searchResults, setSearchResults] = useState<FriendUser[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Real-time friend listener
    useEffect(() => {
        if (!user || !db) return;

        const friendsRef = collection(db, 'users', user.uid, 'friends');
        const unsubscribe = onSnapshot(friendsRef, async (snapshot) => {
            const tempFriends: FriendUser[] = [];
            const allRequests: FriendUser[] = [];

            // We'll collect UIDs to fetch actual presence
            const acceptedFriends: FriendUser[] = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data() as FriendUser;
                const friendData = { ...data, uid: doc.id };

                if (data.status === 'accepted') {
                    acceptedFriends.push(friendData);
                } else if (data.status === 'pending_received') {
                    allRequests.push(friendData);
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
        });

        return () => unsubscribe();
    }, [user]);

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
            showAlert({ title: 'Success', message: 'Friend request sent.', type: 'success' });
        } else {
            showAlert({ title: 'Error', message: result.message || 'Request failed', type: 'error' });
        }
    };

    const handleAccept = async (friendId: string) => {
        if (!user) return;
        await acceptFriendRequest(user.uid, friendId);
    };

    const handleRemove = (friendId: string, nickname: string) => {
        showConfirm({
            title: 'Remove Friend',
            message: `Remove ${nickname} from your friends list?`,
            onConfirm: async () => {
                if (!user) return;
                await removeFriend(user.uid, friendId);
            }
        });
    };

    const handleBattleStepSync = async (friend: FriendUser) => {
        if (!user || !profile) return;
        showConfirm({
            title: 'BATTLE CHALLENGE',
            message: `Challenge ${friend.nickname} to a battle?`,
            onConfirm: async () => {
                const result = await sendBattleInvitation(
                    user.uid,
                    profile.nickname || 'Unknown',
                    profile.avatarUrl || '',
                    friend.uid,
                    friend.nickname
                );
                if (result.success) {
                    showAlert({ title: 'Sent', message: 'Challenge sent! Waiting for response...', type: 'success' });
                } else {
                    showAlert({ title: 'Failed', message: result.message || 'Challenge failed', type: 'error' });
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
            title="SOCIAL DASHBOARD"
            englishTitle="COMMANDER HUB"
            subtitle="Connect & Challenge"
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
                                        {profile?.nickname || 'COMMANDER'}
                                    </h3>
                                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mt-1 opacity-70">RANK PREVIEW: #77</p>
                                </div>
                                <div className="w-full flex gap-2">
                                    <Link href={`/profile/${user?.uid}`} className="flex-1">
                                        <Button variant="ghost" size="sm" fullWidth className="text-[10px] orbitron h-8 border-purple-500/30 hover:bg-purple-500/10">
                                            MY PROFILE
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Navigation Tabs */}
                    <div className="space-y-2">
                        {[
                            { id: 'friends', name: 'FRIENDS', icon: <Users size={16} />, count: friends.length },
                            { id: 'requests', name: 'REQUESTS', icon: <Bell size={16} />, count: requests.length },
                            { id: 'search', name: 'SEARCH', icon: <Search size={16} />, count: 0 },
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

                {/* Main Content Area */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Search Bar - Permanent in main area */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                        <Link href="/factions" className="hidden" /> {/* SEO dummy */}
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="FIND COMMANDERS BY NICKNAME..."
                            className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-12 pr-28 text-sm text-white orbitron focus:outline-none focus:border-purple-500/50 backdrop-blur-xl transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Button
                                onClick={handleSearch}
                                isLoading={isSearching}
                                size="sm"
                                color="secondary"
                                className="orbitron font-bold px-6 h-10 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                            >
                                SEARCH
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
                                    <h2 className="text-xs font-bold text-white/50 orbitron tracking-widest">ACTIVE COMMANDERS ({friends.length})</h2>
                                </div>
                                {friends.length === 0 ? (
                                    <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                                        <Users className="mx-auto text-white/10 mb-4" size={48} />
                                        <p className="text-gray-500 font-mono text-sm leading-relaxed">
                                            NO ALLIES DETECTED IN YOUR GRID.<br />
                                            USE THE SEARCH PROTOCOL TO FIND OTHER COMMANDERS.
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
                                                                    <span className="text-[10px] text-green-400 font-mono uppercase">ONLINE</span>
                                                                ) : (
                                                                    <span className="text-[10px] text-white/30 font-mono uppercase">OFFLINE</span>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-white/30 font-mono mt-0.5">LV.{friend.level || 1} • ELITE COMMANDER</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            onClick={() => handleBattleStepSync(friend)}
                                                            size="sm"
                                                            variant="light"
                                                            className="h-10 w-10 p-0 text-cyan-400 hover:bg-cyan-500/10"
                                                            title="BATTLE"
                                                        >
                                                            <Swords size={20} />
                                                        </Button>
                                                        <Link href={`/profile/${friend.uid}`}>
                                                            <Button size="sm" variant="light" className="h-10 w-10 p-0 text-white/50 hover:text-white hover:bg-white/5" title="VIEW PROFILE">
                                                                <ExternalLink size={20} />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            onClick={() => handleRemove(friend.uid, friend.nickname)}
                                                            size="sm"
                                                            variant="light"
                                                            className="h-10 w-10 p-0 text-red-500/40 hover:text-red-500 hover:bg-red-500/10"
                                                            title="REMOVE"
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
                                    <h2 className="text-xs font-bold text-white/50 orbitron tracking-widest">PENDING TRANSMISSIONS ({requests.length})</h2>
                                </div>
                                {requests.length === 0 ? (
                                    <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                                        <Bell className="mx-auto text-white/10 mb-4" size={48} />
                                        <p className="text-gray-500 font-mono text-sm">NO PENDING REQUESTS IN THE BUFFER.</p>
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
                                                            <p className="text-[10px] text-gray-500 font-mono uppercase leading-none">INVITATION RECEIVED</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleAccept(req.uid)}
                                                            size="sm"
                                                            className="orbitron font-bold text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/40"
                                                        >
                                                            ACCEPT
                                                        </Button>
                                                        <Button
                                                            onClick={() => removeFriend(user?.uid || '', req.uid)}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="orbitron font-bold text-[10px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                        >
                                                            DECLINE
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
                                    <h2 className="text-xs font-bold text-white/50 orbitron tracking-widest">INTEL SEARCH RESULTS ({searchResults.length})</h2>
                                </div>
                                {searchResults.length === 0 ? (
                                    <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                                        <Search className="mx-auto text-white/10 mb-4" size={48} />
                                        <p className="text-gray-500 font-mono text-sm leading-relaxed">
                                            NO COMMANDERS FOUND MATCHING YOUR DATA.<br />
                                            PLEASE RE-ENTER THE NICKNAME PROTOCOL.
                                        </p>
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
                                                            <p className="text-[10px] text-gray-500 font-mono">LEVEL {result.level || 1} • COMMANDER</p>
                                                        </div>
                                                        <div className="w-full pt-2 flex gap-2">
                                                            <Link href={`/profile/${result.uid}`} className="flex-1">
                                                                <Button variant="ghost" size="sm" fullWidth className="text-[10px] orbitron border-white/10">
                                                                    VIEW PROFILE
                                                                </Button>
                                                            </Link>
                                                            {!isFriend && !isAlreadyRequested && (
                                                                <Button
                                                                    onClick={() => handleSendRequest(result)}
                                                                    size="sm"
                                                                    color="primary"
                                                                    className="flex-1 orbitron font-bold text-[10px]"
                                                                >
                                                                    ADD FRIEND
                                                                </Button>
                                                            )}
                                                            {isFriend && (
                                                                <div className="flex-1 flex items-center justify-center bg-purple-500/20 rounded-lg border border-purple-500/30 text-[10px] text-purple-400 font-bold orbitron">
                                                                    FRIEND
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
                    </AnimatePresence>
                </div>

                {/* Right Panel: Recommendations / Stats */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="bg-black/40 border-white/5">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <ShieldAlert size={18} className="text-cyan-400" />
                                <h3 className="text-xs font-bold text-white orbitron tracking-widest uppercase">INTEL FEED</h3>
                            </div>
                            <div className="mb-6 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                                <ResetTimer className="justify-center" />
                            </div>
                            <div className="space-y-4">
                                <div className="p-3 bg-white/5 rounded-xl border-l-2 border-cyan-500">
                                    <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                                        <span className="text-cyan-400 font-bold">SYSTEM:</span> SEASON 1 "GENESIS" IS NOW ACTIVE. ALL SOCIAL RANKS HAVE BEEN RESET.
                                    </p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border-l-2 border-purple-500">
                                    <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                                        <span className="text-purple-400 font-bold">TIP:</span> REACHING LEVEL 10 UNLOCKS "BATTLE SQUADS" - FORM ALLIANCES WITH TOP COMMANDERS.
                                    </p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border-l-2 border-amber-500">
                                    <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                                        <span className="text-amber-400 font-bold">SECURITY:</span> YOUR DATA IS FULLY ENCRYPTED THROUGH THE NEURAL NETWORK.
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
                                    <h3 className="text-sm font-black text-white orbitron tracking-tight italic">GLOBAL RANKINGS</h3>
                                    <p className="text-[10px] text-white/50 font-mono mt-1">COMPETE WITH COMMANDERS WORLDWIDE.</p>
                                </div>
                                <Link href="/ranking">
                                    <Button fullWidth size="sm" variant="ghost" className="text-[10px] orbitron border-white/20 hover:bg-white/10 mt-2">
                                        VIEW LEADERBOARD
                                    </Button>
                                </Link>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </CyberPageLayout>
    );
}
