'use client';

import { useState, useEffect } from 'react';
import { getAllUsersWithStatus, migrateUserStarterPackStatus } from '@/lib/firebase-db';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface UserStatus {
    uid: string;
    nickname: string;
    email?: string;
    level: number;
    tutorialCompleted: boolean;
    hasReceivedStarterPack: boolean;
    createdAt: any;
    lastLogin: any;
    inventoryCount?: number;
}

export default function AdminUsersPage() {
    const { isAdmin, loading: userLoading } = useUser();
    const router = useRouter();
    const [users, setUsers] = useState<UserStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'no-tutorial' | 'no-pack'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!userLoading && !isAdmin) {
            router.push('/main');
        }
    }, [isAdmin, userLoading, router]);

    useEffect(() => {
        if (!isAdmin) return;

        const loadUsers = async () => {
            try {
                setLoading(true);
                const data = await getAllUsersWithStatus();
                setUsers(data);
            } catch (error) {
                console.error('Failed to load users:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
    }, [isAdmin]);

    const handleMigrate = async (uid: string) => {
        if (!confirm('이 유저의 스타터팩 수령 상태를 "수령 완료"로 변경하시겠습니까?')) return;

        try {
            await migrateUserStarterPackStatus(uid, true);
            // Reload users
            const data = await getAllUsersWithStatus();
            setUsers(data);
            alert('마이그레이션 완료!');
        } catch (error) {
            alert('마이그레이션 실패: ' + error);
        }
    };

    const filteredUsers = users.filter(user => {
        // Search filter
        if (searchTerm && !user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !user.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Status filter
        if (filter === 'no-tutorial' && user.tutorialCompleted) return false;
        if (filter === 'no-pack' && user.hasReceivedStarterPack) return false;

        return true;
    });

    const stats = {
        total: users.length,
        tutorialCompleted: users.filter(u => u.tutorialCompleted).length,
        starterPackReceived: users.filter(u => u.hasReceivedStarterPack).length,
        needsMigration: users.filter(u => !u.hasReceivedStarterPack && u.level > 1).length
    };

    if (userLoading || !isAdmin) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a1a] text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">👥 유저 관리</h1>
                    <p className="text-white/60">튜토리얼 완료 및 스타터팩 수령 현황</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-white/60 text-sm mb-1">전체 유저</div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <div className="text-green-400 text-sm mb-1">튜토리얼 완료</div>
                        <div className="text-2xl font-bold text-green-400">{stats.tutorialCompleted}</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="text-blue-400 text-sm mb-1">스타터팩 수령</div>
                        <div className="text-2xl font-bold text-blue-400">{stats.starterPackReceived}</div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <div className="text-yellow-400 text-sm mb-1">마이그레이션 필요</div>
                        <div className="text-2xl font-bold text-yellow-400">{stats.needsMigration}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                    <div className="flex gap-4 items-center">
                        <input
                            type="text"
                            placeholder="닉네임 또는 이메일 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                        >
                            <option value="all">전체 보기</option>
                            <option value="no-tutorial">튜토리얼 미완료</option>
                            <option value="no-pack">스타터팩 미수령</option>
                        </select>
                    </div>
                </div>

                {/* User Table */}
                {loading ? (
                    <div className="text-center py-12 text-white/60">로딩 중...</div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-white/80">닉네임</th>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-white/80">이메일</th>
                                    <th className="px-4 py-3 text-center text-sm font-bold text-white/80">레벨</th>
                                    <th className="px-4 py-3 text-center text-sm font-bold text-white/80">튜토리얼</th>
                                    <th className="px-4 py-3 text-center text-sm font-bold text-white/80">스타터팩</th>
                                    <th className="px-4 py-3 text-center text-sm font-bold text-white/80">가입일</th>
                                    <th className="px-4 py-3 text-center text-sm font-bold text-white/80">액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, idx) => (
                                    <tr key={user.uid} className={`border-b border-white/5 ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                                        <td className="px-4 py-3 font-medium">{user.nickname}</td>
                                        <td className="px-4 py-3 text-white/60 text-sm">{user.email || '-'}</td>
                                        <td className="px-4 py-3 text-center">Lv.{user.level}</td>
                                        <td className="px-4 py-3 text-center">
                                            {user.tutorialCompleted ? (
                                                <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">완료</span>
                                            ) : (
                                                <span className="inline-block px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold">미완료</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {user.hasReceivedStarterPack ? (
                                                <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">수령</span>
                                            ) : (
                                                <span className="inline-block px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold">미수령</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-white/60 text-sm">
                                            {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('ko-KR') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {!user.hasReceivedStarterPack && user.level > 1 && (
                                                <button
                                                    onClick={() => handleMigrate(user.uid)}
                                                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-xs font-bold transition-colors"
                                                >
                                                    마이그레이션
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12 text-white/40">
                                조건에 맞는 유저가 없습니다.
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 text-sm text-white/40">
                    총 {filteredUsers.length}명 표시 중
                </div>
            </div>
        </div>
    );
}
