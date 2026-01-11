'use client';

import { useRouter } from 'next/navigation';
import { UserSubscription } from '@/lib/faction-subscription';
import { TIER_CONFIGS } from '@/lib/faction-subscription';
import { FACTIONS_DATA } from '@/lib/faction-subscription';
import { cn } from '@/lib/utils';

interface SubscriptionWarningModalProps {
    isOpen: boolean;
    subscriptions: UserSubscription[];
    onConfirmLogout: () => void;
    onCancel: () => void;
}

export default function SubscriptionWarningModal({
    isOpen,
    subscriptions,
    onConfirmLogout,
    onCancel,
}: SubscriptionWarningModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    // 활성 구독만 필터링
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

    // 총 일일 비용 계산
    const totalDailyCost = activeSubscriptions.reduce((total, sub) => {
        const tierConfig = TIER_CONFIGS[sub.tier];
        return total + (tierConfig?.dailyCost || 0);
    }, 0);

    // 구독이 없으면 모달 표시 안 함
    if (activeSubscriptions.length === 0) {
        onConfirmLogout();
        return null;
    }

    const handleManageSubscriptions = () => {
        onCancel();
        router.push('/shop');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-2 border-yellow-500/50 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden">
                {/* 경고 헤더 */}
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 flex items-center gap-4">
                    <div className="text-5xl animate-pulse">⚠️</div>
                    <div>
                        <h2 className="text-2xl font-black text-white">잠깐! AI 군단 구독 중입니다</h2>
                        <p className="text-yellow-100 text-sm mt-1">
                            로그아웃 후에도 구독 비용이 계속 차감됩니다
                        </p>
                    </div>
                </div>

                {/* 구독 목록 */}
                <div className="p-6 space-y-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <p className="text-white/90 text-sm leading-relaxed">
                            현재 <span className="font-bold text-yellow-400">{activeSubscriptions.length}개</span>의 AI 군단을 구독 중입니다.
                            <br />
                            이대로 로그아웃하면 <span className="font-bold text-red-400">매일 {totalDailyCost} 코인</span>이 자동으로 차감됩니다.
                        </p>
                    </div>

                    {/* 활성 구독 카드 */}
                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {activeSubscriptions.map((sub) => {
                            const tierConfig = TIER_CONFIGS[sub.tier];
                            const faction = FACTIONS_DATA.factions.find(f => f.id === sub.factionId);

                            return (
                                <div
                                    key={sub.id || sub.factionId}
                                    className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">🤖</div>
                                        <div>
                                            <h3 className="font-bold text-white">{faction?.displayName || sub.factionId}</h3>
                                            <p className="text-xs text-white/60">
                                                {tierConfig?.koreanName} 등급
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-red-400 font-bold">
                                            -{tierConfig?.dailyCost || 0} 코인/일
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 총 비용 강조 */}
                    <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-2 border-red-500/50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-bold text-lg">총 일일 비용</span>
                            <span className="text-red-400 font-black text-2xl">
                                -{totalDailyCost} 코인/일
                            </span>
                        </div>
                    </div>
                </div>

                {/* 액션 버튼 */}
                <div className="p-6 bg-black/50 border-t border-white/10 flex flex-col gap-3">
                    <button
                        onClick={handleManageSubscriptions}
                        className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg hover:scale-105"
                    >
                        📋 구독 관리 페이지로 이동
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20"
                        >
                            취소
                        </button>
                        <button
                            onClick={onConfirmLogout}
                            className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold rounded-xl transition-all border border-red-500/30"
                        >
                            구독 유지하고 로그아웃
                        </button>
                    </div>

                    <p className="text-xs text-white/40 text-center mt-2">
                        💡 팁: 구독을 일시정지하거나 취소하려면 구독 관리 페이지를 이용하세요
                    </p>
                </div>
            </div>
        </div>
    );
}
