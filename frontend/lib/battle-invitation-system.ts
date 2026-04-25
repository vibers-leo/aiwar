
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    Timestamp,
    orderBy,
    limit,
    getDoc
} from 'firebase/firestore';
import { getDatabase, ref, set, push } from 'firebase/database';
import { db } from './firebase';
import app from './firebase';
import { v4 as uuidv4 } from 'uuid';

export interface BattleInvitation {
    id: string;
    fromUid: string;
    fromNickname: string;
    fromAvatarUrl?: string;
    fromLevel?: number;
    toUid: string;
    toNickname: string;
    mode: 'sudden-death' | 'tactics' | 'strategy' | 'double';
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    roomId?: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
}

// 초대 보내기
export async function sendBattleInvitation(
    fromUid: string,
    fromNickname: string,
    fromAvatarUrl: string,
    toUid: string,
    toNickname: string,
    mode: 'sudden-death' | 'tactics' | 'strategy' | 'double' = 'sudden-death',
    fromLevel: number = 1
): Promise<{ success: boolean; invitationId?: string; message?: string }> {
    if (!db) return { success: false, message: "Database not initialized" };
    try {
        const invitationId = uuidv4();
        const now = Timestamp.now();
        const expiresAt = new Timestamp(now.seconds + 60, now.nanoseconds); // 1분 유효

        const invitationRef = doc(db, 'invitations', invitationId);

        await setDoc(invitationRef, {
            id: invitationId,
            fromUid,
            fromNickname,
            fromAvatarUrl,
            fromLevel,
            toUid,
            toNickname,
            mode,
            status: 'pending',
            createdAt: serverTimestamp(),
            expiresAt: expiresAt
        });

        // 알림 트리거 (PVP 초대 수신자에게)
        import('@/lib/notification-service').then(({ notifyPvpInvite }) => notifyPvpInvite(toUid, fromNickname, invitationId)).catch(() => {});

        return { success: true, invitationId };
    } catch (error: any) {
        console.error("Error sending battle invitation:", error);
        return { success: false, message: error.message };
    }
}

// 초대 수락 (RTDB 방 생성)
export async function acceptBattleInvitation(
    invitationId: string,
    toUser: { uid: string; nickname: string; level: number; avatarUrl?: string }
) {
    if (!db || !app) return { success: false, message: "Database not initialized" };
    try {
        const invitationRef = doc(db, 'invitations', invitationId);
        const invSnap = await getDoc(invitationRef);

        if (!invSnap.exists()) return { success: false, message: "Invitation not found" };
        const invData = invSnap.data() as BattleInvitation;

        if (invData.status !== 'pending') {
            return { success: false, message: "Invitation is no longer valid" };
        }

        const rtdb = getDatabase(app);
        const battlesRef = ref(rtdb, 'battles');
        const newRoomRef = push(battlesRef);
        const roomId = newRoomRef.key!;

        await set(newRoomRef, {
            roomId,
            battleMode: invData.mode,
            phase: 'deck-select',
            player1: {
                playerId: invData.fromUid,
                playerName: invData.fromNickname,
                playerLevel: invData.fromLevel || 1,
                selectedCards: [],
                cardOrder: [],
                ready: false,
                wins: 0,
                roundResults: [],
                connected: false,
                lastHeartbeat: Date.now()
            },
            player2: {
                playerId: toUser.uid,
                playerName: toUser.nickname,
                playerLevel: toUser.level,
                selectedCards: [],
                cardOrder: [],
                ready: false,
                wins: 0,
                roundResults: [],
                connected: false,
                lastHeartbeat: Date.now()
            },
            currentRound: 0,
            maxRounds: 5,
            winsNeeded: 3,
            finished: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        await updateDoc(invitationRef, {
            status: 'accepted',
            roomId: roomId
        });

        return { success: true, roomId };
    } catch (error) {
        console.error("Error accepting invitation:", error);
        return { success: false };
    }
}

// 초대 거절
export async function declineBattleInvitation(invitationId: string) {
    if (!db) return { success: false };
    try {
        const invitationRef = doc(db, 'invitations', invitationId);
        await updateDoc(invitationRef, {
            status: 'declined'
        });
        return { success: true };
    } catch (error) {
        console.error("Error declining invitation:", error);
        return { success: false };
    }
}

// 초대 취소
export async function cancelBattleInvitation(invitationId: string) {
    if (!db) return { success: false };
    try {
        const invitationRef = doc(db, 'invitations', invitationId);
        await updateDoc(invitationRef, {
            status: 'expired'
        });
        return { success: true };
    } catch (error) {
        console.error("Error canceling invitation:", error);
        return { success: false };
    }
}

// 수신자용 리스너
export function listenForInvitations(userId: string, callback: (invitations: BattleInvitation[]) => void) {
    if (!db) return () => { };
    const q = query(
        collection(db, 'invitations'),
        where('toUid', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(5)
    );

    return onSnapshot(q, (snapshot) => {
        const invitations: BattleInvitation[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data() as BattleInvitation;
            if (data.expiresAt && data.expiresAt.toMillis() > Date.now()) {
                invitations.push(data);
            }
        });
        callback(invitations);
    });
}

// 발신자용 수락 감지 리스너
export function listenForAcceptedInvitations(userId: string, callback: (invitations: BattleInvitation[]) => void) {
    if (!db) return () => { };
    // 내가 보낸 것 중 status가 accepted인 것
    const q = query(
        collection(db, 'invitations'),
        where('fromUid', '==', userId),
        where('status', '==', 'accepted'),
        orderBy('createdAt', 'desc'),
        limit(1)
    );

    return onSnapshot(q, (snapshot) => {
        const invitations: BattleInvitation[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data() as BattleInvitation;
            // 최근 1분 이내에 수락된 것만 유효
            const now = Date.now();
            if (data.createdAt && (now - data.createdAt.toMillis()) < 60000) {
                invitations.push(data);
            }
        });
        callback(invitations);
    });
}
