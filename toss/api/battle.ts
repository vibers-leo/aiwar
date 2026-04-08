import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { strategyId, opponentStrategyId } = req.body as {
    strategyId: string;
    opponentStrategyId?: string;
  };

  if (!strategyId) {
    return res.status(400).json({ error: '전략을 선택해주세요.' });
  }

  // 전략별 기본 파워 (실제로는 Firebase 실시간 매칭)
  const STRATEGY_POWER: Record<string, number> = {
    aggressive: 85,
    defensive: 72,
    balanced: 78,
  };

  const myPower = STRATEGY_POWER[strategyId] ?? 75;
  const opponentId = opponentStrategyId ?? Object.keys(STRATEGY_POWER)[Math.floor(Math.random() * 3)];
  const opponentPower = STRATEGY_POWER[opponentId] ?? 75;

  // 전략 상성 + 랜덤 요소
  const randomFactor = (Math.random() - 0.5) * 20;
  const myScore = myPower + randomFactor;
  const won = myScore > opponentPower;

  const pointsEarned = won ? 50 : 0;

  return res.status(200).json({
    won,
    myPower,
    opponentPower: opponentPower + Math.floor(Math.random() * 10) - 5,
    opponentStrategy: opponentId,
    pointsEarned,
    message: won
      ? '탁월한 전략 선택! AI 배틀 승리!'
      : '惜! 다음 배틀에서 전략을 바꿔보세요.',
  });
}
