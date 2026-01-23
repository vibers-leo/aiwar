# 세션 로그: Vercel Agent Skills 도입 및 코드 리뷰 워크플로우 생성

**날짜**: 2026-01-19
**주요 목표**: Vercel Agent Skills를 참조하여 프로젝트에 자동화된 코드 리뷰 워크플로우 도입

---

## 📋 작업 개요

Vercel에서 공개한 `agent-skills`의 Best Practice를 우리 프로젝트(`ai-war`)의 에이전트 워크플로우로 이식하였습니다. 이를 통해 성능 최적화와 UI/UX 품질 관리를 위한 체계적인 리뷰 시스템을 구축했습니다.

---

## ✅ 완료된 작업

### 1. 성능 리뷰 워크플로우 생성 (`/review-performance`)

**파일**: `.agent/workflows/review-performance.md`

**주요 점검 항목**:
- **Core Web Vitals**: LCP, CLS 최적화 (이미지 우선순위, 사이즈 명시 등)
- **렌더링 최적화**: Server Components 활용, Suspense 경계, 불필요한 리렌더링 방지
- **데이터 페칭**: 병렬 처리(Promise.all), 캐싱 전략, Colocation
- **번들 최적화**: Dynamic Imports, Tree-shaking 확인

**사용법**:
```bash
/review-performance [파일경로] 성능 최적화 점검해줘
```

### 2. UI/UX 디자인 리뷰 워크플로우 생성 (`/review-ui`)

**파일**: `.agent/workflows/review-ui.md`

**주요 점검 항목**:
- **접근성(A11y)**: 시맨틱 태그 사용, Alt 텍스트, 색상 대비, 폼 라벨링
- **반응형 디자인**: 모바일 퍼스트, 터치 타겟 크기(44px+), 오버플로우 방지
- **UI 폴리싱**: 로딩 상태(스켈레톤), 호버/포커스 피드백, 부드러운 트랜지션
- **에러 처리**: 빈 상태(Empty State), 에러 바운더리

**사용법**:
```bash
/review-ui [파일경로] UI/UX 및 접근성 점검해줘
```

---

## 📝 특이사항

- `vercel-labs/agent-skills` 레포지토리의 직접 분석은 보류되었으나, 핵심 기술인 `react-best-practices`와 `web-design-guidelines`의 내용을 기반으로 커스텀 워크플로우를 성공적으로 생성했습니다.
- 이제 에이전트에게 `/slash-command` 형태로 전문적인 코드 리뷰를 요청할 수 있습니다.

---

## 🔜 향후 활용 계획

- 주요 기능 구현 후 커밋 전 `/review-performance`를 통해 성능 병목 사전 차단
- 신규 페이지 개발 시 `/review-ui`를 통해 디자인 가이드라인 준수 여부 자동 점검
