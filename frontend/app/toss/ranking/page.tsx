export const dynamic = 'force-dynamic';

import Link from 'next/link';

const MOCK_RANKINGS = [
  { rank: 1, name: '전략의신', score: 2850, wins: 142, tier: '마스터' },
  { rank: 2, name: '카드마스터', score: 2720, wins: 128, tier: '마스터' },
  { rank: 3, name: 'AI킬러', score: 2680, wins: 119, tier: '다이아' },
  { rank: 4, name: '불꽃전사', score: 2540, wins: 105, tier: '다이아' },
  { rank: 5, name: '그림자군주', score: 2490, wins: 98, tier: '다이아' },
  { rank: 6, name: '번개손', score: 2410, wins: 91, tier: '플래티넘' },
  { rank: 7, name: '얼음여왕', score: 2380, wins: 87, tier: '플래티넘' },
  { rank: 8, name: '폭풍기사', score: 2320, wins: 82, tier: '플래티넘' },
  { rank: 9, name: '독수리눈', score: 2270, wins: 76, tier: '골드' },
  { rank: 10, name: '미래전략가', score: 2200, wins: 71, tier: '골드' },
];

function getRankColor(rank: number) {
  if (rank === 1) return 'text-amber-500';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-amber-700';
  return 'text-gray-500';
}

function getTierColor(tier: string) {
  switch (tier) {
    case '마스터':
      return 'bg-red-100 text-red-600';
    case '다이아':
      return 'bg-cyan-100 text-cyan-600';
    case '플래티넘':
      return 'bg-violet-100 text-violet-600';
    case '골드':
      return 'bg-amber-100 text-amber-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export default function TossRankingPage() {
  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      {/* 헤더 */}
      <h2 className="mb-1 text-[22px] font-bold text-gray-900">랭킹</h2>
      <p className="mb-6 text-[14px] text-gray-500">
        이번 시즌 최강 플레이어
      </p>

      {/* 랭킹 리스트 */}
      <div className="mb-6 space-y-2">
        {MOCK_RANKINGS.map((player) => (
          <div
            key={player.rank}
            className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3.5"
          >
            <span
              className={`w-7 text-center text-[16px] font-bold ${getRankColor(player.rank)}`}
            >
              {player.rank}
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-gray-900">
                {player.name}
              </p>
              <p className="mt-0.5 text-[12px] text-gray-400">
                {player.score}점 · {player.wins}승
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getTierColor(player.tier)}`}
            >
              {player.tier}
            </span>
          </div>
        ))}
      </div>

      {/* 하단 */}
      <div className="mt-auto pb-4">
        <Link
          href="/toss"
          className="flex w-full items-center justify-center rounded-xl bg-gray-100 py-3.5 text-[15px] font-medium text-gray-600 transition-colors active:bg-gray-200"
        >
          돌아가기
        </Link>
      </div>
    </div>
  );
}
