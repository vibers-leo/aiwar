'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CyberPageLayout from '@/components/CyberPageLayout';
import { loadSupportTickets, updateTicketStatus, loadUniqueRequests, updateUniqueRequestStatus, SupportTicket, UniqueRequest } from '@/lib/firebase-db';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle, MessageSquare, ExternalLink, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';

export default function AdminPage() {
    const router = useRouter();
    const { user, isAdmin, loading: userLoading } = useUser();
    const [activeTab, setActiveTab] = useState<'tickets' | 'requests'>('tickets');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [requests, setRequests] = useState<UniqueRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'tickets') {
                const data = await loadSupportTickets();
                setTickets(data);
            } else {
                const data = await loadUniqueRequests();
                setRequests(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoteTicket = async (id: string, newStatus: any) => {
        if (!confirm(`상태를 ${newStatus}(으)로 변경하시겠습니까?`)) return;
        await updateTicketStatus(id, newStatus);
        fetchData();
    };

    const handleUniqueAction = async (id: string, action: 'approved' | 'rejected') => {
        const comment = prompt(action === 'approved' ? "승인 메시지 (선택)" : "거절 사유 입력");
        if (comment === null) return;

        await updateUniqueRequestStatus(id, action, comment);
        alert(action === 'approved' ? "승인 처리되었습니다." : "거절 처리되었습니다.");
        fetchData();
    };

    // [FIX] Auth guard - Only allow juuuno@naver.com to access admin panel
    if (userLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8">
                <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
                <h1 className="text-3xl font-bold mb-4">접근 권한이 없습니다</h1>
                <p className="text-gray-400 mb-8 text-center">
                    관리자 계정으로 로그인해야 이 페이지에 접근할 수 있습니다.
                </p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold transition-colors"
                >
                    메인으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <CyberPageLayout
            title="ADMIN DASHBOARD"
            subtitle="SYSTEM CONTROL"
            description="시스템 관리 및 요청 승인 패널"
            color="red"
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-white/10 pb-4">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={cn(
                            "px-6 py-2 rounded-lg font-bold transition-all",
                            activeTab === 'tickets' ? "bg-blue-500 text-white" : "text-white/40 hover:bg-white/5"
                        )}
                    >
                        고객 문의 ({tickets.filter(t => t.status === 'open').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={cn(
                            "px-6 py-2 rounded-lg font-bold transition-all",
                            activeTab === 'requests' ? "bg-purple-500 text-white" : "text-white/40 hover:bg-white/5"
                        )}
                    >
                        스튜디오 신청 ({requests.filter(r => r.status === 'pending').length})
                    </button>

                    {/* Quick Links */}
                    <div className="ml-auto flex gap-2">
                        <a
                            href="/admin/ai-monitor"
                            className="px-4 py-2 rounded-lg font-bold bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-500 hover:to-teal-500 transition-all flex items-center gap-2"
                        >
                            🤖 AI 버전 모니터
                        </a>
                        <a
                            href="/admin/card-assets"
                            className="px-4 py-2 rounded-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all flex items-center gap-2"
                        >
                            🎴 카드 에셋 관리
                        </a>
                        <a
                            href="/admin/users"
                            className="px-4 py-2 rounded-lg font-bold bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
                        >
                            👥 유저 관리
                        </a>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="py-20 flex justify-center text-white/40">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {activeTab === 'tickets' ? (
                            // Tickets List
                            tickets.map(ticket => (
                                <div key={ticket.id} className="bg-black/40 border border-white/10 rounded-lg p-6 flex justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold uppercase",
                                                ticket.type === 'error' ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                                            )}>
                                                {ticket.type}
                                            </span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold uppercase border",
                                                ticket.status === 'open' ? "border-green-500 text-green-400" : "border-gray-500 text-gray-500"
                                            )}>
                                                {ticket.status}
                                            </span>
                                            <span className="text-white/40 text-xs">
                                                From: {ticket.userNickname}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">{ticket.title}</h3>
                                        <p className="text-white/70 text-sm whitespace-pre-wrap">{ticket.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {ticket.status !== 'resolved' && (
                                            <button
                                                onClick={() => handleVoteTicket(ticket.id!, 'resolved')}
                                                className="p-2 rounded hover:bg-green-500/20 text-green-400 border border-transparent hover:border-green-500/50 transition-all"
                                                title="해결 완료 처리"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                        )}
                                        {ticket.status !== 'rejected' && (
                                            <button
                                                onClick={() => handleVoteTicket(ticket.id!, 'rejected')}
                                                className="p-2 rounded hover:bg-red-500/20 text-red-400 border border-transparent hover:border-red-500/50 transition-all"
                                                title="기각 처리"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Unique Requests List
                            requests.map(request => (
                                <div key={request.id} className="bg-black/40 border border-white/10 rounded-lg p-6 flex gap-6">
                                    {/* Image Preview */}
                                    <div className="w-32 h-40 bg-black rounded-lg overflow-hidden border border-white/20 flex-shrink-0">
                                        {request.imageUrl ? (
                                            <img src={request.imageUrl} alt={request.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/20">No Img</div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold uppercase",
                                                request.status === 'pending' ? "bg-yellow-500/20 text-yellow-400" :
                                                    request.status === 'approved' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                            )}>
                                                {request.status}
                                            </span>
                                            <span className="text-white/40 text-xs">
                                                Commander: {request.userNickname}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{request.name}</h3>
                                        <p className="text-white/70 text-sm mb-4 bg-white/5 p-3 rounded">{request.description}</p>

                                        {request.status === 'pending' && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleUniqueAction(request.id, 'approved')}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white font-bold text-sm transition-colors"
                                                >
                                                    승인 (카드 생성)
                                                </button>
                                                <button
                                                    onClick={() => handleUniqueAction(request.id, 'rejected')}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-bold text-sm transition-colors"
                                                >
                                                    거절
                                                </button>
                                            </div>
                                        )}
                                        {request.adminComment && (
                                            <p className="mt-3 text-sm text-yellow-400/80">
                                                Admin Comment: {request.adminComment}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {((activeTab === 'tickets' && tickets.length === 0) || (activeTab === 'requests' && requests.length === 0)) && (
                            <div className="py-20 text-center text-white/30">
                                데이터가 없습니다.
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </CyberPageLayout>
    );
}
