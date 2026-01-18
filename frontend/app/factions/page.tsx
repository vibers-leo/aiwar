'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CyberPageLayout from '@/components/CyberPageLayout';
import { AIFaction } from '@/lib/types';
import aiFactionsData from '@/data/ai-factions.json';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAlert } from '@/context/AlertContext';
import { Info, X, Check, Crown, Zap, Clock, Infinity, Shield, Battery, Coins, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import FactionLoreModal from '@/components/FactionLoreModal';
import { FACTION_LORE_DATA, FactionLore } from '@/lib/faction-lore';
import { getCardCharacterImage } from '@/lib/card-images';
import { useFirebase } from '@/components/FirebaseProvider';
import { useUser } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getSubscribedFactions,
    subscribeFaction,
    unsubscribeFaction,
    getTotalSubscriptionCost,
    getFactionSubscription,
    TIER_CONFIG,
    SubscriptionTier
} from '@/lib/faction-subscription-utils';
import { calculateRechargeParams } from '@/lib/token-system';
import FactionCard from '@/components/FactionCard';

export default function FactionsPage() {
    const { profile, reload: refreshProfile } = useUserProfile();
    const { user } = useFirebase();
    const { coins: userCoins, tokens: userTokens, maxTokens, level: userLevel } = useUser();
    const { showAlert, showConfirm } = useAlert();

    // Use real-time user context values for display
    const coins = userCoins || profile?.coins || 0;
    const level = userLevel || profile?.level || 1;
    const userId = user?.uid;

    const [factions, setFactions] = useState<AIFaction[]>([]);
    const [totalCost, setTotalCost] = useState(0);
    const [selectedFaction, setSelectedFaction] = useState<AIFaction | null>(null);
    const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free');
    const [showDetails, setShowDetails] = useState(false);

    // Lore Modal State
    const [selectedLoreFaction, setSelectedLoreFaction] = useState<FactionLore | null>(null);
    const [isLoreModalOpen, setIsLoreModalOpen] = useState(false);

    const TIER_LEVEL_REQ: Record<SubscriptionTier, number> = {
        free: 1,
        pro: 10,
        ultra: 30
    };

    // Memoize subscriptions to prevent unnecessary re-renders of the grid
    const subscriptions = useMemo(() => getSubscribedFactions(userId), [userId]);

    // Calculate recharge params for display
    const rechargeParams = useMemo(() => calculateRechargeParams(subscriptions, level), [subscriptions, level]);

    // Calculate bonuses
    const activeBonuses = useMemo(() => ({
        rate: rechargeParams.rateAmount - 10,
        interval: 10 - rechargeParams.intervalMin,
        cap: rechargeParams.maxCap - (1000 + (level - 1) * 100)
    }), [rechargeParams, level]);

    useEffect(() => {
        // Load factions data
        try {
            const data = (aiFactionsData as { factions: AIFaction[] })?.factions || [];
            if (Array.isArray(data)) {
                setFactions(data);
            }
        } catch (e) {
            console.error("Data Load Error", e);
        }

        setTotalCost(getTotalSubscriptionCost(userId));
    }, [userId]);

    const handleSubscribe = (factionId: string, tier: SubscriptionTier) => {
        const config = TIER_CONFIG[tier];
        const reqLevel = TIER_LEVEL_REQ[tier];

        if (level < reqLevel) {
            showAlert({ title: '레벨 부족', message: `${config.name} 티어는 레벨 ${reqLevel} 이상부터 구독 가능합니다.`, type: 'error' });
            return;
        }

        // 프로필 코인이 로컬 상태와 다르면 동기화
        if (profile?.coins !== undefined) {
            const gameState = require('@/lib/game-state').getGameState();
            if (gameState.coins !== profile.coins) {
                require('@/lib/game-state').updateGameState({ coins: profile.coins });
            }
        }

        showConfirm({
            title: `${config.name} 티어 구독`,
            message: `${factionId} 군단을 ${config.name} 티어로 구독하시겠습니까?\n\n⚠️ 매일 자정에 ${config.cost.toLocaleString()} 코인이 차감되는 정기 구독 상품입니다.`,
            onConfirm: () => {
                const result = subscribeFaction(factionId, tier, userId);
                if (result.success) {
                    showAlert({ title: '구독 완료', message: result.message, type: 'success' });
                    refreshProfile(); // 코인 잔액 갱신
                    setTotalCost(getTotalSubscriptionCost(userId));
                    setSelectedFaction(null);
                } else {
                    showAlert({ title: '구독 실패', message: result.message, type: 'error' });
                }
            }
        });
    };

    const handleUnsubscribe = (factionId: string) => {
        const subscription = getFactionSubscription(factionId, userId);
        if (!subscription) return;

        // 환불 금액 미리 계산
        const calculateRefundPreview = () => {
            if (subscription.dailyCost === 0) return 0;

            const storageKey = userId ? `cancellationHistory_${userId}` : 'cancellationHistory';
            const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const hasEverCancelled = history.some((h: any) => h.factionId === factionId);

            if (!hasEverCancelled) {
                return Math.floor(subscription.dailyCost * 0.5);
            } else {
                const now = new Date();
                const subscriptionStart = new Date(subscription.subscribedAt);
                const hoursUsed = (now.getTime() - subscriptionStart.getTime()) / (1000 * 60 * 60);

                if (hoursUsed < 24) {
                    return subscription.dailyCost;
                }
                return 0;
            }
        };

        const refundAmount = calculateRefundPreview();
        const refundMsg = refundAmount > 0
            ? `\n\n💰 환불 예상 금액: ${refundAmount.toLocaleString()} 코인`
            : '';

        showConfirm({
            title: '구독 취소',
            message: `${factionId} 군단 구독을 취소하시겠습니까?${refundMsg}`,
            onConfirm: () => {
                const result = unsubscribeFaction(factionId, userId);
                if (result.success) {
                    showAlert({ title: '취소 완료', message: result.message, type: 'success' });
                    refreshProfile(); // 코인 잔액 갱신 (환불 시)
                    setTotalCost(getTotalSubscriptionCost(userId));
                } else {
                    showAlert({ title: '취소 실패', message: result.message, type: 'error' });
                }
            }
        });
    };

    const handleLoreClick = useCallback((factionId: string) => {
        const loreData = FACTION_LORE_DATA[factionId];
        if (loreData) {
            setSelectedLoreFaction(loreData);
            setIsLoreModalOpen(true);
        } else {
            showAlert({ title: '정보 없음', message: '상세 정보가 준비 중입니다.', type: 'info' });
        }
    }, [showAlert]);

    const handleSubscribeRequest = useCallback((faction: AIFaction) => {
        setSelectedFaction(faction);
    }, []);

    return (
        <CyberPageLayout
            title="AI 군단"
            englishTitle="AI FACTIONS"
            description="AI 군단을 구독하여 카드를 자동 생성하세요"
            color="purple"
            leftSidebarIcon={<Shield size={32} className="text-purple-400" />}
            leftSidebarTips={[
                "💎 티어별 혜택:",
                "Free: 비용 0 • 30분 주기 • 일 5회",
                "Pro (Lv.10+): 40코인/일 • 일 20회 • 토큰 충전속도 UP",
                "Ultra (Lv.30+): 200코인/일 • 무제한 • 최대 토큰 UP",
                "━━━━━━━━━━━━━━━━━━",
                "📌 구독은 매일 자정에 자동 결제됩니다.",
                "📌 첫 해지 시 50% 환불, 이후 24시간 내 전액 환불.",
                "📌 각 군단의 정보 버튼으로 상세 스토리를 확인하세요!",
            ]}
        >
            <div className="flex flex-col gap-4">
                {/* ===== 상단: 통합 대시보드 ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* 1. 일간 구독 비용 & 현재 코인 */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-amber-900/30 to-amber-950/20 border border-amber-500/30 rounded-2xl p-5"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Crown className="text-amber-400" size={20} />
                            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">일간 구독</h3>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-3xl font-black text-white orbitron">
                                    {totalCost.toLocaleString()}
                                </p>
                                <p className="text-xs text-white/50">코인/일</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-amber-400">
                                    <Coins size={14} />
                                    <span className="text-lg font-bold">{coins.toLocaleString()}</span>
                                </div>
                                <p className="text-[10px] text-white/40">보유 코인</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. 토큰 충전 보너스 (실제 값 동기화) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/20 border border-cyan-500/30 rounded-2xl p-5"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Battery className="text-cyan-400" size={20} />
                            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">토큰 부스트</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className={cn("text-xl font-black", activeBonuses.rate > 0 ? "text-green-400" : "text-white/30")}>
                                    {activeBonuses.rate > 0 ? `+${activeBonuses.rate}` : '-'}
                                </p>
                                <p className="text-[10px] text-white/40">충전량</p>
                            </div>
                            <div>
                                <p className={cn("text-xl font-black", activeBonuses.interval > 0 ? "text-yellow-400" : "text-white/30")}>
                                    {activeBonuses.interval > 0 ? `-${activeBonuses.interval}분` : '-'}
                                </p>
                                <p className="text-[10px] text-white/40">주기 단축</p>
                            </div>
                            <div>
                                <p className={cn("text-xl font-black", activeBonuses.cap > 0 ? "text-blue-400" : "text-white/30")}>
                                    {activeBonuses.cap > 0 ? `+${activeBonuses.cap}` : '-'}
                                </p>
                                <p className="text-[10px] text-white/40">최대 용량</p>
                            </div>
                        </div>
                        {/* 현재 토큰 상태 표시 */}
                        <div className="mt-3 pt-3 border-t border-cyan-500/20">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-white/50">현재 토큰</span>
                                <span className="text-cyan-400 font-bold">{userTokens?.toLocaleString() || 0} / {maxTokens?.toLocaleString() || 1000}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* 3. 구독 중인 군단 */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-purple-900/30 to-purple-950/20 border border-purple-500/30 rounded-2xl p-5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="text-purple-400" size={20} />
                                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">활성 구독</h3>
                            </div>
                            <span className="text-2xl font-black text-white">{subscriptions.length}</span>
                        </div>

                        {subscriptions.length > 0 ? (
                            <div className="space-y-1.5 max-h-[80px] overflow-y-auto custom-scrollbar">
                                {subscriptions.slice(0, 4).map(sub => (
                                    <div key={sub.factionId} className="flex items-center justify-between bg-white/5 rounded-lg px-2.5 py-1.5">
                                        <span className="text-xs text-white capitalize">{sub.factionId}</span>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded font-bold",
                                            sub.tier === 'ultra' ? 'bg-purple-500/30 text-purple-300' :
                                                sub.tier === 'pro' ? 'bg-blue-500/30 text-blue-300' :
                                                    'bg-gray-500/30 text-gray-300'
                                        )}>{sub.tier.toUpperCase()}</span>
                                    </div>
                                ))}
                                {subscriptions.length > 4 && (
                                    <p className="text-[10px] text-white/40 text-center">+{subscriptions.length - 4}개 더...</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-white/40 text-center py-4">구독 중인 군단이 없습니다</p>
                        )}
                    </motion.div>
                </div>

                {/* 구독 알림 배너 */}
                {totalCost > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-amber-900/20 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between"
                    >
                        <p className="text-sm text-amber-300 flex items-center gap-2">
                            <Zap size={14} className="text-amber-400" />
                            <span>매일 자정 <strong>{totalCost.toLocaleString()}</strong> 코인이 자동 차감됩니다</span>
                        </p>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                            상세 {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    </motion.div>
                )}

                {/* ===== 군단 그리드 ===== */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Shield className="text-purple-400" size={20} />
                            전체 AI 군단
                            <span className="text-sm text-white/40 font-normal">({factions.length})</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                        {factions.map(faction => {
                            const subscription = getFactionSubscription(faction.id, userId);
                            const loreData = FACTION_LORE_DATA[faction.id];
                            const koreanName = loreData?.koreanName || faction.displayName;
                            const bgImage = getCardCharacterImage(faction.id) || faction.iconUrl;

                            return (
                                <FactionCard
                                    key={faction.id}
                                    faction={faction}
                                    subscription={subscription}
                                    koreanName={koreanName}
                                    bgImage={bgImage}
                                    onLoreClick={handleLoreClick}
                                    onSubscribeClick={handleSubscribeRequest}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Tier Selection Modal */}
                {selectedFaction && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900 border border-white/20 w-full max-w-2xl rounded-2xl overflow-hidden relative"
                        >
                            <button
                                onClick={() => setSelectedFaction(null)}
                                className="absolute right-4 top-4 text-white/50 hover:text-white z-10"
                            >
                                <X size={24} />
                            </button>

                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center text-3xl overflow-hidden relative">
                                        {selectedFaction.iconUrl ? (
                                            <img src={selectedFaction.iconUrl} alt="icon" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            '🤖'
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedFaction.displayName}</h2>
                                        <p className="text-sm text-white/60">구독 티어를 선택하세요</p>
                                    </div>
                                </div>

                                {/* Tier Options */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    {(['free', 'pro', 'ultra'] as SubscriptionTier[]).map(tier => {
                                        const config = TIER_CONFIG[tier];
                                        const isSelected = selectedTier === tier;
                                        const canAfford = coins >= config.cost;
                                        const reqLevel = TIER_LEVEL_REQ[tier];
                                        const isLevelSufficient = level >= reqLevel;

                                        return (
                                            <button
                                                key={tier}
                                                onClick={() => setSelectedTier(tier)}
                                                disabled={(!canAfford && tier !== 'free') || !isLevelSufficient}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden flex flex-col h-full",
                                                    isSelected
                                                        ? "border-cyan-500 bg-cyan-500/10"
                                                        : "border-white/10 hover:border-white/30",
                                                    ((!canAfford && tier !== 'free') || !isLevelSufficient) && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                {!isLevelSufficient && (
                                                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-[1px] border border-white/5">
                                                        <span className="text-xl mb-1">🔒</span>
                                                        <span className="text-xs font-bold text-red-400">Lv.{reqLevel} 필요</span>
                                                    </div>
                                                )}

                                                <div className="font-bold text-white mb-2">{config.name}</div>
                                                <div className="text-2xl font-black text-yellow-400 mb-2">
                                                    {config.cost === 0 ? 'FREE' : `${config.cost.toLocaleString()}`}
                                                    {config.cost > 0 && <span className="text-xs text-white/60 ml-1">코인</span>}
                                                </div>

                                                <div className="space-y-2 text-xs text-white/60 flex-1">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {config.generationInterval}분 주기
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {config.dailyLimit === 999999 ? <Infinity size={12} /> : <Zap size={12} />}
                                                        {config.dailyLimit === 999999 ? '무제한' : `${config.dailyLimit}회/일`}
                                                    </div>

                                                    {/* Tier Specific Bonuses */}
                                                    {tier === 'pro' && (
                                                        <div className="pt-2 border-t border-white/10 text-green-400 font-bold flex items-center gap-1">
                                                            <Battery size={12} />
                                                            토큰 충전속도 +2
                                                        </div>
                                                    )}
                                                    {tier === 'ultra' && (
                                                        <div className="pt-2 border-t border-white/10 text-green-400 font-bold flex items-center gap-1">
                                                            <Shield size={12} />
                                                            최대 토큰 +1000
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Subscribe Button */}
                                <button
                                    onClick={() => handleSubscribe(selectedFaction.id, selectedTier)}
                                    disabled={(coins < TIER_CONFIG[selectedTier].cost && selectedTier !== 'free') || level < TIER_LEVEL_REQ[selectedTier]}
                                    className={cn(
                                        "w-full py-3 rounded-lg font-bold transition-colors shadow-lg",
                                        (coins >= TIER_CONFIG[selectedTier].cost || selectedTier === 'free') && level >= TIER_LEVEL_REQ[selectedTier]
                                            ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-400 hover:to-cyan-400 shadow-cyan-500/20"
                                            : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    )}
                                >
                                    {level < TIER_LEVEL_REQ[selectedTier]
                                        ? `Lv.${TIER_LEVEL_REQ[selectedTier]} 도달 시 활성화`
                                        : `${TIER_CONFIG[selectedTier].name} 티어로 구독하기`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Lore Modal */}
                <FactionLoreModal
                    faction={selectedLoreFaction}
                    isOpen={isLoreModalOpen}
                    onClose={() => setIsLoreModalOpen(false)}
                    allFactions={Object.values(FACTION_LORE_DATA)}
                />
            </div>
        </CyberPageLayout >
    );
}
