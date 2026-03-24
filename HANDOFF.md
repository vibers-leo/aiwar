# AI War — 맥미니 이전 핸드오프 문서

> 이 파일은 맥북 → 맥미니 이전 시 Claude Code가 대화 컨텍스트를 이어받기 위해 작성되었습니다.
> 새 머신에서 첫 대화 시작 전에 Claude에게 "HANDOFF.md 읽어줘" 라고 말하세요.

**작성일**: 2026-03-24
**작성자**: Claude Sonnet 4.6 (with 개발자)

---

## 1. 프로젝트 개요

**AI War** — Next.js 기반 턴제 카드 배틀 게임
- 실제 AI 서비스(ChatGPT, Claude, Gemini 등)가 군단이 되어 전쟁하는 컨셉
- **게임 목적**: "다양한 AI 서비스를 알아보고 구독하면서 쓰자(성장하자)"
- Firebase Realtime DB + Firestore, Google OAuth
- 경로: `/Users/admin/Desktop/ai-war/frontend` (Next.js App Router)

---

## 2. 최근 완료된 작업 (이번 세션 기준)

### [완료] 버그 수정 배치 (commit: 1b72d7e, 6f620ba, 1cd4e39)
- **스타터팩 중복 청구 취약점** 수정 (`firebase-db.ts`)
- **NaN 표시 버그** 수정 — `profile.tokens` undefined 시 0 처리 (`UserContext.tsx`)
- **PVP stale closure 버그** 수정 — `localPhaseRef`로 해결 (`pvp/room/[roomId]/page.tsx`)
- **`advancePhase()` 잘못된 페이즈명** 수정 (`realtime-battle-engine.ts`)
- **리롤 후 스탯 최소값** 보장 — `Math.max(5, ...)` (`card-generation-system.ts`)
- **`cancelSubscription()`** 함수 추가 (`firebase-db.ts`)
- **`fetchUserSubscriptions`** 타입 `any[]` → `UserSubscription[]` 수정

### [완료] 신규 AI 군단 18개 추가 (commit: 7b044eb)
- DeepSeek, Llama, Mistral, Qwen, HyperCLOVA X, Gemma (LLM)
- Devin, Perplexity, Character.AI (Agent — 신규 카테고리)
- Ideogram, Adobe Firefly (Image)
- Veo, Luma Dream Machine, HeyGen (Video)
- Whisper (Audio)
- Lovable, v0, NotebookLM (Builder — 신규 카테고리)
- 각 군단 Commander 카드 (실제 창업자/CEO) + Hero 카드 추가
- 신규 콤보 8개 추가 (`synergy-utils.ts`)
- AI Recipe API 연동 scaffold (`lib/content-generator.ts`, `admin/content-generator/page.tsx`)

### [완료] 시너지 콤보 생성 시간 단축 + 뱃지 도감 (commit: 067aa48)
- 슬롯 배치 군단들이 콤보 조건 충족 시 생성 인터벌 감소 (bonusPower × 30%, 최대 50%)
- 콤보 최초 달성 시 Firebase `comboBadges` 배열에 저장 + 알림
- 프로필 페이지에 뱃지 도감 섹션 추가

### [완료] 시너지 UI 시각화 (commit: ad5365d)
- **FactionCard**: 각 군단 카드에 소속 콤보 칩 표시
- **군단 페이지**: 시너지 콤보 도감 섹션 (15개, 진행률 바 + 구독 상태)
- **생성 슬롯 페이지**: 활성 콤보 + 근접 콤보(near-miss) 프로그레스 바

---

## 3. 현재 아키텍처 핵심 파일

```
frontend/
├── app/
│   ├── main/                  # 메인 대시보드
│   ├── factions/page.tsx      # 군단 구독 + 콤보 도감 ← 최근 수정
│   ├── generation/page.tsx    # 카드 생성 슬롯 ← 최근 수정
│   ├── pvp/room/[roomId]/     # PVP 실시간 배틀 ← 최근 수정
│   ├── profile/[uid]/         # 유저 프로필 + 뱃지 도감 ← 최근 수정
│   └── admin/
│       ├── page.tsx           # 어드민 대시보드
│       ├── ai-monitor/        # AI 버전 모니터
│       └── content-generator/ # AI 군단 로어 배치 생성 ← 신규
├── components/
│   ├── FactionCard.tsx        # 군단 카드 컴포넌트 ← 최근 수정
│   └── GenerationSlot.tsx     # 생성 슬롯 컴포넌트
├── context/
│   └── UserContext.tsx        # 전체 유저 상태 SSOT
├── lib/
│   ├── firebase-db.ts         # Firebase CRUD + comboBadges ← 최근 수정
│   ├── synergy-utils.ts       # 시너지/콤보 계산 ← 최근 수정
│   ├── generation-utils.ts    # 슬롯 생성 로직 + 시너지 적용 ← 최근 수정
│   ├── content-generator.ts   # AI Recipe API 연동 scaffold ← 신규
│   ├── pvp-battle-system.ts   # PVP 로직
│   └── ai-version-registry.ts # AI 모델 버전 추적
└── data/
    ├── ai-factions.json       # 전체 군단 데이터 (36개)
    └── card-database.ts       # 카드 템플릿 DB
```

---

## 4. 개발자 스타일 & 협업 선호사항

### 코딩 스타일
- **한국어 주석** 선호
- **OKR 커밋 형식**: `[OKR-X.Y] type: 메시지`
- 복잡한 작업 전 TODO 리스트 작성
- 작업 완료 후 TypeScript 타입 체크 (`npx tsc --noEmit`)

### 개발 철학
- "다양한 AI 서비스를 알아보고 구독하면서 쓰자" — 게임 핵심 가치
- 시너지는 **배틀에 직접 적용하지 않는다** (다양성 저해 우려) → 생성 시간 단축으로만 적용
- 과도한 추상화 금지, 최소한의 복잡도
- Firebase SSOT 원칙 — 로컬스토리지는 캐싱 용도만

### 협업 방식
- AI Recipe API 등 외부 서비스를 API로 연결하는 방식 선호
- 다양한 에이전트와 협업하는 팀즈 방식 지향
- 기능 구현 후 항상 TypeScript 에러 확인

---

## 5. 환경 변수 (`.env.local` 필요 — Git에 없음)

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# AI Recipe API (선택 — 없으면 폴백 텍스트 사용)
AI_RECIPE_API_URL=https://your-ai-recipe-api.com
AI_RECIPE_API_KEY=your-api-key
```

---

## 6. 개발 서버 실행

```bash
cd /path/to/ai-war/frontend
npm install
npm run dev   # http://localhost:3000
```

---

## 7. 미완성 / 향후 작업 목록

### 우선순위 높음 (P1)
- [ ] **AI Recipe API 실제 연결** — `lib/content-generator.ts` 작성 완료, API URL/KEY 설정 필요
- [ ] **Card Clash 배틀 완성** — `app/clash/` UI 있으나 실제 배틀 로직 검증 필요
- [ ] **ElevenLabs TTS** 캐릭터 보이스 통합

### 중간 (P2)
- [ ] **시즌 2 스토리** "도원결의 편" 기획 및 구현
- [ ] **사운드 시스템** (`lib/sound-effects.ts` 뼈대 있음)
- [ ] **모바일 최적화**

### 낮음 (P3)
- [ ] 다국어 지원
- [ ] 파티클 효과 강화
- [ ] 랭킹 시스템 심화

---

## 8. 알려진 이슈 / 주의사항

- **`synergy-utils.ts`**: `COMBO_DEFINITIONS`는 반드시 `analyzeDeckSynergy()` 함수보다 먼저 선언되어야 함 (const hoisting 이슈 방지)
- **`generation-utils.ts`**: `require('@/lib/card-generation-system')` 다이나믹 require 사용 중 — 추후 static import로 개선 권장
- **PVP 배틀**: `localPhaseRef` 패턴 사용 중 — stale closure 방지용, 건드릴 때 주의
- **Firebase 미설정 환경**: `isFirebaseConfigured` 체크 후 동작하는 구조, 로컬 개발 시 `.env.local` 필수

---

## 9. 주요 게임 데이터

### 현재 군단 수
- 기존: ChatGPT, Claude, Gemini, Midjourney, DALL-E, Stable Diffusion, Runway, Kling, Suno, ElevenLabs, Sora, Grok (12개)
- 신규 추가: DeepSeek, Llama, Mistral, Qwen, HyperCLOVA X, Gemma, Devin, Perplexity, Character.AI, Ideogram, Adobe Firefly, Veo, Luma, HeyGen, Whisper, Lovable, v0, NotebookLM (18개)
- **총 30개+** (ai-factions.json 확인)

### 시너지 콤보 (15개)
- 기존 7개 + 신규 8개 (Open Source Rebellion, Asian AI Alliance, Google Empire, Builder Squad, OpenAI Full Stack, Search War, Video Mega Alliance, Emotion Wave)

### 어드민 계정
- `juuuno@naver.com` 만 접근 가능 (`context/UserContext.tsx`의 `isAdmin` 로직)

---

*이 파일은 Claude Code가 자동 생성했습니다. 새 머신에서 Claude Code 실행 후 "HANDOFF.md 읽어줘"로 컨텍스트 복원*
