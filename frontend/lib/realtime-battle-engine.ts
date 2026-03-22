// 실시간 PvP 전투 엔진

import { Card, AIType } from './types';
import {
    BattleRoom,
    PlayerState,
    RealtimeBattleMode,
    BattleResult
} from './realtime-pvp-types';
import {
    updateBattleRoom,
    updatePlayerState,
    getBattleRoom
} from './realtime-pvp-service';
import { getGameState, updateGameState } from './game-state';

/**
 * 라운드 실행 및 승자 판정
 */
export async function executeRound(
    room: BattleRoom,
    roundIndex: number
): Promise<{ winner: 'player1' | 'player2' | 'draw'; player1Card: Card; player2Card: Card }> {
    const { player1, player2, battleMode } = room;

    // 카드 가져오기
    const p1CardIndex = player1.cardOrder[roundIndex];
    const p2CardIndex = player2.cardOrder[roundIndex];

    let player1Card = player1.selectedCards[p1CardIndex];
    let player2Card = player2.selectedCards[p2CardIndex];

    // Ambush 모드: 2, 4 라운드는 히든카드 사용
    if (battleMode === 'strategy' && (roundIndex === 1 || roundIndex === 3)) {
        const hiddenIndex = roundIndex === 1 ? 0 : 1;
        if (player1.hiddenCards && player1.hiddenCards[hiddenIndex]) {
            player1Card = player1.hiddenCards[hiddenIndex];
        }
        if (player2.hiddenCards && player2.hiddenCards[hiddenIndex]) {
            player2Card = player2.hiddenCards[hiddenIndex];
        }
    }

    // 전투 판정
    const winner = resolveBattle(player1Card, player2Card);

    return { winner, player1Card, player2Card };
}

import { hasTypeAdvantage, resolveBattleResult } from './type-system';

/**
 * 전투 판정 (가위바위보 + 스탯)
 */
function resolveBattle(card1: Card, card2: Card): 'player1' | 'player2' | 'draw' {
    const res = resolveBattleResult(card1, card2);
    return res.winner;
}


/**
 * 최종 승리 조건 확인
 */
export function checkVictory(room: BattleRoom): string | null {
    if (room.player1.wins >= room.winsNeeded) {
        return room.player1.playerId;
    }
    if (room.player2.wins >= room.winsNeeded) {
        return room.player2.playerId;
    }
    return null;
}

/**
 * 타임아웃 처리
 */
export async function handleTimeout(
    roomId: string,
    playerId: string
): Promise<void> {
    const room = await getBattleRoom(roomId);
    if (!room) return;

    // 타임아웃된 플레이어는 자동 패배
    const isPlayer1 = room.player1.playerId === playerId;
    const winnerId = isPlayer1 ? room.player2.playerId : room.player1.playerId;

    await updateBattleRoom(roomId, {
        winner: winnerId,
        finished: true,
        phase: 'finished'
    });

    // 보상 처리
    await processBattleRewards(roomId, winnerId);
}

/**
 * 연결 끊김 처리
 */
export async function handleDisconnect(
    roomId: string,
    playerId: string
): Promise<void> {
    const room = await getBattleRoom(roomId);
    if (!room) return;

    // 연결 끊긴 플레이어 표시
    await updatePlayerState(roomId, playerId, {
        connected: false
    });

    // 10초 후에도 재연결 안되면 자동 패배
    setTimeout(async () => {
        const updatedRoom = await getBattleRoom(roomId);
        if (!updatedRoom) return;

        const isPlayer1 = updatedRoom.player1.playerId === playerId;
        const player = isPlayer1 ? updatedRoom.player1 : updatedRoom.player2;

        if (!player.connected) {
            await handleTimeout(roomId, playerId);
        }
    }, 10000);
}

/**
 * 보상 계산 및 지급
 */
export async function processBattleRewards(
    roomId: string,
    winnerId: string
): Promise<BattleResult | null> {
    const room = await getBattleRoom(roomId);
    if (!room) return null;

    const isPlayer1Winner = room.player1.playerId === winnerId;
    const winner = isPlayer1Winner ? room.player1 : room.player2;
    const loser = isPlayer1Winner ? room.player2 : room.player1;

    // 1. 카드 교환 (승자는 패자의 일반 카드 1장 획득)
    const { cardsGained, cardsLost } = await transferCards(
        roomId,
        winner.playerId,
        loser.playerId
    );

    // 2. 중앙 집중식 보상 시스템 적용 (pvp-battle-system’s applyBattleResult 호출)
    const state = getGameState();
    const isMeWinner = winnerId === state.userId;
    const isMeLoser = loser.playerId === state.userId;

    if (isMeWinner || isMeLoser) {
        const { applyBattleResult, PVP_REWARDS } = await import('./pvp-battle-system');

        // 보상 정보 구성
        const rewardKey = isMeWinner ? 'realtime-win' : 'realtime-loss';
        const rewards = PVP_REWARDS[rewardKey];

        const systemResult = {
            winner: isMeWinner ? 'player' as const : 'opponent' as const,
            rounds: [], // 상세 라운드 정보는 여기서는 생략 가능하나 필요시 채움
            playerWins: isMeWinner ? winner.wins : loser.wins,
            opponentWins: isMeWinner ? loser.wins : winner.wins,
            rewards: {
                coins: rewards.coins,
                experience: rewards.exp,
                ratingChange: rewards.rating,
                tokens: rewards.tokens || 0
            },
            cardExchange: {
                cardsLost: isMeLoser ? cardsLost : [],
                cardsGained: isMeWinner ? cardsGained : []
            }
        };

        // 중앙 시스템에 결과 적용 (여기서 코인, 토큰, 레이팅, 인벤토리 모두 업데이트됨)
        await applyBattleResult(
            systemResult,
            isMeWinner ? winner.selectedCards : loser.selectedCards,
            isMeWinner ? loser.selectedCards : winner.selectedCards,
            true, // isRanked
            false, // isGhost (실제 PVP)
            true // isRealtime
        );
    }

    // 결과 객체 반환 (UI 표시용)
    const { PVP_REWARDS } = await import('./pvp-battle-system');
    const winRewards = PVP_REWARDS['realtime-win'];
    const lossRewards = PVP_REWARDS['realtime-loss'];

    const result: BattleResult = {
        roomId,
        winnerId: winner.playerId,
        loserId: loser.playerId,
        battleMode: room.battleMode,
        rounds: room.currentRound,
        winnerScore: winner.wins,
        loserScore: loser.wins,
        rewards: {
            winner: {
                coins: winRewards.coins,
                tokens: winRewards.tokens || 0,
                experience: winRewards.exp,
                ratingChange: winRewards.rating,
                cardsGained
            },
            loser: {
                coins: lossRewards.coins,
                tokens: lossRewards.tokens || 0,
                experience: lossRewards.exp,
                ratingChange: lossRewards.rating,
                cardsLost
            }
        },
        timestamp: Date.now()
    };

    return result;
}


/**
 * 카드 교환 (승자 ← 패자)
 */
async function transferCards(
    roomId: string,
    winnerId: string,
    loserId: string
): Promise<{ cardsGained: Card[]; cardsLost: Card[] }> {
    const state = getGameState();
    const myInventory = state.inventory || [];
    const isMeWinner = winnerId === state.userId;
    const isMeLoser = loserId === state.userId;

    if (isMeLoser) {
        // [패자 로직] 카드 소모 및 Firebase에 기록
        const transferableCards = myInventory.filter(
            card => card.rarity === 'common' || card.rarity === 'rare'
        );

        if (transferableCards.length > 0) {
            const randomIndex = Math.floor(Math.random() * transferableCards.length);
            const lostCard = transferableCards[randomIndex];

            // 1. 내 인벤토리에서 제거
            const remainingInventory = myInventory.filter(c => c.id !== lostCard.id);
            updateGameState({ inventory: remainingInventory });

            // 2. Firebase 방 정보에 내가 잃은 카드 기록 (승자가 가져갈 수 있게)
            try {
                await updatePlayerState(roomId, state.userId, { lostCard });
                console.log(`❌ Card sacrificed and saved to room: ${lostCard.name}`);
            } catch (err) {
                console.error('Failed to save lostCard to room:', err);
            }

            return { cardsGained: [], cardsLost: [lostCard] };
        }
    }

    if (isMeWinner) {
        // [승자 로직] 상대방이 잃은 카드 대기 및 획득
        console.log('⌛ Waiting for opponent to sacrifice a card...');

        // 최대 5초간 상대방의 lostCard 대기 (폴링 방식)
        for (let i = 0; i < 10; i++) {
            const room = await getBattleRoom(roomId);
            if (!room) break;

            const opponent = room.player1.playerId === state.userId ? room.player2 : room.player1;

            if (opponent.lostCard) {
                const gainedCard = opponent.lostCard;

                // 내 인벤토리에 추가
                updateGameState({ inventory: [...myInventory, gainedCard] });
                console.log(`🎁 Received card from opponent: ${gainedCard.name}`);

                return { cardsGained: [gainedCard], cardsLost: [] };
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('⚠️ Could not receive card from opponent (timeout or no card available)');
    }

    return { cardsGained: [], cardsLost: [] };
}


/**
 * 승자 보상 계산
 */
function calculateWinnerRewards(mode: RealtimeBattleMode): { coins: number; experience: number } {
    switch (mode) {
        case 'sudden-death':
            return { coins: 200, experience: 50 };
        case 'tactics':
            return { coins: 500, experience: 100 };
        case 'strategy':
            return { coins: 800, experience: 150 };
        default:
            return { coins: 200, experience: 50 };
    }
}

/**
 * 패자 보상 계산 (위로 보상)
 */
function calculateLoserRewards(mode: RealtimeBattleMode): { coins: number; experience: number } {
    switch (mode) {
        case 'sudden-death':
            return { coins: 50, experience: 10 };
        case 'tactics':
            return { coins: 100, experience: 20 };
        case 'strategy':
            return { coins: 150, experience: 30 };
        default:
            return { coins: 50, experience: 10 };
    }
}

/**
 * 다음 페이즈로 진행
 */
export async function advancePhase(roomId: string): Promise<void> {
    const room = await getBattleRoom(roomId);
    if (!room) return;

    let nextPhase = room.phase;

    switch (room.phase) {
        case 'waiting':
            nextPhase = 'vs-matchup';
            break;
        case 'vs-matchup':
            nextPhase = 'deck-select';
            break;
        case 'deck-select':
            nextPhase = 'battle';
            break;
        case 'battle':
            // 승리 조건 확인
            const winnerId = checkVictory(room);
            if (winnerId) {
                nextPhase = 'finished';
                await updateBattleRoom(roomId, {
                    phase: nextPhase,
                    winner: winnerId,
                    finished: true,
                    phaseStartedAt: Date.now()
                });
                await processBattleRewards(roomId, winnerId);
                return;
            }
            // 다음 라운드
            nextPhase = 'combat';
            break;
    }

    await updateBattleRoom(roomId, {
        phase: nextPhase,
        phaseStartedAt: Date.now()
    });
}

/**
 * 양쪽 플레이어 준비 확인
 */
export function areBothPlayersReady(room: BattleRoom): boolean {
    return room.player1.ready && room.player2.ready;
}
