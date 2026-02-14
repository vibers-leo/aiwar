# AI War 개발 워크플로우 가이드

## 📋 개요

AI War 프로젝트의 효율적인 개발을 위한 환경 설정 및 워크플로우 가이드입니다.

**작성일**: 2026-02-14
**OKR 연계**: 개발 속도 +30%, 배포 안정성 향상

---

## 🎯 개발 모드 종류

### 1. 일반 개발 모드 (Firebase 연결)

```bash
npm run dev
```

**용도**:
- 실제 Firebase 연결 필요한 기능 개발
- 백엔드 통합 테스트
- 실시간 데이터 동기화 테스트

**환경 파일**: `.env.local` 또는 `.env.development`

**장점**:
- ✅ 실제 데이터베이스 사용
- ✅ 인증 시스템 정상 작동
- ✅ 실시간 기능 테스트 가능

**단점**:
- ⚠️ Firebase 프로젝트 설정 필요
- ⚠️ 네트워크 연결 필수
- ⚠️ API 호출 비용 발생 가능

---

### 2. Mock 개발 모드 (Firebase 불필요)

```bash
npm run dev:mock
```

**용도**:
- UI/UX 개발
- 프론트엔드 로직 개발
- Firebase 없이 빠른 프로토타이핑
- 오프라인 개발

**환경 파일**: `.env.development.mock`

**장점**:
- ✅ Firebase 설정 불필요
- ✅ 오프라인 개발 가능
- ✅ 빠른 응답 속도
- ✅ API 비용 없음
- ✅ 병렬 개발 가능 (백엔드 대기 불필요)

**단점**:
- ⚠️ 실제 데이터 동기화 안 됨
- ⚠️ Mock 데이터로 제한

**Mock 데이터 위치**: `/frontend/lib/mock-data.ts`

---

### 3. 프로덕션 미리보기 모드

```bash
npm run dev:prod
```

**용도**:
- 프로덕션 환경 시뮬레이션
- 배포 전 최종 테스트

**환경 파일**: `.env.production`

---

## 📁 환경 변수 파일 구조

```
frontend/
├── .env.local              # 기본 개발 환경 (Git 제외)
├── .env.development        # 개발 환경 설정
├── .env.development.mock   # Mock 모드 설정
├── .env.production         # 프로덕션 환경 설정
└── .env.example            # 환경 변수 예시 (Git 포함)
```

### 우선순위

Next.js 환경 변수 로딩 순서:
1. `.env.local` (최우선, 모든 환경)
2. `.env.development` (개발 모드)
3. `.env.production` (프로덕션 모드)
4. `.env` (공통)

---

## 🔧 Mock API 사용법

### 기본 사용법

```typescript
// 1. Mock API import
import { getAPI, mockFirebaseDB } from '@/lib/mock-api';
import * as realFirebaseDB from '@/lib/firebase-db';

// 2. 환경에 따라 자동 선택
const db = getAPI(realFirebaseDB, mockFirebaseDB);

// 3. 동일한 인터페이스로 사용
const profile = await db.loadUserProfile(userId);
const inventory = await db.loadInventory(userId);
```

### Mock 데이터 커스터마이징

`/frontend/lib/mock-data.ts` 파일 수정:

```typescript
// Mock 사용자 변경
export const mockUserProfile = {
    userId: 'custom-user-id',
    displayName: 'Custom Name',
    level: 99,
    coins: 999999,
    // ...
};

// Mock 카드 추가
export const mockInventory = [
    // 기존 카드...
    {
        id: 'custom-card-1',
        name: 'Custom Warrior',
        rarity: 'mythic',
        // ...
    },
];
```

---

## 🚀 개발 시나리오별 워크플로우

### 시나리오 1: UI 컴포넌트 개발

**목표**: 새로운 카드 표시 컴포넌트 개발

```bash
# 1. Mock 모드로 시작
npm run dev:mock

# 2. Mock 데이터 준비
# lib/mock-data.ts에 테스트용 카드 추가

# 3. 컴포넌트 개발
# components/NewCardComponent.tsx 작성

# 4. 브라우저에서 즉시 확인
# http://localhost:3000

# 5. 완료 후 실제 Firebase 연결 테스트
npm run dev
```

**예상 시간**: Mock 모드로 50% 단축

---

### 시나리오 2: 전투 시스템 로직 개발

**목표**: 새로운 전투 알고리즘 추가

```bash
# 1. Mock 모드로 시작 (빠른 테스트)
npm run dev:mock

# 2. lib/battle-system.ts 수정

# 3. Mock 전투 데이터로 테스트
# 브라우저 콘솔에서 즉시 확인

# 4. 로직 확정 후 Firebase 연동
npm run dev

# 5. 실제 데이터로 최종 검증
```

---

### 시나리오 3: 병렬 개발 (프론트엔드 + 백엔드)

**상황**: 백엔드 API가 아직 준비되지 않음

**프론트엔드 개발자**:
```bash
# Mock API 사용
npm run dev:mock

# Mock 데이터로 UI 완성
# lib/mock-api.ts의 mockFirebaseDB 사용
```

**백엔드 개발자**:
```bash
# 실제 Firebase 연결
npm run dev

# Firebase Functions 개발
# Firestore 스키마 설계
```

**통합 시점**:
```bash
# 백엔드 준비 완료 후
# Mock API → Real API 전환
# .env.local의 NEXT_PUBLIC_USE_MOCK=false 설정
```

---

## 🧪 테스트 워크플로우

### 단위 테스트 (Mock 데이터)

```bash
# Mock 모드로 빠른 테스트
NEXT_PUBLIC_USE_MOCK=true npm test

# 또는
npm run dev:mock
# 브라우저 콘솔에서 수동 테스트
```

### E2E 테스트 (실제 Firebase)

```bash
# 1. 개발 서버 시작
npm run dev

# 2. E2E 테스트 실행
npm run test

# 또는 특정 테스트만
npm run test:minigame
```

---

## 🔄 Git 워크플로우

### 브랜치 전략

```
main (프로덕션)
├── develop (개발)
│   ├── feature/new-card-system
│   ├── feature/pvp-matching
│   └── bugfix/inventory-sync
```

### 커밋 메시지 형식

```bash
[OKR-X.Y] type: subject

# 예시:
[OKR-1.4] feat: add mock API layer for minigame
[OKR-2.1] fix: resolve inventory sync issue
[OKR-3.1] docs: update development workflow guide
```

**타입**:
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서
- `test`: 테스트
- `refactor`: 리팩토링
- `style`: 코드 스타일
- `chore`: 기타

---

## 📊 환경별 설정 비교

| 항목 | dev (일반) | dev:mock | dev:prod |
|------|-----------|----------|----------|
| Firebase 연결 | ✅ | ❌ | ✅ |
| 네트워크 필수 | ✅ | ❌ | ✅ |
| 응답 속도 | 보통 | 빠름 | 보통 |
| 실제 데이터 | ✅ | ❌ | ✅ |
| API 비용 | 발생 | 없음 | 발생 |
| 오프라인 개발 | ❌ | ✅ | ❌ |
| 병렬 개발 | 불가 | ✅ | 불가 |

---

## 🛠️ 문제 해결

### Q1: Mock 모드인데 Firebase 에러가 발생해요

**원인**: 환경 변수가 올바르게 설정되지 않음

**해결**:
```bash
# .env 파일 확인
cat frontend/.env.development.mock

# NEXT_PUBLIC_USE_MOCK=true 확인

# 개발 서버 재시작
npm run dev:mock
```

### Q2: Mock 데이터가 변경되지 않아요

**원인**: 브라우저 캐시 또는 Next.js 캐시

**해결**:
```bash
# 1. 브라우저 하드 리프레시 (Cmd+Shift+R)

# 2. Next.js 캐시 삭제
rm -rf .next
npm run dev:mock

# 3. 브라우저 캐시 삭제
# 개발자 도구 > Application > Clear storage
```

### Q3: 실제 모드와 Mock 모드 전환이 안 돼요

**원인**: 환경 변수가 빌드 시점에 고정됨

**해결**:
```bash
# 서버 완전히 종료
lsof -ti:3000 | xargs kill -9

# 원하는 모드로 재시작
npm run dev        # 실제 모드
npm run dev:mock   # Mock 모드
```

---

## 📚 관련 문서

- [OKR.md](../OKR.md) - 프로젝트 목표
- [CLAUDE.md](../CLAUDE.md) - 개발 가이드라인
- [REALTIME_DATABASE_SETUP.md](./REALTIME_DATABASE_SETUP.md) - Firebase 설정
- [README.md](../frontend/tests/README.md) - E2E 테스트 가이드

---

## 🎯 Best Practices

### DO ✅

- **Mock 모드로 UI 먼저 개발**, 나중에 Firebase 연동
- **환경 변수를 .env.example에 문서화**
- **Mock 데이터를 실제 데이터 구조와 동일하게 유지**
- **Git에 .env.local은 절대 커밋하지 않기** (.gitignore 확인)

### DON'T ❌

- **프로덕션 환경 변수를 개발에 사용하지 않기**
- **Mock 모드 코드를 프로덕션 빌드에 포함하지 않기**
- **API 키를 코드에 하드코딩하지 않기**

---

## 🚀 다음 단계

1. **Mock API 활용**: 새 기능 개발 시 Mock 모드부터 시작
2. **병렬 개발**: 프론트엔드/백엔드 동시 작업
3. **CI/CD 구축**: GitHub Actions로 자동 테스트
4. **성능 최적화**: Mock 데이터로 프로파일링

---

**작성자**: Claude Code
**마지막 업데이트**: 2026-02-14
**OKR**: 개발 효율성 +30%
