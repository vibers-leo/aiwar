import Link from 'next/link';

export default function TossHomePage() {
  return (
    <div className="flex flex-1 flex-col px-5 py-8">
      {/* 히어로 */}
      <div className="mb-10 mt-4">
        <h1 className="mb-3 text-[26px] font-bold leading-tight text-gray-900">
          AI 카드로 펼치는<br />
          전략 대전
        </h1>
        <p className="text-[15px] leading-relaxed text-gray-500">
          AI가 생성한 유닛 카드를 수집하고<br />
          실시간 대전에서 승리를 쟁취하세요
        </p>
      </div>

      {/* 기능 카드 */}
      <div className="mb-8 space-y-3">
        <Link
          href="/toss/play"
          className="flex items-center gap-4 rounded-2xl bg-gray-50 p-5 transition-colors active:bg-gray-100"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white text-lg">
            ⚔️
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-gray-900">게임 시작</p>
            <p className="mt-0.5 text-[13px] text-gray-500">
              대전 로비에서 상대를 찾아보세요
            </p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>

        <Link
          href="/toss/ranking"
          className="flex items-center gap-4 rounded-2xl bg-gray-50 p-5 transition-colors active:bg-gray-100"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white text-lg">
            🏆
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-gray-900">랭킹</p>
            <p className="mt-0.5 text-[13px] text-gray-500">
              최강 플레이어 순위를 확인하세요
            </p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
      </div>

      {/* CTA */}
      <div className="mt-auto pb-4">
        <Link
          href="/toss/play"
          className="flex w-full items-center justify-center rounded-xl bg-cyan-500 py-4 text-[16px] font-semibold text-white transition-colors active:bg-cyan-600"
        >
          시작하기
        </Link>
      </div>
    </div>
  );
}
