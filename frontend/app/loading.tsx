export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm" style={{ fontFamily: "Orbitron, sans-serif" }}>
          AGI WAR 로딩 중...
        </p>
      </div>
    </div>
  );
}
