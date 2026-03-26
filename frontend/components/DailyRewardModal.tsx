'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import {
    checkDailyReward,
    claimDailyReward,
    DAILY_REWARD_TABLE,
    getRewardForDay,
    DailyRewardCheckResult,
} from '@/lib/daily-reward-system';
import { cn } from '@/lib/utils';

export default function DailyRewardModal() {
    const { user, addCoins } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [checkResult, setCheckResult] = useState<DailyRewardCheckResult | null>(null);
    const [claimed, setClaimed] = useState(false);
    const [claimedCoins, setClaimedCoins] = useState(0);
    const [loading, setLoading] = useState(false);

    // 로그인 시 자동 체크
    useEffect(() => {
        if (!user?.uid) return;

        const sessionKey = `daily_reward_checked_${user.uid}`;
        // 세션 내 중복 팝업 방지
        if (sessionStorage.getItem(sessionKey)) return;

        const timer = setTimeout(async () => {
            try {
                const result = await checkDailyReward(user.uid);
                if (result.canClaim) {
                    setCheckResult(result);
                    setIsOpen(true);
                }
                sessionStorage.setItem(sessionKey, 'true');
            } catch (e) {
                console.error('[DailyReward] 체크 실패:', e);
            }
        }, 1500); // 로그인 후 1.5초 대기

        return () => clearTimeout(timer);
    }, [user?.uid]);

    const handleClaim = useCallback(async () => {
        if (!user?.uid || !checkResult?.canClaim || loading) return;
        setLoading(true);

        try {
            const result = await claimDailyReward(user.uid);
            await addCoins(result.reward.coins);
            setClaimedCoins(result.reward.coins);
            setClaimed(true);
        } catch (e) {
            console.error('[DailyReward] 수령 실패:', e);
        } finally {
            setLoading(false);
        }
    }, [user?.uid, checkResult, loading, addCoins]);

    const handleClose = () => {
        setIsOpen(false);
        setClaimed(false);
        setCheckResult(null);
    };

    if (!isOpen || !checkResult) return null;

    const currentStreak = checkResult.currentStreak;
    const reward = checkResult.reward!;

    // 14일 보상 표 (현재 위치 하이라이트)
    const rewardPreview = DAILY_REWARD_TABLE.slice(0, 14);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* 배경 오버레이 */}
                    <motion.div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={claimed ? handleClose : undefined}
                    />

                    {/* 모달 본체 */}
                    <motion.div
                        className="relative w-full max-w-md bg-gray-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.15)]"
                        initial={{ scale: 0.8, y: 40 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 40, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20 }}
                    >
                        {/* 헤더 */}
                        <div className="relative bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-b border-amber-500/20 px-6 py-4">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.1),transparent_70%)]" />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-amber-400 orbitron tracking-wider">
                                        일일 출석 보상
                                    </h2>
                                    <p className="text-xs text-amber-500/60 font-mono mt-1">
                                        DAILY LOGIN REWARD
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl">🔥</div>
                                    <p className="text-xs font-bold text-orange-400 font-mono">
                                        {currentStreak}일 연속
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 보상 그리드 */}
                        <div className="p-4">
                            <div className="grid grid-cols-7 gap-1.5 mb-5">
                                {rewardPreview.map((tier, i) => {
                                    const dayNum = i + 1;
                                    const isToday = dayNum === currentStreak;
                                    const isPast = dayNum < currentStreak;
                                    const isFuture = dayNum > currentStreak;

                                    return (
                                        <motion.div
                                            key={dayNum}
                                            className={cn(
                                                'relative flex flex-col items-center justify-center rounded-lg p-1.5 text-center border transition-all min-h-[64px]',
                                                isToday && !claimed && 'border-amber-400 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.3)] scale-105',
                                                isToday && claimed && 'border-green-400 bg-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.3)]',
                                                isPast && 'border-white/5 bg-white/5 opacity-40',
                                                isFuture && 'border-white/10 bg-white/5 opacity-60',
                                            )}
                                            initial={isToday ? { scale: 0.5 } : undefined}
                                            animate={isToday ? { scale: 1.05 } : undefined}
                                            transition={{ type: 'spring', delay: 0.1 * i, damping: 15 }}
                                        >
                                            <span className="text-[10px] font-mono text-white/40 mb-0.5">
                                                D{dayNum}
                                            </span>
                                            <span className="text-sm">
                                                {isPast ? '✅' : tier.icon}
                                            </span>
                                            <span className={cn(
                                                'text-[9px] font-bold mt-0.5',
                                                tier.special ? 'text-amber-300' : 'text-white/50',
                                            )}>
                                                {tier.coins}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* 오늘의 보상 하이라이트 */}
                            <motion.div
                                className={cn(
                                    'rounded-xl p-5 text-center border mb-4',
                                    claimed
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/20',
                                )}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {claimed ? (
                                    <>
                                        <motion.div
                                            className="text-5xl mb-3"
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                                        >
                                            🎉
                                        </motion.div>
                                        <p className="text-green-400 font-bold text-lg mb-1">
                                            보상 수령 완료!
                                        </p>
                                        <motion.p
                                            className="text-2xl font-black text-amber-400 orbitron"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.4 }}
                                        >
                                            +{claimedCoins} 코인
                                        </motion.p>
                                        <p className="text-xs text-white/40 mt-2">
                                            내일도 접속해서 연속 보상을 받으세요!
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-4xl mb-2">{reward.icon}</div>
                                        <p className="text-amber-400 font-bold text-sm mb-1">
                                            {reward.label}
                                        </p>
                                        <p className="text-3xl font-black text-white orbitron mb-1">
                                            {reward.coins} <span className="text-amber-400 text-lg">코인</span>
                                        </p>
                                        {reward.special && (
                                            <p className="text-xs text-amber-500/80 animate-pulse">
                                                ★ 특별 보상일 ★
                                            </p>
                                        )}
                                    </>
                                )}
                            </motion.div>

                            {/* 버튼 */}
                            {claimed ? (
                                <motion.button
                                    onClick={handleClose}
                                    className="w-full py-3 rounded-lg bg-white/10 text-white/70 font-bold text-sm hover:bg-white/20 transition-all font-mono tracking-wider"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    닫기
                                </motion.button>
                            ) : (
                                <motion.button
                                    onClick={handleClaim}
                                    disabled={loading}
                                    className={cn(
                                        'w-full py-3.5 rounded-lg font-bold text-sm tracking-wider transition-all',
                                        loading
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]',
                                    )}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {loading ? '수령 중...' : '보상 받기'}
                                </motion.button>
                            )}

                            {/* 누적 출석 */}
                            <p className="text-center text-[10px] text-white/20 font-mono mt-3">
                                누적 출석: {checkResult.totalLogins + (claimed ? 1 : 0)}일 | 연속: {currentStreak}일
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
