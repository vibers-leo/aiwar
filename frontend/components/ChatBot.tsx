'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';

interface Message {
    role: 'user' | 'bot';
    content: string;
    timestamp: number;
}

const ZEROCLAW_TOKEN = 'zc_f4eaf977f512bac21e61013b93f5374c37419ec7fda1015ce502e0343fd7bfe7';
const WEBHOOK_URL = '/api/chatbot';

function cleanResponse(text: string): string {
    // tool_code 블록 제거
    return text.replace(/<tool_code>[\s\S]*?<\/tool_code>\n?/g, '').trim();
}

export default function ChatBot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: '안녕하세요! AGI WAR 도우미예요. 게임에 대해 궁금한 점을 물어보세요!', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
        setLoading(true);

        try {
            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            if (!res.ok) throw new Error('응답 오류');

            const data = await res.json();
            const cleaned = cleanResponse(data.response || '죄송해요, 답변을 생성하지 못했어요.');

            setMessages(prev => [...prev, { role: 'bot', content: cleaned, timestamp: Date.now() }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'bot',
                content: '연결에 문제가 있어요. 잠시 후 다시 시도해 주세요.',
                timestamp: Date.now()
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* 플로팅 버튼 */}
            <AnimatePresence>
                {!open && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={() => setOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-110 transition-all"
                    >
                        <MessageCircle size={24} className="text-white" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* 채팅 패널 */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-120px)] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Bot size={20} className="text-cyan-400" />
                                <div>
                                    <h3 className="text-sm font-bold text-white">AGI WAR 도우미</h3>
                                    <p className="text-[10px] text-cyan-400/70">Powered by ZeroClaw</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition">
                                <X size={18} className="text-white/50" />
                            </button>
                        </div>

                        {/* 메시지 영역 */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-cyan-500/20 text-white border border-cyan-500/30'
                                            : 'bg-white/5 text-white/80 border border-white/10'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                                        <Loader2 size={16} className="text-cyan-400 animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 입력 */}
                        <div className="p-3 border-t border-white/10">
                            <div className="flex gap-2">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    placeholder="질문을 입력하세요..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                    className="p-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg transition"
                                >
                                    <Send size={16} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
