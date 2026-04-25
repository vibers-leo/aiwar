import { getDatabase, ref, push, onValue, update, query, orderByChild, limitToLast, off } from 'firebase/database';
import app from '@/lib/firebase';

export interface GameNotification {
    id?: string;
    type: 'pvp_match' | 'daily_reward' | 'card_ready' | 'friend_request' | 'pvp_invite' | 'quest_complete' | 'level_up' | 'system';
    title: string;
    message: string;
    read: boolean;
    createdAt: number;
    data?: Record<string, any>; // 추가 데이터 (roomId, questId 등)
}

const NOTIFICATION_ICONS: Record<GameNotification['type'], string> = {
    pvp_match: '⚔️',
    daily_reward: '🎁',
    card_ready: '🃏',
    friend_request: '👋',
    pvp_invite: '🏟️',
    quest_complete: '✅',
    level_up: '⬆️',
    system: '📢',
};

export function getNotificationIcon(type: GameNotification['type']): string {
    return NOTIFICATION_ICONS[type] || '🔔';
}

// 알림 전송
export async function sendNotification(
    userId: string,
    notification: Omit<GameNotification, 'id' | 'read' | 'createdAt'>
): Promise<void> {
    const db = getDatabase(app || undefined);
    const notifRef = ref(db, `notifications/${userId}`);
    await push(notifRef, {
        ...notification,
        read: false,
        createdAt: Date.now(),
    });
}

// 알림 실시간 구독
export function listenToNotifications(
    userId: string,
    callback: (notifications: GameNotification[]) => void
): () => void {
    const db = getDatabase(app || undefined);
    const notifRef = query(
        ref(db, `notifications/${userId}`),
        orderByChild('createdAt'),
        limitToLast(50)
    );

    onValue(notifRef, (snapshot) => {
        const notifications: GameNotification[] = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                notifications.push({
                    id: child.key!,
                    ...child.val(),
                });
            });
        }
        // 최신순 정렬
        notifications.sort((a, b) => b.createdAt - a.createdAt);
        callback(notifications);
    });

    return () => off(notifRef);
}

// 알림 읽음 처리
export async function markAsRead(userId: string, notificationId: string): Promise<void> {
    const db = getDatabase(app || undefined);
    const notifRef = ref(db, `notifications/${userId}/${notificationId}`);
    await update(notifRef, { read: true });
}

// 모든 알림 읽음 처리
export async function markAllAsRead(userId: string): Promise<void> {
    const db = getDatabase(app || undefined);
    const notifRef = ref(db, `notifications/${userId}`);

    return new Promise((resolve) => {
        onValue(notifRef, (snapshot) => {
            if (snapshot.exists()) {
                const updates: Record<string, any> = {};
                snapshot.forEach((child) => {
                    if (!child.val().read) {
                        updates[`${child.key}/read`] = true;
                    }
                });
                if (Object.keys(updates).length > 0) {
                    update(notifRef, updates).then(resolve);
                } else {
                    resolve();
                }
            } else {
                resolve();
            }
        }, { onlyOnce: true });
    });
}

// === 편의 함수: 각 알림 타입별 전송 ===

export async function notifyDailyReward(userId: string): Promise<void> {
    await sendNotification(userId, {
        type: 'daily_reward',
        title: '일일 보상 준비 완료!',
        message: '오늘의 보상이 준비되었어요. 지금 수령하세요!',
    });
}

export async function notifyCardReady(userId: string, factionName: string): Promise<void> {
    await sendNotification(userId, {
        type: 'card_ready',
        title: '카드 생성 완료!',
        message: `${factionName} 팩션에서 새 카드가 생성되었어요.`,
    });
}

export async function notifyFriendRequest(userId: string, fromName: string): Promise<void> {
    await sendNotification(userId, {
        type: 'friend_request',
        title: '친구 요청',
        message: `${fromName}님이 친구 요청을 보냈어요.`,
    });
}

export async function notifyPvpInvite(userId: string, fromName: string, roomId: string): Promise<void> {
    await sendNotification(userId, {
        type: 'pvp_invite',
        title: 'PVP 도전장!',
        message: `${fromName}님이 대전을 신청했어요!`,
        data: { roomId },
    });
}

export async function notifyQuestComplete(userId: string, questTitle: string): Promise<void> {
    await sendNotification(userId, {
        type: 'quest_complete',
        title: '퀘스트 완료!',
        message: `"${questTitle}" 퀘스트를 달성했어요. 보상을 수령하세요!`,
    });
}

export async function notifyLevelUp(userId: string, newLevel: number): Promise<void> {
    await sendNotification(userId, {
        type: 'level_up',
        title: '레벨 업!',
        message: `축하해요! 레벨 ${newLevel}에 도달했어요!`,
    });
}
