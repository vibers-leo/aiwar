---
name: 프로젝트 현재 상태
description: 2026-03-24 기준 완료된 작업, 미완성 기능, 주요 결정사항
type: project
---

## 최근 완료된 주요 작업 (2026-03-24)

**버그 수정 (모두 완료)**
- 스타터팩 중복 청구 취약점 → `hasReceivedStarterPack` 플래그만 신뢰
- UserContext NaN 표시 → `Math.max(0, profile.coins ?? 0)`
- PVP stale closure → `localPhaseRef = useRef<LocalPhase>('loading')`
- `advancePhase()` 잘못된 페이즈명 수정
- 리롤 스탯 최소값 `Math.max(5, ...)`
- `cancelSubscription()` 추가
- `fetchUserSubscriptions` 타입 `any[]` → `UserSubscription[]`

**신규 기능**
- AI 군단 18개 추가 (DeepSeek, Llama, Mistral, Qwen, HyperCLOVA X, Gemma, Devin, Perplexity, Character.AI, Ideogram, Adobe Firefly, Veo, Luma, HeyGen, Whisper, Lovable, v0, NotebookLM)
- 시너지 콤보 생성 시간 단축 — 슬롯 콤보 달성 시 bonusPower×30% 감소 (최대 50%)
- 콤보 뱃지 도감 — 최초 달성 시 Firebase `comboBadges` 저장, 프로필 표시
- 시너지 UI — FactionCard 콤보 칩, 군단 페이지 콤보 도감, 생성 페이지 near-miss 패널

## 미완성 / 다음 작업

- AI Recipe API 실제 연결 (URL/KEY 설정 필요, scaffold 완성됨)
- Card Clash 배틀 완성 검증
- ElevenLabs TTS 통합
- 시즌 2 스토리

## 중요 아키텍처 결정

- `synergy-utils.ts`: COMBO_DEFINITIONS는 함수보다 먼저 선언 필수 (const TDZ 이슈)
- 시너지는 배틀에 적용 안 함 — 생성 시간 단축 + 뱃지로만
- 어드민: `juuuno@naver.com`만 접근 가능
