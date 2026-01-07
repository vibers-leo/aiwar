
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    updateDoc,
    serverTimestamp,
    runTransaction,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface FriendUser {
    uid: string;
    nickname: string;
    avatarUrl: string;
    level: number;
    status: 'pending_sent' | 'pending_received' | 'accepted';
    updatedAt: any;
}

// 닉네임으로 사용자 검색
export async function searchUsers(nickname: string): Promise<FriendUser[]> {
    if (!nickname) return [];
    if (!db) {
        console.error("Database not initialized");
        return [];
    }

    try {
        const usersRef = collection(db, 'users');
        // 'nickname' 필드가 있다고 가정
        // 정확한 일치 검색 또는 유사 검색
        const q = query(
            usersRef,
            where('nickname', '>=', nickname),
            where('nickname', '<=', nickname + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);
        const users: FriendUser[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({
                uid: doc.id,
                nickname: data.nickname || 'Unknown',
                avatarUrl: data.avatarUrl || '',
                level: data.level || 1,
                status: 'accepted', // 검색 결과는 상태와 무관하지만 타입 일치를 위해 임시 설정
                updatedAt: null
            });
        });

        return users;
    } catch (error) {
        console.error("Error searching users:", error);
        return [];
    }
}

// 친구 요청 전송
export async function sendFriendRequest(currentUserId: string, currentUserProfile: any, targetUserId: string, targetUserProfile: any) {
    if (!currentUserId || !targetUserId) throw new Error("Invalid User IDs");
    if (!db) return { success: false, message: "Database not initialized" };

    const userFriendRef = doc(db, 'users', currentUserId, 'friends', targetUserId);
    const targetFriendRef = doc(db, 'users', targetUserId, 'friends', currentUserId);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userFriendRef);
            if (userDoc.exists()) {
                throw new Error("Friend request already sent or users are already friends.");
            }

            // 내 쪽: 보냄 표시
            transaction.set(userFriendRef, {
                uid: targetUserId,
                nickname: targetUserProfile.nickname,
                avatarUrl: targetUserProfile.avatarUrl || '',
                level: targetUserProfile.level || 1,
                status: 'pending_sent',
                updatedAt: serverTimestamp()
            });

            // 상대 쪽: 받음 표시
            transaction.set(targetFriendRef, {
                uid: currentUserId,
                nickname: currentUserProfile.nickname,
                avatarUrl: currentUserProfile.avatarUrl || '',
                level: currentUserProfile.level || 1,
                status: 'pending_received',
                updatedAt: serverTimestamp()
            });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error sending friend request:", error);
        return { success: false, message: error.message };
    }
}

// 친구 요청 수락
export async function acceptFriendRequest(currentUserId: string, targetUserId: string) {
    if (!db) return { success: false, message: "Database not initialized" };

    const userFriendRef = doc(db, 'users', currentUserId, 'friends', targetUserId);
    const targetFriendRef = doc(db, 'users', targetUserId, 'friends', currentUserId);

    try {
        await runTransaction(db, async (transaction) => {
            transaction.update(userFriendRef, {
                status: 'accepted',
                updatedAt: serverTimestamp()
            });
            transaction.update(targetFriendRef, {
                status: 'accepted',
                updatedAt: serverTimestamp()
            });
        });
        return { success: true };
    } catch (error) {
        console.error("Error accepting friend request:", error);
        return { success: false };
    }
}

// 친구 요청 거절 또는 취소 또는 친구 삭제
export async function removeFriend(currentUserId: string, targetUserId: string) {
    if (!db) return { success: false, message: "Database not initialized" };

    const userFriendRef = doc(db, 'users', currentUserId, 'friends', targetUserId);
    const targetFriendRef = doc(db, 'users', targetUserId, 'friends', currentUserId);

    try {
        await runTransaction(db, async (transaction) => {
            transaction.delete(userFriendRef);
            transaction.delete(targetFriendRef);
        });
        return { success: true };
    } catch (error) {
        console.error("Error removing friend:", error);
        return { success: false };
    }
}
