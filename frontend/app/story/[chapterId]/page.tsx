'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    loadStoryProgress,
    getChapters,
    completeStage,
    claimChapterReward,
    Chapter,
    StoryStage
} from '@/lib/story-system';
import { Button } from "@/components/ui/custom/Button";
import { Modal, ModalBody, ModalHeader, ModalFooter, ModalContent } from "@/components/ui/custom/Modal";
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Swords, Shield, Skull, Lock, CheckCircle2, Trophy, Quote, Award } from "lucide-react";
import { cn } from '@/lib/utils';
import { addNotification } from '@/components/NotificationCenter';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import DialogueOverlay from '@/components/story/DialogueOverlay';

export default function ChapterDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { language } = useTranslation();
    const chapterId = params.chapterId as string;

    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [selectedStage, setSelectedStage] = useState<StoryStage | null>(null);

    // 모달 상태
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'success' | 'intro';
        onConfirm?: () => void;
    }>({ isOpen: false, title: '', message: '' });

    const [isDialogueOpen, setIsDialogueOpen] = useState(false);

    const { consumeTokens, user } = useUser();

    useEffect(() => {
        const load = async () => {
            const allChapters = getChapters();
            const found = allChapters.find((c: Chapter) => c.id === chapterId);

            if (found) {
                // Async load with user ID if logged in
                const progress = await loadStoryProgress(chapterId, user?.uid);

                found.unlocked = true;
                found.stages = found.stages.map((s: StoryStage) => ({
                    ...s,
                    isCleared: progress.completedStages.includes(s.id)
                }));

                setChapter(found);

                if (!selectedStage) {
                    const firstUncleared = found.stages.find((s: StoryStage) => !s.isCleared);
                    setSelectedStage(firstUncleared || found.stages[found.stages.length - 1]);
                }
            }
        };
        load();
    }, [chapterId, user]);

    const handleStageSelect = (stage: StoryStage) => {
        if (stage.step > 1) {
            const prevStage = chapter?.stages.find(s => s.step === stage.step - 1);
            if (prevStage && !prevStage.isCleared) {
                addNotification({
                    type: 'warning',
                    title: 'LOCKED',
                    message: language === 'ko' ? '이전 스테이지를 먼저 클리어해야 합니다.' : 'Complete previous stage first.',
                    icon: '🔒'
                });
                return;
            }
        }
        setSelectedStage(stage);
    };

    const handleBattleStart = async () => {
        if (!selectedStage) return;
        setIsDialogueOpen(true);
    };

    const handleDialogueComplete = async () => {
        if (!selectedStage) return;
        const cost = selectedStage.tokenCost || (selectedStage.difficulty === 'BOSS' ? 100 : 50);

        // [Check Token Balance]
        const success = await consumeTokens(cost, 'STORY_MISSION');
        if (success) {
            router.push(`/battle/stage/${selectedStage.id}`);
        }
        setIsDialogueOpen(false);
    };

    if (!chapter) return null;

    const completedStages = chapter.stages.filter(s => s.isCleared).length;
    const progress = Math.round((completedStages / chapter.stages.length) * 100);

    return (
        <div className="min-h-screen py-12 px-4 lg:px-8 bg-[#050505] relative overflow-hidden flex flex-col">
            <BackgroundBeams className="opacity-40" />

            <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col flex-1">
                {/* 헤더 */}
                <div className="flex items-center mb-8 gap-4">
                    <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => router.push('/story')}>
                        <ArrowLeft className="mr-2" size={20} /> BACK
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 italic">
                            {chapter.title_ko || chapter.title}
                        </h1>
                        <p className="text-gray-400 font-mono text-sm">
                            {chapter.description_ko || chapter.description}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                    {/* 왼쪽: 스테이지 리스트 */}
                    <div className="lg:col-span-1 bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white mb-2">STAGES</h2>
                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="text-right text-xs text-cyan-500 mt-1">{progress}% CLEARED</div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-800">
                            {chapter.stages.map((stage) => {
                                const isLocked = stage.step > 1 && !chapter.stages.find(s => s.step === stage.step - 1)?.isCleared && !stage.isCleared;
                                const isSelected = selectedStage?.id === stage.id;

                                return (
                                    <div
                                        key={stage.id}
                                        onClick={() => handleStageSelect(stage)}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group",
                                            isSelected
                                                ? "bg-cyan-900/20 border-cyan-500/50"
                                                : "bg-black/40 border-white/5 hover:bg-white/5",
                                            isLocked && "opacity-50 grayscale"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                                    stage.isCleared ? "bg-green-500/20 text-green-500" : isLocked ? "bg-gray-800 text-gray-500" : "bg-cyan-500/20 text-cyan-500"
                                                )}>
                                                    {stage.isCleared ? <CheckCircle2 size={16} /> : stage.step}
                                                </div>
                                                <div>
                                                    <div className={cn("font-bold text-sm", isSelected ? "text-white" : "text-gray-400")}>
                                                        {stage.title_ko || stage.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 capitalize">{stage.battleMode}</div>
                                                </div>
                                            </div>
                                            {isLocked && <Lock size={14} className="text-gray-600" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 오른쪽: 상세 정보 */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <AnimatePresence mode="wait">
                            {selectedStage ? (
                                <motion.div
                                    key={selectedStage.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative overflow-hidden flex-1 flex flex-col"
                                >
                                    {/* 배경 장식 */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

                                    <div className="relative z-10 flex-1">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <div className="text-cyan-500 font-mono text-sm mb-2">STAGE {selectedStage.id.split('-').slice(1).join('-')}</div>
                                                <h2 className="text-4xl font-black text-white italic mb-4">{selectedStage.title_ko || selectedStage.title}</h2>
                                                <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                                                    {selectedStage.description_ko || selectedStage.description}
                                                </p>
                                            </div>
                                            {selectedStage.isCleared && (
                                                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full font-bold flex items-center gap-2 border border-green-500/30">
                                                    <Trophy size={18} /> CLEARED
                                                </div>
                                            )}
                                        </div>

                                        {/* 적 정보 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                                                <div className="flex items-center gap-2 text-red-400 font-bold mb-4">
                                                    <Skull size={18} /> ENEMY INTEL
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-red-900/20 rounded-xl flex items-center justify-center text-3xl border border-red-500/30">
                                                        👿
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-lg">{selectedStage.enemy.name_ko || selectedStage.enemy.name}</div>
                                                        <div className="text-gray-500 text-sm">Difficulty: <span className={cn(
                                                            "font-bold",
                                                            selectedStage.difficulty === 'EASY' ? "text-green-500" :
                                                                selectedStage.difficulty === 'NORMAL' ? "text-blue-500" :
                                                                    selectedStage.difficulty === 'HARD' ? "text-orange-500" : "text-red-500"
                                                        )}>{selectedStage.difficulty}</span></div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 text-gray-400 text-sm bg-white/5 p-3 rounded-lg italic">
                                                    <Quote size={12} className="inline mr-1 mb-1" />
                                                    {selectedStage.enemy.dialogue.quote_ko || selectedStage.enemy.dialogue.quote || selectedStage.enemy.dialogue.intro_ko || selectedStage.enemy.dialogue.intro}
                                                </div>
                                            </div>

                                            {/* 전투 방식 안내 */}
                                            <div className="bg-black/40 border border-cyan-500/30 rounded-2xl p-6">
                                                <div className="flex items-center gap-2 text-cyan-400 font-bold mb-4">
                                                    <Swords size={18} /> BATTLE MODE
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "px-3 py-1 rounded-lg font-bold text-sm",
                                                            selectedStage.battleMode === 'sudden-death' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                                                selectedStage.battleMode === 'tactics' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                                                                    selectedStage.battleMode === 'double' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                                                                        "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                                        )}>
                                                            {selectedStage.battleMode === 'sudden-death' ? '⚡ 서든 데스' :
                                                                selectedStage.battleMode === 'tactics' ? '🎯 전술 승부' :
                                                                    selectedStage.battleMode === 'double' ? '🎴 2장 대결' :
                                                                        '🌪️ 전략 전투'}
                                                        </div>
                                                    </div>
                                                    <div className="text-gray-300 text-sm bg-white/5 p-4 rounded-lg leading-relaxed">
                                                        {selectedStage.battleMode === 'sudden-death' && (
                                                            <>
                                                                <p className="font-bold text-red-400 mb-2">⚡ 서든 데스 (Sudden Death)</p>
                                                                <p>• 한 라운드에 한 장씩 카드를 내며 5라운드 진행</p>
                                                                <p>• 각 라운드마다 즉시 승부 결정</p>
                                                                <p>• 3승을 먼저 달성하는 쪽이 승리</p>
                                                                <p className="text-yellow-400 mt-2">💡 빠른 판단력과 상성 이해가 중요!</p>
                                                            </>
                                                        )}
                                                        {selectedStage.battleMode === 'tactics' && (
                                                            <>
                                                                <p className="font-bold text-blue-400 mb-2">🎯 전술 승부 (Tactical Duel)</p>
                                                                <p>• 5장의 카드를 미리 1~5라운드에 배치</p>
                                                                <p>• 배치 완료 후 수정 불가</p>
                                                                <p>• 순서대로 자동 대결 진행</p>
                                                                <p className="text-yellow-400 mt-2">💡 상대의 패턴을 예측하고 전략적으로 배치!</p>
                                                            </>
                                                        )}
                                                        {selectedStage.battleMode === 'double' && (
                                                            <>
                                                                <p className="font-bold text-purple-400 mb-2">🎴 2장 대결 (Two-Card Battle)</p>
                                                                <p>• 한 라운드에 2장씩 동시에 카드 선택</p>
                                                                <p>• 총 6장의 카드로 3라운드 진행</p>
                                                                <p>• 각 라운드의 합산 파워로 승부</p>
                                                                <p className="text-yellow-400 mt-2">💡 카드 조합과 시너지가 승패를 가른다!</p>
                                                            </>
                                                        )}
                                                        {selectedStage.battleMode === 'strategy' && (
                                                            <>
                                                                <p className="font-bold text-orange-400 mb-2">🌪️ 전략 전투 (Strategy Battle)</p>
                                                                <p>• 6장의 카드를 미리 배치</p>
                                                                <p>• 적은 무작위 순서로 카드 출전</p>
                                                                <p>• 예측 불가능한 전투 흐름</p>
                                                                <p className="text-yellow-400 mt-2">💡 모든 상황에 대비한 균형잡힌 덱 구성 필수!</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                                                <div className="flex items-center gap-2 text-yellow-500 font-bold mb-4">
                                                    <Award size={18} /> REWARDS
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                                        <span className="text-gray-400">Coins</span>
                                                        <span className="text-yellow-400 font-mono font-bold">+{selectedStage.rewards.coins}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                                        <span className="text-gray-400">EXP</span>
                                                        <span className="text-cyan-400 font-mono font-bold">+{selectedStage.rewards.experience}</span>
                                                    </div>
                                                    {selectedStage.rewards.card && (
                                                        <div className="flex justify-between items-center bg-purple-500/10 p-3 rounded-lg border border-purple-500/30">
                                                            <span className="text-purple-300">Card</span>
                                                            <span className="text-purple-400 font-bold text-sm">Rare Card</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        size="lg"
                                        className="w-full text-lg h-16 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
                                        onClick={handleBattleStart}
                                    >
                                        <Swords className="mr-2" />
                                        {selectedStage.isCleared ? "REPLAY MISSION" : "START MISSION"}
                                    </Button>
                                </motion.div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 font-mono">
                                    SELECT A STAGE TO VIEW DETAILS
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* 대화 오버레이 */}
            {selectedStage && (
                <DialogueOverlay
                    isOpen={isDialogueOpen}
                    onClose={handleDialogueComplete}
                    dialogues={[
                        selectedStage.enemy.dialogue.appearance_ko || selectedStage.enemy.dialogue.appearance,
                        selectedStage.enemy.dialogue.intro_ko || selectedStage.enemy.dialogue.intro,
                        selectedStage.enemy.dialogue.quote_ko || selectedStage.enemy.dialogue.quote,
                        selectedStage.enemy.dialogue.start_ko || selectedStage.enemy.dialogue.start,
                    ].filter((d): d is string => Boolean(d))}
                    speakerName={
                        language === 'ko'
                            ? (selectedStage.enemy.name_ko || selectedStage.enemy.name)
                            : selectedStage.enemy.name
                    }
                    characterImage={selectedStage.enemy.image}
                    type={selectedStage.difficulty === 'BOSS' ? 'boss' : 'intro'}
                />
            )}

            {/* 일반 모달 (성공 메시지 등) */}
            <Modal isOpen={modalConfig.isOpen && modalConfig.type !== 'intro'} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}>
                <ModalContent>
                    <ModalHeader className="text-cyan-500 font-black text-2xl">
                        {modalConfig.title}
                    </ModalHeader>
                    <ModalBody className="text-center py-8">
                        <p className="text-xl text-white">
                            {modalConfig.message}
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            className="w-full bg-cyan-600 hover:bg-cyan-500 py-6 text-lg"
                            onClick={() => {
                                setModalConfig({ ...modalConfig, isOpen: false });
                                modalConfig.onConfirm?.();
                            }}
                        >
                            CONFIRM
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
