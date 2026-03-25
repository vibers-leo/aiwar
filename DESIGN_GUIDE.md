# AGI WAR 디자인 가이드

## 테마
사이버펑크 / 다크 SF — 어두운 배경에 네온 계열 강조색을 사용하는 게임 UI.

---

## 색상 시스템

### 기본 색상 (globals.css + tailwind.config.ts)
```css
color-scheme: dark;

--background: var(--background);   /* 커스텀 — body 배경 */
--foreground: var(--foreground);   /* 커스텀 — body 텍스트 */
```

### Body 기본
```
배경: bg-gray-950 (#030712)
텍스트: foreground 변수
```

### 강조색 (globals.css 변수)
```css
--primary-blue: #00D9FF;   /* 포커스 링, 네온 블루 */
```

### 등급별 글로우 (pulse-glow 애니메이션)
```css
box-shadow: 0 0 20px ~ 40px rgba(138, 43, 226, 0.5~0.8);  /* 보라색 글로우 */
```

---

## 타이포그래피

### 폰트
```css
/* 제목/UI 숫자 — SF 느낌 */
font-family: 'Orbitron', sans-serif;  /* wght: 400, 500, 700, 900 */

/* 본문/한글 */
font-family: 'Noto Sans KR', sans-serif;  /* wght: 300, 400, 500, 700 */

/* 시스템 폰트 (Next.js 기본) */
--font-geist-sans   /* Geist Sans */
--font-geist-mono   /* Geist Mono */
```

---

## 애니메이션 (tailwind.config.ts)

| 이름 | 설명 | 용도 |
|------|------|------|
| `float` | 3초 상하 부유 | 카드/아이콘 |
| `pulse-glow` | 2초 보라 글로우 펄스 | 등급 표시 |
| `slide-down` | 0.5초 위→아래 | 알림/모달 |
| `slide-up` | 0.5초 아래→위 | 모달/패널 |
| `bounce-in` | 0.6초 바운스 등장 | 보상/획득 |
| `shimmer` | 2초 광택 이동 | 로딩/스켈레톤 |
| `meteor-effect` | 5초 유성 | 배경 장식 |

---

## 접근성 (globals.css)

### 포커스 상태
```css
:focus-visible {
  outline: 2px solid #00D9FF;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 217, 255, 0.2);
}
```

### 모션 감소
```css
@media (prefers-reduced-motion: reduce) {
  /* 모든 애니메이션/트랜지션 0.01ms로 축소 */
}
```

---

## 레이아웃

### 전체 구조
- `MainLayout` 컴포넌트가 상단바(GameTopBar) + 하단 네비게이션(DynamicFooter) 관리
- 콘텐츠 영역은 각 라우트 페이지에서 자체 패딩/마진 처리

### 성능 최적화 클래스
```css
.content-visibility-auto {
  content-visibility: auto;
  contain-intrinsic-size: 0 200px;
}

.card-list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 240px;
}
```

---

## 반응형

모바일 우선 설계. `viewport` 메타에서 `userScalable: false` 적용 (게임 앱 특성).

---

**이 가이드는 tailwind.config.ts와 globals.css에서 추출한 실제 값 기준입니다.**
