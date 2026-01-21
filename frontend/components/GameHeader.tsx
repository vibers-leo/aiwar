'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useUser } from '@/context/UserContext';

export default function GameHeader() {
    const pathname = usePathname();
    const { coins, tokens, maxTokens, level } = useUser();

    const menuItems = [
        { name: '스토리', path: '/story', icon: '📖' },
        { name: '대전', path: '/battle', icon: '⚔️' },
        { name: 'AI 군단', path: '/factions', icon: '🤖' },
        { name: 'LAB', path: '/lab', icon: '🔬' },
        { name: '상점', path: '/shop', icon: '🛒' },
        { name: 'PVP', path: '/pvp', icon: '🎯' },
        { name: '랭킹', path: '/ranking', icon: '🏆' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-md border-b-2 border-purple-500/50 z-50">
            <div className="h-full px-6 flex items-center justify-between">
                {/* 로고 */}
                <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
                    <div className="text-3xl font-bold text-gradient">AGI WAR</div>
                    <div className="text-sm text-gray-400">전쟁의 서막</div>
                </Link>

                {/* 메인 메뉴 */}
                <nav className="flex items-center gap-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${pathname === item.path
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                                }`}
                        >
                            <span className="mr-1">{item.icon}</span>
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* 유저 정보 */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-lg border border-yellow-500/50">
                        <span className="text-yellow-400">💰</span>
                        <span className="font-bold text-yellow-300">{coins.toLocaleString()}</span>
                    </div>
                    <div
                        className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/50 cursor-help"
                        title={`최대 보유량: ${maxTokens.toLocaleString()}\n(기본 1000 + 레벨 보너스)`}
                    >
                        <span className="text-purple-400">💎</span>
                        <span className="font-bold text-purple-300">
                            {tokens.toLocaleString()}
                            <span className="text-purple-500/80 text-xs ml-1 font-normal">
                                / {maxTokens.toLocaleString()}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/50">
                        <span className="text-blue-400">⭐</span>
                        <span className="font-bold text-blue-300">Lv.{level}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
