import { Card } from '@/lib/types';
import { InventoryCard } from '@/lib/inventory-system';
import { cn } from '@/lib/utils';
import FooterSlot from './FooterSlot';
import { FlaskConical } from 'lucide-react';

interface FusionFooterProps {
    materialSlots: (InventoryCard | null)[];
    onMaterialDrop: (card: InventoryCard, index: number) => void;
    onMaterialRemove: (index: number) => void;
    onClear: () => void;
    onAutoSelect: () => void;
    onFuse: () => void;
    canFuse: boolean;
}

export default function FusionFooter({
    materialSlots,
    onMaterialDrop,
    onMaterialRemove,
    onClear,
    onAutoSelect,
    onFuse,
    canFuse,
}: FusionFooterProps) {
    const filledCount = materialSlots.filter(c => c !== null).length;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[130px] z-[100]">
            {/* 상단 그라데이션 블러 */}
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent to-black/50 backdrop-blur-sm" />

            {/* 메인 푸터 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-purple-900/10 to-transparent backdrop-blur-md">
                {/* 중앙 정렬 컨테이너 - 모바일 대응 */}
                <div className="h-full px-4 md:px-6 py-3 flex items-center gap-4 md:gap-6 mx-auto w-full max-w-7xl overflow-x-auto no-scrollbar">
                    {/* 재료 슬롯 (스크롤 가능) */}
                    <div className="flex items-center gap-3 overflow-x-auto flex-1 no-scrollbar pr-4">
                        <div className="flex flex-col justify-center min-w-max">
                            <p className="text-[10px] font-mono text-purple-400 uppercase whitespace-nowrap mb-1">
                                🔮 Materials ({filledCount}/3)
                            </p>
                            <div className="flex gap-1.5 md:gap-3">
                                {materialSlots.map((card, index) => (
                                    <FooterSlot
                                        key={index}
                                        card={card}
                                        index={index}
                                        size="medium"
                                        onDrop={(droppedCard) => onMaterialDrop(droppedCard as InventoryCard, index)}
                                        onRemove={card ? () => onMaterialRemove(index) : undefined}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 버튼 영역 (모바일에서는 축소) */}
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                        {/* 초기화 버튼 */}
                        <button
                            onClick={onClear}
                            className="hidden md:block px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-colors text-sm"
                        >
                            초기화
                        </button>

                        {/* 자동선택 버튼 */}
                        <button
                            onClick={onAutoSelect}
                            className="px-3 md:px-5 py-2 md:py-2.5 bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-300 rounded-lg transition-all text-xs md:text-sm font-medium border border-cyan-400/50 whitespace-nowrap"
                        >
                            <span className="md:hidden">Auto</span>
                            <span className="hidden md:inline">자동선택</span>
                        </button>

                        {/* 합성 버튼 */}
                        <button
                            onClick={onFuse}
                            disabled={!canFuse}
                            className={cn(
                                "px-4 md:px-8 py-2 md:py-3 font-bold rounded-xl transition-all text-sm md:text-base flex items-center gap-2 shadow-lg whitespace-nowrap",
                                canFuse
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-purple-500/50 hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed shadow-none"
                            )}
                        >
                            <FlaskConical size={16} />
                            <span>합성</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
