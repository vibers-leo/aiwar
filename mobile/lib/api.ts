// AI 워 API 클라이언트
const API_BASE = "https://ai-war.vercel.app/api";

export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API 에러: ${res.status}`);
  return res.json();
}
