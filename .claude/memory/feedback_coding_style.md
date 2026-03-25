---
name: 코딩 스타일 피드백
description: 개발자가 명시적으로 확인한 코딩 방식 선호도
type: feedback
---

**시너지를 배틀에 직접 적용하지 않는다**
**Why:** "다양한 AI 서비스를 알아보고 구독하자"가 게임 목적인데, 배틀 시너지가 있으면 최적 콤보만 쓰게 됨
**How to apply:** 시너지 효과는 생성 시간 단축 + 뱃지 도감으로만 적용. 배틀에는 건드리지 말 것

---

**OKR 커밋 메시지 형식 사용**
**Why:** 작업이 어느 KR에 기여하는지 추적하기 위해
**How to apply:** 커밋 시 `[OKR-X.Y] type: 메시지` 형식 사용. Co-Authored-By 포함

---

**작업 완료 후 반드시 `npx tsc --noEmit` 실행**
**Why:** TypeScript 에러를 미리 잡아야 함
**How to apply:** 파일 수정 후 타입 체크, 에러 없으면 커밋

---

**과도한 추상화 금지**
**Why:** 개발자가 명시적으로 "복잡해지지 않도록 잘 구현해줘" 요청
**How to apply:** 중복 코드 3줄이 추상화 1개보다 낫다. 한 번만 쓰이는 함수/헬퍼 만들지 말 것

---

**Firebase SSOT 원칙**
**Why:** 로컬스토리지와 Firebase 불일치로 버그가 생긴 전례
**How to apply:** 로컬스토리지는 캐싱 용도만. 권위 있는 데이터는 항상 Firebase/UserContext에서
