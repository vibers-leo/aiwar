'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import CyberPageLayout from '@/components/CyberPageLayout';
import GameCard from '@/components/GameCard';
import { Card } from '@/lib/types';
import { getGameState } from '@/lib/game-state';
import { useAlert } from '@/context/AlertContext';
import { useUser } from '@/context/UserContext'; // [NEW] Added import
import { gameStorage } from '@/lib/game-storage';
import { loadInventory, InventoryCard } from '@/lib/inventory-system';
import { groupCardsByRarity, selectBalancedDeck, getMainCards } from '@/lib/balanced-deck-selector';
import {
    BattleMode,
    MatchType,
    BattleParticipant,
    BattleResult,
    getPVPStats,
    checkPVPRequirements,
    PVP_REQUIREMENTS,
    PVP_REWARDS,
    generateOpponentDeck,
    simulateBattle,
    applyBattleResult,
    getTypeEmoji,
    getTypeName,
} from '@/lib/pvp-battle-system';
import { updateTokens } from '@/lib/firebase-db';
import {
    Trophy, Swords, Shield, Eye, Zap, Clock, Target, Users,
    CheckCircle, XCircle, Award, Coins, TrendingUp, ArrowRight,
    Shuffle, Play, Crown, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RealtimeMatchingModal from '@/components/RealtimeMatchingModal';
import CardPlacementBoard, { RoundPlacement } from '@/components/battle/CardPlacementBoard';

type Phase =
    | 'stats'
    | 'mode-select'
    | 'deck-select'
    | 'match-type'
    | 'deck-reveal'
    | 'card-placement'
    | 'battle'
    | 'double-battle' // 복식승부 인터랙티브 페이즈
    | 'result';

export default function PVPArenaPage() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const { coins, tokens, level, trackMissionEvent } = useUser(); // [NEW] Use generic coins/level/trackMission from context

    const [phase, setPhase] = useState<Phase>('stats');
    const { profile, loading: userLoading } = useUser();
    const [selectedMode, setSelectedMode] = useState<BattleMode>('double');
    const [selectedMatchType, setSelectedMatchType] = useState<MatchType>('ai-training');
    const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
    const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
    const [cardOrder, setCardOrder] = useState<number[]>([0, 1, 2, 3, 4]);
    const [revealTimer, setRevealTimer] = useState(20);
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
    const [currentRound, setCurrentRound] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [animationPhase, setAnimationPhase] = useState<'idle' | 'ready' | 'clash' | 'reveal'>('idle');
    const [isStarting, setIsStarting] = useState(false);

    // ... (rest of the file until handleStartBattle)

    const handleStartBattle = async (overrideOrder?: number[], overrideDeck?: Card[]) => {
        if (isStarting) return; // Prevent double click

        // [NEW] 일일 리셋 체크 (오전 6시)
        const { checkAndResetDailyStats } = require('@/lib/game-state');
        const currentState = checkAndResetDailyStats();

        // [NEW] AI 대전 시작 시 토큰 소모 (계단식: 50, 100, 150...)
        const aiMatchesToday = currentState.dailyStats?.aiMatchesToday || 0;
        const tokenCost = (aiMatchesToday + 1) * 50;

        setIsStarting(true); // Lock

        try {
            // [FIX] Use Firebase Token (Async) instead of Local Storage
            if (tokens < tokenCost) {
                showAlert({
                    title: '토큰 부족',
                    message: `이번 대전을 시작하려면 ${tokenCost} 토큰이 필요합니다. (오늘 ${aiMatchesToday}회 진행됨)`,
                    type: 'error'
                });
                setIsStarting(false);
                return;
            }

            // Deduct Tokens Server-side
            await updateTokens(-tokenCost);

            const pDeck = overrideDeck || playerDeck;
            const player: BattleParticipant = {
                name: `Player_${level}`,
                level: level,
                deck: pDeck,
                cardOrder: overrideOrder || cardOrder,
            };

            const opponent: BattleParticipant = {
                name: selectedMatchType === 'ai-training' ? `AI 훈련봇 Lv.${level}` : 'Opponent',
                level: level,
                deck: opponentDeck,
                cardOrder: [0, 1, 2, 3, 4, 5], // AI Deck Order extended
            };

            if (selectedMode === 'double') {
                // 복식승부는 별도 플로우
                startDoubleBattle(player, opponent);
            } else {
                const result = simulateBattle(player, opponent, selectedMode);
                setBattleResult(result);
                setCurrentRound(0);
                setPhase('battle');
                runBattleAnimation(result);
            }
        } catch (error) {
            console.error("Battle Start Failed:", error);
            showAlert({ title: '오류', message: '전투 시작 중 문제가 발생했습니다.', type: 'error' });
        } finally {
            setIsStarting(false); // Unlock
        }
    };
    // ... (Existing implementation kept as is, not part of this replacement block but context)
    // Actually, I should just replace handleStartBattle and add the state near other states.
    // But replace_file_content works on blocks.
    // I will add the state first, then update handleStartBattle.
    // [NEW] 복식승부 전용 스테이트
    const [doubleBattleState, setDoubleBattleState] = useState<{
        round: number; // 1, 2, 3
        phase: 'ready' | 'choice' | 'clash' | 'result';
        timer: number;
        playerSelection: Card | null;
        opponentSelection: Card | null;
        roundWinner: 'player' | 'opponent' | 'draw' | null;
        playerWins: number;
        opponentWins: number;
        history: any[];
    }>({
        round: 1,
        phase: 'ready',
        timer: 3,
        playerSelection: null,
        opponentSelection: null,
        roundWinner: null,
        playerWins: 0,
        opponentWins: 0,
        history: []
    });

    const stats = getPVPStats();
    const state = getGameState();

    const [inventory, setInventory] = useState<InventoryCard[]>([]);

    // 카드 선택 (푸터 대신 로컬 state)
    const [selectedCards, setSelectedCards] = useState<InventoryCard[]>([]);

    // 실시간 매칭 모달
    const [showMatchingModal, setShowMatchingModal] = useState(false);

    // Load real cards on mount
    useEffect(() => {
        const loadCards = async () => {
            const cards = await gameStorage.getCards();
            setInventory(cards);
        };
        loadCards();
    }, []);

    // 모드 정보
    const modes = [
        {
            id: 'sudden-death' as BattleMode,
            name: '단판 승부',
            nameEn: 'Sudden Death',
            description: '5장 덱 - 1:1 정면 승부 (빠른 진행)',
            icon: Zap,
            color: 'from-amber-500 to-orange-500',
            rounds: '5장 덱',
            reward: `+${PVP_REWARDS['sudden-death'].coins} 코인`,
        },
        {
            id: 'double' as BattleMode,
            name: '두장 승부',
            nameEn: 'Two-Card Battle',
            description: '6장 덱 - "하나빼기" 심리전 (3판 2선승)',
            icon: Users,
            color: 'from-indigo-500 to-violet-500',
            rounds: '6장 덱',
            reward: `+${PVP_REWARDS.double.coins} 코인`,
        },
        {
            id: 'tactics' as BattleMode,
            name: '전술 승부',
            nameEn: 'Tactical Duel',
            description: '5장 덱 - 배치와 상성을 활용한 정공법 (3점 선승)',
            icon: Shield,
            color: 'from-blue-500 to-cyan-500',
            rounds: '3선승',
            reward: `+${PVP_REWARDS.tactics.coins} 코인`,
        },
        {
            id: 'ambush' as BattleMode,
            name: '전략 승부',
            nameEn: 'Strategy Battle',
            description: '6장 덱 - 3라운드 "매복" 시스템 (3점 선승)',
            icon: Eye,
            color: 'from-purple-500 to-pink-500',
            rounds: '6장 덱',
            reward: `+${PVP_REWARDS.ambush.coins} 코인`,
        },
    ];

    // 푸터 관련 useEffect 제거됨 - 로컬 state로 관리

    // 덱 공개 타이머
    useEffect(() => {
        if (phase === 'deck-reveal' && revealTimer > 0) {
            const timer = setInterval(() => {
                setRevealTimer(prev => {
                    if (prev <= 1) {
                        // 타이머 종료 - 모든 모드에서 카드 배치 단계로 이동 (단판 승부 포함)
                        setPhase('card-placement');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [phase, revealTimer, selectedMode]);

    // 전투 모드 선택
    const handleModeSelect = (mode: BattleMode) => {
        setSelectedMode(mode);
    };

    // 전투 시작 (참가 조건 확인)
    const handleStartPVP = async (mode: BattleMode) => {
        try {
            const rawInventory = await loadInventory();
            // Timestamp -> Date 변환 및 타입 캐스팅
            const mappedInventory = rawInventory.map(c => ({
                ...c,
                acquiredAt: c.acquiredAt && typeof (c.acquiredAt as any).toDate === 'function'
                    ? (c.acquiredAt as any).toDate()
                    : new Date(c.acquiredAt as any)
            }));

            setInventory(mappedInventory);

            // Check PVP requirements (AI practice mode - no tokens required)
            const check = await checkPVPRequirements(mappedInventory, level, coins, tokens, false);

            if (!check.canJoin) {
                showAlert({
                    title: '참가 불가',
                    message: check.reason || '입장 조건을 만족하지 못했습니다.',
                    type: 'error'
                });
                return;
            }

            // [FIX] Manual Coin Check with Context State (More accurate than gameStorage)
            if (coins < PVP_REQUIREMENTS.entryFeeCoins) {
                showAlert({
                    title: '참가 불가',
                    message: `코인이 부족합니다. (필요: ${PVP_REQUIREMENTS.entryFeeCoins})`,
                    type: 'error'
                });
                return;
            }

            setSelectedMode(mode);
            setPhase('deck-select');
        } catch (e) {
            console.error("PVP Start Error", e);
            showAlert({ title: '오류', message: '데이터를 불러오는 중 문제가 발생했습니다.', type: 'error' });
        }
    };

    // 덱 확정
    const handleDeckConfirm = () => {
        const selected = selectedCards;
        let targetSize = 5;
        if (selectedMode === 'ambush' || selectedMode === 'double') {
            targetSize = 6;
        }

        if (selected.length !== targetSize) {
            showAlert({ title: '덱 미완성', message: `${targetSize}장의 카드를 선택해주세요.`, type: 'warning' });
            return;
        }

        setPlayerDeck(selected);
        setPhase('match-type');
    };

    // 대전 방식 선택
    const handleMatchTypeSelect = async (type: MatchType) => {
        if (type === 'realtime') {
            // [NEW] 실시간 대전 입장 조건 체크 (여분 카드 포함)
            const check = await checkPVPRequirements(inventory, level, coins, tokens, true);

            if (!check.canJoin) {
                showAlert({
                    title: '참가 불가',
                    message: check.reason || '실시간 대전 참여 조건을 만족하지 못했습니다.',
                    type: 'error'
                });
                return;
            }

            setSelectedMatchType(type);
            setShowMatchingModal(true);
            return;
        } else {
            setSelectedMatchType(type);
            // AI 훈련: AI 덱 생성 및 애니메이션화
            const targetSize = (selectedMode === 'ambush' || selectedMode === 'double') ? 6 : 5;
            const aiOpponent = generateOpponentDeck(state.level, [], targetSize);
            setOpponentDeck(aiOpponent.deck);
            setRevealTimer(20); // 타이머 초기화
            setPhase('deck-reveal');

            // AI 덱 생성 시뮬레이션 (카드 뒷면 -> 앞면)
            // ...
        }
    };

    // 매칭 성공 콜백
    const handleMatchFound = (roomId: string, opponentName: string) => {
        setShowMatchingModal(false);
        showAlert({
            title: '매칭 성공!',
            message: `${opponentName}님과 연결되었습니다. 전투방으로 이동합니다.`,
            type: 'success'
        });
        // 실시간 전투방으로 이동
        router.push(`/pvp/room/${roomId}`);
    };

    // 카드 순서 확정
    const handleOrderConfirm = () => {
        handleStartBattle();
    };



    // 복식승부 시작
    const startDoubleBattle = (player: BattleParticipant, opponent: BattleParticipant) => {
        setDoubleBattleState({
            round: 1,
            phase: 'ready',
            timer: 3,
            playerSelection: null,
            opponentSelection: null,
            roundWinner: null,
            playerWins: 0,
            opponentWins: 0,
            history: []
        });
        setPhase('double-battle');
        runDoubleBattleRound(1);
    };

    // 복식승부 라운드 진행
    const runDoubleBattleRound = async (round: number) => {
        // 1. Ready (설명)
        setDoubleBattleState(prev => ({ ...prev, round, phase: 'ready', timer: 3, playerSelection: null, opponentSelection: null, roundWinner: null }));
        await new Promise(r => setTimeout(r, 1500));

        // 2. Choice (3초 타이머)
        setDoubleBattleState(prev => ({ ...prev, phase: 'choice', timer: 3 }));

        // 타이머 시작 (setInterval 대신 간단히 재귀 호출이나 useEffect 사용 가능하지만 여기선 루프 내에서 처리 힘들 수 있음)
        // useEffect에서 deck-reveal 처럼 timer 줄이는 로직을 추가하거나, 여기서 비동기 루프로 처리
        // 간단히 비동기로 처리
        for (let i = 3; i > 0; i--) {
            setDoubleBattleState(prev => ({ ...prev, timer: i }));
            await new Promise(r => setTimeout(r, 1000));
        }

        // 시간 종료 후 자동 선택 (만약 선택 안했으면 랜덤)
        handleDoubleBattleTimeout();
    };

    const handleDoubleBattleSelection = (card: Card) => {
        if (doubleBattleState.phase !== 'choice') return;
        setDoubleBattleState(prev => ({ ...prev, playerSelection: card }));
    };

    const handleDoubleBattleTimeout = async () => {
        // use current state via functional update or ref logic needed? 
        // In this loop-based approach, React state update is async. Typically handled via useEffect logic.
        // For simplicity, we'll shift the timer logic to useEffect triggered by phase='double-battle' & subphase='choice'.
    };

    // useEffect for Double Battle Timer
    useEffect(() => {
        if (phase === 'double-battle' && doubleBattleState.phase === 'choice') {
            if (doubleBattleState.timer > 0) {
                const timerId = setTimeout(() => {
                    setDoubleBattleState(prev => ({ ...prev, timer: prev.timer - 1 }));
                }, 1000);
                return () => clearTimeout(timerId);
            } else {
                // Time's up! Resolve round
                resolveDoubleBattleRound();
            }
        }
    }, [phase, doubleBattleState.phase, doubleBattleState.timer]);

    const resolveDoubleBattleRound = async () => {
        const state = doubleBattleState; // Note: closure might have stale state if used inside timeout
        // But here we are called by useEffect when timer hits 0. We need access to LATEST selection.
        // Effect dependency ensures we have it? No, standard closure trap.
        // Better to use a ref or functional update inside setDoubleBattleState BUT applying logic is complex.

        // Let's rely on setDoubleBattleState callback to get latest data and trigger next step physically.
        setDoubleBattleState(prev => {
            // AI Selection Logic (Always picks random or based on difficulty)
            // Current Round Index: (round-1)*2 and (round-1)*2+1
            const baseIdx = (prev.round - 1) * 2;
            const aiCard1 = opponentDeck[baseIdx];
            const aiCard2 = opponentDeck[baseIdx + 1];

            // Simple AI: Random pick
            const aiSelection = Math.random() > 0.5 ? aiCard1 : aiCard2;

            // Player Selection (Random if null)
            let playerSel = prev.playerSelection;
            const myCard1 = playerDeck[baseIdx];
            const myCard2 = playerDeck[baseIdx + 1];
            if (!playerSel) {
                playerSel = Math.random() > 0.5 ? myCard1 : myCard2;
            }

            // Determine Winner
            const { determineRoundWinner } = require('@/lib/pvp-battle-system'); // Lazy import helper
            const winner = determineRoundWinner(playerSel, aiSelection);

            // Update State for Clash Phase
            return {
                ...prev,
                playerSelection: playerSel,
                opponentSelection: aiSelection,
                roundWinner: winner,
                phase: 'clash',
                playerWins: prev.playerWins + (winner === 'player' ? 1 : 0),
                opponentWins: prev.opponentWins + (winner === 'opponent' ? 1 : 0),
            };
        });

        // 애니메이션 효과 후 다음 라운드 or 종료
        await new Promise(r => setTimeout(r, 3000)); // Clash view duration

        setDoubleBattleState(prev => {
            if (prev.round >= 3) {
                // End Battle
                finishDoubleBattle(prev);
                return prev;
            }
            // Next Round
            return {
                ...prev,
                round: prev.round + 1,
                phase: 'ready',
                timer: 3,
                playerSelection: null,
                opponentSelection: null,
                roundWinner: null
            };
        });

        // If not ended, loop continues via useEffect (phase becomes 'ready' -> wait -> 'choice')
        // We need a way to transition ready->choice automatically.
        // Add another effect or logic.
    };

    // Auto transition Ready -> Choice
    useEffect(() => {
        if (phase === 'double-battle' && doubleBattleState.phase === 'ready') {
            const timer = setTimeout(() => {
                setDoubleBattleState(prev => ({ ...prev, phase: 'choice' }));
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [phase, doubleBattleState.phase, doubleBattleState.round]);

    const finishDoubleBattle = (finalState: any) => {
        // Construct BattleResult
        let finalWinner: 'player' | 'opponent' = 'opponent';
        if (finalState.playerWins > finalState.opponentWins) finalWinner = 'player';
        else if (finalState.opponentWins > finalState.playerWins) finalWinner = 'opponent';

        // 3승 전승 보너스
        const perfectBonus = finalState.playerWins === 3 ? 100 : 0;

        const result: BattleResult = {
            winner: finalWinner,
            rounds: [], // TODO: Fill with history if needed
            playerWins: finalState.playerWins,
            opponentWins: finalState.opponentWins,
            rewards: {
                coins: (finalWinner === 'player' ? PVP_REWARDS.double.coins : 0) + perfectBonus,
                experience: finalWinner === 'player' ? PVP_REWARDS.double.exp : 10,
                ratingChange: finalWinner === 'player' ? PVP_REWARDS.double.rating : -10
            }
        };

        if (perfectBonus > 0) {
            showAlert({ title: '퍼펙트 승리!', message: '3라운드 전승으로 100 코인 보너스를 획득했습니다!', type: 'success' });
        }

        applyBattleResult(result, playerDeck, opponentDeck, false, false, false);
        setBattleResult(result);
        setPhase('result');
    };

    // 전투 애니메이션
    const runBattleAnimation = async (result: BattleResult) => {
        for (let i = 0; i < result.rounds.length; i++) {
            setCurrentRound(i);

            // 1. 대기 (뒷면)
            setAnimationPhase('ready');
            setAnimating(true);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 2. 충돌 (뒷면끼리 2번 부딪힘)
            setAnimationPhase('clash');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. 공개 (카드 뒤집힘 + 결과)
            setAnimationPhase('reveal');
            await new Promise(resolve => setTimeout(resolve, 4000));

            setAnimationPhase('idle');
            setAnimating(false);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 전투 종료 - 결과 화면으로
        await applyBattleResult(result, playerDeck, opponentDeck, false, false, false);

        // [NEW] Track Mission Event
        if (result.winner === 'player') {
            trackMissionEvent('battle-win', 1);
        }

        setPhase('result');
    };

    // 다시 하기
    const handlePlayAgain = () => {
        setPhase('stats');
        setPlayerDeck([]);
        setOpponentDeck([]);
        setCardOrder([0, 1, 2, 3, 4]);
        setBattleResult(null);
        setCurrentRound(0);
        // Refresh cards
        gameStorage.getCards().then(cards => setInventory(cards));
    };

    // [Safety] 프로필 로딩 중일 때 표시할 상태
    if (userLoading || !profile) {
        return (
            <CyberPageLayout title="PVP 아레나" englishTitle="PVP ARENA" color="red">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-red-500 orbitron animate-pulse">SYNCHRONIZING PROFILE...</p>
                </div>
            </CyberPageLayout>
        );
    }

    const nickname = profile.nickname || '지휘관';

    // [NEW] 중복 닉네임 정리 가드
    if ((profile as any).needsNicknameChange) {
        return (
            <CyberPageLayout title="닉네임 변경 필요" englishTitle="RENAME REQUIRED" color="yellow">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
                        <Swords className="text-yellow-500 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-4 orbitron">COMMANDER NAME CONFLICT</h2>
                    <p className="text-white/60 mb-8 max-w-md">
                        현재 사용 중인 닉네임({(profile as any).oldNickname})이 다른 지휘관과 중복되어 임시 닉네임으로 변경되었습니다.<br />
                        아레나 참가를 위해 새로운 고유 닉네임을 설정해주세요.
                    </p>
                    <button
                        onClick={() => router.push('/settings')}
                        className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all"
                    >
                        닉네임 재설정하러 가기
                    </button>
                </div>
            </CyberPageLayout>
        );
    }

    return (
        <CyberPageLayout
            title="PVP 아레나"
            englishTitle="PVP ARENA"
            description="실시간 플레이어 대전 - 최강자를 가리자!"
            color="red"
        >
            <div className="max-w-7xl mx-auto">
                {/* Season Banner */}


                <AnimatePresence mode="wait">
                    {/* 1단계: 성적 확인 */}
                    {phase === 'stats' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* 전적 표시 */}
                            <div className="grid grid-cols-5 gap-4 mb-8">
                                <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award className="text-amber-400" size={20} />
                                        <h3 className="text-sm text-white/60">레이팅</h3>
                                    </div>
                                    <p className="text-3xl font-black text-amber-400">{stats.rating || 1000}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Trophy className="text-green-400" size={20} />
                                        <h3 className="text-sm text-white/60">승리</h3>
                                    </div>
                                    <p className="text-3xl font-black text-green-400">{stats.wins}</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <XCircle className="text-red-400" size={20} />
                                        <h3 className="text-sm text-white/60">패배</h3>
                                    </div>
                                    <p className="text-3xl font-black text-red-400">{stats.losses}</p>
                                </div>
                                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="text-cyan-400" size={20} />
                                        <h3 className="text-sm text-white/60">승률</h3>
                                    </div>
                                    <p className="text-3xl font-black text-cyan-400">{stats.winRate}%</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Swords className="text-purple-400" size={20} />
                                        <h3 className="text-sm text-white/60">총 전투</h3>
                                    </div>
                                    <p className="text-3xl font-black text-purple-400">{stats.totalBattles}</p>
                                </div>
                            </div>

                            {/* Season Banner (moved here) */}
                            <div className="mb-8 text-center bg-gradient-to-r from-red-900/40 via-black to-red-900/40 border-y border-red-500/30 py-4">
                                <h2 className="text-2xl font-black text-red-500 tracking-widest orbitron mb-1">WAR OF THE BEGINNING</h2>
                                <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                                    <span className="font-bold text-white">Season 1</span>
                                    <span>|</span>
                                    <span>2026. 1. 1 ~ 2026. 1. 31</span>
                                </div>
                            </div>

                            {/* 참가 조건 */}
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                                <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2 whitespace-nowrap">
                                    <Award size={20} />
                                    참가 조건
                                </h3>
                                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className={cn(
                                            state.level >= PVP_REQUIREMENTS.minLevel ? 'text-green-400' : 'text-red-400'
                                        )} size={16} />
                                        <span className="text-white/80">레벨 {PVP_REQUIREMENTS.minLevel} 이상</span>
                                    </div>
                                    <div className="w-px h-3 bg-white/20 hidden md:block" />
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className={cn(
                                            coins >= PVP_REQUIREMENTS.entryFeeCoins ? 'text-green-400' : 'text-red-400'
                                        )} size={16} />
                                        <span className="text-white/80">참가비 {PVP_REQUIREMENTS.entryFeeCoins} 코인</span>
                                    </div>
                                    <div className="w-px h-3 bg-white/20 hidden md:block" />
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className={cn(
                                            inventory.length >= 5 ? 'text-green-400' : 'text-red-400'
                                        )} size={16} />
                                        <span className="text-white/80">등급별 카드 보유 (5장+)</span>
                                    </div>
                                </div>
                            </div>

                            {/* 전투 모드 선택 */}
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Target className="text-red-400" size={24} />
                                전투 모드 선택
                            </h2>
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                {modes.map((mode) => {
                                    const Icon = mode.icon;
                                    const isSelected = selectedMode === mode.id;

                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => handleModeSelect(mode.id)}
                                            className={cn(
                                                "relative p-6 rounded-2xl border-2 transition-all text-left overflow-hidden group",
                                                isSelected
                                                    ? "border-cyan-500 bg-cyan-500/10 scale-105 shadow-lg shadow-cyan-500/20"
                                                    : "border-white/10 hover:border-white/30 bg-black/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity",
                                                mode.color
                                            )} />

                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between mb-4">
                                                    <Icon className={cn(
                                                        "w-10 h-10",
                                                        isSelected ? "text-cyan-400" : "text-white/60"
                                                    )} />
                                                    {isSelected && (
                                                        <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center animate-pulse">
                                                            <div className="w-2 h-2 rounded-full bg-white" />
                                                        </div>
                                                    )}
                                                </div>

                                                <h3 className="text-xl font-bold text-white mb-1">{mode.name}</h3>
                                                <p className="text-sm text-white/40 mb-4">{mode.nameEn}</p>
                                                <p className="text-sm text-white/60 mb-4">{mode.description}</p>

                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-white/40">{mode.rounds}</span>
                                                    <span className="text-yellow-400 font-bold">{mode.reward}</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 시작 버튼 */}
                            <div className="text-center">
                                <button
                                    onClick={() => handleStartPVP(selectedMode)}
                                    className="px-12 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-red-500/50 hover:shadow-red-500/70 hover:scale-105 flex items-center gap-2 mx-auto"
                                >
                                    <Swords size={24} />
                                    전투 시작
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* 2단계: 덱 선택 */}
                    {phase === 'deck-select' && (
                        <motion.div
                            key="deck-select"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="pb-32"
                        >
                            {/* 주력 카드 섹션 (등급별 최고 카드) */}
                            {inventory.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                                        <span>⭐</span>
                                        주력 카드 (전투 투입 권장)
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                                        {getMainCards(inventory).map(card => (
                                            <motion.div
                                                key={`main-${card.id}`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="cursor-pointer relative"
                                                onClick={() => {
                                                    let targetSize = 5;
                                                    if (selectedMode === 'ambush' || selectedMode === 'double') targetSize = 6;

                                                    const isSelected = selectedCards.find(c => c.id === card.id);
                                                    if (isSelected) {
                                                        setSelectedCards(prev => prev.filter(c => c.id !== card.id));
                                                    } else if (selectedCards.length < targetSize) {
                                                        setSelectedCards(prev => [...prev, card as Card]);
                                                    }
                                                }}
                                            >
                                                <GameCard
                                                    card={card as Card}
                                                    isSelected={selectedCards.some(c => c.id === card.id)}
                                                />
                                                <div className="absolute top-1 right-1 bg-amber-500 text-black text-[9px] font-black px-1 rounded shadow-lg z-20">MAIN</div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-white/60">전체 카드 목록</h4>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {inventory
                                    .sort((a, b) => b.stats.totalPower - a.stats.totalPower)
                                    .map(card => (
                                        <motion.div
                                            key={card.id}
                                            whileTap={{ scale: 0.95 }}
                                            className="cursor-pointer"
                                            onClick={() => {
                                                let targetSize = 5;
                                                if (selectedMode === 'ambush' || selectedMode === 'double') targetSize = 6;

                                                const isSelected = selectedCards.find(c => c.id === card.id);
                                                if (isSelected) {
                                                    setSelectedCards(prev => prev.filter(c => c.id !== card.id));
                                                } else if (selectedCards.length < targetSize) {
                                                    setSelectedCards(prev => [...prev, card]);
                                                }
                                            }}
                                        >
                                            <GameCard
                                                card={card}
                                                isSelected={selectedCards.some(c => c.id === card.id)}
                                            />
                                        </motion.div>
                                    ))}
                            </div>

                            {/* 버튼 영역 - 하단 고정 (덱 슬롯 포함) */}
                            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-4 z-50">
                                <div className="max-w-5xl mx-auto px-4">
                                    {/* 덱 슬롯 (모드에 따라 5 or 6개) */}
                                    <div className="flex justify-center gap-4 mb-4 overflow-x-auto pb-2">
                                        {Array.from({ length: (selectedMode === 'ambush' || selectedMode === 'double') ? 6 : 5 }).map((_, i) => {
                                            const card = selectedCards[i];
                                            // 가위바위보 타입 결정
                                            const getTypeInfo = (c: Card) => {
                                                const type = c.type || 'EFFICIENCY';
                                                if (type === 'EFFICIENCY') return {
                                                    emoji: '✊',
                                                    name: '바위',
                                                    color: 'text-amber-400',
                                                    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
                                                    border: 'border-2 border-amber-300/50'
                                                };
                                                if (type === 'CREATIVITY') return {
                                                    emoji: '✌️',
                                                    name: '가위',
                                                    color: 'text-red-400',
                                                    bg: 'bg-gradient-to-br from-red-500 to-pink-600',
                                                    border: 'border-2 border-red-300/50'
                                                };
                                                return {
                                                    emoji: '🖐️',
                                                    name: '보',
                                                    color: 'text-blue-400',
                                                    bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
                                                    border: 'border-2 border-blue-300/50'
                                                };
                                            };
                                            const typeInfo = card ? getTypeInfo(card) : null;

                                            return (
                                                <motion.div
                                                    key={i}
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className={cn(
                                                        "relative w-28 h-40 rounded-xl border-2 transition-all overflow-hidden cursor-pointer",
                                                        card
                                                            ? "border-cyan-500 bg-cyan-500/10 shadow-xl shadow-cyan-500/30"
                                                            : "border-white/20 bg-white/5 border-dashed"
                                                    )}
                                                    onClick={() => {
                                                        if (card) {
                                                            setSelectedCards(prev => prev.filter(c => c.id !== card.id));
                                                        }
                                                    }}
                                                >
                                                    {card ? (
                                                        <>
                                                            {/* 카드 이미지 */}
                                                            {(() => {
                                                                const { getCardCharacterImage } = require('@/lib/card-images');
                                                                const cardImage = getCardCharacterImage(card.templateId, card.name, card.rarity);
                                                                return (
                                                                    <div
                                                                        className="absolute inset-0 bg-cover bg-center"
                                                                        style={{
                                                                            backgroundImage: `url(${cardImage || card.imageUrl || '/assets/cards/default-card.png'})`,
                                                                            backgroundSize: 'cover',
                                                                            backgroundPosition: 'center'
                                                                        }}
                                                                    />
                                                                );
                                                            })()}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                                            {/* 등급 표시 (한글) */}
                                                            {(() => {
                                                                const rarityInfo: Record<string, { text: string; bg: string; border: string }> = {
                                                                    legendary: { text: '전설', bg: 'bg-gradient-to-r from-yellow-500 to-orange-500', border: 'border-yellow-300/50' },
                                                                    commander: { text: '군단장', bg: 'bg-gradient-to-r from-purple-600 to-pink-600', border: 'border-purple-300/50' },
                                                                    epic: { text: '영웅', bg: 'bg-gradient-to-r from-purple-500 to-indigo-500', border: 'border-purple-300/50' },
                                                                    rare: { text: '희귀', bg: 'bg-gradient-to-r from-blue-500 to-cyan-500', border: 'border-blue-300/50' },
                                                                    unique: { text: '유니크', bg: 'bg-gradient-to-r from-green-500 to-emerald-500', border: 'border-green-300/50' },
                                                                    common: { text: '일반', bg: 'bg-gradient-to-r from-gray-500 to-slate-500', border: 'border-gray-300/50' }
                                                                };
                                                                const info = rarityInfo[card.rarity || 'common'] || rarityInfo.common;
                                                                return (
                                                                    <div className={cn(
                                                                        "absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-lg z-10 border",
                                                                        info.bg,
                                                                        info.border
                                                                    )}>
                                                                        {info.text}
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* 가위바위보 타입 아이콘 */}
                                                            {typeInfo && (
                                                                <div className={cn(
                                                                    "absolute top-1.5 right-1.5 px-2 py-1 rounded-full text-lg shadow-lg z-10",
                                                                    typeInfo.bg,
                                                                    typeInfo.border
                                                                )}>
                                                                    {typeInfo.emoji}
                                                                </div>
                                                            )}

                                                            {/* 레벨 표시 (하단 오른쪽) */}
                                                            <div className="absolute bottom-10 right-1.5 z-10">
                                                                <div className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-[10px] font-black text-white shadow-lg border border-yellow-300/50">
                                                                    LV.{card.level || 1}
                                                                </div>
                                                            </div>

                                                            {/* 하단 전투력 표시 */}
                                                            <div className="absolute bottom-0 left-0 right-0 p-2 text-center bg-black/70 z-10">
                                                                <div className="text-sm font-bold text-white">
                                                                    ⚡{Math.floor(card.stats.totalPower)}
                                                                </div>
                                                            </div>

                                                            {/* 제거 버튼 (호버 시) */}
                                                            <div className="absolute inset-0 bg-red-500/0 hover:bg-red-500/60 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 z-20">
                                                                <span className="text-white font-bold text-2xl drop-shadow-lg">✕</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-white/30">
                                                            <span className="text-2xl font-bold mb-1">{i + 1}</span>
                                                            <span className="text-[10px]">빈 슬롯</span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* 액션 버튼 */}
                                    <div className="flex items-center justify-between gap-4">
                                        <button
                                            onClick={() => {
                                                setPhase('stats');
                                                setSelectedCards([]);
                                            }}
                                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                                        >
                                            <ArrowRight className="rotate-180" size={20} />
                                            뒤로 가기
                                        </button>

                                        <button
                                            onClick={() => {
                                                // 자동 선택 - 등급별로 균형 잡힌 덱 구성 (주력카드 우선)
                                                let targetSize = 5;
                                                if (selectedMode === 'ambush' || selectedMode === 'double') targetSize = 6;

                                                const balancedDeck = selectBalancedDeck(inventory, targetSize);
                                                setSelectedCards(balancedDeck as Card[]);
                                            }}
                                            className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-bold rounded-xl transition-all flex items-center gap-2"
                                        >
                                            <Shuffle size={20} />
                                            자동 선택
                                        </button>

                                        <div className="flex-1 text-center">
                                            <span className="text-2xl font-black orbitron">
                                                <span className={cn(
                                                    selectedCards.length === ((selectedMode === 'ambush' || selectedMode === 'double') ? 6 : 5) ? "text-green-400" : "text-white/60"
                                                )}>{selectedCards.length}</span>
                                                <span className="text-white/40">/{(selectedMode === 'ambush' || selectedMode === 'double') ? 6 : 5}</span>
                                            </span>
                                            <span className="text-white/40 ml-2">선택됨</span>
                                        </div>

                                        <button
                                            onClick={handleDeckConfirm}
                                            disabled={selectedCards.length !== ((selectedMode === 'ambush' || selectedMode === 'double') ? 6 : 5)}
                                            className={cn(
                                                "px-10 py-3 rounded-xl font-bold flex items-center gap-2 transition-all",
                                                selectedCards.length === ((selectedMode === 'ambush' || selectedMode === 'double') ? 6 : 5)
                                                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/50"
                                                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                            )}
                                        >
                                            <Swords size={20} />
                                            {selectedCards.length === ((selectedMode === 'ambush' || selectedMode === 'double') ? 6 : 5)
                                                ? "덱 확정 및 전투 참가"
                                                : `${selectedCards.length}/${(selectedMode === 'ambush' || selectedMode === 'double') ? 6 : 5}장 선택`
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 3단계: 대전 방식 선택 */}
                    {phase === 'match-type' && (
                        <motion.div
                            key="match-type"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-black text-white mb-2">대전 방식 선택</h2>
                                <p className="text-white/60">실시간 대전 또는 AI 훈련을 선택하세요</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <button
                                    onClick={() => handleMatchTypeSelect('realtime')}
                                    className="relative p-8 rounded-2xl border-2 border-white/10 hover:border-red-500/50 bg-black/40 hover:bg-red-500/10 transition-all group"
                                >
                                    <div className="text-center">
                                        <Users className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold text-white mb-2">실시간 대전</h3>
                                        <p className="text-sm text-white/60 mb-4">실제 플레이어와 매칭</p>
                                        <div className="text-xs text-yellow-400">정식 보상 지급</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleMatchTypeSelect('ai-training')}
                                    className="relative p-8 rounded-2xl border-2 border-white/10 hover:border-cyan-500/50 bg-black/40 hover:bg-cyan-500/10 transition-all group"
                                >
                                    <div className="text-center">
                                        <Target className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold text-white mb-2">AI 훈련</h3>
                                        <p className="text-sm text-white/60 mb-4">AI 상대와 연습</p>
                                        <div className="text-xs text-cyan-400">테스트용 - 정식 보상</div>
                                    </div>
                                </button>
                            </div>

                            <div className="text-center mt-8">
                                <button
                                    onClick={() => {
                                        setPhase('deck-select');
                                        setSelectedMatchType('ai-training');
                                    }}
                                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center gap-2 mx-auto"
                                >
                                    <ArrowRight className="rotate-180" size={20} />
                                    뒤로 가기
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* 4단계: 덱 공개 */}
                    {phase === 'deck-reveal' && (
                        <motion.div
                            key="deck-reveal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-4"
                        >
                            {/* 상대 덱 (위) */}
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-4"
                            >
                                <h3 className="text-lg font-bold text-red-400 mb-4 text-center">👹 상대 덱</h3>
                                <div className="flex justify-center gap-6">
                                    {opponentDeck.map((card, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ rotateY: 180, opacity: 0 }}
                                            animate={{ rotateY: 0, opacity: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="w-36 flex-shrink-0"
                                        >
                                            <GameCard card={card} />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            <div className="flex flex-col items-center justify-center gap-4 my-4 py-4 bg-gradient-to-r from-transparent via-white/5 to-transparent">
                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-6">
                                        <span className="text-2xl font-bold text-white/60">전투준비</span>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="text-5xl font-black text-yellow-400 orbitron"
                                        >
                                            VS
                                        </motion.div>
                                        <div className="flex items-center gap-2">
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 0.5, repeat: Infinity }}
                                                className="text-4xl font-black text-cyan-400 orbitron"
                                            >
                                                {revealTimer}
                                            </motion.div>
                                            <span className="text-lg text-white/40">초</span>
                                        </div>
                                    </div>

                                    {/* Ready/Skip Button - Moved Here */}
                                    <button
                                        onClick={() => {
                                            setRevealTimer(1);
                                        }}
                                        className="px-8 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black italic rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 group text-sm"
                                    >
                                        <Zap className="w-4 h-4 group-hover:text-yellow-300 transition-colors" />
                                        BATTLE START!
                                    </button>

                                    <button
                                        onClick={() => {
                                            setPhase('match-type');
                                            setOpponentDeck([]);
                                            setRevealTimer(20);
                                        }}
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-all flex items-center gap-2 text-sm"
                                    >
                                        <ArrowRight className="rotate-180" size={16} />
                                        취소
                                    </button>
                                </div>
                            </div>

                            {/* 내 덱 (아래) */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6"
                            >
                                <h3 className="text-lg font-bold text-cyan-400 mb-4 text-center">🤖 내 덱</h3>
                                <div className="flex justify-center gap-6">
                                    {playerDeck.map((card, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ rotateY: 180, opacity: 0 }}
                                            animate={{ rotateY: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 + i * 0.1 }}
                                            className="w-36 flex-shrink-0"
                                        >
                                            <GameCard card={card} />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* 5단계: 카드 순서 배치 */}
                    {phase === 'card-placement' && (
                        <motion.div
                            key="card-placement"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <CardPlacementBoard
                                selectedCards={playerDeck}
                                battleMode={selectedMode}
                                opponentDeck={opponentDeck}
                                onCancel={() => {
                                    setPhase('deck-reveal');
                                    setRevealTimer(20);
                                }}
                                onPlacementComplete={(placement: RoundPlacement) => {
                                    let orderedDeck: Card[] = [];

                                    if (selectedMode === 'double') {
                                        orderedDeck = [
                                            placement.round1.main, placement.round1.hidden,
                                            placement.round2.main, placement.round2.hidden,
                                            placement.round3.main, placement.round3.hidden
                                        ].filter(Boolean);
                                    } else if (selectedMode === 'ambush') {
                                        // Ambush: 5 Main + 1 Hidden (at R3)
                                        // Order for simulation: [R1, R2, R3, R4, R5, Hidden]
                                        orderedDeck = [
                                            placement.round1.main,
                                            placement.round2.main,
                                            placement.round3.main,
                                            placement.round4.main,
                                            placement.round5.main,
                                            placement.round3.hidden
                                        ].filter(Boolean);
                                    } else {
                                        // Tactics / Sudden Death
                                        orderedDeck = [
                                            placement.round1.main,
                                            placement.round2.main,
                                            placement.round3.main,
                                            placement.round4.main,
                                            placement.round5.main
                                        ].filter(Boolean);
                                    }

                                    const order = orderedDeck.map((_, i) => i);
                                    setPlayerDeck(orderedDeck);
                                    setCardOrder(order);
                                    // Pass ordered deck directly to battle handler via state update, 
                                    // but state update is async.
                                    // Only Double Battle logic uses state.playerDeck directly.
                                    // Simulate logic uses arguments.
                                    // For Double Battle, we must wait for state? 
                                    // Actually handleStartBattle uses current 'playerDeck' state variable.
                                    // Since setPlayerDeck is async, we should pass the new deck to handleStartBattle.
                                    handleStartBattle(order, orderedDeck);
                                }}
                            />
                        </motion.div>
                    )}

                    {/* 6단계: 전투 */}
                    {phase === 'battle' && battleResult && battleResult.rounds.length > 0 && (() => {
                        // 안전한 라운드 인덱스
                        const roundIndex = Math.min(currentRound, battleResult.rounds.length - 1);
                        const round = battleResult.rounds[roundIndex];

                        return (
                            <motion.div
                                key="battle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-8"
                            >
                                {/* 라운드 정보 */}
                                <div className="text-center mb-8">
                                    <h2 className="text-4xl font-black text-white mb-2 orbitron">
                                        ROUND {round.round}
                                    </h2>
                                    <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                                        <span className="text-cyan-400">
                                            {battleResult.rounds.slice(0, currentRound + (animationPhase === 'reveal' ? 1 : 0)).filter(r => r.winner === 'player').length}
                                        </span>
                                        <span className="text-white/40">vs</span>
                                        <span className="text-red-400">
                                            {battleResult.rounds.slice(0, currentRound + (animationPhase === 'reveal' ? 1 : 0)).filter(r => r.winner === 'opponent').length}
                                        </span>
                                    </div>
                                </div>

                                {/* 카드 대결 영역 */}
                                <div className="flex items-center justify-center gap-8 mb-8">
                                    {/* 내 카드 */}
                                    <motion.div
                                        initial={{ x: -100, opacity: 0 }}
                                        animate={{
                                            x: animationPhase === 'clash' ? [0, 50, 0, 50, 0] : 0, // 2번 충돌
                                            scale: animationPhase === 'reveal' && round.winner === 'player' ? 1.1 :
                                                animationPhase === 'reveal' && round.winner === 'opponent' ? 0.9 : 1,
                                            opacity: 1
                                        }}
                                        transition={{
                                            x: { duration: 1, times: [0, 0.2, 0.5, 0.7, 1] }, // 충돌 타이밍
                                            duration: 0.3
                                        }}
                                        className="text-center relative"
                                    >
                                        {/* 카드 뒷면 (ready, clash 단계) or 앞면 (reveal 단계) */}
                                        {animationPhase !== 'reveal' ? (
                                            <div className="w-[180px] h-[270px] relative rounded-xl overflow-hidden border-4 border-cyan-500/50 shadow-2xl">
                                                <div className="absolute inset-0">
                                                    <Image
                                                        src="/assets/cards/card-back-sci-fi.png"
                                                        alt="Card Back"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                                                    <div className="text-cyan-400 font-bold bg-black/60 mx-auto inline-block px-3 py-1 rounded-full text-sm backdrop-blur-sm">내 카드</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "transition-all duration-500",
                                                round.winner === 'opponent' && "grayscale opacity-60"
                                            )}>
                                                <GameCard card={round.playerCard} />
                                            </div>
                                        )}

                                        {/* 타입 표시 - 카드 뒷면 중앙 오버레이 (Ready/Clash 단계) */}
                                        {/* 타입 표시 - 카드 뒷면 중앙 오버레이 제거됨 */}


                                        {/* 승리 표시 - 위치 변경 (Top Center) */}
                                        {animationPhase === 'reveal' && round.winner === 'player' && (
                                            <motion.div
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                className="absolute -left-48 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
                                            >
                                                <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/40 via-yellow-900/40 to-transparent border-l-4 border-yellow-400 pl-6 pr-12 py-4 shadow-[0_0_20px_rgba(234,179,8,0.3)] backdrop-blur-sm transform -skew-x-12">
                                                    <div className="transform skew-x-12 flex items-center gap-3">
                                                        <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-md" />
                                                        <div className="flex flex-col">
                                                            <span className="text-yellow-400 font-black text-3xl leading-none italic tracking-wider">VICTORY</span>
                                                            <span className="text-yellow-200/60 text-xs font-bold tracking-[0.2em]">ROUND WINNER</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        {animationPhase === 'reveal' && round.winner === 'opponent' && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                                                <span className="text-9xl text-red-600/80 font-black drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] animate-pulse">✕</span>
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* VS */}
                                    <div className="text-center w-24">
                                        <motion.div
                                            animate={animationPhase === 'clash' ? { scale: [1, 2, 1], color: '#ff0000' } : {}}
                                            transition={{ duration: 0.4 }}
                                            className="text-6xl font-black text-white/30 orbitron"
                                        >
                                            VS
                                        </motion.div>

                                        {/* 승패 결과 */}
                                        {animationPhase === 'reveal' && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="mt-6"
                                            >
                                                {round.winner === 'player' && (
                                                    <div className="text-3xl text-green-400 font-bold drop-shadow-lg">WIN!</div>
                                                )}
                                                {round.winner === 'opponent' && (
                                                    <div className="text-3xl text-red-500 font-bold drop-shadow-lg">LOSE</div>
                                                )}
                                                {round.winner === 'draw' && (
                                                    <div className="text-3xl text-yellow-400 font-bold drop-shadow-lg">DRAW</div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* 상대 카드 */}
                                    <motion.div
                                        initial={{ x: 100, opacity: 0 }}
                                        animate={{
                                            x: animationPhase === 'clash' ? [0, -20, 0] : 0,
                                            scale: animationPhase === 'reveal' && round.winner === 'opponent' ? 1.1 :
                                                animationPhase === 'reveal' && round.winner === 'player' ? 0.9 : 1,
                                            opacity: 1
                                        }}
                                        transition={{
                                            x: { duration: 0.4, times: [0, 0.5, 1] },
                                            duration: 0.5
                                        }}
                                        className="text-center relative"
                                    >
                                        {/* 카드 뒷면 or 앞면 */}
                                        {animationPhase !== 'reveal' ? (
                                            <div className="w-[180px] h-[270px] relative rounded-xl overflow-hidden border-4 border-red-500/50 shadow-2xl">
                                                <div className="absolute inset-0">
                                                    <Image
                                                        src="/assets/cards/card-back-sci-fi.png"
                                                        alt="Card Back"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                                                    <div className="text-red-400 font-bold bg-black/60 mx-auto inline-block px-3 py-1 rounded-full text-sm backdrop-blur-sm">상대 카드</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "transition-all duration-1000",
                                                round.winner === 'player' && "grayscale opacity-50 blur-[1px]"
                                            )}>
                                                <GameCard card={round.opponentCard} />
                                            </div>
                                        )}

                                        {/* 타입 표시 (애니메이션 중에만) */}
                                        {/* 타입 표시 - 항상 표시 (카드 뒷면 위에도) */}
                                        {/* 타입 표시 - 카드 뒷면 중앙 오버레이 (Ready/Clash 단계) */}
                                        {/* 타입 표시 - 카드 뒷면 중앙 오버레이 제거됨 */}


                                        {/* 승리 표시 */}
                                        {/* 승리 표시 */}
                                        {/* 승리 표시 - 오른쪽 사이드 (Opponent) */}
                                        {animationPhase === 'reveal' && round.winner === 'opponent' && (
                                            <motion.div
                                                initial={{ x: 20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                className="absolute -right-48 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
                                            >
                                                <div className="flex flex-row-reverse items-center gap-3 bg-gradient-to-l from-red-600/40 via-red-900/40 to-transparent border-r-4 border-red-500 pr-6 pl-12 py-4 shadow-[0_0_20px_rgba(220,38,38,0.3)] backdrop-blur-sm transform skew-x-12">
                                                    <div className="transform -skew-x-12 flex flex-row-reverse items-center gap-3">
                                                        <Trophy className="w-10 h-10 text-red-500 drop-shadow-md" />
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-red-500 font-black text-3xl leading-none italic tracking-wider">VICTORY</span>
                                                            <span className="text-red-300/60 text-xs font-bold tracking-[0.2em]">ENEMY WIN</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        {animationPhase === 'reveal' && round.winner === 'player' && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-8xl text-red-500 font-black drop-shadow-lg">✕</span>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>

                                {/* 대기 중 텍스트 */}
                                {!animating && (
                                    <div className="text-center text-white/50 animate-pulse">
                                        카드 공개 중...
                                    </div>
                                )}
                            </motion.div>
                        );
                    })()}

                    {/* 7단계: 결과 */}
                    {phase === 'result' && battleResult && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className={cn(
                                "text-center mb-8 p-12 rounded-2xl border-2",
                                battleResult.winner === 'player'
                                    ? "bg-green-500/10 border-green-500/50"
                                    : "bg-red-500/10 border-red-500/50"
                            )}>
                                <div className="text-8xl mb-4">
                                    {battleResult.winner === 'player' ? '🏆' : '😢'}
                                </div>
                                <h2 className={cn(
                                    "text-5xl font-black mb-4",
                                    battleResult.winner === 'player' ? "text-green-400" : "text-red-400"
                                )}>
                                    {battleResult.winner === 'player' ? '승리!' : '패배!'}
                                </h2>
                                <div className="text-2xl font-bold text-white/60 mb-8">
                                    {battleResult.playerWins} : {battleResult.opponentWins}
                                </div>

                                {/* 보상 */}
                                <div className="bg-black/40 rounded-xl p-6 mb-6">
                                    <h3 className="text-lg font-bold text-white mb-4">보상</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Coins className="text-yellow-400" size={24} />
                                            <span className={cn(
                                                "text-2xl font-bold",
                                                battleResult.rewards.coins > 0 ? "text-green-400" : "text-red-400"
                                            )}>
                                                {battleResult.rewards.coins > 0 ? '+' : ''}{battleResult.rewards.coins}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2">
                                            <TrendingUp className="text-cyan-400" size={24} />
                                            <span className="text-2xl font-bold text-cyan-400">
                                                +{battleResult.rewards.experience} EXP
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2">
                                            <Trophy className="text-purple-400" size={24} />
                                            <span className={cn(
                                                "text-2xl font-bold",
                                                battleResult.rewards.ratingChange > 0 ? "text-green-400" : "text-red-400"
                                            )}>
                                                {battleResult.rewards.ratingChange > 0 ? '+' : ''}{battleResult.rewards.ratingChange}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 카드 교환 */}
                                {battleResult.cardExchange && (battleResult.cardExchange.cardsGained.length > 0 || battleResult.cardExchange.cardsLost.length > 0) && (
                                    <div className="bg-black/40 rounded-xl p-6 mb-6">
                                        <h3 className="text-lg font-bold text-white mb-4">카드 교환</h3>
                                        {battleResult.cardExchange.cardsGained.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm text-green-400 mb-2">획득한 카드 ({battleResult.cardExchange.cardsGained.length}장)</p>
                                                <div className="flex gap-2 justify-center">
                                                    {battleResult.cardExchange.cardsGained.map((card, i) => (
                                                        <div key={i} className="w-20">
                                                            <GameCard card={card} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {battleResult.cardExchange.cardsLost.length > 0 && (
                                            <div>
                                                <p className="text-sm text-red-400 mb-2">잃은 카드 ({battleResult.cardExchange.cardsLost.length}장)</p>
                                                <div className="flex gap-2 justify-center">
                                                    {battleResult.cardExchange.cardsLost.map((card, i) => (
                                                        <div key={i} className="w-20 opacity-50">
                                                            <GameCard card={card} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 버튼 */}
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={handlePlayAgain}
                                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all"
                                    >
                                        다시 하기
                                    </button>
                                    <button
                                        onClick={() => router.push('/main')}
                                        className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                                    >
                                        메인으로
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {/* 복식 승부 인터랙티브 화면 */}
                    {phase === 'double-battle' && doubleBattleState && (
                        <motion.div
                            key="double-battle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
                        >
                            {/* Round Indicator */}
                            <div className="absolute top-8 text-4xl font-black text-white orbitron">
                                ROUND {doubleBattleState.round} / 3
                            </div>

                            {/* Score */}
                            <div className="absolute top-20 flex gap-12 text-2xl font-bold">
                                <div className="text-cyan-400">YOU: {doubleBattleState.playerWins}</div>
                                <div className="text-red-400">ENEMY: {doubleBattleState.opponentWins}</div>
                            </div>

                            {/* Opponent Cards (Top) - Hidden unless revealed */}
                            <div className="flex justify-center gap-8 mb-12">
                                {opponentDeck.slice((doubleBattleState.round - 1) * 2, (doubleBattleState.round - 1) * 2 + 2).map((card, i) => {
                                    const isRevealed = doubleBattleState.phase === 'clash';
                                    const isSelected = doubleBattleState.opponentSelection?.id === card.id;

                                    return (
                                        <motion.div
                                            key={`opp-${i}`}
                                            animate={{
                                                y: isSelected && isRevealed ? 50 : 0,
                                                scale: isSelected && isRevealed ? 1.2 : 1,
                                                opacity: isRevealed && !isSelected ? 0.3 : 1
                                            }}
                                            className="relative"
                                        >
                                            <div className={cn(
                                                "w-48 h-64 rounded-xl border-2 transition-all overflow-hidden",
                                                isRevealed && isSelected ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]" : "border-white/20"
                                            )}>
                                                {isRevealed && isSelected || doubleBattleState.phase === 'choice' ? (
                                                    <GameCard card={card} /> // Show card during choice or if selected & revealed
                                                ) : (
                                                    // Card Back
                                                    <div className="w-full h-full bg-slate-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#333_10px,#333_20px)] flex items-center justify-center">
                                                        <span className="text-4xl">👹</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Timer / VS Status */}
                            <div className="my-8 h-24 flex items-center justify-center">
                                {doubleBattleState.phase === 'ready' && (
                                    <div className="text-3xl text-white/50 animate-pulse">준비하세요...</div>
                                )}
                                {doubleBattleState.phase === 'choice' && (
                                    <div className="text-6xl font-black text-yellow-400 orbitron animate-ping">
                                        {doubleBattleState.timer}
                                    </div>
                                )}
                                {doubleBattleState.phase === 'clash' && (
                                    <div className="text-5xl font-black text-white orbitron">
                                        {doubleBattleState.roundWinner === 'player' ?
                                            <span className="text-cyan-400">WIN!</span> :
                                            doubleBattleState.roundWinner === 'opponent' ?
                                                <span className="text-red-400">LOSE!</span> :
                                                <span className="text-gray-400">DRAW</span>
                                        }
                                    </div>
                                )}
                            </div>

                            {/* Player Cards (Bottom) - Choice */}
                            <div className="flex justify-center gap-8 mt-4">
                                {playerDeck.slice((doubleBattleState.round - 1) * 2, (doubleBattleState.round - 1) * 2 + 2).map((card, i) => {
                                    const isSelected = doubleBattleState.playerSelection?.id === card.id;
                                    const isPhaseChoice = doubleBattleState.phase === 'choice';
                                    const isRevealed = doubleBattleState.phase === 'clash';

                                    return (
                                        <motion.div
                                            key={`player-${i}`}
                                            whileHover={isPhaseChoice ? { scale: 1.05, y: -20 } : {}}
                                            whileTap={isPhaseChoice ? { scale: 0.95 } : {}}
                                            animate={{
                                                y: isRevealed && isSelected ? -50 : 0,
                                                scale: isRevealed && isSelected ? 1.2 : 1,
                                                opacity: isRevealed && !isSelected ? 0.3 : 1,
                                                filter: isPhaseChoice && doubleBattleState.playerSelection && !isSelected ? 'grayscale(100%)' : 'none'
                                            }}
                                            className={cn(
                                                "cursor-pointer transition-all",
                                                isSelected ? "ring-4 ring-cyan-400 rounded-xl" : ""
                                            )}
                                            onClick={() => handleDoubleBattleSelection(card)}
                                        >
                                            <div className="w-48 h-64 pointer-events-none">
                                                <GameCard card={card} />
                                            </div>
                                            {isPhaseChoice && (
                                                <div className="mt-4 text-center">
                                                    <span className={cn(
                                                        "px-4 py-2 rounded-full font-bold",
                                                        isSelected ? "bg-cyan-500 text-white" : "bg-white/10 text-white/50"
                                                    )}>
                                                        {isSelected ? "선택됨" : "선택"}
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Instruction Text */}
                            {doubleBattleState.phase === 'choice' && (
                                <div className="absolute bottom-10 text-white/60 animate-bounce">
                                    카드를 선택하여 하나빼기 승부!
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 실시간 매칭 모달 */}
            <RealtimeMatchingModal
                isOpen={showMatchingModal}
                onClose={() => setShowMatchingModal(false)}
                onMatchFound={handleMatchFound}
                battleMode={selectedMode as 'sudden-death' | 'tactics' | 'ambush'}
                playerName={state.nickname || `Player_${state.level}`}
                playerLevel={state.level}
            />
        </CyberPageLayout>
    );
}
