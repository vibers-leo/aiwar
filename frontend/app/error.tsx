"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
          시스템 오류 발생
        </h2>
        <p className="text-gray-400 mb-6">
          예상치 못한 문제가 발생했습니다. 다시 시도해 주세요.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
