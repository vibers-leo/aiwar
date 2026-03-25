'use client';

import { useState, useEffect } from 'react';
import { InventoryCard, loadInventory } from '@/lib/inventory-system';
import {
    canApplyForStudio,
    submitStudioApplication,
    getStudioCost,
    getMyApplications,
    StudioApplication,
    getUniqueStatBonus,
    getRemainingTime,
    UNIQUE_CREATION_TIME_MS,
    REQUIRED_MATERIAL_COUNT,
    validateMaterialCards
} from '@/lib/studio-application-utils';
import { Button } from '@/components/ui/custom/Button';
import GameCard from '@/components/GameCard';
import CyberPageLayout from '@/components/CyberPageLayout';
import { Input } from '@/components/ui/custom/Input';
import { Textarea } from '@/components/ui/custom/Textarea';
import ImageUpload from '@/components/ImageUpload';
import MythicFooter from '@/components/Footer/MythicFooter';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';
import { Sparkles, Star, Clock, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { Card } from '@/lib/types';

export default function StudioPage() {
    const [selectedCard, setSelectedCard] = useState<InventoryCard | null>(null);
    const [materialSlots, setMaterialSlots] = useState<(InventoryCard | null)[]>(Array(REQUIRED_MATERIAL_COUNT).fill(null));
    const [userTokens, setUserTokens] = useState(0);
    const [displayCards, setDisplayCards] = useState<InventoryCard[]>([]);
    const { t, language } = useTranslation();

    // Application Form State
    const [appName, setAppName] = useState('');
    const [appDesc, setAppDesc] = useState('');
    const [appImage, setAppImage] = useState<string | null>(null);
    const [myApps, setMyApps] = useState<StudioApplication[]>([]);
    const [viewMode, setViewMode] = useState<'create' | 'list'>('create');

    useEffect(() => {
        loadCards();

        // 1초마다 남은 시간 업데이트
        const interval = setInterval(() => {
            setMyApps(prev => [...prev]); // Force re-render
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const loadCards = async () => {
        const { getGameState } = await import('@/lib/game-state');

        const cards = await loadInventory();
        const state = getGameState();
        const apps = await getMyApplications();

        setDisplayCards(cards);
        setUserTokens(state.tokens || 0);
        setMyApps(apps);
    };

    const handleCardClick = (card: InventoryCard) => {
        if (selectedCard?.instanceId === card.instanceId) {
            setSelectedCard(null);
        } else {
            setSelectedCard(card);
        }
    };

    const handleMaterialClick = (card: InventoryCard) => {
        // 빈 슬롯 찾기
        const emptyIndex = materialSlots.findIndex(slot => slot === null);
        if (emptyIndex !== -1) {
            const newSlots = [...materialSlots];
            newSlots[emptyIndex] = card;
            setMaterialSlots(newSlots);
        }
    };

    const handleDragStart = (e: React.DragEvent, card: InventoryCard) => {
        e.dataTransfer.setData('application/json', JSON.stringify(card));
    };

    const handleMaterialDrop = (card: InventoryCard | Card, index: number) => {
        const newSlots = [...materialSlots];
        newSlots[index] = card as InventoryCard;
        setMaterialSlots(newSlots);
    };

    const handleMaterialRemove = (index: number) => {
        const newSlots = [...materialSlots];
        newSlots[index] = null;
        setMaterialSlots(newSlots);
    };

    const handleClear = () => {
        setMaterialSlots(Array(REQUIRED_MATERIAL_COUNT).fill(null));
    };

    const handleAutoSelect = () => {
        if (!selectedCard) return;

        const baseRarity = selectedCard.rarity || 'common';
        const selectedIds = new Set(materialSlots.filter(s => s).map(s => s!.instanceId));
        selectedIds.add(selectedCard.instanceId); // 베이스 카드 제외

        // 같은 등급, 레벨 1 카드만 필터링
        const availableMaterials = displayCards.filter(card =>
            card.rarity === baseRarity &&
            (card.level || 1) === 1 &&
            !selectedIds.has(card.instanceId)
        );

        if (availableMaterials.length < REQUIRED_MATERIAL_COUNT) {
            alert(`같은 등급(${baseRarity})의 레벨 1 카드가 부족합니다. (필요: ${REQUIRED_MATERIAL_COUNT}장, 보유: ${availableMaterials.length}장)`);
            return;
        }

        setMaterialSlots(availableMaterials.slice(0, REQUIRED_MATERIAL_COUNT));
    };

    const handleSubmit = async () => {
        if (!selectedCard) {
            alert(t('unique.studio.validation.baseCard'));
            return;
        }

        const filledMaterials = materialSlots.filter((c): c is InventoryCard => c !== null);

        // 재료 검증
        const validation = validateMaterialCards(selectedCard, filledMaterials);
        if (!validation.isValid) {
            alert(validation.message);
            return;
        }

        if (!appName.trim() || !appDesc.trim()) {
            alert(t('unique.studio.validation.input'));
            return;
        }

        const rarity = selectedCard.rarity || 'common';
        const { coins: costCoins, tokens: costTokens } = getStudioCost(rarity);

        const confirmMsg = `유니크 생성을 시작하시겠습니까?\n\n베이스: ${selectedCard.name}\n재료: ${filledMaterials.length}장\n비용: ${costCoins.toLocaleString()} Coins + ${costTokens.toLocaleString()} Tokens\n\n⏱️ 완성까지 72시간 (3일)이 소요됩니다.\n⚠️ 재료 카드는 소모됩니다.`;

        if (confirm(confirmMsg)) {
            const result = await submitStudioApplication(
                appName,
                appDesc,
                appImage || selectedCard.imageUrl || '/card_placeholder.png',
                selectedCard,
                filledMaterials
            );

            if (result.success) {
                alert(result.message);
                setSelectedCard(null);
                setMaterialSlots(Array(REQUIRED_MATERIAL_COUNT).fill(null));
                setAppName('');
                setAppDesc('');
                setAppImage(null);
                await loadCards();
                setViewMode('list');
            } else {
                alert(result.message);
            }
        }
    };

    const filledMaterialCount = materialSlots.filter(s => s !== null).length;
    const canSubmit = !!selectedCard && !!appName.trim() && !!appDesc.trim() && filledMaterialCount === REQUIRED_MATERIAL_COUNT;

    // 선택된 카드의 등급별 비용 계산
    const studioCost = selectedCard ? getStudioCost(selectedCard.rarity || 'common') : { coins: 0, tokens: 0 };
    const statBonus = selectedCard ? getUniqueStatBonus(selectedCard.rarity || 'common') : 1.0;

    // 등급별 색상
    const getRarityColor = (rarity?: string) => {
        switch (rarity) {
            case 'common': return 'text-gray-400';
            case 'rare': return 'text-blue-400';
            case 'epic': return 'text-purple-400';
            case 'legendary': return 'text-yellow-400';
            case 'mythic': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    // 재료로 사용 가능한지 체크
    const canUseMaterial = (card: InventoryCard): boolean => {
        if (!selectedCard) return false;
        if (card.instanceId === selectedCard.instanceId) return false; // 베이스 카드 제외
        if (card.rarity !== selectedCard.rarity) return false; // 같은 등급만
        if ((card.level || 1) !== 1) return false; // 레벨 1만
        return true;
    };

    return (
        <CyberPageLayout
            title={t('unique.studio.title')}
            subtitle="UNIQUE CREATION"
            description={t('unique.studio.description')}
            color="red"
        >
            {/* 탭 버튼 */}
            <div className="flex gap-3 mb-6 -mt-4">
                <button
                    onClick={() => setViewMode('create')}
                    className={cn(
                        "px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                        viewMode === 'create'
                            ? "bg-red-500/20 text-red-400 border border-red-500/50"
                            : "bg-white/5 text-white/60 hover:bg-white/10 border border-transparent"
                    )}
                >
                    <Sparkles size={16} />
                    {t('unique.tab.create')}
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                        "px-5 py-2 text-sm font-medium rounded-lg transition-all",
                        viewMode === 'list'
                            ? "bg-red-500/20 text-red-400 border border-red-500/50"
                            : "bg-white/5 text-white/60 hover:bg-white/10 border border-transparent"
                    )}
                >
                    {t('unique.tab.history')} ({myApps.length})
                </button>
            </div>

            {viewMode === 'create' ? (
                <>
                    <div className="pb-[280px] md:pb-[160px]">
                        {/* 입력 폼 */}
                        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                                <Star className="text-yellow-400" size={20} />
                                {t('unique.form.title')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">{t('unique.form.name')}</label>
                                        <Input
                                            value={appName}
                                            onChange={(e) => setAppName(e.target.value)}
                                            placeholder={t('unique.form.namePlaceholder')}
                                            className="bg-gray-800 border-gray-700 h-12 text-lg"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-gray-300 mb-2">{t('unique.form.desc')}</label>
                                        <Textarea
                                            value={appDesc}
                                            onChange={(e) => setAppDesc(e.target.value)}
                                            placeholder={t('unique.form.descPlaceholder')}
                                            className="bg-gray-800 border-gray-700 h-64 resize-none text-base leading-relaxed"
                                        />
                                    </div>
                                </div>
                                <div className="h-full">
                                    <ImageUpload
                                        onImageChange={setAppImage}
                                        currentImage={appImage || undefined}
                                        className="h-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {selectedCard && (
                            <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-400 font-bold">{t('unique.cost.label')}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("font-bold text-sm", getRarityColor(selectedCard.rarity))}>
                                            [{selectedCard.rarity?.toUpperCase() || 'COMMON'}]
                                        </span>
                                        <span className="font-bold text-yellow-400">
                                            {studioCost.coins.toLocaleString()} Coins / {studioCost.tokens.toLocaleString()} Tokens
                                        </span>
                                    </div>
                                </div>

                                {/* 재료 요구사항 */}
                                <div className={cn(
                                    "flex items-center gap-2 text-sm mb-2 p-2 rounded",
                                    filledMaterialCount === REQUIRED_MATERIAL_COUNT ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                                )}>
                                    <Package size={16} />
                                    <span>
                                        재료 카드: {filledMaterialCount}/{REQUIRED_MATERIAL_COUNT}장 (같은 등급, 레벨 1)
                                    </span>
                                </div>

                                {/* 생성 시간 안내 */}
                                <div className="flex items-center gap-2 text-sm mb-2 text-cyan-400">
                                    <Clock size={16} />
                                    <span>생성 시간: 72시간 (3일)</span>
                                </div>

                                <div className="text-xs text-gray-400 mb-2">
                                    <Star className="inline text-yellow-400" size={12} /> 스탯 보너스: +{((statBonus - 1) * 100).toFixed(0)}%
                                </div>
                                <p className="text-xs text-gray-500 whitespace-pre-wrap">
                                    {t('unique.cost.warning')}
                                </p>
                            </div>
                        )}

                        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">
                                    {t('unique.list.title')} ({displayCards.length})
                                </h3>
                                <p className="text-sm text-gray-400">
                                    베이스 카드 선택 후 재료 카드를 선택하세요
                                </p>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {displayCards.map(card => {
                                    const isSelectedBase = selectedCard?.instanceId === card.instanceId;
                                    const isSelectedMaterial = materialSlots.some(s => s?.instanceId === card.instanceId);
                                    const isMaterialEligible = canUseMaterial(card);

                                    return (
                                        <div
                                            key={card.instanceId}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, card)}
                                            onClick={() => {
                                                if (!selectedCard) {
                                                    handleCardClick(card);
                                                } else if (isMaterialEligible && !isSelectedMaterial) {
                                                    handleMaterialClick(card);
                                                }
                                            }}
                                            className={cn(
                                                "cursor-pointer transition-all relative",
                                                isSelectedBase && "ring-4 ring-red-500 scale-105 z-10",
                                                isSelectedMaterial && "ring-4 ring-cyan-500 scale-105 z-10",
                                                !isSelectedBase && !isSelectedMaterial && selectedCard && !isMaterialEligible && "opacity-30 grayscale",
                                                !isSelectedBase && !isSelectedMaterial && "hover:scale-105"
                                            )}
                                        >
                                            <GameCard card={card} />
                                            {card.isUnique && (
                                                <div className="absolute inset-x-0 bottom-0 bg-yellow-600 text-white text-[10px] font-bold py-1 text-center font-mono flex items-center justify-center gap-1">
                                                    <Star size={12} />
                                                    UNIQUE
                                                </div>
                                            )}
                                            {selectedCard && !isMaterialEligible && card.instanceId !== selectedCard.instanceId && (
                                                <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                                                    {card.rarity !== selectedCard.rarity ? '등급' : 'Lv.1만'}
                                                </div>
                                            )}
                                            {isSelectedBase && (
                                                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg text-xs">
                                                    BASE
                                                </div>
                                            )}
                                            {isSelectedMaterial && (
                                                <div className="absolute -top-2 -right-2 bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {displayCards.length === 0 && (
                                <div className="text-center py-20 text-white/40">
                                    {t('unique.list.empty')}
                                </div>
                            )}
                        </div>
                    </div>

                    <MythicFooter
                        label={language === 'ko' ? `베이스 + 재료 (${filledMaterialCount}/${REQUIRED_MATERIAL_COUNT})` : `Base + Materials (${filledMaterialCount}/${REQUIRED_MATERIAL_COUNT})`}
                        submitLabel={language === 'ko' ? '유니크 생성 신청 (72시간)' : 'Submit Creation (72h)'}
                        materialSlots={[selectedCard, ...materialSlots]}
                        onMaterialDrop={handleMaterialDrop}
                        onMaterialRemove={handleMaterialRemove}
                        onClear={handleClear}
                        onAutoSelect={handleAutoSelect}
                        onSubmit={handleSubmit}
                        canSubmit={canSubmit}
                    />
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myApps.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            {t('unique.history.empty')}
                        </div>
                    ) : (
                        myApps.map(app => {
                            const timeInfo = getRemainingTime(app.completedAt);

                            return (
                                <div key={app.id} className="bg-white/5 border border-white/10 rounded-lg p-6 relative group overflow-hidden">
                                    <div className="absolute top-4 right-4 z-10">
                                        {timeInfo.isComplete ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 flex items-center gap-1">
                                                <CheckCircle size={12} />
                                                완료
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 flex items-center gap-1">
                                                <Clock size={12} />
                                                {timeInfo.remainingText}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-4 items-start mb-4">
                                        <div className="w-20 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                            {app.imageUrl ? (
                                                <img src={app.imageUrl} alt={app.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">?</div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-white mb-1 flex items-center gap-1">
                                                <Star className="text-yellow-400" size={16} />
                                                {app.name}
                                            </h4>
                                            <p className="text-xs text-gray-400 line-clamp-2">{app.description}</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                신청: {new Date(app.createdAt).toLocaleString()}
                                            </p>
                                            {app.completedAt && (
                                                <p className="text-xs text-cyan-400 mt-1">
                                                    완료 예정: {new Date(app.completedAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {!timeInfo.isComplete && (
                                        <div className="bg-white/5 p-3 rounded text-xs text-gray-400 mt-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock size={14} className="text-cyan-400" />
                                                <span className="text-cyan-400 font-bold">제작 진행 중...</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-cyan-500 h-2 rounded-full transition-all duration-1000"
                                                    style={{
                                                        width: `${((UNIQUE_CREATION_TIME_MS - timeInfo.remainingMs) / UNIQUE_CREATION_TIME_MS * 100).toFixed(1)}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </CyberPageLayout>
    );
}
