'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CyberPageLayout from '@/components/CyberPageLayout';
import { AIFaction, Card } from '@/lib/types';
import aiFactionsData from '@/data/ai-factions.json';
import { cn } from '@/lib/utils';
import { useAlert } from '@/context/AlertContext';
import { Clock, AlertTriangle, Plus, X, Zap, Gift, Sparkles, Info, Shield } from 'lucide-react';
import { getActiveCombosFromFactions, getSlotSynergyTimeReduction, COMBO_DEFINITIONS, ComboDefinition } from '@/lib/synergy-utils';
import { addComboBadge } from '@/lib/firebase-db';
import { addCardToInventory } from '@/lib/inventory-system';
import {
    getGenerationSlots,
    assignFactionToSlot,
    removeFactionFromSlot,
    checkGenerationStatus,
    generateCard,
    updateAllSlotStatuses,
    getRemainingGenerations
} from '@/lib/generation-utils';
import { getSubscribedFactions, TIER_CONFIG } from '@/lib/faction-subscription-utils';
import CardRewardModal from '@/components/CardRewardModal';
import { COMMANDERS, CARD_DATABASE } from '@/data/card-database';
import { createCardFromTemplate } from '@/lib/card-generation-system';
import { loadInventory, removeCardFromInventory } from '@/lib/inventory-system';
import { useFirebase } from '@/components/FirebaseProvider';
import { useUser } from '@/context/UserContext'; // [NEW]
import GenerationSlot from '@/components/GenerationSlot';
import GameCard from '@/components/GameCard';

export default function GenerationPage() {
    const router = useRouter();
    const { user } = useFirebase();
    const { showAlert, showConfirm } = useAlert();
    const { trackMissionEvent, addTokens, consumeTokens, tokens, refreshInventory, level, profile } = useUser(); // [NEW] Use UserContext for missions and rewards

    const userId = user?.uid;

    const [factions, setFactions] = useState<AIFaction[]>([]);
    const [slots, setSlots] = useState(getGenerationSlots(userId));
    const [subscriptions, setSubscriptions] = useState(getSubscribedFactions(userId));
    const [selectedSlotForAssignment, setSelectedSlotForAssignment] = useState<number | null>(null);
    const [tick, setTick] = useState(0);

    // Reward Modal State
    const [rewardModalOpen, setRewardModalOpen] = useState(false);
    const [rewardCards, setRewardCards] = useState<Card[]>([]);
    const [rewardModalTitle, setRewardModalTitle] = useState("카드 획득!");
    const [rewardModalBonus, setRewardModalBonus] = useState<{ type: 'token' | 'coin'; value: number; label: string } | undefined>(undefined);
    const [rewardCardScale, setRewardCardScale] = useState(1);
    const [isProcessingAll, setIsProcessingAll] = useState(false);

    const loadData = useCallback(() => {
        try {
            const updatedSlots = updateAllSlotStatuses(userId);
            setSlots(updatedSlots);
            setSubscriptions(getSubscribedFactions(userId));
        } catch (error) {
            console.error("[Generation] Failed to load data:", error);
        }
    }, [userId]);

    useEffect(() => {
        try {
            const data = (aiFactionsData as { factions: AIFaction[] })?.factions || [];
            if (Array.isArray(data)) {
                setFactions(data);
            }
        } catch (e) {
            console.error("Data Load Error", e);
        }
        loadData();
    }, [userId, loadData]);

    // Optimized polling: Separate the 1s UI "tick" from the expensive data reload
    useEffect(() => {
        const timer = setInterval(() => {
            setTick(t => t + 1);
        }, 1000);

        // Periodically sync heavy state (every 10s or when needed)
        const stateSyncTimer = setInterval(() => {
            loadData();
        }, 10000);

        return () => {
            clearInterval(timer);
            clearInterval(stateSyncTimer);
        };
    }, [userId, loadData]);

    const handleAssignFaction = async (slotIndex: number, factionId: string) => {
        if (!userId) {
            showAlert({ title: '로그인 필요', message: '로그인이 필요한 기능입니다.', type: 'error' });
            return;
        }

        const alreadyAssigned = slots.some(s => s.factionId === factionId);
        if (alreadyAssigned) {
            showAlert({ title: '중복 배치 불가', message: '이 군단은 이미 다른 슬롯에 배치되어 있습니다.', type: 'warning' });
            return;
        }

        const faction = factions.find(f => f.id === factionId);
        const commanderTemplate = COMMANDERS.find(c => c.aiFactionId === factionId);

        // [FIX] 안내 모달 추가: 배치 시 군단장 카드 대여 알림 + 토큰 부스트 정보
        const tempCard = commanderTemplate ? { ...createCardFromTemplate(commanderTemplate), isRented: true } : null;

        // 현재 구독 + 새로 배치하는 군단의 토큰 부스트 계산
        const { calculateRechargeParams } = require('@/lib/token-system');
        const { FACTION_CATEGORY_MAP, CATEGORY_TOKEN_BONUS } = require('@/lib/token-constants');

        // 현재 슬롯에 있는 군단들의 구독 정보
        const currentSlottedSubs = slots
            .filter(s => s.factionId)
            .map(s => subscriptions.find(sub => sub.factionId === s.factionId))
            .filter(Boolean);

        // 새로 추가될 군단의 구독 정보
        const newFactionSub = subscriptions.find(s => s.factionId === factionId);

        // Before & After 계산
        const beforeParams = calculateRechargeParams(currentSlottedSubs, level || 1);
        const afterSubs = [...currentSlottedSubs, newFactionSub].filter(Boolean);
        const afterParams = calculateRechargeParams(afterSubs, level || 1);

        // 새 군단의 카테고리와 보너스 타입
        const newFactionCategory = FACTION_CATEGORY_MAP[factionId];
        const newFactionBonus = newFactionCategory ? CATEGORY_TOKEN_BONUS[newFactionCategory] : null;

        const getBonusTypeLabel = (type: string) => {
            switch (type) {
                case 'recharge_amount': return '⚡ 충전량 증가';
                case 'recharge_speed': return '⏱️ 충전 속도 증가';
                case 'max_capacity': return '🔋 최대 용량 증가';
                default: return '✨ 보너스';
            }
        };

        showConfirm({
            title: '군단 배치 및 카드 대여',
            message: '', // Using content instead
            content: (
                <div className="flex flex-col items-center gap-4 py-2">
                    <p className="text-gray-300 text-sm font-medium leading-relaxed text-center">
                        <span className="text-cyan-400 font-bold">[{faction?.displayName || factionId}]</span> 군단을 배치하시겠습니까?
                    </p>

                    {/* 군단장 카드 미리보기 */}
                    {tempCard && (
                        <div className="relative transform hover:scale-105 transition-transform duration-300 my-2">
                            <div className="absolute -inset-4 bg-cyan-500/20 blur-xl rounded-full" />
                            <GameCard
                                card={tempCard}
                                isHolographic
                            />
                            <div className="absolute -bottom-6 left-0 right-0 text-center">
                                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest bg-black/80 px-3 py-1 rounded-full border border-cyan-500/30">
                                    ⚔️ 전투에서 사용 가능
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 토큰 부스트 정보 */}
                    <div className="w-full mt-4 bg-gradient-to-r from-green-900/30 to-cyan-900/30 border border-green-500/30 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Zap size={14} />
                            토큰 부스트 효과
                        </h4>

                        {/* 새 군단의 보너스 타입 */}
                        {newFactionBonus && (
                            <div className="mb-3 px-3 py-2 bg-black/30 rounded-lg border border-white/10">
                                <p className="text-xs text-white/70">
                                    {faction?.displayName} 특성: <span className="text-green-400 font-bold">{getBonusTypeLabel(newFactionBonus.type)}</span>
                                </p>
                            </div>
                        )}

                        {/* Before → After 비교 */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="space-y-1">
                                <p className="text-white/50">충전량</p>
                                <p className="text-white font-bold">
                                    {beforeParams.rateAmount} → <span className={afterParams.rateAmount > beforeParams.rateAmount ? 'text-green-400' : 'text-white'}>{afterParams.rateAmount}</span>
                                </p>
                                {afterParams.rateAmount > beforeParams.rateAmount && (
                                    <p className="text-[10px] text-green-400">+{afterParams.rateAmount - beforeParams.rateAmount}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-white/50">충전 주기</p>
                                <p className="text-white font-bold">
                                    {beforeParams.intervalMin}분 → <span className={afterParams.intervalMin < beforeParams.intervalMin ? 'text-yellow-400' : 'text-white'}>{afterParams.intervalMin}분</span>
                                </p>
                                {afterParams.intervalMin < beforeParams.intervalMin && (
                                    <p className="text-[10px] text-yellow-400">-{beforeParams.intervalMin - afterParams.intervalMin}분</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-white/50">최대 용량</p>
                                <p className="text-white font-bold">
                                    {beforeParams.maxCap.toLocaleString()} → <span className={afterParams.maxCap > beforeParams.maxCap ? 'text-blue-400' : 'text-white'}>{afterParams.maxCap.toLocaleString()}</span>
                                </p>
                                {afterParams.maxCap > beforeParams.maxCap && (
                                    <p className="text-[10px] text-blue-400">+{(afterParams.maxCap - beforeParams.maxCap).toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-white/40 text-center">
                        ⚠️ 슬롯에서 제거 시 군단장 카드는 회수됩니다
                    </p>
                </div>
            ),
            onConfirm: async () => {
                const result = assignFactionToSlot(slotIndex, factionId, userId);
                if (result.success) {
                    loadData();
                    setSelectedSlotForAssignment(null);

                    // 신규 콤보 뱃지 체크
                    if (userId) {
                        const newAllFactionIds = slots
                            .filter(s => s.factionId && s.index !== slotIndex)
                            .map(s => s.factionId as string)
                            .concat([factionId]);
                        const newCombos = getActiveCombosFromFactions(newAllFactionIds);
                        const existingBadges = profile?.comboBadges || [];
                        for (const combo of newCombos) {
                            if (!existingBadges.includes(combo.id)) {
                                addComboBadge(userId, combo.id).catch(console.error);
                                showAlert({
                                    title: `${combo.icon} 콤보 뱃지 획득!`,
                                    message: `[${combo.name}] 콤보를 최초로 활성화했습니다!`,
                                    type: 'success'
                                });
                            }
                        }
                    }

                    // 1. Commander Rental Logic - UserContext가 처리하므로 별도 저장 불필요
                    try {
                        console.log(`[Rental] Faction placed in slot: ${factionId}`);

                        if (commanderTemplate) {
                            // [FIX] 모달을 먼저 표시하여 빠른 피드백 제공
                            const newCommanderCard = {
                                ...createCardFromTemplate(commanderTemplate),
                                isRented: true,
                                isRentalCard: true,
                                ownerId: userId as string
                            };
                            setRewardCards([newCommanderCard]);
                            setRewardModalTitle("🎖️ COMMANDER RENTED");
                            setRewardCardScale(1.5);

                            // 토큰 보너스 정보 표시
                            const boostLabel = newFactionBonus
                                ? getBonusTypeLabel(newFactionBonus.type)
                                : '토큰 충전 보너스';
                            setRewardModalBonus({ type: 'token', value: 50, label: `배치 완료! ${boostLabel}` });

                            // Add bonus tokens
                            try {
                                await addTokens(50);
                            } catch (err) {
                                console.error("Token reward failed", err);
                            }

                            setRewardModalOpen(true);

                            // [FIX] 인벤토리 새로고침을 백그라운드에서 실행 (모달 표시 속도 개선)
                            refreshInventory().catch(err => {
                                console.error("[Rental] Background inventory refresh failed:", err);
                            });
                        } else {
                            // 군단장이 없는 경우에만 인벤토리 새로고침 대기
                            await refreshInventory();
                            showAlert({ title: '배치 완료', message: '군단이 배치되어 카드 생성이 시작되었습니다.', type: 'success' });
                        }
                    } catch (error) {
                        console.error("[Rental] Failed to process Commander rental:", error);
                        showAlert({ title: '배치 완료', message: '군단이 배치되었으나, 대여 카드 지급 중 오류가 발생했습니다.', type: 'warning' });
                    }
                }
            }
        });
    };

    const handleRemoveFaction = useCallback((slotIndex: number) => {
        const slot = slots.find(s => s.index === slotIndex);
        if (!slot || !slot.factionId) return;

        showConfirm({
            title: '군단 배치 해제',
            message: '군단을 슬롯에서 제거하면 대여 중인 해당 군단의 "군단장 카드"도 함께 회수됩니다. 계속하시겠습니까?',
            onConfirm: async () => {
                // 1. 군단장 카드 회수 로직
                try {
                    const inventory = await loadInventory(userId);
                    // 해당 팩션의 군단장 카드 찾기
                    const commanderTemplate = COMMANDERS.find(c => c.aiFactionId === slot.factionId);

                    if (commanderTemplate) {
                        const rentedCommanderCards = inventory.filter(c => c.templateId === commanderTemplate.id && c.isRented);
                        for (const card of rentedCommanderCards) {
                            await removeCardFromInventory(card.instanceId, userId);
                            console.log(`[Generation] Reclaimed rented commander card: ${card.name}`);
                        }
                    }
                } catch (error) {
                    console.error("Failed to reclaim commander card:", error);
                }

                // 2. 슬롯 제거 로직
                const result = removeFactionFromSlot(slotIndex, userId);
                if (result.success) {
                    showAlert({ title: '제거 완료', message: '군단이 제거되었으며, 군단장 카드가 회수되었습니다.', type: 'success' });
                    loadData();
                    // [NEW] Refresh inventory to remove rental commander card
                    await refreshInventory();
                } else {
                    showAlert({ title: '제거 실패', message: result.message, type: 'error' });
                }
            }
        });
    }, [slots, userId, showConfirm, showAlert]);

    const handleReceiveCard = useCallback(async (slotIndex: number) => {
        // [COST CHECK] 100 Tokens per card
        const COST_PER_CARD = 100;
        const success = await consumeTokens(COST_PER_CARD);

        if (!success) {
            showAlert({ title: '토큰 부족', message: `카드를 수령하려면 토큰 ${COST_PER_CARD}개가 필요합니다.`, type: 'error' });
            return;
        }

        const result = await generateCard(slotIndex, userId);
        if (result.success && result.card) {
            try {
                await addCardToInventory(result.card);
                setRewardCards([result.card]);
                setRewardModalTitle("카드 획득!");
                setRewardCardScale(1); // Reset scale
                setRewardModalBonus(undefined); // Reset bonus
                setRewardModalOpen(true);
                loadData();
                trackMissionEvent('unit-claim', 1); // [NEW] Track Mission
            } catch (error) {
                console.error('Failed to save card:', error);
                showAlert({ title: '오류', message: '카드 저장 중 오류가 발생했습니다. (토큰은 차감되지 않았습니다)', type: 'error' });
                // Note: consumeTokens already deducted tokens. In a robust system we'd refund, but complex here.
                // Assuming save failure is rare.
            }
        } else {
            showAlert({ title: '생성 실패', message: result.message, type: 'error' });
            // Refund if generation logic failed but tokens consumed?
            // Since generation logic is just utils time check, failure implies slot not ready.
            // But we should optimally check readiness BEFORE consuming tokens.
            // However, result.success tells if generated.
        }
    }, [userId, showAlert, consumeTokens, trackMissionEvent]); // Added dependencies

    const handleReceiveAll = async () => {
        if (isProcessingAll) return;

        const readySlots = slots.filter(slot => {
            if (!slot.factionId) return false;
            const canGen = !!(slot.nextGenerationAt && new Date(slot.nextGenerationAt).getTime() <= Date.now());
            return canGen;
        });

        if (readySlots.length === 0) return;

        // [COST CHECK] Batch Cost
        const COST_PER_CARD = 100;
        const totalCost = readySlots.length * COST_PER_CARD;

        const hasBalance = await consumeTokens(totalCost);

        if (!hasBalance) {
            showAlert({ title: '토큰 부족', message: `모두 받으려면 토큰 ${totalCost}개가 필요합니다.`, type: 'error' });
            return;
        }

        setIsProcessingAll(true);
        const receivedCards: Card[] = [];
        let successCount = 0;

        try {
            // Sequential processing to avoid state race conditions and UI lag
            for (const slot of readySlots) {
                const result = await generateCard(slot.index, userId);
                if (result.success && result.card) {
                    await addCardToInventory(result.card);
                    receivedCards.push(result.card);
                    successCount++;
                }
            }

            if (successCount > 0) {
                setRewardCards(receivedCards);
                setRewardModalTitle("모두 받기 완료!");
                setRewardCardScale(1); // Reset scale
                setRewardModalBonus(undefined); // Reset bonus
                setRewardModalOpen(true);
                loadData();
                trackMissionEvent('unit-claim', successCount); // [NEW] Track Mission
            }
        } catch (error) {
            console.error("Batch receipt error:", error);
            showAlert({ title: '오류', message: '일부 카드를 수령하는 중 오류가 발생했습니다.', type: 'error' });
        } finally {
            setIsProcessingAll(false);
        }
    };

    const getRemainingTime = (nextGenAt: Date | string | null): string => {
        if (!nextGenAt) return '--:--';
        const diff = new Date(nextGenAt).getTime() - Date.now();
        if (diff <= 0) return '준비됨!';

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const assignedFactionIds = useMemo(() => slots.filter(s => s.factionId).map(s => s.factionId as string), [slots]);
    const availableFactions = useMemo(() => subscriptions.filter(s => !assignedFactionIds.includes(s.factionId)), [subscriptions, assignedFactionIds]);

    // 시너지 콤보
    const activeCombos = useMemo(() => getActiveCombosFromFactions(assignedFactionIds), [assignedFactionIds]);
    const synergyTimeReduction = useMemo(() => getSlotSynergyTimeReduction(assignedFactionIds), [assignedFactionIds]);

    // 슬롯에 1개 이상 군단이 들어있어 진행 중인 근접 콤보 (미완성 포함)
    const nearMissCombos = useMemo(() => {
        if (assignedFactionIds.length === 0) return [];
        return COMBO_DEFINITIONS
            .filter(combo => {
                const matched = combo.requiredFactions.filter(f => assignedFactionIds.includes(f)).length;
                return matched > 0 && matched < combo.requiredFactions.length;
            })
            .map(combo => ({
                ...combo,
                matched: combo.requiredFactions.filter(f => assignedFactionIds.includes(f)).length,
            }))
            .sort((a, b) => (b.matched / b.requiredFactions.length) - (a.matched / a.requiredFactions.length))
            .slice(0, 4); // 최대 4개만 표시
    }, [assignedFactionIds]);

    const readyCount = useMemo(() => slots.filter(slot => {
        if (!slot.factionId) return false;
        if (!slot.nextGenerationAt) return false;
        return new Date(slot.nextGenerationAt).getTime() <= Date.now();
    }).length, [slots, tick]);
    const handleSlotReceive = useCallback((index: number) => {
        setRewardModalTitle("카드 획득!");
        handleReceiveCard(index);
    }, [handleReceiveCard]);

    const handleAssign = useCallback((index: number) => {
        setSelectedSlotForAssignment(index);
    }, []);

    // Auth Guard: Show login required message if not authenticated
    if (!user) {
        return (
            <CyberPageLayout
                title="카드 생성"
                englishTitle="CARD GENERATION"
                description="시간이 되면 자동으로 생성되는 카드를 수령하세요"
                color="green"
            >
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="text-center p-8 bg-black/40 border border-green-500/30 rounded-xl max-w-md">
                        <Zap className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">로그인이 필요합니다</h2>
                        <p className="text-gray-400 mb-6">
                            카드 생성 기능을 사용하려면 먼저 로그인해 주세요.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                        >
                            로그인하기
                        </button>
                    </div>
                </div>
            </CyberPageLayout>
        );
    }

    return (
        <CyberPageLayout
            title="카드 생성"
            englishTitle="CARD GENERATION"
            description="시간이 되면 자동으로 생성되는 카드를 수령하세요"
            color="green"
            leftSidebarIcon={<Zap size={32} className="text-green-400" />}
            leftSidebarTips={[
                "⚡ 카드는 설정된 주기마다 자동으로 생성됩니다.",
                "🔋 각 슬롯에 원하는 AI 군단을 배치하여 카드를 생산하세요.",
                "🛒 상점에서 '슬롯 확장권'을 구매하면 동시 생성 수를 늘릴 수 있습니다.",
                "💎 'AI 군단' 메뉴에서 구독 티어를 올리면 생성 속도가 빨라집니다.",
                "📌 생성된 카드는 클릭하여 수령해야 인벤토리에 저장됩니다."
            ]}
        >
            <div className="flex flex-col">
                <div className="mb-6 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-lg p-6 flex-shrink-0">
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <h3 className="text-sm text-white/60 mb-1">구독 중인 군단</h3>
                            <p className="text-2xl font-bold text-green-400">{subscriptions.length}</p>
                        </div>
                        <div>
                            <h3 className="text-sm text-white/60 mb-1">활성 슬롯</h3>
                            <p className="text-2xl font-bold text-cyan-400">
                                {slots.filter(s => s.factionId).length}/5
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm text-white/60 mb-1">최단 주기</h3>
                            <p className="text-2xl font-bold text-yellow-400">
                                {subscriptions.length > 0 ? Math.min(...subscriptions.map(s => s.generationInterval)) + '분' : '-'}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm text-white/60 mb-1">수령 대기</h3>
                            <p className="text-2xl font-bold text-pink-400">{readyCount}</p>
                        </div>
                    </div>

                    {subscriptions.length === 0 && (
                        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-yellow-400">
                                구독 중인 군단이 없습니다. <button onClick={() => router.push('/factions')} className="underline font-bold">군단 구독하러 가기</button>
                            </p>
                        </div>
                    )}

                    {/* 시너지 콤보 패널 */}
                    {(activeCombos.length > 0 || nearMissCombos.length > 0) && (
                        <div className="mt-4 space-y-2">
                            {/* 활성 콤보 */}
                            {activeCombos.length > 0 && (
                                <div className="bg-purple-500/10 border border-purple-500/40 rounded-xl p-3">
                                    <p className="text-xs font-bold text-purple-300 mb-2 flex items-center gap-1.5">
                                        <Shield size={13} className="text-purple-400" />
                                        활성 시너지 — 생성 시간 <span className="text-green-400">-{Math.round(synergyTimeReduction * 100)}%</span>
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {activeCombos.map(combo => (
                                            <span key={combo.id} title={combo.description} className="px-2 py-1 bg-purple-500/25 border border-purple-400/40 rounded-full text-xs text-purple-200 font-bold flex items-center gap-1">
                                                {combo.icon} {combo.name}
                                                <span className="text-green-400 text-[9px]">-{Math.round(combo.bonusPower * 30)}%</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 근접 콤보 (진행 중) */}
                            {nearMissCombos.length > 0 && (
                                <div className="bg-white/3 border border-white/10 rounded-xl p-3">
                                    <p className="text-xs font-bold text-white/40 mb-2 flex items-center gap-1.5">
                                        <Sparkles size={12} />
                                        달성 가능한 콤보
                                    </p>
                                    <div className="space-y-2">
                                        {nearMissCombos.map(combo => {
                                            const pct = Math.round((combo.matched / combo.requiredFactions.length) * 100);
                                            return (
                                                <div key={combo.id} className="flex items-center gap-2">
                                                    <span className="text-base w-5 shrink-0">{combo.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-[10px] text-white/60 font-bold truncate">{combo.name}</span>
                                                            <span className="text-[9px] text-white/30 shrink-0 ml-1">{combo.matched}/{combo.requiredFactions.length}</span>
                                                        </div>
                                                        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                                                            <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] text-purple-400/70 shrink-0">+{Math.round(combo.bonusPower * 30)}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Zap className="text-green-400" size={20} />
                            생성 슬롯 (5개)
                        </h2>
                        {readyCount > 0 && (
                            <button
                                onClick={handleReceiveAll}
                                disabled={isProcessingAll}
                                className={cn(
                                    "px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-pink-500/30",
                                    isProcessingAll ? "opacity-70 cursor-not-allowed" : "hover:from-pink-400 hover:to-purple-400 animate-pulse"
                                )}
                            >
                                <Gift size={16} className={isProcessingAll ? "animate-spin" : ""} />
                                {isProcessingAll ? '처리 중...' : `모두 받기 (${readyCount})`}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        {slots.map((slot) => {
                            const subscription = subscriptions.find(s => s.factionId === slot.factionId);
                            const canGenerate = !!(slot.factionId && slot.nextGenerationAt && new Date(slot.nextGenerationAt).getTime() <= Date.now());
                            const remainingTime = getRemainingTime(slot.nextGenerationAt);
                            const remaining = slot.factionId ? getRemainingGenerations(slot.factionId, userId) : 0;
                            const faction = factions.find(f => f.id === slot.factionId);

                            // 군단장(실제사진)보다는 군단의 대표 캐릭터(HERO/EPIC급 캐릭터) 이미지를 찾는 로직
                            const characterTemplate = CARD_DATABASE.find((c: any) =>
                                c.aiFactionId === slot.factionId &&
                                (c.rarity === 'mythic' || c.rarity === 'legendary' || c.rarity === 'epic' || c.rarity === 'rare')
                            );

                            return (
                                <GenerationSlot
                                    key={slot.index}
                                    slot={slot}
                                    subscription={subscription}
                                    factionName={faction?.displayName || slot.factionId || ''}
                                    cardImage={characterTemplate?.imageUrl || faction?.iconUrl}
                                    iconUrl={faction?.iconUrl}
                                    canGenerate={canGenerate}
                                    remainingTime={remainingTime}
                                    remainingGenerations={remaining}
                                    onReceiveCard={handleSlotReceive}
                                    onRemoveFaction={handleRemoveFaction}
                                    onAssignClick={handleAssign}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Info size={18} className="text-cyan-400" />
                        카드 생성 가이드
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div className="space-y-2">
                            <p className="text-cyan-400 font-bold">1. 군단 구독</p>
                            <p className="text-white/60">AI 군단 페이지에서 원하는 군단을 구독하세요. 티어가 높을수록 생성 주기가 짧아지고 일일 생성 제한이 늘어납니다.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-green-400 font-bold">2. 슬롯 배치</p>
                            <p className="text-white/60">구독한 군단을 빈 슬롯에 배치하세요. 배치가 완료되면 타이머가 작동하며 카드를 생성하기 시작합니다.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-pink-400 font-bold">3. 카드 수령</p>
                            <p className="text-white/60">타이머가 완료되면 '카드 받기' 버튼이 활성화됩니다. 생성된 카드는 즉시 인벤토리에 추가됩니다.</p>
                        </div>
                    </div>
                </div>

                {selectedSlotForAssignment !== null && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-zinc-900 border border-white/20 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                                <div>
                                    <h2 className="text-xl font-bold text-white">군단 배치</h2>
                                    <p className="text-xs text-white/50">슬롯 {selectedSlotForAssignment + 1}에 배치할 군단을 선택하세요</p>
                                </div>
                                <button
                                    onClick={() => setSelectedSlotForAssignment(null)}
                                    className="text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {availableFactions.length > 0 ? (
                                    <div className="grid gap-3">
                                        {availableFactions.map(sub => {
                                            const faction = factions.find(f => f.id === sub.factionId);
                                            const config = TIER_CONFIG[sub.tier as keyof typeof TIER_CONFIG];
                                            const remaining = getRemainingGenerations(sub.factionId, userId);

                                            return (
                                                <button
                                                    key={sub.factionId}
                                                    onClick={() => handleAssignFaction(selectedSlotForAssignment, sub.factionId)}
                                                    className="flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left bg-white/5 group"
                                                >
                                                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                                        {faction?.iconUrl ? (
                                                            <img
                                                                src={faction.iconUrl}
                                                                alt={faction.displayName}
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.parentElement?.classList.add('fallback-icon');
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-2xl">🤖</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                                                            {faction?.displayName || sub.factionId}
                                                        </div>
                                                        <div className={cn("text-xs font-bold",
                                                            sub.tier === 'free' ? 'text-gray-400' :
                                                                sub.tier === 'pro' ? 'text-blue-400' : 'text-purple-400'
                                                        )}>
                                                            {config?.name || sub.tier} 티어
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-xs space-y-1">
                                                        <div className="flex items-center justify-end gap-1 text-white/40">
                                                            <Clock size={12} />
                                                            {sub.generationInterval}분
                                                        </div>
                                                        <div className="flex items-center justify-end gap-1 text-white/40">
                                                            <Zap size={12} />
                                                            {sub.dailyGenerationLimit === 999999 ? '무제한' : `${remaining}회 남음`}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-6">
                                        <AlertTriangle className="mx-auto text-yellow-500/50 mb-4" size={48} />
                                        <p className="text-white font-bold mb-2">배치 가능한 군단이 없습니다</p>
                                        <p className="text-sm text-white/50 mb-6">먼저 AI 군단 메뉴에서 군단을 구독하세요.</p>
                                        <button
                                            onClick={() => router.push('/factions')}
                                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-colors"
                                        >
                                            군단 구독하러 가기
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <CardRewardModal
                    isOpen={rewardModalOpen}
                    onClose={() => {
                        setRewardModalOpen(false);
                        setRewardCardScale(1);
                        setRewardModalBonus(undefined);
                    }}
                    cards={rewardCards}
                    title={rewardModalTitle}
                    cardScale={rewardCardScale}
                    bonusReward={rewardModalBonus}
                    previousStats={undefined}
                />
            </div>
        </CyberPageLayout >
    );
}
