# AI War CI/CD 파이프라인 설정 가이드

## 📋 개요

GitHub Actions를 사용한 자동화된 CI/CD 파이프라인입니다.

**작성일**: 2026-02-15
**OKR 연계**: 개발 효율성 +30%, 배포 안정성 향상

---

## 🔄 CI/CD 워크플로우

### 자동 실행 트리거

```yaml
# 다음 이벤트 발생 시 자동 실행
- main 브랜치에 push
- develop 브랜치에 push
- main/develop에 대한 Pull Request 생성
```

### 4단계 파이프라인

```
1. Lint & Type Check (병렬)
   ├── ESLint 검사
   └── TypeScript 타입 체크

2. Build Test
   ├── npm ci (의존성 설치)
   ├── .env.local 생성 (Mock 모드)
   ├── Next.js 빌드
   └── 빌드 결과물 아티팩트 업로드

3. E2E Tests (선택적)
   ├── Playwright 브라우저 설치
   ├── E2E 테스트 실행
   └── 테스트 리포트 업로드
   (실패해도 다음 단계 진행)

4. Deploy (main 브랜치만)
   ├── 프로덕션 빌드
   └── Firebase Hosting 배포
```

---

## 🚀 초기 설정

### 1. GitHub Secrets 설정

**Firebase 인증 정보를 GitHub Secrets에 등록해야 합니다.**

#### 1-1. Firebase Service Account 생성

```bash
# Firebase 프로젝트 디렉토리에서
firebase login
firebase projects:list

# Service Account 키 생성
firebase init hosting:github
```

또는 수동 생성:

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 설정 > 서비스 계정
3. "새 비공개 키 생성" 클릭
4. JSON 파일 다운로드

#### 1-2. GitHub Secrets 등록

**GitHub Repository > Settings > Secrets and variables > Actions > New repository secret**

다음 Secrets를 등록:

| Secret Name | 값 | 설명 |
|-------------|-----|------|
| `FIREBASE_SERVICE_ACCOUNT` | JSON 파일 전체 내용 | Firebase 서비스 계정 키 |
| `FIREBASE_API_KEY` | `AIzaSy...` | `.env.local`의 값 |
| `FIREBASE_AUTH_DOMAIN` | `aiwar-14246.firebaseapp.com` | Firebase Auth 도메인 |
| `FIREBASE_PROJECT_ID` | `aiwar-14246` | Firebase 프로젝트 ID |
| `FIREBASE_STORAGE_BUCKET` | `aiwar-14246.firebasestorage.app` | Storage 버킷 |
| `FIREBASE_MESSAGING_SENDER_ID` | `954193586426` | FCM Sender ID |
| `FIREBASE_APP_ID` | `1:954193...` | Firebase App ID |
| `FIREBASE_DATABASE_URL` | `https://aiwar-14246...` | Realtime DB URL |

**⚠️ 보안 주의**: 절대 이 값들을 코드에 하드코딩하지 마세요!

---

## 📊 CI/CD 사용법

### 1. 자동 빌드 & 테스트

**코드 푸시 시 자동 실행**:

```bash
git add .
git commit -m "[OKR-1.1] feat: add new feature"
git push origin main
```

### 2. Pull Request 검증

```bash
# feature 브랜치에서 작업
git checkout -b feature/new-feature
git commit -m "feat: implement new feature"
git push origin feature/new-feature

# GitHub에서 PR 생성 → CI 자동 실행
```

### 3. 수동 배포 (선택)

```bash
# main 브랜치에 푸시하면 자동 배포
git checkout main
git merge feature/new-feature
git push origin main
# → Firebase Hosting에 자동 배포
```

---

## 🧪 로컬에서 CI 시뮬레이션

### CI 환경과 동일하게 테스트

```bash
# 1. Mock 모드로 빌드
cd frontend
npm ci
npm run build

# 2. Lint 검사
npm run lint

# 3. 타입 체크
npx tsc --noEmit

# 4. E2E 테스트
npm run test
```

---

## 📈 CI/CD 결과 확인

### GitHub Actions 탭

1. GitHub Repository 접속
2. **Actions** 탭 클릭
3. 워크플로우 실행 목록 확인

### 배지 추가 (선택)

README.md에 CI 상태 배지 추가:

```markdown
[![CI/CD](https://github.com/your-username/ai-war/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/ai-war/actions/workflows/ci.yml)
```

---

## 🔧 문제 해결

### Q1: "Secrets not found" 에러

**원인**: GitHub Secrets 미설정

**해결**:
```bash
# 1. Firebase Service Account JSON 생성
firebase init hosting:github

# 2. GitHub Settings > Secrets에 등록
```

### Q2: 빌드 실패 - "Module not found"

**원인**: package-lock.json 동기화 문제

**해결**:
```bash
# 로컬에서
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
git push
```

### Q3: E2E 테스트 타임아웃

**원인**: GitHub Actions 환경에서 브라우저 실행 속도 느림

**해결**: 이미 `continue-on-error: true` 설정됨 (실패해도 진행)

필요 시 타임아웃 연장:
```yaml
# .github/workflows/ci.yml
- name: Run Playwright tests
  run: npm run test
  timeout-minutes: 10  # 기본 5분 → 10분
```

### Q4: Firebase 배포 실패

**원인 1**: Service Account 권한 부족

**해결**:
```bash
# Firebase Console > IAM 및 관리자
# Service Account에 "Firebase Hosting 관리자" 역할 추가
```

**원인 2**: firebase.json 설정 오류

**해결**:
```bash
# 로컬에서 배포 테스트
firebase deploy --only hosting
```

---

## 🎯 Best Practices

### DO ✅

- **모든 커밋 전에 로컬 테스트 실행**
  ```bash
  npm run build && npm run lint && npm run test
  ```

- **PR 생성 시 CI 통과 확인 후 머지**
  - 녹색 체크 표시 확인

- **main 브랜치는 항상 배포 가능한 상태 유지**
  - 실험적 코드는 feature 브랜치에서

- **OKR 태그가 포함된 커밋 메시지**
  ```bash
  [OKR-1.3] fix: resolve PVP matching timeout issue
  ```

### DON'T ❌

- **CI 실패 무시하지 않기**
  - 빨간 X 표시 나오면 반드시 수정

- **Secrets를 코드에 하드코딩하지 않기**
  ```typescript
  // ❌ 절대 금지
  const apiKey = "AIzaSyASjSKFJDoy...";

  // ✅ 환경 변수 사용
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  ```

- **main 브랜치에 직접 푸시 지양**
  - PR을 통한 코드 리뷰 권장

---

## 📚 관련 문서

- [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) - 개발 워크플로우
- [OKR.md](../OKR.md) - 프로젝트 목표
- [CLAUDE.md](../CLAUDE.md) - 개발 가이드라인

---

## 🔄 업데이트 내역

| 날짜 | 변경 사항 |
|------|----------|
| 2026-02-15 | 초기 CI/CD 파이프라인 구축 |
| | GitHub Actions 워크플로우 생성 |
| | Firebase Hosting 자동 배포 설정 |

---

**작성자**: Claude Code
**OKR**: 개발 효율성 +30%, 배포 안정성 100%
