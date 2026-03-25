/**
 * 전투 승점 시스템
 * 
 * [공식 전투 규칙 - docs/전투규칙지침.md 참조]
 * 
 * - 일반 라운드 승리: +1점
 * - 전략 전투 3라운드 특수 규칙:
 *   * 3-1 라운드: 기본 카드 대결
 *   * 3-2 라운드: 히든 카드 대결
 *   * 둘 다 승리: +2점 (독점 승리)
 *   * 각각 다른 사람 승리: 3-2 승자만 +1점 (3-1 승자는 승점 없음!)
 * - 3점 먼저 획득 시 즉시 승리
 */

export type BattleType = 'strategic' | 'tactical';

export interface RoundResult {
    roundNumber: number | string; // '3-1', '3-2' for strategy mode
    winner: 'player' | 'enemy' | 'draw';
    isHiddenRound: boolean;
    playerCard: any;
    enemyCard: any;
    // 히든 라운드용 추가 정보
    hiddenCardWinner?: 'player' | 'enemy' | 'draw';
    playerHiddenCard?: any;
    enemyHiddenCard?: any;
}

export interface VictoryState {
    playerScore: number;
    enemyScore: number;
    playerWonCards: any[];
    enemyWonCards: any[];
    isGameOver: boolean;
    finalWinner: 'player' | 'enemy' | null;
}

/**
 * 승점 계산
 */
export function calculateVictoryPoints(
    results: RoundResult[],
    battleType: BattleType = 'tactical',
    targetScore: number = 3
): VictoryState {
    let playerScore = 0;
    let enemyScore = 0;
    const playerWonCards: any[] = [];
    const enemyWonCards: any[] = [];

    // 전략 전투: 3라운드 특수 처리
    if (battleType === 'strategic') {
        const round3_1 = results.find(r => r.roundNumber === '3-1' || r.roundNumber === 3);
        const round3_2 = results.find(r => r.roundNumber === '3-2');

        for (const result of results) {
            // 3라운드 특수 처리 (3-1, 3-2)
            if (result.roundNumber === '3-1' || result.roundNumber === 3) {
                // 3-1 자체로는 승점 없음 - 3-2 결과와 함께 판정
                continue;
            } else if (result.roundNumber === '3-2') {
                // 3-2 라운드 판정 (핵심!)
                const winner3_1 = round3_1?.winner;
                const winner3_2 = result.winner;

                // 둘 다 같은 사람이 승리: 2점
                if (winner3_1 === 'player' && winner3_2 === 'player') {
                    playerScore += 2;
                    if (round3_1?.playerCard) playerWonCards.push(round3_1.playerCard);
                    if (result.playerCard) playerWonCards.push(result.playerCard);
                } else if (winner3_1 === 'enemy' && winner3_2 === 'enemy') {
                    enemyScore += 2;
                    if (round3_1?.enemyCard) enemyWonCards.push(round3_1.enemyCard);
                    if (result.enemyCard) enemyWonCards.push(result.enemyCard);
                }
                // 각각 다른 사람 승리: 3-2 승자만 1점!
                else if (winner3_2 === 'player') {
                    playerScore += 1;
                    if (result.playerCard) playerWonCards.push(result.playerCard);
                } else if (winner3_2 === 'enemy') {
                    enemyScore += 1;
                    if (result.enemyCard) enemyWonCards.push(result.enemyCard);
                }
                // 3-2가 무승부면 아무도 점수 없음
            }
            // 일반 라운드 (1, 2, 4, 5)
            else {
                if (result.winner === 'draw') continue;
                if (result.winner === 'player') {
                    playerWonCards.push(result.playerCard);
                    playerScore += 1;
                } else {
                    enemyWonCards.push(result.enemyCard);
                    enemyScore += 1;
                }
            }
        }
    }
    // 일반 전투 (전술 승부 등)
    else {
        for (const result of results) {
            if (result.winner === 'draw') continue;
            if (result.winner === 'player') {
                playerWonCards.push(result.playerCard);
                playerScore += 1;
            } else {
                enemyWonCards.push(result.enemyCard);
                enemyScore += 1;
            }
        }
    }

    // 승리 조건 체크
    const isGameOver = playerScore >= targetScore || enemyScore >= targetScore;
    const finalWinner = isGameOver
        ? playerScore >= targetScore
            ? 'player'
            : 'enemy'
        : null;

    return {
        playerScore,
        enemyScore,
        playerWonCards,
        enemyWonCards,
        isGameOver,
        finalWinner,
    };
}

/**
 * 라운드 결과 생성
 */
export function createRoundResult(
    roundNumber: number | string,
    playerCard: any,
    enemyCard: any,
    winner: 'player' | 'enemy' | 'draw'
): RoundResult {
    const isHiddenRound = roundNumber === '3-2';

    return {
        roundNumber,
        winner,
        isHiddenRound,
        playerCard,
        enemyCard,
    };
}

/**
 * 현재 라운드까지의 승점 상태 가져오기
 */
export function getVictoryStateAtRound(
    results: RoundResult[],
    currentRound: number | string,
    battleType: BattleType = 'tactical',
    targetScore: number = 3
): VictoryState {
    const relevantResults = results.filter(r => {
        if (typeof r.roundNumber === 'string' && typeof currentRound === 'string') {
            return r.roundNumber <= currentRound;
        }
        if (typeof r.roundNumber === 'number' && typeof currentRound === 'number') {
            return r.roundNumber <= currentRound;
        }
        // Handle mixed: treat '3-1' as 3.1, '3-2' as 3.2
        const getRoundValue = (rn: number | string): number => {
            if (typeof rn === 'number') return rn;
            if (rn === '3-1') return 3.1;
            if (rn === '3-2') return 3.2;
            return parseFloat(rn) || 0;
        };
        return getRoundValue(r.roundNumber) <= getRoundValue(currentRound);
    });
    return calculateVictoryPoints(relevantResults, battleType, targetScore);
}

/**
 * 3라운드 보너스 (2점) 획득 가능 여부 체크
 */
export function canGetRound3Bonus(
    results: RoundResult[],
    player: 'player' | 'enemy'
): {
    canGetBonus: boolean;
    round3_1Won: boolean;
    round3_2Won: boolean;
} {
    const round3_1Result = results.find(r => r.roundNumber === '3-1' || r.roundNumber === 3);
    const round3_2Result = results.find(r => r.roundNumber === '3-2');

    const round3_1Won = round3_1Result?.winner === player;
    const round3_2Won = round3_2Result?.winner === player;

    return {
        canGetBonus: round3_1Won && round3_2Won,
        round3_1Won,
        round3_2Won,
    };
}
