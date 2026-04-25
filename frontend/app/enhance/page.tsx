'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card as CardType } from '@/lib/types';
import { enhanceCard, getEnhanceCost, getEnhancePreview } from '@/lib/enhance-utils';
import CyberPageLayout from '@/components/CyberPageLayout';
import EnhanceFooter from '@/components/Footer/EnhanceFooter';
import EnhanceWorkspace from '@/components/Workspace/EnhanceWorkspace';
import GameCard from '@/components/GameCard';
import CardRewardModal from '@/components/CardRewardModal';
import { useAlert } from '@/context/AlertContext';
import { cn } from '@/lib/utils';
import { getResearchBonus } from '@/lib/research-system';
import { loadInventory, InventoryCard, filterCards, sortCards, getInventoryStats, updateInventoryCard, getMainCards } from '@/lib/inventory-system';
import { getGameState } from '@/lib/game-state';
import { gameStorage } from '@/lib/game-storage';
import { FACTION_CATEGORY_MAP } from '@/lib/token-constants'; // [NEW]
import { useUser } from '@/context/UserContext'; // [NEW]
import { Sparkles } from "lucide-react";

export default function EnhancePage() {
    const { showAlert } = useAlert();
    const router = useRouter();
    const { consumeTokens, profile, user, loading } = useUser(); // [NEW]
    const [allCards, setAllCards] = useState<InventoryCard[]>([]);
    const [targetCard, setTargetCard] = useState<InventoryCard | null>(null);
    const [materialSlots, setMaterialSlots] = useState<(InventoryCard | null)[]>(Array(10).fill(null));
    const [userTokens, setUserTokens] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [masteryLevel, setMasteryLevel] = useState(0);
    const [selectedRarity, setSelectedRarity] = useState<string>('all');

    // 강화 완료 모달
    const [rewardModalOpen, setRewardModalOpen] = useState(false);
    const [enhancedResult, setEnhancedResult] = useState<CardType | null>(null);
    const [previousStats, setPreviousStats] = useState<CardType['stats'] | undefined>(undefined);

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        const allInventory = await loadInventory();
        // Filter out commander cards - they cannot be enhanced
        const cards = allInventory.filter(c => c.rarity !== 'commander');

        const gameState = getGameState();

        let discountVal = 0;
        let masteryVal = 0;
        if (gameState.research?.stats?.negotiation) {
            discountVal = getResearchBonus('negotiation', gameState.research.stats.negotiation.currentLevel) / 100;
        }
        if (gameState.research?.stats?.mastery) {
            masteryVal = gameState.research.stats.mastery.currentLevel;
        }
        setDiscount(discountVal);
        setMasteryLevel(masteryVal);

        setAllCards(cards);
        setAllCards(cards);
        setUserTokens(profile ? profile.tokens : (gameState.tokens || 0)); // Use profile tokens if available
    };

    // 카드 드래그 시작
    const handleDragStart = (e: React.DragEvent, card: InventoryCard) => {
        e.dataTransfer.setData('application/json', JSON.stringify(card));
    };

    // 카드 클릭 (타겟이 없으면 타겟으로, 있으면 재료로, 이미 선택된 카드면 제거)
    const handleCardClick = (card: InventoryCard) => {
        // 1. 타겟 카드를 다시 클릭한 경우 -> 타겟 제거
        if (targetCard && card.instanceId === targetCard.instanceId) {
            handleTargetRemove();
            return;
        }

        // 2. 재료 슬롯에 있는 카드를 다시 클릭한 경우 -> 해당 슬롯에서 제거
        const materialIndex = materialSlots.findIndex(s => s?.instanceId === card.instanceId);
        if (materialIndex !== -1) {
            handleMaterialRemove(materialIndex);
            return;
        }

        // 3. 타겟이 없으면 타겟으로 설정
        if (!targetCard) {
            setTargetCard(card);
            // 타겟 설정 시 슬롯 초기화 (혹시 모르니)
            setMaterialSlots(Array(10).fill(null));
        } else {
            // 4. 타겟이 있고, 다른 카드를 클릭한 경우 -> 재료로 추가
            // Rarity Check
            if ((card.rarity || 'common') !== (targetCard.rarity || 'common')) {
                showAlert({ title: '등급 불일치', message: '강화 재료는 대상 카드와 같은 등급이어야 합니다.', type: 'warning' });
                return;
            }

            // 타겟이 아닌 다른 카드면 재료로 추가
            const emptyIndex = materialSlots.findIndex(s => s === null);
            if (emptyIndex !== -1) {
                const newSlots = [...materialSlots];
                newSlots[emptyIndex] = card;
                setMaterialSlots(newSlots);
            } else {
                showAlert({ title: '슬롯 가득 참', message: '더 이상 재료를 추가할 수 없습니다.', type: 'warning' });
            }
        }
    };

    // 타겟 드롭
    const handleTargetDrop = (card: InventoryCard) => {
        setTargetCard(card);
        // 타겟 변경 시 재료 초기화
        setMaterialSlots(Array(10).fill(null));
    };

    // 재료 드롭
    const handleMaterialDrop = (card: InventoryCard, index: number) => {
        if (!targetCard) {
            setTargetCard(card);
            setMaterialSlots(Array(10).fill(null));
            return;
        }

        // Rarity Check
        if ((card.rarity || 'common') !== (targetCard.rarity || 'common')) {
            showAlert({ title: '등급 불일치', message: '강화 재료는 대상 카드와 같은 등급이어야 합니다.', type: 'warning' });
            return;
        }

        if (card.instanceId !== targetCard.instanceId) {
            // 이미 슬롯에 있는 카드인지 확인 (UX 결정사항: 중복 허용? 아님. 인벤토리 카드는 고유함)
            // InventoryCard has instanceId. If dragging same card to another slot?
            // Usually we move it. But here we overwrite.
            // Check if card is already in another slot?
            const existingIndex = materialSlots.findIndex(s => s?.instanceId === card.instanceId);
            const newSlots = [...materialSlots];

            if (existingIndex !== -1 && existingIndex !== index) {
                // 이미 다른 슬롯에 있으면 그 슬롯 비움 (이동 효과)
                newSlots[existingIndex] = null;
            }

            newSlots[index] = card;
            setMaterialSlots(newSlots);
        }
    };

    // 타겟 제거
    const handleTargetRemove = () => {
        setTargetCard(null);
        setMaterialSlots(Array(10).fill(null));
    };

    // 재료 제거
    const handleMaterialRemove = (index: number) => {
        const newSlots = [...materialSlots];
        newSlots[index] = null;
        setMaterialSlots(newSlots);
    };

    // 초기화
    const handleClear = () => {
        setTargetCard(null);
        setMaterialSlots(Array(10).fill(null));
    };

    // 자동 선택 (같은 등급 10장)
    const handleAutoSelect = () => {
        if (!targetCard) return;

        // 타겟 제외, 같은 등급인 카드 중 레벨이 낮은 순으로 10장 선택
        const available = allCards.filter(c =>
            c.instanceId !== targetCard.instanceId &&
            c.rarity === targetCard.rarity
        );
        const sorted = available.sort((a, b) => (a.level || 1) - (b.level || 1));
        const selected = sorted.slice(0, 10);

        setMaterialSlots([...selected, ...Array(10 - selected.length).fill(null)]);
    };

    // 강화 실행
    const handleEnhance = async () => {
        if (!targetCard) return;

        const filledMaterials = materialSlots.filter((c): c is InventoryCard => c !== null);
        if (filledMaterials.length !== 10) {
            showAlert({ title: '재료 부족', message: '재료 카드 10장이 필요합니다.', type: 'warning' });
            return;
        }


        const cost = getEnhanceCost(targetCard.level || 1, targetCard.rarity || 'common', discount);

        // 카테고리 판별 (팩션 ID 기반)
        const factionId = targetCard.aiFactionId || 'gemini'; // default
        const categoryKey = FACTION_CATEGORY_MAP[factionId] || 'COMMON';

        // consumeTokens가 잔액 체크 및 소모(할인/페이백 포함) 처리
        const success = await consumeTokens(cost, categoryKey);

        if (!success) {
            showAlert({ title: '토큰 부족', message: `토큰이 부족합니다. (필요: ${cost})`, type: 'error' });
            return;
        }

        try {
            const { removeCardFromInventory, addCardToInventory } = await import('@/lib/inventory-system');

            // 강화 실행 (숙달 레벨 전달)
            setPreviousStats(targetCard.stats); // 이전 스탯 저장
            const enhancedCard = enhanceCard(targetCard as any, filledMaterials as any, masteryLevel);

            // 1. 재료 카드 10장 삭제
            for (const mat of filledMaterials) {
                await removeCardFromInventory(mat.instanceId);
            }

            // 2. 대상 카드 삭제 후 강화된 카드 추가
            await removeCardFromInventory(targetCard.instanceId);
            await addCardToInventory(enhancedCard);

            // 3. 토큰 차감 (이미 consumeTokens에서 처리됨)
            // await gameStorage.addTokens(-cost); // REMOVED

            // 4. 강화 성공 모달 표시
            setEnhancedResult(enhancedCard);
            setRewardModalOpen(true);

            // 알림 트리거 (강화 성공)
            if (user?.uid) {
                import('@/lib/notification-service').then(({ sendNotification }) => sendNotification(user.uid, {
                    type: 'system',
                    title: '카드 강화 성공!',
                    message: `${enhancedCard.name} 카드 강화가 완료되었습니다!`,
                })).catch(() => {});
            }

            handleClear();
            await loadCards(); // 인벤토리 & 토큰 갱신
        } catch (error) {
            console.error('강화 오류:', error);
            // 실패 시 토큰 롤백 처리가 필요할 수 있으나, 일단 소모된 것으로 처리 (실패 비용)
            // 혹은 여기서 addTokens(cost)로 복구해줄 수도 있음. 
            // 하지만 transaction이 아니므로 복잡함. 일단 에러는 드물다고 가정.
            showAlert({ title: '강화 실패', message: `강화 중 문제가 발생했습니다.\n${error instanceof Error ? error.message : String(error)}`, type: 'error' });
        }
    };

    const filledCount = materialSlots.filter(c => c !== null).length;
    const canEnhance = targetCard !== null && filledCount === 10;

    // 미리보기 정보 (숙달 레벨 반영)
    const preview = targetCard ? getEnhancePreview(targetCard as any, masteryLevel) : undefined;
    const enhancePreview = (preview && targetCard) ? {
        currentLevel: preview.currentLevel,
        nextLevel: preview.nextLevel,
        currentPower: targetCard.stats.totalPower || 0,
        nextPower: preview.nextStats.totalPower || 0,
        cost: getEnhanceCost(targetCard.level || 1, targetCard.rarity || 'common', discount)
    } : undefined;

    // 모든 카드 표시 (주력 카드 우선 정렬)
    const displayCards = sortCards(
        allCards.filter(c =>
            c.instanceId !== targetCard?.instanceId &&
            !materialSlots.some(s => s?.instanceId === c.instanceId) &&
            (selectedRarity === 'all' || (c.rarity || 'common') === selectedRarity)
        ),
        'power',
        false,
        true // prioritizeMain
    );

    if (!loading && !user) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center p-8 bg-black/40 border border-cyan-500/30 rounded-xl max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-2">로그인이 필요해요</h2>
                    <p className="text-gray-400 mb-6">이 기능을 사용하려면 먼저 로그인해 주세요.</p>
                    <button onClick={() => router.push('/')} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors">
                        로그인하기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <CyberPageLayout
            title="강화 프로토콜"
            englishTitle="UNIT UPGRADE"
            description="인벤토리의 유닛을 선택하여 강화합니다. 숙달 연구 레벨에 따라 고성장 확률이 증가하며, 협상력 레벨에 따라 비용이 할인됩니다."
            color="amber"
            leftSidebarIcon={<Sparkles size={32} className="text-amber-400" />}
            leftSidebarTips={[
                "✨ 동일한 등급의 AI 카드를 재료로 사용하여 유닛을 강화할 수 있습니다.",
                "🧪 [연구소 > 숙달 연구] 레벨이 높으면 강화 '대성공' 확률이 증가합니다.",
                "💰 [연구소 > 협상력 연구] 레벨이 높으면 강화 비용(토큰)이 할인됩니다.",
                "⚠️ 강화에 사용된 재료 카드는 사라지므로 주의하세요.",
                "⭐ 주력 카드는 잠금 설정하여 실수로 재료로 사용하는 것을 방지하세요."
            ]}
        >
            {/* 메인 영역: 카드 목록 */}
            {/* 메인 영역: 카드 목록 */}
            <div className="p-6 pb-[280px] md:pb-[160px] w-full mx-auto overflow-auto custom-scrollbar h-[calc(100vh-80px)]">
                {/* Main Cards Section - 주력카드 */}
                {allCards.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
                            <span className="text-amber-400">⭐</span>
                            주력 카드 (등급별 최고 레벨)
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-gradient-to-br from-amber-900/10 to-yellow-900/10 p-3 rounded-xl border border-amber-500/20">
                            {(() => {
                                const mainCards = getMainCards(allCards);

                                return mainCards.map(card => {
                                    const rarity = card.rarity || 'common';
                                    if (selectedRarity !== 'all' && (card.rarity || 'common') !== selectedRarity) return null;

                                    const isSelected =
                                        card.instanceId === targetCard?.instanceId ||
                                        materialSlots.some(s => s?.instanceId === card.instanceId);

                                    return (
                                        <div
                                            key={rarity}
                                            onClick={() => handleCardClick(card)}
                                            className={cn(
                                                "cursor-pointer transition-all hover:scale-105",
                                                isSelected && "opacity-50 ring-2 ring-amber-500 rounded-xl"
                                            )}
                                        >
                                            <GameCard card={card as any} />
                                        </div>
                                    );
                                }).filter(Boolean);
                            })()}
                        </div>
                    </div>
                )}

                {/* 인벤토리 헤더 및 필터 */}
                <div className="mb-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            내 유닛 보관함 <span className="text-sm text-zinc-500 font-normal">({displayCards.length}장)</span>
                        </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {['all', 'common', 'rare', 'epic', 'legendary', 'mythic'].map(rarity => (
                            <button
                                key={rarity}
                                onClick={() => setSelectedRarity(rarity)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border",
                                    selectedRarity === rarity
                                        ? "bg-amber-500 text-black border-amber-400"
                                        : "bg-black/40 text-white/60 border-white/10 hover:bg-white/10"
                                )}
                            >
                                {rarity === 'all' ? '전체' : rarity}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 카드 그리드 */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {displayCards.map(card => {
                        const isSelected =
                            card.instanceId === targetCard?.instanceId ||
                            materialSlots.some(s => s?.instanceId === card.instanceId);

                        return (
                            <div
                                key={card.instanceId}
                                onClick={() => handleCardClick(card)}
                                className={cn(
                                    "cursor-pointer transition-all hover:scale-105",
                                    isSelected && "opacity-50 ring-2 ring-amber-500 rounded-xl"
                                )}
                            >
                                <GameCard card={card as any} />
                            </div>
                        );
                    })}
                </div>

                {displayCards.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                        <p>해당하는 카드가 없습니다.</p>
                    </div>
                )}
            </div>

            {/* 하단 푸터 슬롯 (강화 UI 핵심) */}
            <EnhanceFooter
                targetCard={targetCard as any}
                materialSlots={materialSlots as any}
                onTargetDrop={handleTargetDrop as any}
                onMaterialDrop={handleMaterialDrop as any}
                onTargetRemove={handleTargetRemove}
                onMaterialRemove={handleMaterialRemove}
                onClear={handleClear}
                onAutoSelect={handleAutoSelect}
                onEnhance={handleEnhance}
                canEnhance={canEnhance}
            />

            {/* 결과 모달 */}
            <CardRewardModal
                isOpen={rewardModalOpen}
                onClose={() => setRewardModalOpen(false)}
                cards={enhancedResult ? [enhancedResult] : []}
                title="강화 프로토콜 완료"
                previousStats={previousStats}
            />
        </CyberPageLayout>
    );
}
