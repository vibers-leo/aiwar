'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentUser, logout, User } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        setUser(getCurrentUser());
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <>
            {/* 햄버거 버튼 (모바일만) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 md:hidden p-3 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                aria-label="메뉴"
            >
                <div className="w-6 h-5 flex flex-col justify-between">
                    <span className={`block h-0.5 w-full bg-white transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                    <span className={`block h-0.5 w-full bg-white transition-all ${isOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`block h-0.5 w-full bg-white transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </div>
            </button>

            {/* 오버레이 */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* 사이드 메뉴 */}
            <div
                className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-purple-900 to-indigo-900 z-50 transform transition-transform duration-300 md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6 h-full flex flex-col">
                    {/* 헤더 */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white">메뉴</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>

                        {/* 사용자 정보 */}
                        {user && (
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-white font-bold">{user.nickname}</div>
                                <div className="text-gray-300 text-sm">@{user.username}</div>
                            </div>
                        )}
                    </div>

                    {/* 메뉴 항목 */}
                    <nav className="flex-1 space-y-2">
                        <Link
                            href="/"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            🏠 메인 홈
                        </Link>

                        <Link
                            href="/missions"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            🎯 일일 미션
                        </Link>

                        <Link
                            href="/story"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            📖 스토리
                        </Link>

                        <Link
                            href="/battle"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            ⚔️ 대전
                        </Link>

                        <Link
                            href="/pvp"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            ⚔️ PvP
                        </Link>

                        <Link
                            href="/ranking"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            🏆 랭킹
                        </Link>

                        <Link
                            href="/my-cards"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            🎴 인벤토리
                        </Link>

                        <Link
                            href="/shop"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            🛒 상점
                        </Link>

                        <Link
                            href="/achievements"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            🎖️ 업적
                        </Link>

                        <Link
                            href="/settings"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            ⚙️ 설정
                        </Link>
                    </nav>

                    {/* 하단 버튼 */}
                    <div className="mt-4">
                        {user && (
                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                            >
                                🚪 로그아웃
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
