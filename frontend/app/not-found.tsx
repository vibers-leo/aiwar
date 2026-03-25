import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-6">
      <div className="text-center max-w-md">
        <div className="text-7xl font-black mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
          404
        </div>
        <h2 className="text-xl font-bold mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-400 mb-6">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/main"
          className="inline-block px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors"
        >
          메인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
