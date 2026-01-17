# AI War 전투 시스템 아키텍처

> **최종 업데이트**: 2026-01-17  
> **상태**: ✅ 동기화 완료

## 📊 전투 UI 통합 현황

### 핵심 전투 컴포넌트

| 컴포넌트 | 경로 | 역할 | 사용처 |
|---------|------|-----|-------|
| **BattleArena** | `components/BattleArena.tsx` | 메인 전투 엔진 | 스토리, PVP, 실시간 PVP |
| **DoubleBattleArena** | `components/battle/DoubleBattleArena.tsx` | 2장 대결 모드 | 스토리 (double 모드) |

---

## ✅ 통합 완료 확인

### 스토리 모드 (`/battle/stage/[stageId]`)

```tsx
// app/battle/stage/[stageId]/page.tsx - Line 353
<BattleArena
    playerDeck={selectedHand}
    enemyDeck={enemies}
    opponent={{
        name: storyStage.enemy.name_ko,
        level: storyStage.step
    }}
    onFinish={handleBattleFinish}
    title={storyStage.title_ko}
    battleMode={storyStage.battleMode}
    enemySelectionMode={...}
    autoStartBattle={true}
    initialPlacement={...}
/>
```

### PVP 연습 모드 (`/pvp/fight`)

```tsx
// app/pvp/fight/page.tsx - Line 139
<BattleArena
    playerDeck={playerDeck}
    enemyDeck={enemyDeck}
    opponent={{
        name: opponent?.name || 'Enemy',
        level: opponent?.level || 1
    }}
    onFinish={handleBattleFinish}
    title={t('page.pvp.title')}
/>
```

### 실시간 PVP (`/pvp/room/[roomId]`)

```tsx
// app/pvp/room/[roomId]/page.tsx - Line 723
<BattleArena
    playerDeck={myBattleDeck}
    enemyDeck={opponentBattleDeck}
    opponent={{
        name: opponentProfile?.nickname || 'Opponent',
        level: opponentProfile?.level || 1
    }}
    onFinish={handleBattleComplete}
    title="실시간 대전"
    battleMode="tactics"
    autoStartBattle={true}
    initialPlacement={myPlacement}
/>
```

---

## 🔧 BattleArena Props 정의

```typescript
interface BattleArenaProps {
    // 필수
    playerDeck: Card[];           // 플레이어 덱 (5~6장)
    enemyDeck: Card[];            // 적 덱 (5~6장)
    opponent: {                   // 상대 정보
        name: string;
        level: number;
        avatarUrl?: string;
    };
    onFinish: (result) => void;   // 전투 종료 콜백
    title?: string;               // 전투 타이틀

    // 선택
    battleMode?: 'sudden-death' | 'tactics' | 'strategy' | 'double';
    strategyTime?: number;        // 전략 시간 (기본 20초)
    maxRounds?: number;           // 최대 라운드 (기본 5)
    enemySelectionMode?: 'ordered' | 'random';
    autoStartBattle?: boolean;    // 자동 시작
    initialPlacement?: number[];  // 초기 카드 배치 순서
    manualResult?: boolean;       // 결과창 외부 제어
    rewards?: { coins: number; exp: number };
    nextLabel?: string;           // 다음 버튼 텍스트
}
```

---

## 📁 파일 구조

```
components/
├── BattleArena.tsx              ⬅️ 메인 전투 엔진 (848줄)
│   ├── 전략 모드 UI
│   ├── 카드 대결 애니메이션
│   ├── 라운드 판정 로직
│   └── 결과 오버레이
│
├── battle/
│   ├── DoubleBattleArena.tsx    ⬅️ 2장 대결 모드
│   ├── BattleDeckSelection.tsx  ⬅️ 덱 선택 UI
│   ├── CardPlacementBoard.tsx   ⬅️ 카드 배치 UI
│   ├── OpponentDeckReveal.tsx   ⬅️ 상대 덱 공개
│   ├── BattleScene.tsx          ❌ 미사용 (레거시)
│   ├── EnhancedBattleScene.tsx  ❌ 미사용 (레거시)
│   ├── PreBattleScene.tsx       ❌ 미사용 (레거시)
│   └── SingleCardBattle.tsx     ❌ 미사용 (레거시)
│
└── BattleResult.tsx             ❌ 미사용 (BattleArena 내장)
```

---

## 🎮 전투 흐름

```
┌─────────────────────────────────────────────────────┐
│                    STORY MODE                        │
├─────────────────────────────────────────────────────┤
│  intro ──▶ deck-select ──▶ opponent-reveal ──▶      │
│          placement ──▶ BATTLE ──▶ chapter-map       │
│                         │                           │
│                    BattleArena                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    PVP MODE                          │
├─────────────────────────────────────────────────────┤
│  deck-select ──▶ BATTLE ──▶ result ──▶ lobby        │
│                    │                                │
│               BattleArena                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                 REALTIME PVP                         │
├─────────────────────────────────────────────────────┤
│  matching ──▶ deck-select ──▶ placement ──▶         │
│          BATTLE ──▶ result ──▶ lobby                │
│            │                                        │
│       BattleArena                                   │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ 레거시 페이지 및 컴포넌트 (사용 중지)

### 레거시 페이지

| 경로 | 상태 | 접근성 | 설명 |
|-----|------|-------|------|
| `/battle` | ❌ 미사용 | 🔒 메뉴 숨김 | 레거시 스테이지 선택 |
| `/battle/1-card` | ❌ 미사용 | 🔒 직접 URL만 | 1장 대결 테스트 |

### 레거시 컴포넌트

| 파일 | 상태 | 대체된 컴포넌트 |
|-----|------|---------------|
| `BattleScene.tsx` | ❌ 미사용 | BattleArena |
| `EnhancedBattleScene.tsx` | ❌ 미사용 | BattleArena |
| `PreBattleScene.tsx` | ❌ 미사용 | 스토리 단계별 분리 |
| `SingleCardBattle.tsx` | ❌ 미사용 | BattleArena |
| `BattleResult.tsx` | ❌ 미사용 | BattleArena 내장 |

> **참고**: 레거시 페이지(`/battle`, `/battle/1-card`)는 메뉴에서 숨김 처리되어  
> 일반 사용자가 접근할 수 없습니다. 스토리 모드는 `/story` → `/battle/stage/[stageId]` 경로를 사용합니다.

---

## 🔄 동기화 체크리스트

- [x] 스토리 모드: `BattleArena` 사용
- [x] PVP 연습: `BattleArena` 사용
- [x] 실시간 PVP: `BattleArena` 사용
- [x] 2장 대결: `DoubleBattleArena` 사용
- [x] 결과 화면: `BattleArena` 내부 통합
- [x] 카드 애니메이션: 동일
- [x] 상성 판정: 동일 (`hasTypeAdvantage`)

---

## 📝 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-17 | 전투 시스템 아키텍처 문서 생성 |
| 2026-01-17 | 스토리/PVP BattleArena 통합 확인 |
| 2026-01-10 | BattleArena `manualResult` 모드 추가 |
| 2026-01-09 | 레거시 BattleScene 제거 시작 |
