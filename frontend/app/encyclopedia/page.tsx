'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CyberPageLayout from '@/components/CyberPageLayout';
import { Card as CardType, CardTemplate, AIFaction } from '@/lib/types';
import { storage } from '@/lib/utils';
import { CARD_DATABASE, COMMANDERS } from '@/data/card-database';
import aiFactionsData from '@/data/ai-factions.json';
import { getCardName, getCardDescription } from '@/data/card-translations';
import { cn } from '@/lib/utils';
import { Lock, Play } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import FactionLoreModal from '@/components/FactionLoreModal';
import { FACTION_LORE_DATA, FactionLore } from '@/lib/faction-lore';
import { getFactionSubscription, SubscriptionTier } from '@/lib/faction-subscription-utils';

type Tab = 'UNITS' | 'LEGIONS' | 'COMMANDERS';

type SelectedItem =
    | { type: 'UNIT'; data: CardTemplate; isOwned: boolean }
    | { type: 'LEGION'; data: AIFaction; isOwned: boolean }
    | { type: 'COMMANDER'; data: CardTemplate; isOwned: boolean };

export default function EncyclopediaPage() {
    const { language } = useTranslation();
    const { inventory, loading: userLoading } = useUser(); // [NEW] Use inventory from context
    const [activeTab, setActiveTab] = useState<Tab>('UNITS');
    const [ownedCardIds, setOwnedCardIds] = useState<Set<string>>(new Set());
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

    // Faction Lore Modal state (for LEGIONS tab)
    const [selectedLoreFaction, setSelectedLoreFaction] = useState<FactionLore | null>(null);
    const [isLoreModalOpen, setIsLoreModalOpen] = useState(false);

    // 번역 객체
    const translations = {
        ko: {
            title: '군단 도감',
            englishTitle: 'ENCYCLOPEDIA',
            description: '모든 유닛, 군단, 군단장의 완전한 아카이브',
            tabs: {
                UNITS: '유닛',
                LEGIONS: '군단',
                COMMANDERS: '군단장'
            },
            rarity: '등급',
            specialty: '특성',
            cmdAcc: '명령 (정확도)',
            tacSpd: '전술 (속도)',
            strategist: '전략가'
        },
        en: {
            title: 'Encyclopedia',
            englishTitle: 'NEURAL DB',
            description: 'Complete archive of all Units, Legions, and Legion Commanders',
            tabs: {
                UNITS: 'UNITS',
                LEGIONS: 'LEGIONS',
                COMMANDERS: 'COMMANDERS'
            },
            rarity: 'Rarity',
            specialty: 'Specialty',
            cmdAcc: 'CMD (Acc)',
            tacSpd: 'TAC (Spd)',
            strategist: 'STRATEGIST'
        }
    };

    const tr = translations[language as keyof typeof translations] || translations.ko;

    useEffect(() => {
        // [UPDATED] Use inventory from UserContext instead of local storage
        if (!userLoading && inventory) {
            const ownedIds = new Set<string>();
            inventory.forEach(card => {
                // Add templateId (primary match - same as CARD_DATABASE.id)
                if (card.templateId) {
                    ownedIds.add(card.templateId);
                    // Also add lowercase version for case-insensitive matching
                    ownedIds.add(card.templateId.toLowerCase());
                }
                // Also add card.id in case templateId differs
                if (card.id) {
                    // Extract base templateId from instance IDs like "chatgpt-1_user_123456"
                    const baseId = card.id.split('_')[0];
                    ownedIds.add(baseId);
                    ownedIds.add(baseId.toLowerCase());
                    ownedIds.add(card.id);
                }
                // For cards with aiFactionId
                if ((card as any).aiFactionId) {
                    ownedIds.add((card as any).aiFactionId);
                    ownedIds.add((card as any).aiFactionId.toLowerCase());
                }
                // For commander cards, also check the name-based ID
                if (card.name) {
                    const nameId = card.name.toLowerCase().replace(/\s+/g, '-');
                    ownedIds.add(nameId);
                    ownedIds.add(card.name.toLowerCase());
                }
            });
            setOwnedCardIds(ownedIds);
            console.log('[Encyclopedia] Loaded owned card IDs:', ownedIds.size, 'from inventory of', inventory.length);
        }
    }, [inventory, userLoading]);

    // 유닛 탭에서는 commander 카드 제외
    const unitCards = CARD_DATABASE.filter(card => card.rarity !== 'commander');

    const renderUnits = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {unitCards.map((card, i) => {
                const isOwned = ownedCardIds.has(card.id);
                return (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedItem({ type: 'UNIT', data: card, isOwned })}
                        className={cn(
                            "aspect-[3/4] relative rounded-lg border overflow-hidden cursor-pointer group transition-all",
                            isOwned
                                ? "border-cyan-500/30 bg-black/40 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                : "border-white/5 bg-white/5 grayscale opacity-60"
                        )}
                    >
                        {card.imageUrl && (
                            <div className="absolute inset-0 z-0">
                                <img
                                    src={card.imageUrl}
                                    alt={card.name}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'; // Hide broken image
                                        e.currentTarget.parentElement!.style.backgroundColor = '#1a1a1a'; // Fallback color
                                    }}
                                />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90 z-10" />

                        <div className="absolute top-2 right-2 z-20 flex gap-1">
                            {card.videoUrl && (
                                <div className="bg-red-500/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                                    <Play size={6} fill="white" /> LIVE
                                </div>
                            )}

                            <div className={cn("w-2 h-2 rounded-full",
                                card.rarity === 'common' ? 'bg-gray-500' :
                                    card.rarity === 'rare' ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6]' :
                                        card.rarity === 'epic' ? 'bg-purple-500 shadow-[0_0_5px_#a855f7]' :
                                            card.rarity === 'legendary' ? 'bg-amber-500 shadow-[0_0_5px_#f59e0b]' : 'bg-white'
                            )} />
                        </div>

                        <div className="absolute bottom-0 w-full p-3 z-20">
                            <div className="text-[10px] font-mono text-white/70 mb-1">{card.aiFactionId.toUpperCase()}</div>
                            <div className="font-bold text-white text-sm truncate drop-shadow-md">{getCardName(card.id, card.name, language as 'ko' | 'en')}</div>
                        </div>

                        {!isOwned && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Lock className="text-white/20" size={32} />
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );

    const renderLegions = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiFactionsData.factions.map((faction: any, i: number) => {
                // AI 군단 캐릭터 이미지 경로
                const characterImage = `/assets/cards/${faction.id}-character.png`;
                const factionIcon = `/assets/factions/${faction.id}.png`;

                return (
                    <motion.div
                        key={faction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => {
                            // FactionLoreModal 사용
                            const loreData = FACTION_LORE_DATA[faction.id];
                            if (loreData) {
                                setSelectedLoreFaction(loreData);
                                setIsLoreModalOpen(true);
                            } else {
                                // 로어 데이터가 없으면 기존 모달 사용
                                setSelectedItem({ type: 'LEGION', data: { ...faction, imageUrl: characterImage }, isOwned: true });
                            }
                        }}
                        className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all group"
                    >
                        {/* 캐릭터 이미지 배경 */}
                        <div className="aspect-[16/9] relative overflow-hidden">
                            <img
                                src={characterImage}
                                alt={faction.displayName}
                                className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                                onError={(e) => {
                                    // 캐릭터 이미지가 없으면 팩션 아이콘 표시
                                    const target = e.target as HTMLImageElement;
                                    target.src = factionIcon;
                                    target.className = "w-20 h-20 mx-auto mt-8 object-contain opacity-60";
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                        </div>

                        {/* 군단 정보 */}
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <img
                                    src={factionIcon}
                                    alt=""
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <div>
                                    <h3 className="font-bold text-white text-lg">{faction.displayName}</h3>
                                    <div className="flex gap-2 text-[10px] font-mono text-white/40">
                                        {faction.specialty.map((s: string) => <span key={s} className="bg-white/10 px-1 rounded">{s}</span>)}
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-white/50 line-clamp-2">{faction.description}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );

    const renderCommanders = () => {
        // 각 군단장의 Ultra 구독 상태 확인
        const getCommanderUnlockStatus = (cmd: CardTemplate) => {
            const subscription = getFactionSubscription(cmd.aiFactionId);
            const isUltra = subscription?.tier === 'ultra';
            return { isUnlocked: isUltra, tier: subscription?.tier };
        };

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {COMMANDERS.map((cmd, i) => {
                    const { isUnlocked, tier } = getCommanderUnlockStatus(cmd);
                    return (
                        <motion.div
                            key={cmd.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedItem({ type: 'COMMANDER', data: cmd, isOwned: isUnlocked })}
                            className={cn(
                                "aspect-[3/4] relative rounded-lg border overflow-hidden cursor-pointer group transition-all",
                                isUnlocked
                                    ? "border-amber-500/40 bg-black/40 hover:border-amber-500/70 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                    : "border-white/10 bg-white/5 grayscale opacity-70"
                            )}
                        >
                            {/* CEO 캐릭터 이미지 */}
                            {cmd.imageUrl && (
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={cmd.imageUrl}
                                        alt={cmd.name}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                                    />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/90 z-10" />

                            {/* Ultra 배지 또는 잠금 아이콘 */}
                            <div className="absolute top-2 right-2 z-20">
                                {isUnlocked ? (
                                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                        ⚡ ULTRA
                                    </div>
                                ) : (
                                    <div className="bg-black/60 backdrop-blur-sm text-white/60 text-[10px] font-mono px-2 py-1 rounded-full flex items-center gap-1">
                                        <Lock size={10} /> {tier ? tier.toUpperCase() : 'LOCKED'}
                                    </div>
                                )}
                            </div>

                            {/* 군단 아이콘 */}
                            <div className="absolute top-2 left-2 z-20">
                                <img
                                    src={`/assets/factions/${cmd.aiFactionId}.png`}
                                    alt={cmd.aiFactionId}
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            </div>

                            {/* 잠금 오버레이 */}
                            {!isUnlocked && (
                                <div className="absolute inset-0 z-15 flex flex-col items-center justify-center bg-black/40">
                                    <Lock className="text-white/30" size={32} />
                                    <span className="text-[10px] text-white/40 mt-2 font-mono">ULTRA 구독 필요</span>
                                </div>
                            )}

                            {/* 하단 정보 */}
                            <div className="absolute bottom-0 w-full p-3 z-20">
                                <div className="text-[10px] font-mono text-amber-400/80 mb-0.5">
                                    {cmd.aiFactionId.toUpperCase()} COMMANDER
                                </div>
                                <div className={cn(
                                    "font-bold text-sm truncate drop-shadow-md",
                                    isUnlocked ? "text-amber-400" : "text-white/60"
                                )}>
                                    {getCardName(cmd.id, cmd.name, language as 'ko' | 'en')}
                                </div>
                                {cmd.specialAbility && (
                                    <div className="text-[9px] text-white/50 mt-1 truncate">
                                        ✨ {cmd.specialAbility.name}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    return (
        <CyberPageLayout
            title={tr.title}
            englishTitle={tr.englishTitle}
            description={tr.description}
            color="cyan"
        >
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
                {(['UNITS', 'LEGIONS', 'COMMANDERS'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-4 py-2 text-sm font-mono tracking-widest transition-all rounded-lg",
                            activeTab === tab
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {tr.tabs[tab]}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'UNITS' && renderUnits()}
                {activeTab === 'LEGIONS' && renderLegions()}
                {activeTab === 'COMMANDERS' && renderCommanders()}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
                        onClick={() => setSelectedItem(null)}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="aspect-video bg-black/50 relative flex items-center justify-center border-b border-white/5 overflow-hidden">
                                {'videoUrl' in selectedItem.data && selectedItem.data.videoUrl ? (
                                    <video
                                        src={selectedItem.data.videoUrl}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                ) : 'imageUrl' in selectedItem.data && selectedItem.data.imageUrl ? (
                                    <img
                                        src={selectedItem.data.imageUrl}
                                        alt={selectedItem.data.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-6xl animate-pulse">
                                        {selectedItem.type === 'UNIT' ? '🃏' : selectedItem.type === 'LEGION' ? '🤖' : '👑'}
                                    </div>
                                )}

                                {!selectedItem.isOwned && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                                        <Lock size={48} className="text-white/20" />
                                    </div>
                                )}
                            </div>

                            <div className="p-8">
                                <h2 className="text-3xl font-black orbitron text-white mb-2">
                                    {selectedItem.type === 'LEGION'
                                        ? selectedItem.data.displayName
                                        : getCardName(selectedItem.data.id, selectedItem.data.name, language as 'ko' | 'en')}
                                </h2>

                                <p className="text-white/60 mb-6 leading-relaxed">
                                    {selectedItem.type === 'LEGION'
                                        ? selectedItem.data.description
                                        : getCardDescription(selectedItem.data.id, selectedItem.data.description, language as 'ko' | 'en')}
                                </p>

                                {selectedItem.type === 'UNIT' && 'rarity' in selectedItem.data && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-3 rounded">
                                            <div className="text-[10px] text-white/40 uppercase">{tr.rarity}</div>
                                            <div className="text-sm font-bold text-white capitalize">{selectedItem.data.rarity}</div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded">
                                            <div className="text-[10px] text-white/40 uppercase">{tr.specialty}</div>
                                            <div className="text-sm font-bold text-white capitalize">{selectedItem.data.specialty}</div>
                                        </div>
                                    </div>
                                )}

                                {selectedItem.type === 'COMMANDER' && (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex justify-between bg-white/5 p-2 rounded">
                                                <span className="text-white/50">{tr.cmdAcc}</span>
                                                <span className="text-amber-400">{selectedItem.data.baseStats.accuracy.min}</span>
                                            </div>
                                            <div className="flex justify-between bg-white/5 p-2 rounded">
                                                <span className="text-white/50">{tr.tacSpd}</span>
                                                <span className="text-amber-400">{selectedItem.data.baseStats.speed.min}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Faction Lore Modal - 군단 상세 모달 (factions 페이지와 동일) */}
            <FactionLoreModal
                faction={selectedLoreFaction}
                isOpen={isLoreModalOpen}
                onClose={() => setIsLoreModalOpen(false)}
                allFactions={Object.values(FACTION_LORE_DATA) as any}
            />
        </CyberPageLayout>
    );
}
