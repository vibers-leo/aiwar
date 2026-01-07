'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
    listenForInvitations,
    acceptBattleInvitation,
    declineBattleInvitation,
    listenForAcceptedInvitations,
    BattleInvitation
} from '@/lib/battle-invitation-system';
import { Avatar } from '@/components/ui/custom/Avatar';
import { Button } from '@/components/ui/custom/Button';
import { Swords, X, Check } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

export default function BattleInvitationNotification() {
    const { user, level } = useUser();
    const { profile } = useUserProfile();
    const router = useRouter();
    const { showAlert } = useAlert();
    const [invitations, setInvitations] = useState<BattleInvitation[]>([]);

    useEffect(() => {
        if (!user) return;

        // 1. 내가 받은 초대 리스닝 (수신자)
        const unsubscribeReceived = listenForInvitations(user.uid, (invs) => {
            setInvitations(invs);
        });

        // 2. 내가 보낸 초대 중 수락된 것 리스닝 (발신자)
        let isRouting = false;

        const unsubscribeAccepted = listenForAcceptedInvitations(user.uid, (invs) => {
            // 이미 이동 중이면 무시
            if (invs.length > 0 && !isRouting) {
                const acceptedInv = invs[0];
                if (acceptedInv.roomId) {
                    // 여기서 로컬 스토리지 등으로 '이 방은 이미 처리함' 체크하면 더 좋음
                    // 하지만 간단히 라우팅
                    isRouting = true;
                    showAlert({ title: '매칭 성사', message: `${acceptedInv.toNickname}님이 초대를 수락했습니다! 이동합니다.`, type: 'success' });
                    router.push(`/pvp/room/${acceptedInv.roomId}`);
                }
            }
        });

        return () => {
            unsubscribeReceived();
            unsubscribeAccepted();
        };
    }, [user]);

    const handleAccept = async (invitation: BattleInvitation) => {
        if (!user || !profile) return;

        try {
            const toUser = {
                uid: user.uid,
                nickname: profile.nickname || user.displayName || 'Unknown',
                level: level || 1,
                avatarUrl: profile.avatarUrl || user.photoURL || ''
            };

            const result = await acceptBattleInvitation(invitation.id, toUser);

            if (result.success && result.roomId) {
                router.push(`/pvp/room/${result.roomId}`);
            } else {
                showAlert({ title: '오류', message: result.message || '대전을 수락하지 못했습니다.', type: 'error' });
            }
        } catch (error) {
            console.error("Accept error:", error);
            showAlert({ title: '오류', message: '대전을 수락 중 오류가 발생했습니다.', type: 'error' });
        }
    };

    const handleDecline = async (invitationId: string) => {
        await declineBattleInvitation(invitationId);
    };

    if (invitations.length === 0) return null;

    return (
        <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {invitations.map(invitation => (
                    <motion.div
                        key={invitation.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="bg-zinc-900/90 backdrop-blur-md border border-red-500/30 rounded-xl p-4 shadow-2xl w-80 pointer-events-auto relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent animate-pulse" />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={invitation.fromAvatarUrl || '/avatars/default.png'}
                                        className="w-10 h-10 border-2 border-red-500"
                                    />
                                    <div>
                                        <div className="text-[10px] text-red-400 font-bold tracking-wider mb-0.5 orbitron">
                                            BATTLE CHALLENGE
                                        </div>
                                        <div className="text-sm font-bold text-white">
                                            {invitation.fromNickname}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-red-500/20 p-1.5 rounded-lg text-red-400 animate-pulse">
                                    <Swords size={18} />
                                </div>
                            </div>

                            <p className="text-xs text-gray-300 mb-4 pl-1">
                                has challenged you to a <span className="font-bold text-white">{invitation.mode}</span> battle!
                            </p>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    fullWidth
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold h-9"
                                    onPress={() => handleAccept(invitation)}
                                // startContent={<Check size={14} />} // lint fix needed if check not imported or props issue
                                >
                                    ACCEPT
                                </Button>
                                <Button
                                    size="sm"
                                    fullWidth
                                    className="bg-zinc-700 hover:bg-zinc-600 text-gray-300 h-9"
                                    onPress={() => handleDecline(invitation.id)}
                                // startContent={<X size={14} />}
                                >
                                    DECLINE
                                </Button>
                            </div>

                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 60, ease: "linear" }}
                                className="absolute bottom-0 left-0 h-0.5 bg-red-500"
                            />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
