'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useFirebase } from '@/components/FirebaseProvider';
import {
    GameNotification,
    listenToNotifications,
    markAsRead as markAsReadService,
    markAllAsRead as markAllAsReadService,
    sendNotification,
    getNotificationIcon,
} from '@/lib/notification-service';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'levelup' | 'enhance' | 'fusion'
    | 'pvp_match' | 'daily_reward' | 'card_ready' | 'friend_request' | 'pvp_invite' | 'quest_complete' | 'level_up' | 'system';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    link?: string;
    icon?: string;
    data?: Record<string, any>;
}

interface NotificationContextType {
    notifications: NotificationItem[];
    unreadCount: number;
    addNotification: (type: NotificationType, title: string, message: string, link?: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    showPanel: boolean;
    togglePanel: () => void;
    closePanel: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useFirebase();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);

    // Firebase Realtime DB 실시간 구독
    useEffect(() => {
        if (authLoading || !user?.uid) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        const unsubscribe = listenToNotifications(user.uid, (firebaseNotifs) => {
            const items: NotificationItem[] = firebaseNotifs.map(n => ({
                id: n.id || '',
                type: n.type as NotificationType,
                title: n.title,
                message: n.message,
                timestamp: n.createdAt,
                read: n.read,
                icon: getNotificationIcon(n.type),
                data: n.data,
            }));
            setNotifications(items);
            setUnreadCount(items.filter(n => !n.read).length);
        });

        return unsubscribe;
    }, [user?.uid, authLoading]);

    // 알림 추가 (Firebase에 저장)
    const addNotification = useCallback((type: NotificationType, title: string, message: string, link?: string) => {
        if (!user?.uid) return;

        const gameType = (['pvp_match', 'daily_reward', 'card_ready', 'friend_request', 'pvp_invite', 'quest_complete', 'level_up', 'system'].includes(type)
            ? type
            : 'system') as GameNotification['type'];

        sendNotification(user.uid, {
            type: gameType,
            title,
            message,
            data: link ? { link } : undefined,
        });
    }, [user?.uid]);

    const markAsRead = useCallback((id: string) => {
        if (!user?.uid) return;
        markAsReadService(user.uid, id);
    }, [user?.uid]);

    const markAllAsRead = useCallback(() => {
        if (!user?.uid) return;
        markAllAsReadService(user.uid);
    }, [user?.uid]);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const togglePanel = useCallback(() => setShowPanel(prev => !prev), []);
    const closePanel = useCallback(() => setShowPanel(false), []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            showPanel,
            togglePanel,
            closePanel,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
