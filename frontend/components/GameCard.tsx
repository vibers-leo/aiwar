'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, Rarity } from '@/lib/types';
import { InventoryCard } from '@/lib/inventory-system';
import { getCardCharacterImage, getFactionIcon, getCardCharacterVideo } from '@/lib/card-images';
import { getTypeIcon, getTypeColor } from '@/lib/type-system';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';
import { getCardName } from '@/data/card-translations';

interface GameCardProps {
    card: CardType | InventoryCard;
    onClick?: () => void;
    isSelected?: boolean;
    isDisabled?: boolean;
    isHolographic?: boolean;
    showDetails?: boolean;
    isFlipped?: boolean; // New prop for showing card back
}

// 등급별 색상 설정
const RARITY_CONFIG: Record<Rarity, { border: string; glow: string; badge: string; bgGradient: string; glowColor: string }> = {
    common: {
        border: 'border-gray-500/50',
        glow: '',
        badge: 'bg-gray-600 text-gray-200',
        bgGradient: 'from-gray-800/50 to-gray-900/50',
        glowColor: 'rgba(156,163,175,0.3)'
    },
    rare: {
        border: 'border-blue-500/50',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
        badge: 'bg-blue-600 text-blue-100',
        bgGradient: 'from-blue-900/30 to-gray-900/50',
        glowColor: 'rgba(59,130,246,0.5)'
    },
    epic: {
        border: 'border-purple-500/50',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
        badge: 'bg-purple-600 text-purple-100',
        bgGradient: 'from-purple-900/30 to-gray-900/50',
        glowColor: 'rgba(168,85,247,0.6)'
    },
    legendary: {
        border: 'border-amber-500/60',
        glow: 'shadow-[0_0_30px_rgba(245,158,11,0.6)]',
        badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
        bgGradient: 'from-amber-900/40 to-gray-900/50',
        glowColor: 'rgba(245,158,11,0.7)'
    },
    unique: {
        border: 'border-red-500/60',
        glow: 'shadow-[0_0_35px_rgba(239,68,68,0.6)]',
        badge: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
        bgGradient: 'from-red-900/40 to-gray-900/50',
        glowColor: 'rgba(239,68,68,0.7)'
    },
    commander: {
        border: 'border-emerald-500/60',
        glow: 'shadow-[0_0_35px_rgba(16,185,129,0.6)]',
        badge: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white',
        bgGradient: 'from-emerald-900/40 to-gray-900/50',
        glowColor: 'rgba(16,185,129,0.7)'
    }
};

// 등급 한글/영어 이름
const RARITY_NAMES: Record<Rarity, Record<'ko' | 'en', string>> = {
    common: { ko: '일반', en: 'Common' },
    rare: { ko: '희귀', en: 'Rare' },
    epic: { ko: '영웅', en: 'Epic' },
    legendary: { ko: '전설', en: 'Legendary' },
    unique: { ko: '유니크', en: 'Unique' },
    commander: { ko: '군단장', en: 'Commander' }
};

// 스탯 라벨 다국어
const STAT_LABELS: Record<'efficiency' | 'creativity' | 'function', Record<'ko' | 'en', string>> = {
    efficiency: { ko: '효율', en: 'EFF' },
    creativity: { ko: '창의', en: 'CRE' },
    function: { ko: '기능', en: 'FUN' }
};

// 등급별 별 개수
const RARITY_STARS: Record<Rarity, number> = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    unique: 5,
    commander: 5
};

function GameCard({
    card,
    onClick,
    isSelected = false,
    isDisabled = false,
    isHolographic = false,
    showDetails = true,
    isFlipped = false
}: GameCardProps) {
    const { language } = useTranslation();
    const lang = (language as 'ko' | 'en') || 'ko';
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // 🛡️ Null check: card가 없으면 플레이스홀더 표시 (대전 멈춤 버그 방지)
    if (!card) {
        return (
            <div
                className="relative rounded-xl overflow-hidden border-2 border-gray-500/50 bg-gray-900/80 flex items-center justify-center"
                style={{ width: '160px', height: '240px' }}
            >
                <div className="text-4xl opacity-50">❓</div>
                <span className="absolute bottom-2 text-xs text-white/30">No Card</span>
            </div>
        );
    }

    // 실제 카드 등급 사용 (fallback: common)
    const rarity: Rarity = card.rarity || 'common';
    const config = RARITY_CONFIG[rarity];

    // 카드 이미지/영상 가져오기
    const characterImage = card.imageUrl || getCardCharacterImage(card.templateId, card.name, rarity);
    const factionIcon = card.templateId ? getFactionIcon(card.templateId.split('-')[0]) : null;

    // [FIX] 호버 비디오 우선순위: hoverVideo > videoUrl > getCardCharacterVideo
    const characterVideo = card.hoverVideo || card.videoUrl || getCardCharacterVideo(card.templateId, rarity);
    const hoverSound = card.hoverSound;
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 호버 시 영상 재생 제어
    useEffect(() => {
        if (videoRef.current && characterVideo) {
            if (isHovered) {
                videoRef.current.play().catch(() => { });
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isHovered, characterVideo]);

    // 호버 시 사운드 재생 제어
    useEffect(() => {
        if (!hoverSound) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(hoverSound);
            audioRef.current.volume = 0.5;
        }

        if (isHovered) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.warn("Audio play failed", e));
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [isHovered, hoverSound]);

    // 전설/유니크는 상시 영상 표시 가능, 또는 호버 비디오가 있을 때 호버 시 표시
    const shouldShowVideo = characterVideo && (isHovered || (rarity === 'unique' && !card.hoverVideo));
    const isHighRarity = rarity === 'legendary' || rarity === 'unique' || rarity === 'commander';

    return (
        <motion.div
            className={cn(
                "relative transition-all duration-300 rounded-xl overflow-hidden border-2",
                config.border,
                isHighRarity && config.glow,
                isSelected && "scale-105 ring-2 ring-cyan-400",
                !isSelected && !isDisabled && "hover:scale-110 hover:z-10",
                isDisabled && "opacity-50 cursor-not-allowed grayscale",
                !isDisabled && "cursor-pointer"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={isDisabled ? undefined : onClick}
            style={{ width: '160px', height: '240px' }}
            whileHover={!isDisabled ? { scale: 1.08 } : undefined}
            transition={{ duration: 0.2 }}
        >
            {/* 카드 뒷면 (isFlipped 상태일 때 표시) */}
            {isFlipped && (
                <div className="absolute inset-0 z-50 bg-black rounded-xl overflow-hidden border-2 border-gray-700">
                    <Image
                        src="/assets/cards/card-back-sci-fi.png"
                        alt="Card Back"
                        fill
                        className="object-cover"
                    />
                </div>
            )}

            {/* 고급 등급 글로우 이펙트 */}
            {!isFlipped && isHighRarity && (
                <motion.div
                    className="absolute inset-0 z-0 pointer-events-none rounded-xl"
                    animate={{
                        boxShadow: isHovered
                            ? `0 0 40px ${config.glowColor}, 0 0 60px ${config.glowColor}, inset 0 0 20px ${config.glowColor}`
                            : `0 0 20px ${config.glowColor}`
                    }}
                    transition={{ duration: 0.3 }}
                />
            )}

            {/* Holographic Overlay */}
            {(isHolographic || rarity === 'unique') && (
                <motion.div
                    className="absolute inset-0 z-30 pointer-events-none"
                    animate={{
                        background: isHovered
                            ? 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)'
                            : 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
                    }}
                />
            )}

            {/* 카드 배경 */}
            <div className={cn("absolute inset-0 bg-gradient-to-b", config.bgGradient)} />

            {/* 카드 이미지/영상 영역 */}
            <div className="relative h-[55%] flex items-center justify-center overflow-hidden bg-black/30">
                {/* 배경 그라데이션 */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10" />

                {/* 영상 (호버 시 또는 고급 등급) */}
                <AnimatePresence>
                    {shouldShowVideo && (
                        <motion.video
                            ref={videoRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            src={characterVideo}
                            className="absolute inset-0 w-full h-full object-cover z-5"
                            muted
                            loop
                            playsInline
                            onLoadedData={() => setVideoLoaded(true)}
                        />
                    )}
                </AnimatePresence>

                {/* 이미지 (영상 없을 때 또는 로딩 중) */}
                {(!shouldShowVideo || !videoLoaded) && (
                    <>
                        {characterImage && !imageError ? (
                            <Image
                                src={characterImage}
                                alt={card.name || 'Card'}
                                fill
                                className="object-cover"
                                onError={() => setImageError(true)}
                            />
                        ) : factionIcon && !imageError ? (
                            <Image
                                src={factionIcon}
                                alt={card.name || 'Card'}
                                width={80}
                                height={80}
                                className="object-contain drop-shadow-lg"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="text-5xl">🤖</div>
                        )}
                    </>
                )}

                {/* 타입 아이콘 (가위바위보) - 상단 우측 배치 및 크기 확대 */}
                {card.type && (
                    <div
                        className="absolute top-1.5 right-1.5 w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-white/50 z-50 shadow-2xl backdrop-blur-sm"
                        style={{ backgroundColor: getTypeColor(card.type) }}
                        title={card.type}
                    >
                        <span className="drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                            {getTypeIcon(card.type)}
                        </span>
                    </div>
                )}

                {/* 레벨 표시 - 하단 우측으로 이동 */}
                <div
                    className="absolute bottom-1.5 right-1.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-black text-white border border-white/20 z-20 shadow-lg font-mono"
                    suppressHydrationWarning
                >
                    LV.{card.level}
                </div>

                {/* 등급 배지 */}
                <motion.div
                    className={cn("absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider z-20", config.badge)}
                    animate={isHighRarity ? { scale: [1, 1.05, 1] } : undefined}
                    transition={isHighRarity ? { repeat: Infinity, duration: 2 } : undefined}
                >
                    {RARITY_NAMES[rarity][lang]}
                </motion.div>

                {/* 영상 재생 인디케이터 */}
                {characterVideo && isHovered && (
                    <div className="absolute bottom-1 right-1 z-20">
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-2 h-2 bg-red-500 rounded-full"
                        />
                    </div>
                )}

                {/* 선택 체크 표시 - 더욱 프리미엄하고 '딱 맞게' 개선 */}
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-40 rounded-xl overflow-hidden pointer-events-none"
                    >
                        {/* 테두리 글로우 */}
                        <div className="absolute inset-0 border-[3px] border-cyan-400 shadow-[inset_0_0_20px_rgba(6,182,212,0.5)] rounded-xl" />

                        {/* 배경 오버레이 */}
                        <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[0.5px]" />

                        {/* 체크마크 애니메이션 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="w-14 h-14 rounded-full bg-cyan-500/90 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.8)] border-2 border-white/30"
                            >
                                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* 카드 정보 영역 */}
            {showDetails && (
                <div className="relative h-[45%] p-2.5 flex flex-col bg-black/60 z-10">
                    <h3 className="text-xs font-bold text-white truncate orbitron mb-1">
                        {getCardName(card.templateId || card.id || "", card.name || "", lang) || `AI 유닛 #${card.id?.slice(0, 5) || '???'}`}
                    </h3>

                    {/* 등급 별 표시 */}
                    <div className="flex items-center gap-0.5 mb-2">
                        {Array.from({ length: RARITY_STARS[rarity] }).map((_, i) => (
                            <motion.span
                                key={i}
                                className="text-[10px] text-amber-400"
                                animate={isHighRarity && isHovered ? { scale: [1, 1.2, 1] } : undefined}
                                transition={{ delay: i * 0.1, repeat: Infinity, duration: 1 }}
                            >
                                ★
                            </motion.span>
                        ))}
                    </div>

                    {/* 스탯 - 올바른 이름으로 표시 */}
                    <div className="flex-1 space-y-1 text-[10px]">
                        <StatBar label={STAT_LABELS.efficiency[lang]} value={card.stats?.efficiency || 0} color="cyan" />
                        <StatBar label={STAT_LABELS.creativity[lang]} value={card.stats?.creativity || 0} color="purple" />
                        <StatBar label={STAT_LABELS.function[lang]} value={card.stats?.function || 0} color="green" />
                    </div>

                    {/* 총 전투력 */}
                    <div className="mt-1.5 pt-1.5 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[9px] text-white/50 font-mono">PWR</span>
                        <motion.span
                            className="text-sm font-black orbitron bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                            animate={isHovered ? { scale: [1, 1.05, 1] } : undefined}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            suppressHydrationWarning
                        >
                            {card.stats?.totalPower || 0}
                        </motion.span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function StatBar({ label, value, color }: { label: string; value: number; color: 'cyan' | 'purple' | 'green' }) {
    const maxValue = 100;
    const percentage = Math.min((value / maxValue) * 100, 100);

    const colorClasses = {
        cyan: 'from-cyan-500 to-cyan-400',
        purple: 'from-purple-500 to-purple-400',
        green: 'from-green-500 to-green-400'
    };

    return (
        <div className="flex items-center gap-1.5">
            <span className="text-white/50 w-6 font-mono">{label}</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className={cn("h-full bg-gradient-to-r rounded-full", colorClasses[color])}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>
            <span className="text-white/70 w-5 text-right font-mono">{value}</span>
        </div>
    );
}

export default React.memo(GameCard);
