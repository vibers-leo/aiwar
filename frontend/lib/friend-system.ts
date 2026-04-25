
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
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from './firebase';

export interface FriendUser {
    uid: string;
    nickname: string;
    avatarUrl: string;
    level: number;
    status?: 'pending_sent' | 'pending_received' | 'accepted';
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
            where('nickname', '<=', nickname + '\uf8ff'),
            limit(20)
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
                updatedAt: null
            });
        });

        return users;
    } catch (error) {
        console.error("Error searching users:", error);
        return [];
    }
}

// 최근 활동 유저 추천 (친구 추가용)
export async function getRecommendedUsers(currentUserId: string, limitCount = 5): Promise<FriendUser[]> {
    if (!db) return [];
    try {
        const usersRef = collection(db, 'users');
        // lastLogin 기준으로 내림차순 정렬 (최근 접속자)
        // [Note] 복합 인덱스 필요 가능성 있음
        const q = query(usersRef, orderBy('lastLogin', 'desc'), limit(limitCount + 1));

        const snapshot = await getDocs(q);
        const users: FriendUser[] = [];

        snapshot.forEach(doc => {
            if (doc.id === currentUserId) return; // 나 자신 제외
            const data = doc.data();
            users.push({
                uid: doc.id,
                nickname: data.nickname || 'User',
                avatarUrl: data.avatarUrl || '',
                level: data.level || 1,
                updatedAt: data.lastLogin
            });
        });

        return users.slice(0, limitCount);
    } catch (error) {
        console.warn("Failed to fetch recommended users (likely missing index):", error);
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
        // 알림 트리거 (친구 요청 수신자에게)
        import('@/lib/notification-service').then(({ notifyFriendRequest }) => notifyFriendRequest(targetUserId, currentUserProfile.nickname || 'Unknown')).catch(() => {});

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
