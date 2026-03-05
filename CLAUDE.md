# AI War - Claude Code 프로젝트 가이드

## 프로젝트 개요

AI War는 Next.js 기반의 턴제 카드 배틀 게임입니다. Firebase Realtime Database를 사용하며, 몰입감 있는 스토리텔링과 완벽한 사용자 경험을 추구합니다.

## 개발 철학 및 핵심 가치

### 1. 완벽한 통합과 검증 우선
- **모든 시스템은 Firebase와 완벽하게 동기화되어야 합니다**
- 로컬 스토리지는 캐싱 용도로만 사용하고, SSOT(Single Source of Truth)는 항상 UserContext와 Firebase입니다
- 중복된 상태 관리 로직을 제거하고, Context API를 통한 단일 진실 공급원을 유지합니다
- 작업 완료 후 반드시 End-to-End 테스트를 수행합니다 (카드 생성 → 인벤토리 → 전투 → 보상 흐름)
- 새로고침 테스트로 데이터 지속성을 검증합니다

### 2. 사용자 경험(UX)을 최우선으로
- **작은 불편함도 즉시 수정합니다**
  - UI 깜빡임(flicker) 현상 제거
  - 로딩 시 "레벨 1", "0 코인" 같은 잘못된 기본값 노출 방지
  - 스탯 0 또는 극단적인 수치 생성 방지
- **사용자가 "기분 좋게" 플레이할 수 있어야 합니다**
  - 일일 리셋 후 즉시 보상을 받을 수 있게 (대기 시간 없음)
  - 자동 선택 시 등급별 최적 카드 선택 (전설 카드 우선)
  - 직관적이고 반응성 좋은 UI/UX

### 3. 몰입감 있는 스토리텔링
- 비주얼 노벨 스타일의 시네마틱 대화 시스템 사용
- 캐릭터별 개성과 깊이 있는 내러티브
- 타이핑 애니메이션(30ms/글자), 캐릭터 초상화, Scene별 효과 등 디테일한 연출
- 다중 캐릭터 시스템: Chip(메인 AI), Sam(보안 AI), Dario(개발자), Elon(CEO), Grok(AI 어시스턴트)

### 4. 게임 밸런스와 알고리즘적 사고
- **카드 생성 로직**
  - 주 스탯 비중 40~60%
  - 나머지 스탯 최소 5포인트 이상 보장
  - 극단적이거나 무의미한 수치 방지
- **자동 선택 로직**
  - 등급별 그룹화 (toLowerCase 정규화)
  - 각 등급 내에서 레벨 > 전투력 순 정렬
  - 각 등급 최상위 1장씩 우선 선발

### 5. 명확한 구조와 정리
- 중복된 디렉토리나 파일은 즉시 정리 (혼란 방지)
- `/frontend` 폴더를 단일 Source of Truth로 유지
- 명확한 파일 구조 및 책임 분리
- Context API 기반의 체계적인 상태 관리

## 기술 스택

### Frontend
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **State Management**: React Context API

### Backend
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Google OAuth)

### 주요 라이브러리
- Aceternity UI (고급 UI 컴포넌트)
- ElevenLabs (TTS - 계획 중)
- Suno (BGM - 계획 중)

## 프로젝트 구조

```
/frontend
├── app/                    # Next.js App Router
│   ├── main/              # 메인 대시보드
│   ├── story/             # 스토리 모드
│   ├── battle/            # 전투 시스템
│   ├── pvp/               # PVP 모드
│   ├── social/            # 소셜 대시보드
│   ├── clash/             # 카드 클래시 (신규)
│   └── minigame/          # 미니게임 (신규)
├── components/            # 재사용 가능한 컴포넌트
├── context/              # Context API (UserContext 등)
├── lib/                  # 유틸리티 및 시스템 로직
├── data/                 # 게임 데이터 (스토리, 챕터 등)
└── public/               # 정적 파일 (이미지, 오디오)
```

## 핵심 시스템

### 1. UserContext (SSOT)
- 모든 사용자 데이터의 단일 진실 공급원
- Firebase 실시간 동기화
- 메서드: `addCoins`, `addExperience`, `updateUserProfile` 등

### 2. 일일 리셋 시스템
- 오전 6시 자동 리셋
- 일일 퀘스트 및 보상 초기화
- 생성 슬롯 자동 활성화 (즉시 수령 가능 상태로 전환)

### 3. 카드 생성 시스템
- `card-generation-system.ts`: 카드 스탯 생성 및 리롤
- `generation-utils.ts`: 슬롯 상태 관리 및 업데이트

### 4. 전투 시스템
- Story Mode: 스테이지 기반 PVE
- PVP Mode: 실시간 매칭 및 전투
- Card Clash: 새로운 카드 배틀 시스템 (개발 중)

### 5. 스토리 시스템
- Chapter 1~5 (시즌 1 완료)
- 시네마틱 대화 시스템
- 엔딩 시스템 ("보이는 평화, 다가오는 파도")

## 개발 워크플로우

### 1. 치명적 오류(Blocker)는 즉시 수정
- "use client" 누락
- Context Provider 래핑 오류
- Import 누락
- 타입 참조 오류

### 2. 작업 후 반드시 검증
- 브라우저 자동화 테스트
- 실제 플레이 흐름 시뮬레이션
- 새로고침 후 데이터 유지 확인

### 3. Git 커밋 규칙
- **Commit Message Format**:
  - `feat: 새로운 기능 추가`
  - `fix: 버그 수정`
  - `refactor: 리팩토링`
  - `docs: 문서 업데이트`
- **Co-Authored-By 명시**:
  ```
  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```
- **작업 단위별 커밋** (의미 있는 단위로 분리)

### 4. 세션 로그 작성
- 모든 작업은 `/frontend/session-logs/` 또는 `/frontend/session-log/`에 기록
- 형식: `YYYY-MM-DD_HHMMSS_작업명.md`
- 포함 내용:
  - Key Goal
  - 상세 작업 일지 (Chronological)
  - 기술적 포인트
  - 커밋 내역
  - 테스트 결과

## OKR 기반 개발 원칙

### OKR이란?
OKR(Objectives and Key Results)은 구글과 실리콘밸리에서 사용하는 성과 관리 체계입니다. 우리 프로젝트의 OKR은 `/OKR.md` 파일에 정의되어 있으며, 모든 작업은 이 OKR과 연계되어야 합니다.

### OKR 구조
- **Objective (목표)**: 가슴 뛰는 정성적 목표 (예: "플레이어가 매일 돌아오는 세계 구축")
- **Key Results (핵심 결과)**: 측정 가능한 정량적 지표 (예: "DAU 1,000명 달성")
- **Initiatives (실행 방안)**: 구체적인 실행 작업 (예: "Card Clash 시스템 구현")

### 작업 시 OKR 준수 원칙

#### 1. 작업 시작 전: OKR 연계 확인
**모든 작업은 반드시 OKR.md의 Initiatives와 연결되어야 합니다.**

- ✅ **Good**: "KR 1.4(Minigame 참여율 40%)를 달성하기 위해 가위바위보 시스템을 구현합니다"
- ❌ **Bad**: "가위바위보 기능을 만들어야 할 것 같아서 만듭니다"

**작업 전 체크리스트**:
1. 이 작업이 어느 Objective와 연결되는가?
2. 이 작업이 어느 Key Result 달성에 기여하는가?
3. 이 작업이 OKR.md의 Initiatives 체크리스트에 있는가?

#### 2. Output이 아닌 Outcome에 집중
**"무엇을 했는가"가 아니라 "어떤 결과를 만들었는가"에 집중합니다.**

- ✅ **Outcome**: "PVP 매칭 성공률을 70%에서 95%로 개선했습니다"
- ❌ **Output**: "PVP 매칭 로직을 100줄 수정했습니다"

**보고 시 포함 사항**:
- 작업 전 측정값 (Before)
- 작업 후 측정값 (After)
- 목표 대비 달성률 (%)
- KR에 미친 영향 분석

#### 3. 측정 가능한 성과 지표 포함
**작업 완료 시 반드시 측정 가능한 지표를 함께 보고합니다.**

**측정 지표 예시**:
- 성능: 로딩 시간, 응답 속도, 메모리 사용량
- UX: 클릭 수, 전환율, 이탈률, 세션 시간
- 품질: 버그 수, 테스트 커버리지, 타입 안정성
- 비즈니스: DAU, MAU, 재방문율, ARPU

**작업 후 보고 형식**:
```
[작업명]
- 연계 OKR: Objective 1 > KR 1.3
- Before: PVP 매칭 성공률 70%, 평균 대기 시간 60초
- After: PVP 매칭 성공률 95%, 평균 대기 시간 28초
- 목표 대비: 성공률 100% 달성 (목표 95%), 대기 시간 93% 달성 (목표 30초)
- KR 영향: KR 1.3 완전 달성 ✅
```

#### 4. 우선순위는 OKR 달성률 기준
**작업 우선순위는 OKR 달성률이 낮은 항목부터 설정합니다.**

**우선순위 매트릭스**:
1. **P0 (긴급)**: KR 달성률 30% 미만이면서 마감일 임박 (1주 이내)
2. **P1 (높음)**: KR 달성률 50% 미만이면서 마감일 1개월 이내
3. **P2 (중간)**: KR 달성률 50~70%이면서 마감일 여유 있음
4. **P3 (낮음)**: KR 달성률 70% 이상 또는 Stretch Goal

**현재 우선순위 (2026-02-14 기준)**:
- P0: Minigame 시스템 (KR 1.4, 0% → 40% 필요, 마감일 2026-03-15)
- P0: 와디즈 펀딩 준비 (KR 2.1~2.4, 0%, 마감일 2026-03-31)
- P1: PVP 매칭 최적화 (KR 1.3, 70% → 95%, 마감일 2026-02-28)
- P1: 사운드 시스템 (KR 3.4, 0% → 100%, 마감일 2026-04-30)

#### 5. OKR 리뷰 및 업데이트
**매주 월요일 OKR 진행률을 확인하고, 매월 말 리뷰를 진행합니다.**

**주간 체크인 (매주 월요일)**:
- Initiatives 체크리스트 업데이트
- 완료된 항목 체크 및 새로운 블로커 식별
- 우선순위 재조정

**월간 리뷰 (매월 마지막 금요일)**:
- Key Results 달성률 측정 및 분석
- 목표 미달 시 원인 분석 및 대책 수립
- 필요 시 KR 수정 또는 새로운 Initiatives 추가

### AI 어시스턴트의 OKR 활용 방법

#### 작업 시작 시
1. **OKR.md 파일을 먼저 읽고** 현재 프로젝트의 목표를 이해합니다
2. 사용자 요청이 어느 Objective/KR과 연결되는지 명시합니다
3. 작업의 예상 KR 기여도를 추정합니다

**예시**:
```
사용자: "PVP 매칭 로직을 개선해줘"

AI 응답:
"PVP 매칭 로직 개선 작업을 시작하겠습니다.

📊 OKR 연계:
- Objective 1: 플레이어가 매일 돌아오는 세계 구축
- KR 1.3: PVP 매칭 성공률 95% 달성 및 평균 대기 시간 30초 이내
- 현재 달성률: 70% (성공률), 60초 (대기 시간)
- 예상 기여: 성공률 85% → 95%, 대기 시간 60초 → 30초

작업 내용:
1. 매칭 알고리즘 최적화
2. 타임아웃 로직 개선
3. 재연결 처리 강화
..."
```

#### 작업 완료 시
1. **측정 가능한 결과를 포함**하여 보고합니다
2. **OKR 달성률 업데이트**를 제안합니다
3. **다음 우선순위 작업**을 추천합니다

**예시**:
```
"PVP 매칭 로직 개선을 완료했습니다!

📈 성과 지표:
- Before: 매칭 성공률 70%, 평균 대기 시간 60초
- After: 매칭 성공률 95%, 평균 대기 시간 28초
- 목표 대비: KR 1.3 완전 달성 ✅

💡 OKR 업데이트 제안:
OKR.md의 KR 1.3 상태를 '95% 달성'으로 업데이트하시겠습니까?

🎯 다음 우선순위:
현재 Minigame 시스템(KR 1.4)이 0%이며 마감일이 임박합니다(P0).
다음 작업으로 가위바위보 시스템 구현을 시작하시겠습니까?"
```

#### 새로운 작업 제안 시
1. **OKR에 없는 작업은 신중하게 제안**합니다
2. 새로운 작업이 **기존 KR 달성에 방해가 되지 않는지** 확인합니다
3. 정말 필요하다면 **새로운 Initiative 추가를 제안**합니다

### OKR 기반 커밋 메시지

**커밋 메시지에 OKR 연계 정보를 포함합니다.**

**형식**:
```
[OKR-{Objective번호}.{KR번호}] {타입}: {커밋 메시지}

예시:
[OKR-1.3] feat: optimize PVP matching algorithm to achieve 95% success rate
[OKR-1.4] feat: implement minigame rock-paper-scissors battle system
[OKR-2.1] feat: create Wadiz funding preview page
[OKR-3.4] feat: integrate ElevenLabs TTS for character voices
```

### OKR 실패 시 대응

**KR 달성이 어려울 경우 즉시 보고하고 대책을 논의합니다.**

**70% 미만 달성 예상 시**:
1. 원인 분석 (기술적 한계, 리소스 부족, 요구사항 변경 등)
2. 대책 수립 (범위 축소, 마감일 연장, 리소스 추가)
3. OKR 수정 제안 (KR 조정 또는 Objective 재정의)

**보고 형식**:
```
⚠️ OKR 달성 위험 알림

- KR 1.4: Minigame 일일 참여율 40% 목표
- 현재 달성률: 15% (목표 대비 37.5%)
- 예상 최종 달성률: 25% (62.5%)
- 마감일까지 남은 시간: 4주

원인:
- UI/UX가 복잡하여 신규 유저 진입 장벽 높음
- 튜토리얼 부재로 게임 방법 이해 어려움

제안 대책:
1. 튜토리얼 추가 (예상 소요: 1주)
2. UI 간소화 (예상 소요: 3일)
3. 또는 KR 목표를 40% → 25%로 조정
```

## 코딩 스타일 가이드

### TypeScript
- 엄격한 타입 정의 사용
- 인터페이스 우선 (CardData, UserProfile 등)
- any 사용 지양

### React 컴포넌트
- **"use client" 지시어 필수**
  - Hook 사용하는 모든 컴포넌트
  - Context 사용하는 모든 컴포넌트
- **Context Provider는 최상위에서 래핑**
- **useEffect로 중복 리스너 지양** (UserContext 직접 구독)

### 네이밍 컨벤션
- 컴포넌트: PascalCase (`GameTopBar`, `Season1EndingModal`)
- 함수/변수: camelCase (`handleAutoSelect`, `currentDialogue`)
- 상수: UPPER_SNAKE_CASE (`DEFAULT_STATS`, `RESET_HOUR`)
- 파일명: kebab-case (`card-generation-system.ts`, `story-system.ts`)

### CSS/Tailwind
- Tailwind 우선 사용
- CSS Module은 복잡한 애니메이션에만 사용
- 일관된 색상 팔레트 유지 (사이버펑크 테마)

## 디버깅 및 트러블슈팅

### 자주 발생하는 문제

1. **"createContext only works in Client Components"**
   - 해결: 컴포넌트 최상단에 `"use client"` 추가

2. **"useGame must be used within GameProvider"**
   - 해결: `layout.tsx`에서 Provider로 전체 트리 래핑

3. **UI 깜빡임 (Flicker)**
   - 원인: 개별 useEffect 리스너로 인한 지연
   - 해결: UserContext 직접 구독으로 변경

4. **카드 스탯 0 또는 극단적 수치**
   - 원인: 스탯 분배 로직 오류
   - 해결: 최소값 보장 및 비율 조정

5. **포트 충돌 및 잠금 파일**
   - 해결: 기존 프로세스 종료 후 `.next/dev/lock` 삭제

## 현재 개발 중인 기능

### 1. Card Clash System
- 실시간 카드 배틀 시스템
- 파일: `lib/card-clash-service.ts`, `lib/card-clash-types.ts`

### 2. Minigame System
- 미니게임 시스템
- 파일: `lib/minigame-system.ts`, `lib/realtime-minigame-service.ts`

### 3. Sound Effects
- 사운드 효과 시스템
- 파일: `lib/sound-effects.ts`

## 향후 계획

### 단기 (우선순위 높음)
- [ ] Card Clash 시스템 완성
- [ ] Minigame 시스템 완성
- [ ] 사운드 효과 시스템 통합
- [ ] ElevenLabs TTS 통합 (캐릭터 보이스)
- [ ] Suno BGM 통합

### 중기
- [ ] 시즌 2 스토리 라인 ("도원결의 편")
- [ ] 스토리 분기 시스템
- [ ] 캐릭터 애니메이션
- [ ] 파티클 효과

### 장기
- [ ] 다국어 지원
- [ ] 모바일 최적화
- [ ] 리더보드 시스템 강화

## 중요 파일 및 경로

### 핵심 Context
- `frontend/context/UserContext.tsx` - 사용자 상태 관리

### 게임 시스템
- `frontend/lib/card-generation-system.ts` - 카드 생성
- `frontend/lib/generation-utils.ts` - 슬롯 관리
- `frontend/lib/story-system.ts` - 스토리 진행
- `frontend/lib/pvp-battle-system.ts` - PVP 전투
- `frontend/lib/firebase-db.ts` - Firebase 연동

### 데이터
- `frontend/data/story-system.ts` - 스토리 데이터
- `frontend/data/season1-ending.ts` - 시즌 1 엔딩
- `frontend/lib/character-portraits.ts` - 캐릭터 정보

### UI 컴포넌트
- `frontend/components/GameTopBar.tsx` - 상단바
- `frontend/components/DynamicFooter.tsx` - 하단 네비게이션
- `frontend/components/CommanderProfileModal.tsx` - 프로필 모달
- `frontend/components/Season1EndingModal.tsx` - 엔딩 모달

## AI 어시스턴트에게 요청할 때

### 선호하는 작업 방식
1. **먼저 관련 파일을 읽고 이해한 후 작업 시작**
2. **작업 전 TODO 리스트 작성** (복잡한 작업일 경우)
3. **작업 중 발견한 UX 문제는 즉시 제안**
4. **작업 완료 후 테스트 시나리오 제시**
5. **세션 로그 작성 (중요 작업일 경우)**

### 커뮤니케이션 스타일
- 기술적 세부사항을 명확히 설명
- "상황", "해결", "기술적 포인트" 형식 선호
- 작업 후 "검증" 단계 포함
- 이모지 사용 OK (📝, ✅, 🎯, 🔧 등)

### 금지 사항
- **중복 코드 생성 금지** (SSOT 원칙)
- **로컬 스토리지를 SSOT로 사용 금지**
- **검증 없이 "완료했습니다" 보고 금지**
- **임의로 파일 구조 변경 금지** (반드시 먼저 논의)

## 참고 자료

### 문서 위치
- 개발 계획: `frontend/docs/MINIGAME_PLAN.md`, `frontend/docs/WADIZ_PLAN.md`
- 세션 로그: `frontend/session-logs/`, `frontend/session-log/`

### Git 브랜치 전략
- `main`: 프로덕션 브랜치
- 기능 개발: 직접 main에 커밋 (소규모 프로젝트)

### 개발 환경
- Node.js 버전: 최신 LTS
- Package Manager: npm
- 개발 서버: `npm run dev` (기본 포트 3000)
- 빌드: `npm run build`

---

**마지막 업데이트**: 2026-02-14
**작성자**: AI War 개발팀 (with Claude Code)
