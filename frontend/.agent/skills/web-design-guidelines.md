---
name: web-design-guidelines
description: Web Interface Guidelines for AI War project. Use when reviewing UI, checking accessibility, auditing design, or reviewing UX.
---

# AI War Web Design Guidelines

UI 코드 리뷰 및 웹 인터페이스 가이드라인입니다.

## 🎯 Accessibility (접근성)

### ARIA Labels
```tsx
// ❌ 접근성 없음
<button onClick={handleClick}>
  <TrashIcon />
</button>

// ✅ ARIA 라벨 추가
<button 
  onClick={handleClick}
  aria-label="카드 삭제"
>
  <TrashIcon />
</button>
```

### Semantic HTML
```tsx
// ❌ div 남용
<div onClick={handleClick}>Click me</div>

// ✅ 적절한 요소 사용
<button onClick={handleClick}>Click me</button>

// ❌ 제목 순서 무시
<h1>제목</h1>
<h4>부제목</h4>

// ✅ 올바른 순서
<h1>제목</h1>
<h2>부제목</h2>
```

### Keyboard Navigation
```tsx
// ✅ 키보드 핸들러 추가
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Interactive Element
</div>
```

## 🎨 Focus States (포커스 상태)

### Visible Focus
```css
/* ❌ 포커스 숨김 */
*:focus {
  outline: none;
}

/* ✅ 명확한 포커스 표시 */
.interactive-element:focus-visible {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: 2px;
}

.card:focus-visible {
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.5);
}
```

## 📝 Forms (폼)

### Autocomplete
```tsx
// ✅ 자동완성 속성 추가
<input
  type="email"
  name="email"
  autoComplete="email"
  placeholder="이메일 주소"
/>

<input
  type="text"
  name="username"
  autoComplete="username"
  placeholder="사용자 이름"
/>
```

### Validation & Error Handling
```tsx
// ✅ 유효성 검사 및 에러 표시
<form onSubmit={handleSubmit}>
  <label htmlFor="cardName">카드 이름</label>
  <input
    id="cardName"
    type="text"
    value={cardName}
    onChange={handleChange}
    aria-invalid={errors.cardName ? 'true' : 'false'}
    aria-describedby={errors.cardName ? 'cardNameError' : undefined}
  />
  {errors.cardName && (
    <span id="cardNameError" role="alert" className="error">
      {errors.cardName}
    </span>
  )}
</form>
```

## 🎬 Animation (애니메이션)

### Reduced Motion 지원
```css
/* 모션 감소 설정 존중 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// ✅ React에서 모션 감소 처리
import { useReducedMotion } from 'framer-motion'

function Card() {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1.05 }}
    />
  )
}
```

### GPU-Friendly Transforms
```css
/* ❌ Layout thrashing 유발 */
.card:hover {
  width: 110%;
  left: -5%;
}

/* ✅ Compositor-friendly transforms */
.card:hover {
  transform: scale(1.1) translateX(-5%);
}

/* will-change 사용 (필요시에만) */
.animated-card {
  will-change: transform, opacity;
}
```

## 🖼️ Images (이미지)

### Dimensions & Loading
```tsx
// ✅ 항상 크기 지정 + lazy loading
import Image from 'next/image'

<Image
  src={cardImage}
  alt={`${cardName} 카드 이미지`}
  width={300}
  height={400}
  loading="lazy"  // 또는 priority={true} for above-fold
/>

// 일반 img 태그 사용 시
<img
  src={cardImage}
  alt={`${cardName} 카드 이미지`}
  width="300"
  height="400"
  loading="lazy"
/>
```

### Alt Text
```tsx
// ❌ 빈 alt 또는 무의미한 alt
<img src={card} alt="" />
<img src={card} alt="이미지" />

// ✅ 의미있는 alt
<img src={geminiCard} alt="Gemini 군단 유닛 카드 - Legendary 등급" />

// 장식용 이미지는 빈 alt + role="presentation"
<img src={decorativeBg} alt="" role="presentation" />
```

## ⚡ Performance (성능)

### Virtualization (긴 목록)
```tsx
import { FixedSizeList } from 'react-window'

function CardList({ cards }) {
  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={cards.length}
      itemSize={120}
    >
      {({ index, style }) => (
        <CardItem card={cards[index]} style={style} />
      )}
    </FixedSizeList>
  )
}
```

### Preconnect & DNS Prefetch
```tsx
// app/layout.tsx 또는 _document.tsx
<head>
  <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
  <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
</head>
```

## 🌙 Dark Mode & Theming

### Color Scheme
```tsx
// CSS
:root {
  color-scheme: dark light;
  --bg-primary: #0a0a0a;
  --text-primary: #ffffff;
}

// Meta tag
<meta name="theme-color" content="#0a0a0a" />
```

### CSS Variables
```css
/* 테마 변수 사용 */
.card {
  background: var(--card-bg);
  color: var(--card-text);
  border-color: var(--card-border);
}

/* 희귀도별 색상 */
.rarity-common { --rarity-color: #8b8b8b; }
.rarity-rare { --rarity-color: #4a90d9; }
.rarity-epic { --rarity-color: #a855f7; }
.rarity-legendary { --rarity-color: #f59e0b; }
.rarity-unique { --rarity-color: #ef4444; }
```

## 👆 Touch & Interaction

### Touch Action
```css
/* 스와이프/줌 제어 */
.card-slider {
  touch-action: pan-x;  /* 가로 스와이프만 허용 */
}

.game-board {
  touch-action: none;  /* 모든 터치 제스처 직접 제어 */
}
```

### Tap Highlight
```css
/* 모바일 탭 하이라이트 */
.interactive-card {
  -webkit-tap-highlight-color: rgba(168, 85, 247, 0.2);
}

/* 또는 제거 */
.button {
  -webkit-tap-highlight-color: transparent;
}
```

## 🌍 Locale & i18n (국제화)

### Number & Date Formatting
```tsx
// ❌ 하드코딩
const price = `${amount}원`
const date = `${year}년 ${month}월 ${day}일`

// ✅ Intl API 사용
const price = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW'
}).format(amount)

const date = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}).format(new Date())
```

---

## AI War 특화 체크리스트

### 카드 컴포넌트
- [ ] 모든 카드에 적절한 alt 텍스트
- [ ] 호버/포커스 상태 명확히 표시
- [ ] 키보드로 선택 가능
- [ ] 희귀도별 색상이 색맹 친화적
- [ ] 모션 감소 설정 존중

### 전투 화면
- [ ] 스크린 리더로 턴 정보 접근 가능
- [ ] 60fps 유지 (GPU 가속 사용)
- [ ] 터치 디바이스에서 제스처 지원

### 폼 & 입력
- [ ] 모든 입력 필드에 라벨
- [ ] 에러 메시지가 명확하고 접근 가능
- [ ] 자동완성 속성 적용
