# Firebase Realtime Database 활성화 가이드

## 📋 개요

AI War 게임의 PVP 매칭, 미니게임 대전, 실시간 채팅 기능을 위해 Firebase Realtime Database를 활성화하는 단계별 가이드입니다.

**소요 시간**: 약 10-15분
**난이도**: ⭐⭐☆☆☆ (쉬움)
**OKR 영향**: KR 1.3 (PVP 매칭 95%) +30%

---

## 🎯 목표

- ✅ Firebase Realtime Database 생성 및 활성화
- ✅ 보안 규칙 배포
- ✅ 데이터베이스 URL 확인
- ✅ 로컬 환경에서 연결 테스트

---

## 📌 사전 준비

1. **Firebase 프로젝트 접속**
   - Firebase Console: https://console.firebase.google.com/
   - 프로젝트: `aiwar-14246` 선택

2. **권한 확인**
   - 프로젝트 소유자(Owner) 또는 편집자(Editor) 권한 필요
   - 확인 방법: 프로젝트 설정 > 사용자 및 권한

---

## 🚀 Step 1: Realtime Database 생성

### 1.1 Firebase Console 접속

```
1. https://console.firebase.google.com/ 접속
2. "aiwar-14246" 프로젝트 선택
3. 왼쪽 메뉴에서 "빌드(Build)" 클릭
4. "Realtime Database" 클릭
```

### 1.2 데이터베이스 만들기

```
1. "데이터베이스 만들기(Create Database)" 버튼 클릭
2. 데이터베이스 위치 선택:
   - 추천: asia-southeast1 (싱가포르)
   - 이유: 한국과 가장 가까운 리전, 낮은 지연시간
3. "다음" 클릭
```

### 1.3 보안 규칙 설정

```
1. 시작 모드 선택:
   ⚠️ "잠금 모드(Locked mode)" 선택 (보안을 위해 중요!)

2. "사용 설정" 클릭
   - 이유: 우리가 직접 작성한 보안 규칙을 나중에 배포할 예정
   - 테스트 모드는 누구나 읽고 쓸 수 있어 위험함

3. 데이터베이스 생성 완료 대기 (약 30초~1분)
```

---

## 🔒 Step 2: 보안 규칙 배포

### 2.1 데이터베이스 URL 확인

Realtime Database 페이지 상단에 URL이 표시됩니다:

```
https://aiwar-14246-default-rtdb.firebaseio.com
```

또는

```
https://aiwar-14246-default-rtdb.asia-southeast1.firebasedatabase.app
```

**🔔 중요**: 이 URL이 `.env.local` 파일의 `NEXT_PUBLIC_FIREBASE_DATABASE_URL`과 일치하는지 확인하세요!

### 2.2 로컬에서 보안 규칙 배포

터미널에서 다음 명령어 실행:

```bash
cd /Users/admin/Desktop/ai-war

# Firebase CLI로 보안 규칙 배포
firebase deploy --only database

# 예상 출력:
# ✔  Deploy complete!
#
# Project Console: https://console.firebase.google.com/project/aiwar-14246/overview
# Database Rules:  https://aiwar-14246-default-rtdb.firebaseio.com
```

### 2.3 보안 규칙 검증

Firebase Console에서 확인:

```
1. Realtime Database > 규칙(Rules) 탭 클릭
2. 다음과 같은 규칙이 표시되어야 함:
   {
     "rules": {
       "users": { ... },
       "leaderboard": { ... },
       "minigame": { ... },
       ...
     }
   }
3. "게시(Publish)" 버튼이 비활성화되어 있으면 이미 최신 규칙임
```

---

## 🔍 Step 3: 연결 테스트

### 3.1 개발 서버 재시작

```bash
cd frontend
npm run dev
```

### 3.2 브라우저 콘솔 확인

개발 서버 시작 후 브라우저(http://localhost:3000)에서:

```
1. F12 또는 Cmd+Option+I로 개발자 도구 열기
2. Console 탭 확인
3. 다음 메시지가 표시되어야 함:
   ✅ Firebase 초기화 완료
   ✅ Realtime Database 초기화 완료: https://aiwar-14246-default-rtdb.firebaseio.com
```

**❌ 만약 에러가 발생한다면:**

```
Error: Permission denied
→ 보안 규칙이 올바르게 배포되지 않았을 수 있음
→ Step 2.2 다시 실행

Error: databaseURL not configured
→ .env.local 파일 확인
→ NEXT_PUBLIC_FIREBASE_DATABASE_URL 값이 올바른지 확인
```

### 3.3 수동 연결 테스트

브라우저 콘솔에서 직접 테스트:

```javascript
// Firebase가 초기화되었는지 확인
import { database } from './lib/firebase';
console.log('Database:', database);

// 간단한 쓰기 테스트 (테스트 후 삭제 필요)
import { ref, set } from 'firebase/database';
const testRef = ref(database, 'test/connection');
set(testRef, { timestamp: Date.now(), status: 'connected' })
  .then(() => console.log('✅ Write test passed!'))
  .catch(err => console.error('❌ Write test failed:', err));
```

---

## 📊 Step 4: 데이터 구조 확인

### 4.1 Firebase Console에서 데이터 확인

```
1. Realtime Database > 데이터(Data) 탭 클릭
2. 루트 노드 확인:
   - users/
   - leaderboard/global/
   - minigame/cardClash/
   - pvp/queue/
   - waitingRooms/
   - battles/
   - matchmaking/
   - chat/
```

### 4.2 예상 데이터 구조

```json
{
  "users": {
    "<userId>": {
      "profile": {
        "coins": 1000,
        "level": 1,
        "exp": 0,
        "lastLogin": { ".sv": "timestamp" }
      },
      "inventory": [...],
      "research": {...},
      "stageProgress": {...}
    }
  },
  "leaderboard": {
    "global": {
      "<userId>": {
        "displayName": "Player 1",
        "level": 10,
        "totalPower": 5000,
        "winRate": 0.65
      }
    }
  },
  "minigame": {
    "cardClash": {
      "queue": {
        "<userId>": {
          "mode": "sudden-death",
          "betAmount": 1000,
          "hand": [...],
          "timestamp": 1234567890
        }
      }
    }
  }
}
```

---

## ✅ 완료 체크리스트

다음 항목을 모두 확인하세요:

- [ ] Firebase Console에서 Realtime Database가 생성되었음
- [ ] 데이터베이스 리전이 asia-southeast1 (또는 원하는 리전)임
- [ ] 보안 규칙이 배포되었음 (Locked mode)
- [ ] `.env.local`의 DATABASE_URL이 올바름
- [ ] 개발 서버 재시작 완료
- [ ] 브라우저 콘솔에서 "Realtime Database 초기화 완료" 메시지 확인
- [ ] 에러 메시지 없음

---

## 🐛 문제 해결

### Q1: "Permission denied" 에러 발생

**원인**: 보안 규칙이 모든 접근을 차단하고 있음

**해결 방법**:
```bash
# 보안 규칙 다시 배포
firebase deploy --only database

# 또는 Firebase Console에서 수동으로 규칙 수정
```

### Q2: "databaseURL not configured" 에러

**원인**: 환경 변수가 설정되지 않았거나 잘못됨

**해결 방법**:
```bash
# .env.local 파일 확인
cat frontend/.env.local | grep DATABASE_URL

# 예상 출력:
# NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://aiwar-14246-default-rtdb.firebaseio.com

# URL이 없거나 잘못되었다면 수정
nano frontend/.env.local
```

### Q3: 개발 서버를 재시작해도 변경사항이 반영 안 됨

**원인**: Next.js 캐시 문제

**해결 방법**:
```bash
# .next 폴더 삭제 후 재시작
rm -rf frontend/.next
cd frontend && npm run dev
```

### Q4: Firebase CLI 명령어가 작동하지 않음

**원인**: Firebase CLI가 설치되지 않았거나 로그인 안 됨

**해결 방법**:
```bash
# Firebase CLI 설치 (이미 설치되어 있으면 생략)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 확인
firebase projects:list

# aiwar-14246이 목록에 있는지 확인
```

---

## 🎮 다음 단계

Realtime Database 활성화가 완료되었다면:

### 1. PVP 매칭 테스트
```bash
# PVP 테스트 페이지 접속
http://localhost:3000/pvp

# 두 개의 브라우저 탭에서 동시에 매칭 시도
# 서로 매칭되는지 확인
```

### 2. 미니게임 대전 테스트
```bash
# 미니게임 페이지 접속
http://localhost:3000/minigame/sudden-death

# 베팅 후 AI와 대전
# Firebase Console > Data 탭에서 실시간 데이터 변경 확인
```

### 3. E2E 테스트 실행
```bash
cd frontend
npm run test:battle
npm run test:minigame
```

---

## 📚 추가 자료

- [Firebase Realtime Database 공식 문서](https://firebase.google.com/docs/database)
- [보안 규칙 가이드](https://firebase.google.com/docs/database/security)
- [데이터 구조 설계 Best Practices](https://firebase.google.com/docs/database/usage/structure)
- [프로젝트 OKR.md](../OKR.md)

---

**작성일**: 2026-02-14
**작성자**: Claude Code
**OKR 연계**: KR 1.3 (PVP 매칭 95%)
