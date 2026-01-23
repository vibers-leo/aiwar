'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CyberPageLayout from '@/components/CyberPageLayout';
import GameCard from '@/components/GameCard';
import { useFooter } from '@/context/FooterContext';
import { useUser } from '@/context/UserContext';
import { useAlert } from '@/context/AlertContext';
import { loadInventory, InventoryCard, filterCards, sortCards, getInventoryStats, updateInventoryCard, getMainCards } from '@/lib/inventory-system';
import { SortAsc, SortDesc, Grid3X3, LayoutList, Lock } from 'lucide-react';
import { cn, storage } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';
// rerollCardStats import removed
import { useFirebase } from '@/components/FirebaseProvider';
import { CARD_DATABASE } from '@/data/card-database';
import { gameStorage } from '@/lib/game-storage';
import { getCardName } from '@/data/card-translations';
import { useCardModal } from '@/components/CardModalContext';

type SortOption = 'power' | 'rarity' | 'name' | 'acquiredAt';
type FilterOption = 'all' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'commander';

// Requested Order: Common -> Rare -> Hero(Epic) -> Legend -> Unique -> Commander
const rarityOrder = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    mythic: 5,
    commander: 6
};


export default function MyCardsPage() {
    const { user } = useFirebase();
    const router = useRouter();
    const { t, language } = useTranslation();
    const footer = useFooter();
    const { inventory: globalInventory, loading: globalLoading, refreshData, mainDeck, updateMainDeck } = useUser();
    const { showAlert } = useAlert();
    const { openCardModal } = useCardModal();

    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('rarity'); // Default by rarity
    const [sortAsc, setSortAsc] = useState(true); // Low to High (Common to Commander)
    const [filterRarity, setFilterRarity] = useState<FilterOption>('all');
    const [isManageMode, setIsManageMode] = useState(false);
    const [tempMainDeck, setTempMainDeck] = useState<InventoryCard[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        // refreshData is called internally by UserContext, but we can call it here if we want absolute fresh data on mount
        refreshData();
    }, []);

    // Inventory processing (Moved filter/sort logic to use globalInventory)
    const cards = globalInventory;
    const loading = globalLoading;

    const filteredAndSortedCards = useMemo(() => {
        let result = [...cards];

        // Filter by rarity
        if (filterRarity !== 'all') {
            result = filterCards(result, { rarity: [filterRarity] });
        }

        // Sort with Main Cards prioritized at the top
        result = sortCards(result, sortBy, sortAsc, true);

        return result;
    }, [cards, filterRarity, sortBy, sortAsc]);

    const statsOverview = useMemo(() => {
        return getInventoryStats(cards);
    }, [cards]);

    if (!mounted) {
        return <div className="min-h-screen bg-black" />;
    }

    return (
        <CyberPageLayout
            title={language === 'ko' ? '보유 카드 목록' : 'Card Inventory'}
            englishTitle="MY INVENTORY"
            subtitle={language === 'ko' ? '카드 인벤토리' : 'Card Inventory'}
            description={language === 'ko' ? '생성된 유닛을 관리하세요.' : 'Manage your generated units.'}
            color="purple"
            leftSidebarIcon={<Grid3X3 size={32} className="text-purple-400" />}
            leftSidebarTips={[
                "보유 카드 관리 - 생성된 AI 유닛 인벤토리",
                "대표 덱: 5-6장의 주력 카드를 설정하여 전투에 사용",
                "등급별 필터: 일반 → 희귀 → 영웅 → 전설 → 신화 → 군단장",
                "정렬 옵션: 등급, 전투력, 이름, 획득일로 정렬 가능",
                "덱 관리 모드에서 카드를 클릭하여 대표 덱 구성",
            ]}
        >
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: '전체 보유량', value: statsOverview.total, color: 'text-white' },
                    { label: '군단장', value: statsOverview.byRarity['commander'] || 0, color: 'text-red-500' },
                    { label: '신화', value: statsOverview.byRarity['mythic'] || 0, color: 'text-red-500' },
                    { label: '전설', value: statsOverview.byRarity['legendary'] || 0, color: 'text-amber-400' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="bg-white/5 border border-white/10 rounded-lg p-4 text-center"
                    >
                        <p className={cn("text-2xl font-black orbitron", stat.color)}>{stat.value}</p>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Dev Buttons Removed */}

            {/* Main Cards Section - 주력카드 */}
            {!loading && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="text-amber-400">⭐</span>
                            {language === 'ko' ? '나의 대표 덱' : 'My Main Deck'}
                            <span className="text-xs text-white/40 font-normal">
                                ({mainDeck.length > 0 ? (language === 'ko' ? '설정됨' : 'Set') : (language === 'ko' ? '미설정 - 자동 추천 중' : 'Not set - Auto 추천')})
                            </span>
                        </h3>
                        <button
                            onClick={() => {
                                if (isManageMode) {
                                    setIsManageMode(false);
                                    setTempMainDeck([]);
                                } else {
                                    setIsManageMode(true);
                                    setTempMainDeck([...mainDeck]);
                                }
                            }}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-bold transition-all border shadow-lg",
                                isManageMode
                                    ? "bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30"
                                    : "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30"
                            )}
                        >
                            {isManageMode ? (language === 'ko' ? '취소' : 'CANCEL') : (language === 'ko' ? '덱 관리' : 'MANAGE DECK')}
                        </button>
                    </div>

                    <div className={cn(
                        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 p-4 rounded-xl border transition-all",
                        isManageMode ? "bg-cyan-500/5 border-cyan-500/40 ring-1 ring-cyan-500/20" : "bg-gradient-to-br from-amber-900/10 to-purple-900/10 border-amber-500/20"
                    )}>
                        {(() => {
                            const displayDeck = isManageMode ? tempMainDeck : (mainDeck.length > 0 ? mainDeck : getMainCards(cards));

                            if (displayDeck.length === 0) {
                                return (
                                    <div className="col-span-full py-8 text-center text-white/20 text-sm font-mono">
                                        {language === 'ko' ? '선택된 카드가 없습니다' : 'NO_CARDS_SELECTED'}
                                    </div>
                                );
                            }

                            return displayDeck.map((card, idx) => {
                                const rarity = card.rarity || 'common';
                                return (
                                    <motion.div
                                        key={`${card.instanceId}-${idx}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="cursor-pointer relative"
                                        onClick={() => {
                                            if (isManageMode) {
                                                setTempMainDeck(prev => prev.filter(c => c.instanceId !== card.instanceId));
                                            } else {
                                                openCardModal(card);
                                            }
                                        }}
                                    >
                                        <GameCard card={card} isSelected={false} />
                                        {isManageMode && (
                                            <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                                                <span className="text-white text-[10px] font-bold">×</span>
                                            </div>
                                        )}
                                        {!isManageMode && (
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/80 border border-white/20 rounded text-[8px] font-bold text-white/60 whitespace-nowrap">
                                                {rarity === 'commander' ? '군단장' :
                                                    rarity === 'mythic' ? '신화' :
                                                        rarity === 'legendary' ? '전설' :
                                                            rarity === 'epic' ? '영웅' :
                                                                rarity === 'rare' ? '희귀' : '일반'}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            });
                        })()}
                    </div>

                    {isManageMode && (
                        <div className="mt-4 flex items-center justify-between bg-cyan-900/20 p-4 rounded-xl border border-cyan-500/30">
                            <div className="text-sm">
                                <span className="text-cyan-400 font-bold">{tempMainDeck.length}</span>
                                <span className="text-white/60"> / 5-6 {language === 'ko' ? '장 선택됨' : 'cards selected'}</span>
                                <p className="text-[10px] text-white/40 mt-1">
                                    {language === 'ko' ? '* 아래 목록에서 카드를 클릭하여 추가하세요.' : '* Click cards below to add.'}
                                </p>
                            </div>
                            <button
                                disabled={tempMainDeck.length < 5 || isSaving}
                                onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        await updateMainDeck(tempMainDeck);
                                        setIsManageMode(false);
                                        showAlert({
                                            title: language === 'ko' ? '성공' : 'SUCCESS',
                                            message: language === 'ko' ? '주력 덱이 저장되었습니다!' : 'Main deck saved successfully!',
                                            type: 'success'
                                        });
                                    } catch (err) {
                                        showAlert({
                                            title: language === 'ko' ? '오류' : 'ERROR',
                                            message: language === 'ko' ? '저장에 실패했습니다.' : 'Failed to save deck.',
                                            type: 'error'
                                        });
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                className={cn(
                                    "px-8 py-2 rounded-lg font-black orbitron italic transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]",
                                    tempMainDeck.length >= 5 && !isSaving
                                        ? "bg-cyan-500 text-black hover:bg-cyan-400 scale-105"
                                        : "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
                                )}
                            >
                                {isSaving ? 'SAVING...' : (language === 'ko' ? '저장하기' : 'SAVE DECK')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6 bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {(['all', 'common', 'rare', 'epic', 'legendary', 'mythic', 'commander'] as FilterOption[]).map(rarity => {
                        const labelMap: Record<string, string> = {
                            all: '전체',
                            common: '일반',
                            rare: '희귀',
                            epic: '영웅',
                            legendary: '전설',
                            mythic: '신화',
                            commander: '군단장'
                        };
                        return (
                            <button
                                key={rarity}
                                onClick={() => setFilterRarity(rarity)}
                                className={cn(
                                    "px-3 py-1.5 rounded text-[10px] font-mono font-bold transition-all whitespace-nowrap",
                                    filterRarity === rarity
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                        : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
                                )}
                            >
                                {labelMap[rarity]}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 min-w-[20px]" />

                <div className="flex gap-2">
                    {(['rarity', 'power', 'name', 'acquiredAt'] as SortOption[]).map(option => (
                        <button
                            key={option}
                            onClick={() => {
                                if (sortBy === option) setSortAsc(!sortAsc);
                                else { setSortBy(option); setSortAsc(true); }
                            }}
                            className={cn(
                                "px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-widest transition-all flex items-center gap-1",
                                sortBy === option
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                    : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
                            )}
                        >
                            {option === 'acquiredAt' ? 'DATE' : option.toUpperCase()}
                            {sortBy === option && (sortAsc ? <SortAsc size={12} /> : <SortDesc size={12} />)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards Grid */}
            {loading ? (
                <div className="text-center py-20 text-white/30 font-mono">LOADING_INVENTORY_DATA...</div>
            ) : filteredAndSortedCards.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <p className="text-white/30 mb-4 font-mono">NO_UNITS_FOUND</p>
                    <button
                        onClick={() => router.push('/factions')}
                        className="px-6 py-3 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg text-sm font-mono uppercase tracking-widest hover:bg-purple-500/30 transition-all"
                    >
                        GO_TO_GENERATION
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-20">
                    {filteredAndSortedCards.map((card, i) => (
                        <motion.div
                            key={card.instanceId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.02, 0.3) }} // Cap delay for large lists
                            className="cursor-pointer card-list-item" // Added content-visibility class
                            onClick={() => {
                                if (isManageMode) {
                                    const isSelected = tempMainDeck.find(c => c.instanceId === card.instanceId);
                                    if (isSelected) {
                                        setTempMainDeck(prev => prev.filter(c => c.instanceId !== card.instanceId));
                                    } else if (tempMainDeck.length < 6) {
                                        setTempMainDeck(prev => [...prev, card]);
                                    } else {
                                        showAlert({
                                            title: language === 'ko' ? '알림' : 'NOTICE',
                                            message: language === 'ko' ? '최대 6장까지 선택 가능합니다.' : 'Maximum 6 cards allowed.',
                                            type: 'warning'
                                        });
                                    }
                                } else {
                                    openCardModal(card);
                                }
                            }}
                        >
                            <GameCard
                                card={card}
                                isSelected={isManageMode && !!tempMainDeck.find(c => c.instanceId === card.instanceId)}
                            />
                            {card.isLocked && (
                                <div className="absolute top-2 left-2 w-6 h-6 bg-amber-500/80 rounded-full flex items-center justify-center pointer-events-none">
                                    <Lock size={12} className="text-black" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}


        </CyberPageLayout>
    );
}
