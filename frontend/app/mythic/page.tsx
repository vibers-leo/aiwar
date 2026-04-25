'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card as CardType } from '@/lib/types';
import { InventoryCard, addCardToInventory, removeCardFromInventory, loadInventory as loadInventorySystem } from '@/lib/inventory-system';
import CyberPageLayout from '@/components/CyberPageLayout';
import MythicFooter from '@/components/Footer/MythicFooter';
import GameCard from '@/components/GameCard';
import { cn } from '@/lib/utils';
import { useAlert } from '@/context/AlertContext';
import CardRewardModal from '@/components/CardRewardModal';
import { gameStorage } from '@/lib/game-storage';
import { useUser } from '@/context/UserContext';
import { useNotification } from '@/context/NotificationContext';
import { generateId } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';
import { Crown } from "lucide-react";

export default function MythicCreationPage() {
    const { showAlert } = useAlert();
    const { refreshData } = useUser();
    const { t } = useTranslation();

    const [legendaryCards, setLegendaryCards] = useState<InventoryCard[]>([]);
    const [materialSlots, setMaterialSlots] = useState<(InventoryCard | null)[]>(Array(3).fill(null));
    const [userTokens, setUserTokens] = useState(0);

    // Reward Modal State
    const [rewardModalOpen, setRewardModalOpen] = useState(false);
    const [rewardCard, setRewardCard] = useState<CardType | null>(null);

    // Parameters
    const REQUIRED_TOKEN_COST = 5000;

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        const cards = await loadInventorySystem();
        const gameState = await gameStorage.loadGameState();

        // Filter only Legendary cards that are not enhanced (Level 1)
        const legendaries = cards.filter(c => c.rarity === 'legendary' && c.level === 1);

        setLegendaryCards(legendaries as InventoryCard[]);
        setUserTokens(gameState.tokens || 0);
    };

    // Card Drag Start
    const handleDragStart = (e: React.DragEvent, card: InventoryCard) => {
        e.dataTransfer.setData('application/json', JSON.stringify(card));
    };

    // Card Click
    const handleCardClick = (card: InventoryCard) => {
        const emptyIndex = materialSlots.findIndex(s => s === null);
        if (emptyIndex !== -1) {
            const newSlots = [...materialSlots];
            newSlots[emptyIndex] = card;
            setMaterialSlots(newSlots);
        }
    };

    // Material Drop
    const handleMaterialDrop = (card: InventoryCard | CardType, index: number) => {
        const newSlots = [...materialSlots];
        newSlots[index] = card as InventoryCard;
        setMaterialSlots(newSlots);
    };

    // Material Remove
    const handleMaterialRemove = (index: number) => {
        const newSlots = [...materialSlots];
        newSlots[index] = null;
        setMaterialSlots(newSlots);
    };

    // Clear Slots
    const handleClear = () => {
        setMaterialSlots(Array(3).fill(null));
    };

    // Auto Select
    const handleAutoSelect = () => {
        // 이미 슬롯에 있는 것 제외하고 선택
        const selectedIds = materialSlots.filter(c => c !== null).map(c => c!.id);
        const available = legendaryCards.filter(c => !selectedIds.includes(c.id));

        if (available.length < 3) {
            showAlert({
                title: t('fusion.validation.selectThree'),
                message: t('fusion.validation.selectThree'),
                type: 'warning'
            });
            return;
        }

        const toSelect = available.slice(0, 3);
        setMaterialSlots(toSelect);
    };

    // Create Mythic Card Logic
    const createMythicCard = (materials: InventoryCard[], userId: string): CardType => {
        // 1. Calculate Stats (Avg * 1.3)
        const avgStats = {
            efficiency: Math.floor(materials.reduce((sum, c) => sum + (c.stats.efficiency || 0), 0) / 3),
            creativity: Math.floor(materials.reduce((sum, c) => sum + (c.stats.creativity || 0), 0) / 3),
            function: Math.floor(materials.reduce((sum, c) => sum + (c.stats.function || 0), 0) / 3),
        };

        const multiplier = 1.3; // 30% bonus for Mythic
        const newEfficiency = Math.floor(avgStats.efficiency * multiplier);
        const newCreativity = Math.floor(avgStats.creativity * multiplier);
        const newFunction = Math.floor(avgStats.function * multiplier);
        const newTotalPower = newEfficiency + newCreativity + newFunction;

        return {
            id: generateId(),
            instanceId: `${generateId()}-${Date.now()}`,
            templateId: materials[0].templateId || materials[0].id,
            name: `${materials[0].name} (Mythic)`,
            ownerId: userId,
            level: 1, // Reset level
            experience: 0,
            stats: {
                efficiency: newEfficiency,
                creativity: newCreativity,
                function: newFunction,
                accuracy: 0, speed: 0, stability: 0, ethics: 0,
                totalPower: newTotalPower
            },
            rarity: 'mythic',
            acquiredAt: new Date(),
            isLocked: false,
            specialSkill: materials[0].specialSkill
        };
    };

    const { addNotification } = useNotification();

    // Submit Handler
    const handleSubmit = async () => {
        const filledMaterials = materialSlots.filter((c): c is InventoryCard => c !== null);

        if (filledMaterials.length !== 3) {
            showAlert({ title: t('fusion.validation.selectThree'), message: t('fusion.validation.selectThree'), type: 'warning' });
            return;
        }

        if (userTokens < REQUIRED_TOKEN_COST) {
            showAlert({ title: t('unique.modal.insufficient'), message: `${t('unique.modal.insufficient')} (Req: ${REQUIRED_TOKEN_COST})`, type: 'warning' });
            return;
        }

        try {
            // 1. Create Card
            const { user } = useUser(); // Moved inside to ensure it's accessed correctly if needed, though hook should be top level. Actually the hook is top level already.

            // Re-using user from top level hook
            const newCard = createMythicCard(filledMaterials, user?.uid || 'player');

            // 2. Remove Materials
            for (const mat of filledMaterials) {
                await removeCardFromInventory(mat.instanceId);
            }

            // 3. Add New Card
            await addCardToInventory(newCard);

            // 4. Consume Tokens
            await gameStorage.addTokens(-REQUIRED_TOKEN_COST);

            // 5. Success
            setRewardCard(newCard);
            setRewardModalOpen(true);
            handleClear();
            refreshData();
            loadCards(); // Refresh list

            addNotification('enhance', t('unique.modal.success'), `${newCard.name} ${t('unique.modal.success')}`, '/mythic');

        } catch (e) {
            console.error(e);
            showAlert({ title: t('unique.modal.error'), message: t('unique.modal.error'), type: 'error' });
            addNotification('error', t('unique.modal.error'), t('unique.modal.error'), '/mythic');
        }
    };

    const filledCount = materialSlots.filter(c => c !== null).length;
    const canSubmit = filledCount === 3;

    return (
        <CyberPageLayout
            title={t('page.unique.title')}
            englishTitle={t('page.unique.englishTitle')}
            description={t('page.unique.description')}
            color="red"
            leftSidebarIcon={<Crown size={32} className="text-red-500" />}
            leftSidebarTips={[
                "👑 전설 등급 카드 3장을 융합하여 '신화(Mythic)' 등급 카드를 제작합니다.",
                "⚠️ 융합에 사용된 전설 카드는 소멸되므로 신중하게 선택하세요.",
                "⚡ 신화 제작에는 대량의 토큰(5,000)이 소모됩니다.",
                "⚔️ 신화 유닛은 압도적인 기본 능력치와 강력한 고유 스킬을 보유합니다.",
                "🎰 제작 시 일정 확률로 다른 기종의 신화 유닛이 등장할 수 있습니다 (변이)."
            ]}
        >
            {/* Top Info */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-red-500">{t('fusion.selectUnitsPrompt')}</h2>
                        <p className="text-red-300/60 text-sm">보유 중인 전설 카드만 표시됩니다.</p>
                    </div>
                    <div className="bg-black/40 px-4 py-2 rounded-lg border border-red-900/50">
                        <span className="text-red-400 text-sm mr-2">{t('fusion.cost')}:</span>
                        <span className="text-xl font-bold text-yellow-500">{REQUIRED_TOKEN_COST.toLocaleString()} T</span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-[220px]">
                    {legendaryCards.map(card => {
                        const isSelected = materialSlots.some(s => s?.id === card.id);
                        return (
                            <div
                                key={card.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, card)}
                                onClick={() => handleCardClick(card)}
                                className={cn(
                                    "cursor-grab active:cursor-grabbing transition-all hover:scale-105",
                                    isSelected && "opacity-50 ring-2 ring-red-500 grayscale"
                                )}
                            >
                                <GameCard card={card} />
                            </div>
                        );
                    })}
                    {legendaryCards.length === 0 && (
                        <div className="col-span-full py-20 text-center text-red-300/30">
                            {t('unique.list.empty')}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <MythicFooter
                label={t('fusion.requirements')}
                materialSlots={materialSlots}
                onMaterialDrop={handleMaterialDrop}
                onMaterialRemove={handleMaterialRemove}
                onClear={handleClear}
                onAutoSelect={handleAutoSelect}
                onSubmit={handleSubmit}
                canSubmit={canSubmit}
            />

            {/* Reward Modal */}
            <CardRewardModal
                isOpen={rewardModalOpen}
                onClose={() => setRewardModalOpen(false)}
                cards={rewardCard ? [rewardCard] : []}
                title={t('unique.modal.success')}
            />
        </CyberPageLayout>
    );
}
