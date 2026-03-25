'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import CyberPageLayout from '@/components/CyberPageLayout';
// import { getGameState, updateGameState } from '@/lib/game-state';
import { useAlert } from '@/context/AlertContext';
import { ShoppingCart, Coins, Package, Sparkles, X, ShoppingBag, Loader2, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { CARD_PACKS, openCardPack, CardPack } from '@/lib/card-pack-system';
import { Card } from '@/lib/types';
import { addCardsToInventory } from '@/lib/inventory-system';
import { motion, AnimatePresence } from 'framer-motion';
import GachaRevealModal from '@/components/GachaRevealModal';
import { useUser } from '@/context/UserContext';
import { gameStorage } from '@/lib/game-storage';
import { getResearchBonus } from '@/lib/research-system';
import FactionSubscriptionModal from '@/components/FactionSubscriptionModal'; // [NEW]

export default function ShopPage() {
    const router = useRouter();
    const { showAlert, showConfirm } = useAlert();
    const { coins, tokens, level, addCoins, addTokens, refreshData, user, buyCardPack } = useUser(); // [FIXED] moved buyCardPack here

    // 연구 보너스 로드
    const [negotiationBonus, setNegotiationBonus] = useState(0);
    const [fortuneLevel, setFortuneLevel] = useState(1);
    const [insightLevel, setInsightLevel] = useState(1);

    // Local state for UI only (pack opening animation)
    const [openedCards, setOpenedCards] = useState<Card[]>([]);
    const [showPackOpening, setShowPackOpening] = useState(false);
    const [currentPack, setCurrentPack] = useState<CardPack | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isExchanging, setIsExchanging] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false); // [NEW]

    useEffect(() => {
        loadResearchData();
    }, []);

    const loadResearchData = async () => {
        const state = await gameStorage.loadGameState();
        if (state.research?.stats?.negotiation) {
            const bonus = getResearchBonus('negotiation', state.research.stats.negotiation.currentLevel);
            setNegotiationBonus(bonus);
        }
        if (state.research?.stats?.fortune) {
            setFortuneLevel(state.research.stats.fortune.currentLevel);
        }
        if (state.research?.stats?.insight) {
            setInsightLevel(state.research.stats.insight.currentLevel);
        }
    };

    const handlePurchase = async (pack: CardPack, skipConfirm = false) => {
        if (!user?.uid) {
            showAlert({ title: '오류', message: '로그인이 필요합니다.', type: 'error' });
            return;
        }

        const discount = pack.currencyType === 'coin' ? negotiationBonus / 100 : 0; // Discount only for Coins
        const finalPrice = Math.floor(pack.price * (1 - discount));
        const currencyName = pack.currencyType === 'coin' ? '코인' : '토큰';

        // 재화 확인
        const currentBalance = pack.currencyType === 'coin' ? coins : tokens;

        if (currentBalance < finalPrice) {
            showAlert({
                title: `${currencyName} 부족`,
                message: `${currencyName}이 부족합니다!\n필요: ${finalPrice} ${currencyName}\n보유: ${currentBalance} ${currencyName}`,
                type: 'error',
            });
            return;
        }

        const processPurchase = async () => {
            setIsPurchasing(true);
            try {
                // 1. 카드 생성 (기존 로직 유지)
                const generatedCards = openCardPack(pack, user.uid, insightLevel);

                // 2. 트랜잭션 구매 실행 (재화 차감 + 카드 지급 통합)
                await buyCardPack(generatedCards, finalPrice, pack.currencyType);

                // 3. 잭팟 로직 (코인 구매 시에만 적용)
                if (pack.currencyType === 'coin') {
                    let jackpotProb = 0;
                    if (fortuneLevel >= 9) jackpotProb = 0.05;
                    else if (fortuneLevel >= 7) jackpotProb = 0.03;
                    else if (fortuneLevel >= 5) jackpotProb = 0.02;
                    else if (fortuneLevel >= 3) jackpotProb = 0.01;

                    if (jackpotProb > 0 && Math.random() < jackpotProb) {
                        const refund = Math.floor(finalPrice * (0.1 + Math.random() * 0.4));
                        if (refund > 0) {
                            await addCoins(refund);
                            showAlert({
                                title: '🍀 잭팟 발생!',
                                message: `행운 보너스! ${refund.toLocaleString()} 코인을 돌려받았습니다!`,
                                type: 'success'
                            });
                        }
                    }
                }

                // 4. 개봉 애니메이션
                setCurrentPack(pack);
                setOpenedCards(generatedCards);
                setShowPackOpening(true);

            } catch (error) {
                console.error('카드팩 구매 실패:', error);
                showAlert({
                    title: '구매 실패',
                    message: '오류가 발생했습니다. 재화는 차감되지 않았습니다.',
                    type: 'error',
                });
            } finally {
                setIsPurchasing(false);
            }
        };

        if (skipConfirm) {
            await processPurchase();
        } else {
            showConfirm({
                title: '카드팩 구매',
                message: `${pack.name}을(를) 구매하시겠습니까?\n\n가격: ${finalPrice} ${currencyName}${discount > 0 ? ` (${negotiationBonus}% 할인)` : ''}\n카드 개수: ${pack.cardCount}장`,
                onConfirm: processPurchase
            });
        }
    };

    // Add Token Deduction Helper if not exists in Context (it does, updated below logic)
    // Actually addTokens in context wraps updateTokens which supports +/- 

    const closePackOpening = () => {
        setShowPackOpening(false);
        setOpenedCards([]);
        setCurrentPack(null);
    };

    const handleBuyAgain = () => {
        if (currentPack) {
            // Close modal first to reset animation, then purchase
            setShowPackOpening(false);
            setOpenedCards([]);
            // Small delay to allow modal close animation
            setTimeout(() => {
                handlePurchase(currentPack, true);
            }, 300);
        }
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'text-gray-400 border-gray-500';
            case 'rare': return 'text-blue-400 border-blue-500';
            case 'epic': return 'text-purple-400 border-purple-500';
            case 'legendary': return 'text-yellow-400 border-yellow-500';
            case 'mythic': return 'text-pink-400 border-pink-500';
            case 'commander': return 'text-red-400 border-red-500';
            default: return 'text-gray-400 border-gray-500';
        }
    };

    const handleExchangeToken = async () => {
        const EXCHANGE_COST = 100; // [UPDATED]
        const EXCHANGE_AMOUNT = 1000; // [UPDATED]

        if (coins < EXCHANGE_COST) {
            showAlert({
                title: '코인 부족',
                message: `코인이 부족합니다!\n필요: ${EXCHANGE_COST.toLocaleString()} 코인`,
                type: 'error'
            });
            return;
        }

        setIsExchanging(true);
        try {
            // Atomic update ideal, but sequential for now
            await addCoins(-EXCHANGE_COST);
            await addTokens(EXCHANGE_AMOUNT);
            await refreshData();

            showAlert({
                title: '환전 완료',
                message: `${EXCHANGE_COST.toLocaleString()} 코인을 사용하여 ${EXCHANGE_AMOUNT} 토큰을 충전했습니다.`,
                type: 'success'
            });
        } catch (error) {
            console.error(error);
            showAlert({ title: '오류', message: '환전 중 문제가 발생했습니다.', type: 'error' });
        } finally {
            setIsExchanging(false);
        }
    };

    return (
        <CyberPageLayout
            title="상점"
            englishTitle="SHOP"
            description="코인으로 카드팩을 구매하세요"
            color="yellow"
            leftSidebarIcon={<ShoppingBag size={32} className="text-yellow-400" />}
            leftSidebarTips={[
                "데이터 상점 - AI 카드팩 구매 및 토큰 환전소",
                "협상력 연구를 올리면 모든 카드팩을 할인된 가격에 구매할 수 있습니다.",
                "행운 연구를 올리면 구매 시 잭팟으로 코인을 돌려받을 확률이 높아집니다.",
                "통찰력 연구를 올리면 더 높은 등급의 카드를 획득할 확률이 증가합니다.",
                "100 코인으로 1,000 토큰을 환전할 수 있습니다.",
            ]}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header / Nav */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            데이터 상점
                        </h1>
                        <p className="text-gray-400 mt-1">AI 카드팩 구매 및 토큰 환전소</p>
                    </div>
                </div>

                {/* 보유 코인 */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm text-white/60 mb-1">보유 코인</h3>
                            <p className="text-4xl font-black text-yellow-400 flex items-center gap-2">
                                <Coins size={32} />
                                {coins.toLocaleString()}
                            </p>
                            {negotiationBonus > 0 && (
                                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                                    <Sparkles size={12} />
                                    협상력 보너스로 모든 품목 {negotiationBonus}% 할인 중!
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-white/60">레벨</p>
                            <p className="text-2xl font-bold text-cyan-400">Lv.{level}</p>
                        </div>
                    </div>
                </div>



                {/* 환전소 섹션 [NEW] */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <RefreshCw className="text-cyan-400" /> DATA EXCHANGE
                            </h2>
                            <p className="text-gray-400 text-sm">
                                데이터 코인을 사용하여 활동력(Token)을 충전할 수 있습니다.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 bg-black/60 p-4 rounded-xl border border-white/5">
                            <div className="text-right">
                                <div className="text-xs text-gray-500">PAY</div>
                                <div className="text-lg font-bold text-yellow-500 flex items-center justify-end gap-1">
                                    <Coins size={16} /> 100
                                </div>
                            </div>
                            <ArrowRight className="text-gray-600" />
                            <div className="text-left">
                                <div className="text-xs text-gray-500">GET</div>
                                <div className="text-lg font-bold text-cyan-500 flex items-center gap-1">
                                    <Zap size={16} /> 1,000 TOKENS
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleExchangeToken}
                            disabled={coins < 100 || isExchanging}
                            className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all ${coins < 100
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105'
                                }`}
                        >
                            {isExchanging ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
                            {isExchanging ? 'EXCHANGING...' : 'EXCHANGE NOW'}
                        </button>
                    </div>
                </div>

                {/* 카드팩 목록 */}
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <ShoppingCart className="text-yellow-400" size={24} />
                    카드팩
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {CARD_PACKS.map((pack) => {
                        const isCoin = pack.currencyType === 'coin';
                        const discount = isCoin ? negotiationBonus / 100 : 0;
                        const finalPrice = Math.floor(pack.price * (1 - discount));
                        const hasDiscount = discount > 0;

                        return (
                            <div
                                key={pack.id}
                                className={cn(
                                    "bg-black/40 border rounded-xl p-6 transition-all group relative overflow-hidden",
                                    isCoin ? "border-white/10 hover:border-yellow-500/50" : "border-cyan-500/20 hover:border-cyan-500/50"
                                )}
                            >
                                <div className="text-center mb-4 relative z-10">
                                    <div className="text-6xl mb-3">{pack.icon}</div>
                                    <h3 className="text-xl font-bold text-white mb-2">{pack.name}</h3>
                                    <p className="text-sm text-white/60 mb-2">{pack.description}</p>
                                    <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                                        <Package size={14} />
                                        <span>{pack.cardCount}장</span>
                                    </div>
                                </div>

                                {/* 확률 정보 */}
                                <div className="bg-white/5 rounded-lg p-3 mb-4">
                                    <p className="text-xs text-white/40 mb-2">등급 확률</p>
                                    <div className="space-y-1">
                                        {Object.entries(pack.rarityWeights).map(([rarity, weight]) => {
                                            if (weight === 0) return null;
                                            return (
                                                <div key={rarity} className="flex justify-between text-xs">
                                                    <span className={getRarityColor(rarity).split(' ')[0]}>
                                                        {rarity.toUpperCase()}
                                                    </span>
                                                    <span className="text-white/60">{weight}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePurchase(pack)}
                                    disabled={isPurchasing}
                                    className={cn(
                                        "w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all relative z-10",
                                        isCoin
                                            ? "bg-yellow-600 hover:bg-yellow-500 text-black"
                                            : "bg-cyan-600 hover:bg-cyan-500 text-white"
                                    )}
                                >
                                    {isPurchasing ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        isCoin ? <Coins size={18} /> : <Zap size={18} />
                                    )}
                                    <div>
                                        {hasDiscount && (
                                            <span className="line-through text-xs opacity-60 mr-2">
                                                {pack.price.toLocaleString()}
                                            </span>
                                        )}
                                        <div className="text-3xl font-black text-yellow-400 flex items-center justify-center gap-2">
                                            <Coins size={24} />
                                            {finalPrice.toLocaleString()}
                                            {hasDiscount && (
                                                <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded ml-1">
                                                    -{negotiationBonus}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* 안내 */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
                        <Sparkles size={20} />
                        안내사항
                    </h3>
                    <ul className="space-y-2 text-sm text-white/60">
                        <li>• 카드팩을 구매하면 즉시 개봉되어 카드를 획득합니다</li>
                        <li>• 획득한 카드는 자동으로 인벤토리에 추가됩니다</li>
                        <li>• 비싼 팩일수록 고등급 카드 확률이 높습니다</li>
                        <li>• 코인은 전투 승리, 미션 완료 등으로 획득할 수 있습니다</li>
                    </ul>
                </div>
            </div>

            {/* 구매 중 로딩 레이어 */}
            <AnimatePresence>
                {isPurchasing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-center"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center border-2 border-yellow-500/50 mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)]"
                        >
                            <ShoppingBag className="text-yellow-400" size={48} />
                        </motion.div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">구매 처리 중...</h2>
                        <p className="text-gray-400 flex items-center gap-2">
                            <Loader2 className="animate-spin" size={16} />
                            네트워크를 통해 카드를 획득하고 있습니다. 잠시만 기다려주세요.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 카드팩 개봉 모달 (GachaRevealModal 사용) */}
            <GachaRevealModal
                isOpen={showPackOpening}
                onClose={closePackOpening}
                cards={openedCards}
                packType={currentPack?.price! >= 1000 ? 'legendary' : currentPack?.price! >= 500 ? 'premium' : 'basic'}
                onBuyAgain={handleBuyAgain}
            />
        </CyberPageLayout >
    );
}
