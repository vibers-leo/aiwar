'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, User } from 'lucide-react';
import { Modal, ModalBody, ModalHeader, ModalFooter } from './ui/custom/Modal';
import { Button } from './ui/custom/Button';
import { Avatar } from './ui/custom/Avatar';
import { sendMessage, subscribeToMessages, getOrCreateChatRoom, ChatMessage } from '@/lib/chat-system';
import { useUser } from '@/context/UserContext';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUser: {
        uid: string;
        nickname: string;
        avatarUrl?: string;
    } | null;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, targetUser }) => {
    const { user } = useUser();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && user && targetUser) {
            setIsLoading(true);
            getOrCreateChatRoom(user.uid, targetUser.uid)
                .then(id => {
                    setRoomId(id);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to initialize chat room:", err);
                    setIsLoading(false);
                });
        }
    }, [isOpen, user, targetUser]);

    useEffect(() => {
        if (roomId) {
            const unsubscribe = subscribeToMessages(roomId, (newMessages) => {
                setMessages(newMessages);
                // Scroll to bottom
                setTimeout(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    }
                }, 100);
            });
            return () => unsubscribe();
        }
    }, [roomId]);

    const handleSend = async () => {
        if (!inputText.trim() || !roomId || !user) return;

        const text = inputText;
        setInputText('');
        const result = await sendMessage(roomId, user.uid, text);
        if (!result.success) {
            // Handle error (maybe put text back or show alert)
            setInputText(text);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!targetUser) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <Avatar src={targetUser.avatarUrl} className="w-10 h-10 border border-cyan-500/50" />
                    <div>
                        <h3 className="text-white font-bold orbitron text-sm">{targetUser.nickname}</h3>
                        <p className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> ONLINE
                        </p>
                    </div>
                </div>
            </ModalHeader>

            <ModalBody className="p-0 flex flex-col h-[400px]">
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/20">
                            <MessageSquare size={40} className="mb-2" />
                            <p className="text-sm">대화 내용이 없습니다.</p>
                            <p className="text-[10px] uppercase tracking-widest mt-1">Start a conversation</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.senderId === user?.uid;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={msg.id || idx}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe
                                            ? 'bg-cyan-600/20 border border-cyan-500/30 text-white rounded-tr-none'
                                            : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                        {msg.timestamp && (
                                            <div className="text-[9px] opacity-30 mt-1 text-right">
                                                {new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="relative">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="메시지를 입력하세요..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all resize-none h-12"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
};
