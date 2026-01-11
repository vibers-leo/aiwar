'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import RoundPlacementSlot from './RoundPlacementSlot';
import { BattleMode } from '@/lib/pvp-battle-system';
import { getTypeIcon, getTypeColor } from '@/lib/type-system';
import { RefreshCcw, Wand2, Trash2, Swords, ArrowRight, AlertTriangle } from 'lucide-react';

interface CardPlacementBoardProps {
    selectedCards: any[];
    onPlacementComplete: (placement: RoundPlacement) => void;
    onCancel?: () => void; // NEW: Cancel callback
    battleMode?: BattleMode; // 'sudden-death' 모드 확인용
    opponentDeck?: any[]; // 상대방 덱 정보
}

export interface RoundPlacement {
    round1: { main: any; hidden?: any };
    round2: { main: any; hidden?: any };
    round3: { main: any; hidden?: any };
    round4: { main: any; hidden?: any };
    round5: { main: any; hidden?: any };
}

export default function CardPlacementBoard({ selectedCards, onPlacementComplete, onCancel, battleMode = 'tactics', opponentDeck = [] }: CardPlacementBoardProps) {
    const hasHiddenSlots = battleMode === 'strategy';

    const [placement, setPlacement] = useState<{
        round1: any | null;
        round1Hidden: any | null; // Added for Double Battle
        round2Main: any | null;
        round2Hidden: any | null;
        round3Main: any | null;
        round3Hidden: any | null;
        round4Main: any | null;
        round4Hidden: any | null;
        round5: any | null;
    }>(() => {
        const initial = {
            round1: null,
            round1Hidden: null, // Added for Double Battle
            round2Main: null,
            round2Hidden: null,
            round3Main: null,
            round3Hidden: null,
            round4Main: null,
            round4Hidden: null,
            round5: null,
        };

        // Ambush 모드: 메인 슬롯 1~5번 자동 배치 (6번째는 히든)
        // Ambush 모드: 초기화 시 빈 상태로 시작 (수동 배치 유도)
        // if (battleMode === 'strategy' && selectedCards.length === 6) { ... }

        return initial;
    });

    const [draggingCard, setDraggingCard] = useState<any | null>(null);

    // Get cards that are still available in the pool
    const getAvailableCards = () => {
        if (battleMode === 'double') {
            const placedCardIds = new Set([
                placement.round1?.id,
                placement.round1Hidden?.id,
                placement.round2Main?.id,
                placement.round2Hidden?.id,
                placement.round3Main?.id,
                placement.round3Hidden?.id,
            ].filter(Boolean));
            return selectedCards.filter(card => !placedCardIds.has(card.id));
        }

        if (hasHiddenSlots) {
            // Ambush 모드: 히든 슬롯에 배치되지 않은 카드만 표시 (메인 슬롯 카드는 재사용 가능)
            const hiddenPlacedIds = new Set([
                placement.round3Hidden?.id
            ].filter(Boolean));
            return selectedCards.filter(card => !hiddenPlacedIds.has(card.id));
        }

        // 일반 모드: 어디든 배치된 카드는 제외
        const placedCardIds = new Set([
            placement.round1?.id,
            placement.round2Main?.id,
            placement.round3Main?.id, // Changed from round3
            placement.round4Main?.id,
            placement.round5?.id,
        ].filter(Boolean));

        return selectedCards.filter(card => !placedCardIds.has(card.id));
    };

    // Get cards that can be used as hidden (already placed in main slots)
    const getHiddenEligibleCards = () => {
        // For Double Battle, any card can be hidden if not already placed in another slot
        if (battleMode === 'double') {
            return selectedCards.filter(card => {
                const p = placement;
                const cardId = card.id;
                if (p.round1?.id === cardId) return true;
                if (p.round1Hidden?.id === cardId) return true;
                if (p.round2Main?.id === cardId) return true;
                if (p.round2Hidden?.id === cardId) return true;
                if (p.round3Main?.id === cardId) return true;
                if (p.round3Hidden?.id === cardId) return true;
                if (p.round4Main?.id === cardId) return true;
                if (p.round4Hidden?.id === cardId) return true;
                if (p.round5?.id === cardId) return true;
                return false;
            });
        }

        // For Ambush, only cards already in main slots can be hidden
        return [
            placement.round1,
            placement.round2Main,
            placement.round3Main, // Changed from round3
            placement.round4Main,
            placement.round5,
        ].filter(Boolean);
    };

    const handleDragStart = (card: any) => {
        setDraggingCard(card);
    };

    const handleDragEnd = () => {
        setDraggingCard(null);
    };

    const handleDropMain = (round: string, cardId: string, sourceSlot?: string) => {
        // Swap logic
        if (sourceSlot) {
            handleSwap(sourceSlot, round);
            return;
        }

        // Standard drop (from pool)
        const card = selectedCards.find(c => c.id === cardId);
        if (!card) return;

        setPlacement(prev => ({
            ...prev,
            [round]: card,
        }));
    };

    const handleDropHidden = (round: string, cardId: string, sourceSlot?: string) => {
        if (!hasHiddenSlots && battleMode !== 'double') return;

        // Swap logic
        if (sourceSlot) {
            handleSwap(sourceSlot, round);
            return;
        }

        const card = selectedCards.find(c => c.id === cardId);
        if (!card) return;

        // Check if card is already used as hidden in another round (for Ambush)
        if (battleMode === 'strategy') {
            const otherHiddenRound = round === 'round3Hidden' ? null : 'round3Hidden'; // Only one hidden slot in Ambush
            if (otherHiddenRound && placement[otherHiddenRound as keyof typeof placement]?.id === card.id) {
                alert('이 카드는 이미 다른 라운드의 히든 카드로 사용 중입니다!');
                return;
            }
        }

        // Check for Double Battle: card cannot be in any other slot (main or hidden)
        if (battleMode === 'double') {
            const isCardAlreadyPlaced = Object.entries(placement).some(([key, value]) =>
                value && value.id === card.id && key !== round
            );
            if (isCardAlreadyPlaced) {
                alert('이 카드는 이미 다른 슬롯에 배치되었습니다!');
                return;
            }
        }

        setPlacement(prev => ({
            ...prev,
            [round]: card,
        }));
    };

    // Swap function
    const handleSwap = (sourceSlot: string, targetSlot: string) => {
        // Ambush 모드에서도 스왑 허용 (일반 <-> 히든)
        // if (hasHiddenSlots && (!sourceSlot.includes('Hidden') || !targetSlot.includes('Hidden'))) return;

        if (sourceSlot === targetSlot) return;

        setPlacement(prev => {
            const newPlacement = { ...prev };
            const sourceCard = newPlacement[sourceSlot as keyof typeof placement];
            const targetCard = newPlacement[targetSlot as keyof typeof placement];

            newPlacement[sourceSlot as keyof typeof placement] = targetCard;
            newPlacement[targetSlot as keyof typeof placement] = sourceCard;

            return newPlacement;
        });
    };

    const handleRemove = (round: string) => {
        setPlacement(prev => ({
            ...prev,
            [round]: null,
        }));
    };

    const handleReset = () => {
        if (battleMode === 'double') {
            setPlacement(prev => ({
                ...prev,
                round1: null,
                round1Hidden: null,
                round2Main: null,
                round2Hidden: null,
                round3Main: null,
                round3Hidden: null,
            }));
        } else if (hasHiddenSlots) {
            // Ambush 모드: 전체 초기화 (수동 배치 지원)
            setPlacement({
                round1: null,
                round1Hidden: null,
                round2Main: null,
                round2Hidden: null,
                round3Main: null,
                round3Hidden: null,
                round4Main: null,
                round4Hidden: null,
                round5: null,
            });
        } else {
            setPlacement({
                round1: null,
                round1Hidden: null, // Reset this too for consistency
                round2Main: null,
                round2Hidden: null,
                round3Main: null, // Changed from round3
                round3Hidden: null,
                round4Main: null,
                round4Hidden: null,
                round5: null,
            });
        }
    };

    const handleAutoFill = () => {
        if (battleMode === 'double') {
            const available = getAvailableCards();
            const emptySlots = [
                'round1', 'round1Hidden',
                'round2Main', 'round2Hidden',
                'round3Main', 'round3Hidden'
            ].filter(slot => !placement[slot as keyof typeof placement]);

            const shuffled = [...available].sort(() => Math.random() - 0.5);

            setPlacement(prev => {
                const next = { ...prev };
                emptySlots.forEach((slot, i) => {
                    if (shuffled[i]) {
                        next[slot as keyof typeof placement] = shuffled[i];
                    }
                });
                return next;
            });
            return;
        }

        // Ambush 모드: 히든 슬롯만 채우기
        // Ambush 모드: 자동 배치 (최강 카드 -> 히든, 나머지 랜덤)
        if (hasHiddenSlots) {
            // 전체 재배치 로직으로 변경 (기존 배치 무시)
            const allCards = [...selectedCards];

            // 1. Find Strongest Card (Total Power)
            const strongest = allCards.reduce((prev, current) => {
                return (prev.stats?.totalPower || 0) > (current.stats?.totalPower || 0) ? prev : current;
            });

            // 2. Others
            const others = allCards.filter(c => c.id !== strongest.id).sort(() => Math.random() - 0.5);

            setPlacement({
                round1: others[0],
                round1Hidden: null,
                round2Main: others[1],
                round2Hidden: null,
                round3Main: others[2],
                round3Hidden: strongest, // Strongest to Hidden
                round4Main: others[3],
                round4Hidden: null,
                round5: others[4],
            });
            return;
        }

        const available = getAvailableCards();
        if (available.length === 0) return;

        const emptySlots = [
            'round1', 'round2Main', 'round3Main', 'round4Main', 'round5' // Changed from round3
        ].filter(slot => !placement[slot as keyof typeof placement]);

        const shuffled = [...available].sort(() => Math.random() - 0.5);

        setPlacement(prev => {
            const next = { ...prev };
            emptySlots.forEach((slot, i) => {
                if (shuffled[i]) {
                    next[slot as keyof typeof placement] = shuffled[i];
                }
            });
            return next;
        });
    };

    // 클릭으로 자동 배치 (첫 번째 빈 슬롯에 배치)
    const handleAutoPlace = (card: any) => {
        if (battleMode === 'double') {
            if (!placement.round1) handleDropMain('round1', card.id);
            else if (!placement.round1Hidden) handleDropHidden('round1Hidden', card.id);
            else if (!placement.round2Main) handleDropMain('round2Main', card.id);
            else if (!placement.round2Hidden) handleDropHidden('round2Hidden', card.id);
            else if (!placement.round3Main) handleDropMain('round3Main', card.id);
            else if (!placement.round3Hidden) handleDropHidden('round3Hidden', card.id);
            return;
        }

        if (hasHiddenSlots) {
            // Ambush: R1 -> R5 -> Hidden 순서 배치
            if (!placement.round1) handleDropMain('round1', card.id);
            else if (!placement.round2Main) handleDropMain('round2Main', card.id);
            else if (!placement.round3Main) handleDropMain('round3Main', card.id);
            else if (!placement.round4Main) handleDropMain('round4Main', card.id);
            else if (!placement.round5) handleDropMain('round5', card.id);
            else if (!placement.round3Hidden) handleDropHidden('round3Hidden', card.id);
            return;
        }

        if (!placement.round1) handleDropMain('round1', card.id);
        else if (!placement.round2Main) handleDropMain('round2Main', card.id);
        else if (!placement.round3Main) handleDropMain('round3Main', card.id); // Changed from round3
        else if (!placement.round4Main) handleDropMain('round4Main', card.id);
        else if (!placement.round5) handleDropMain('round5', card.id);
    };

    const isPlacementComplete = () => {
        // Double Battle: 3 Rounds x 2 Cards = 6 Total
        if (battleMode === 'double') {
            return placement.round1 && placement.round1Hidden &&
                placement.round2Main && placement.round2Hidden &&
                placement.round3Main && placement.round3Hidden;
        }

        // Standard / Ambush Base: 5 Main Cards
        const basicCheck = placement.round1 &&
            placement.round2Main &&
            placement.round3Main &&
            placement.round4Main &&
            placement.round5;

        if (!basicCheck) return false;

        // Ambush: R3 Hidden
        if (battleMode === 'strategy') {
            return placement.round3Hidden;
        }

        return true;
    };

    const handleConfirm = () => {
        if (!isPlacementComplete()) {
            alert('모든 라운드에 카드를 배치해주세요!');
            return;
        }

        const finalPlacement: RoundPlacement = {
            round1: {
                main: placement.round1!,
                hidden: placement.round1Hidden || undefined,
            },
            round2: {
                main: placement.round2Main!,
                hidden: placement.round2Hidden || undefined,
            },
            round3: {
                main: placement.round3Main!,
                hidden: placement.round3Hidden || undefined,
            },
            round4: {
                main: placement.round4Main!,
                hidden: placement.round4Hidden || undefined,
            },
            round5: {
                main: placement.round5!,
                hidden: undefined, // Round 5 never has hidden
            },
        };

        onPlacementComplete(finalPlacement);
    };

    const getCardImage = (card: any) => {
        const { getCardCharacterImage } = require('@/lib/card-images');
        return getCardCharacterImage(card.templateId, card.name, card.rarity) || '/assets/cards/default-card.png';
    };

    const availableCards = getAvailableCards();

    return (
        <div className="w-full h-[calc(100vh-80px)] flex flex-col overflow-hidden relative">
            {/* Compact Header */}
            <div className="shrink-0 pt-3 pb-1 text-center relative z-10">
                <h2 className="text-2xl font-black text-white italic tracking-tighter flex items-center justify-center gap-2">
                    <span className="text-cyan-500">TACTICAL</span> DEPLOYMENT
                    <span className="text-[10px] font-normal text-gray-500 bg-black/50 px-2 py-1 rounded-full border border-white/10 ml-2 backdrop-blur-md">
                        {battleMode === 'strategy' ? '전략 승부 (6장)' : battleMode === 'double' ? '두장 승부 (6장)' : '전술 승부 (5장)'}
                    </span>
                </h2>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col justify-center items-center gap-1 min-h-0 px-4 py-2">

                {/* 1. TOP: Opponent Intel */}
                {opponentDeck && opponentDeck.length > 0 && (
                    <div className="w-full max-w-5xl flex items-center justify-center gap-3 bg-gradient-to-r from-transparent via-red-950/30 to-transparent border-y border-red-500/20 py-2 mb-2 backdrop-blur-sm">
                        <div className="text-center shrink-0">
                            <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">😈</span>
                            <div className="text-[9px] font-black text-red-500 tracking-widest mt-0.5">ENEMY</div>
                        </div>
                        <div className="flex justify-center gap-2">
                            {opponentDeck.map((card, idx) => (
                                <div key={idx} className="relative w-12 h-16 rounded-lg border border-red-500/30 overflow-hidden opacity-90 shadow-lg shadow-red-950/20">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-110"
                                        style={{ backgroundImage: `url(${getCardImage(card)})` }}
                                    />
                                    {/* Obscure opponent cards slightly */}
                                    <div className="absolute inset-0 bg-red-900/40" />
                                    {/* Type Hint */}
                                    {card.type && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-black/80 rounded flex items-center justify-center text-[10px] text-white border border-white/10">
                                            {getTypeIcon(card.type)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                            <div className="text-[9px] text-red-400 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-full border border-red-500/30 shadow-lg backdrop-blur-md animate-pulse">
                                <AlertTriangle size={10} className="text-red-500" />
                                <span>적은 5장의 카드 중 <span className="text-red-300 font-bold">랜덤하게</span> 냅니다</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. CENTER: Battle Board Slots */}
                <div className="flex-1 w-full max-w-5xl flex flex-col justify-center relative">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-5 pointer-events-none" />

                    <div className="flex justify-center items-end gap-3 flex-wrap z-10 mb-2">
                        {/* Round 1 */}
                        <RoundPlacementSlot
                            roundNumber={1}
                            hasHidden={battleMode === 'double'}
                            mainCard={placement.round1}
                            hiddenCard={placement.round1Hidden}
                            opponentCard={opponentDeck[0]}
                            mainSlotId="round1"
                            hiddenSlotId="round1Hidden"
                            onDropMain={(cardId, sourceSlot) => handleDropMain('round1', cardId, sourceSlot)}
                            onDropHidden={(cardId, sourceSlot) => handleDropHidden('round1Hidden', cardId, sourceSlot)}
                            onRemoveMain={() => handleRemove('round1')}
                            onRemoveHidden={() => handleRemove('round1Hidden')}
                        />
                        {/* Round 2 */}
                        <RoundPlacementSlot
                            roundNumber={2}
                            hasHidden={battleMode === 'double'}
                            mainCard={placement.round2Main}
                            hiddenCard={placement.round2Hidden}
                            opponentCard={opponentDeck[1]}
                            mainSlotId="round2Main"
                            hiddenSlotId="round2Hidden"
                            onDropMain={(cardId, sourceSlot) => handleDropMain('round2Main', cardId, sourceSlot)}
                            onDropHidden={(cardId, sourceSlot) => handleDropHidden('round2Hidden', cardId, sourceSlot)}
                            onRemoveMain={() => handleRemove('round2Main')}
                            onRemoveHidden={() => handleRemove('round2Hidden')}
                        />
                        {/* Round 3 */}
                        <RoundPlacementSlot
                            roundNumber={3}
                            hasHidden={battleMode === 'strategy' || battleMode === 'double'}
                            mainCard={placement.round3Main}
                            hiddenCard={placement.round3Hidden}
                            opponentCard={opponentDeck[2]}
                            mainSlotId="round3Main"
                            hiddenSlotId="round3Hidden"
                            onDropMain={(cardId, sourceSlot) => handleDropMain('round3Main', cardId, sourceSlot)}
                            onDropHidden={(cardId, sourceSlot) => handleDropHidden('round3Hidden', cardId, sourceSlot)}
                            onRemoveMain={() => handleRemove('round3Main')}
                            onRemoveHidden={() => handleRemove('round3Hidden')}
                        />
                        {/* Round 4 & 5 */}
                        {battleMode !== 'double' && (
                            <>
                                <RoundPlacementSlot
                                    roundNumber={4}
                                    hasHidden={false}
                                    hiddenCard={null}
                                    mainCard={placement.round4Main}
                                    opponentCard={opponentDeck[3]}
                                    mainSlotId="round4Main"
                                    onDropMain={(cardId, sourceSlot) => handleDropMain('round4Main', cardId, sourceSlot)}
                                    onDropHidden={() => { }}
                                    onRemoveMain={() => handleRemove('round4Main')}
                                    onRemoveHidden={() => { }}
                                />
                                <RoundPlacementSlot
                                    roundNumber={5}
                                    hasHidden={false}
                                    hiddenCard={null}
                                    mainCard={placement.round5}
                                    opponentCard={opponentDeck[4]}
                                    mainSlotId="round5"
                                    onDropMain={(cardId, sourceSlot) => handleDropMain('round5', cardId, sourceSlot)}
                                    onDropHidden={() => { }}
                                    onRemoveMain={() => handleRemove('round5')}
                                    onRemoveHidden={() => { }}
                                />
                            </>
                        )}
                    </div>

                    {/* Quick Access Bar (Reset/Auto/Start) */}
                    <div className="flex items-center justify-center gap-3 mt-1">
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-all flex items-center gap-2"
                            >
                                <ArrowRight className="rotate-180" size={16} />
                                취소
                            </button>
                        )}

                        <button
                            onClick={handleReset}
                            className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                            title="Reset Board"
                        >
                            <Trash2 size={18} />
                        </button>

                        <button
                            onClick={handleConfirm}
                            disabled={!isPlacementComplete()}
                            className={cn(
                                "px-10 py-3 rounded-full font-black text-lg transition-all shadow-xl flex items-center gap-2 mx-4",
                                isPlacementComplete()
                                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:scale-105 hover:shadow-cyan-500/40"
                                    : "bg-gray-800 text-gray-600 cursor-not-allowed border border-white/5"
                            )}
                        >
                            {isPlacementComplete() ? (
                                <>BATTLE START <Swords size={20} /></>
                            ) : (
                                <span className="text-sm font-normal">배치 미완료</span>
                            )}
                        </button>

                        <button
                            onClick={handleAutoFill}
                            className="p-2 hover:bg-white/10 rounded-full text-cyan-400 hover:text-cyan-200 transition-colors"
                            title="Auto Fill"
                        >
                            <Wand2 size={18} />
                        </button>
                    </div>
                </div>

                {/* 3. BOTTOM: My Card Pool */}
                <div className="shrink-0 w-full max-w-6xl bg-black/60 border-t border-white/20 p-3 backdrop-blur-xl rounded-t-[24px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-black text-gray-400 flex items-center gap-2 tracking-widest px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
                            MY CARDS ({availableCards.length})
                        </div>
                        {availableCards.length === 0 && (
                            <div className="text-[9px] font-bold text-cyan-400 animate-bounce bg-cyan-950/30 px-2 py-0.5 rounded-full border border-cyan-500/30">
                                ALL CARDS DEPLOYED ✨
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center gap-2 overflow-x-auto pb-2 no-scrollbar min-h-[120px] px-1">
                        {availableCards.length > 0 ? availableCards.map((card) => (
                            <motion.div
                                key={card.id}
                                layoutId={`card-${card.id}`}
                                draggable
                                onDragStart={(e: any) => {
                                    e.dataTransfer.setData('cardId', card.id);
                                    handleDragStart(card);
                                }}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleAutoPlace(card)}
                                whileHover={{ scale: 1.1, y: -10, rotate: 1 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-24 h-32 rounded-xl border border-white/20 overflow-hidden cursor-pointer shadow-2xl hover:border-cyan-400 transition-colors group shrink-0"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110"
                                    style={{ backgroundImage: `url(${getCardImage(card)})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute bottom-1 inset-x-0 text-[9px] font-bold text-white text-center py-1 truncate px-2 group-hover:text-cyan-400">
                                    {card.name}
                                </div>
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-xs border border-white/10 shadow-lg">
                                    {getTypeIcon(card.type)}
                                </div>
                            </motion.div>
                        )) : (
                            <div className="flex items-center text-gray-600 text-sm italic">
                                Ready to battle
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
