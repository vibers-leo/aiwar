'use client';

import { useNotification } from '@/context/NotificationContext';
import { Bell, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNotificationIcon } from '@/lib/notification-service';

function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
}

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, showPanel, togglePanel, closePanel } = useNotification();
    const panelRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // 패널 바깥 클릭 시 닫기
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                closePanel();
            }
        };
        if (showPanel) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showPanel, closePanel]);

    const handleNotifClick = (notif: typeof notifications[0]) => {
        markAsRead(notif.id);
        if (notif.data?.link) {
            router.push(notif.data.link);
            closePanel();
        } else if (notif.data?.roomId) {
            router.push(`/pvp/room/${notif.data.roomId}`);
            closePanel();
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* 벨 아이콘 */}
            <button
                onClick={togglePanel}
                className="relative p-2 rounded-lg hover:bg-white/10 transition"
            >
                <Bell size={20} className="text-white/70" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* 알림 패널 */}
            <AnimatePresence>
                {showPanel && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-80 max-h-[70vh] bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <h3 className="text-sm font-bold text-white">알림</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                                    >
                                        모두 읽음
                                    </button>
                                )}
                                <button onClick={closePanel} className="p-1 hover:bg-white/10 rounded">
                                    <X size={14} className="text-white/50" />
                                </button>
                            </div>
                        </div>

                        {/* 알림 목록 */}
                        <div className="overflow-y-auto max-h-[calc(70vh-48px)]">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center text-white/40 text-sm">
                                    알림이 없어요
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotifClick(notif)}
                                        className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${
                                            !notif.read ? 'bg-cyan-500/5' : ''
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <span className="text-lg flex-shrink-0 mt-0.5">
                                                {notif.icon || '🔔'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-sm font-medium truncate ${
                                                        notif.read ? 'text-white/60' : 'text-white'
                                                    }`}>
                                                        {notif.title}
                                                    </p>
                                                    {!notif.read && (
                                                        <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-white/25 mt-1">
                                                    {timeAgo(notif.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
