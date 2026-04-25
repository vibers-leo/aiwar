'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

const GAME_MODES = [
  {
    id: 'quick',
    title: '빠른 대전',
    description: '랜덤 상대와 즉시 대전',
    icon: '⚡',
    color: 'bg-cyan-500',
  },
  {
    id: 'ranked',
    title: '랭크 대전',
    description: '실력에 맞는 상대와 경쟁',
    icon: '🏅',
    color: 'bg-amber-500',
  },
  {
    id: 'friend',
    title: '친구 대전',
    description: '친구를 초대해서 대전',
    icon: '🤝',
    color: 'bg-violet-500',
  },
];

export default function TossPlayPage() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const handleStart = () => {
    if (!selectedMode) return;
    alert(`${GAME_MODES.find((m) => m.id === selectedMode)?.title} 준비 중입니다.\n토스 정식 출시 후 이용 가능합니다.`);
  };

  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      {/* 헤더 */}
      <h2 className="mb-1 text-[22px] font-bold text-gray-900">게임 로비</h2>
      <p className="mb-6 text-[14px] text-gray-500">
        대전 모드를 선택하세요
      </p>

      {/* 모드 선택 */}
      <div className="mb-8 space-y-3">
        {GAME_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={`flex w-full items-center gap-4 rounded-2xl p-5 text-left transition-all ${
              selectedMode === mode.id
                ? 'bg-cyan-50 ring-2 ring-cyan-500'
                : 'bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg text-white ${mode.color}`}
            >
              {mode.icon}
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-gray-900">
                {mode.title}
              </p>
              <p className="mt-0.5 text-[13px] text-gray-500">
                {mode.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* 하단 버튼 */}
      <div className="mt-auto space-y-3 pb-4">
        <button
          onClick={handleStart}
          disabled={!selectedMode}
          className={`flex w-full items-center justify-center rounded-xl py-4 text-[16px] font-semibold transition-colors ${
            selectedMode
              ? 'bg-cyan-500 text-white active:bg-cyan-600'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          대전 시작
        </button>
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
