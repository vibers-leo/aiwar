---
name: react-best-practices
description: React and Next.js performance optimization guidelines for AI War project. Use when writing, reviewing, or refactoring React/Next.js code.
---

# AI War React Best Practices

Vercel의 React 베스트 프랙티스를 AI War 프로젝트에 맞게 적용한 가이드입니다.

## 🔴 CRITICAL - 반드시 적용

### 1. Bundle Size Optimization

#### Dynamic Imports for Heavy Components
무거운 컴포넌트는 `next/dynamic`으로 lazy-load합니다.

```tsx
// ❌ 잘못된 방식 - 초기 번들에 포함됨
import { MonacoEditor } from './monaco-editor'
import { ChessBoard } from './chess-board'

// ✅ 올바른 방식 - 필요할 때 로드
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('./monaco-editor').then(m => m.MonacoEditor),
  { ssr: false }
)

const ChessBoard = dynamic(
  () => import('./chess-board').then(m => m.ChessBoard),
  { ssr: false, loading: () => <div>Loading...</div> }
)
```

**AI War에서 dynamic import 대상:**
- `@react-three/drei`, `@react-three/fiber` (3D 렌더링)
- `framer-motion` (복잡한 애니메이션)
- `lottie-react` (Lottie 애니메이션)
- 에디터, 차트 컴포넌트

#### Direct Imports (Barrel file 피하기)
```tsx
// ❌ 잘못된 방식 - 전체 라이브러리 로드
import { motion, AnimatePresence } from 'framer-motion'

// ✅ 올바른 방식 - 필요한 것만 로드
import { motion } from 'framer-motion/m'
```

### 2. Async Operations - Waterfall 제거

#### Promise.all() 사용
독립적인 비동기 작업은 병렬 실행합니다.

```tsx
// ❌ 잘못된 방식 - 순차 실행 (3 round trips)
const user = await fetchUser()
const cards = await fetchCards()
const battleHistory = await fetchBattleHistory()

// ✅ 올바른 방식 - 병렬 실행 (1 round trip)
const [user, cards, battleHistory] = await Promise.all([
  fetchUser(),
  fetchCards(),
  fetchBattleHistory()
])
```

**AI War 적용 예시:**
```tsx
// Firebase 데이터 로딩 시
const loadGameData = async () => {
  const [factions, cards, userStats] = await Promise.all([
    getDocs(collection(db, 'factions')),
    getDocs(collection(db, 'cards')),
    getDoc(doc(db, 'users', userId))
  ])
}
```

## 🟠 HIGH - 권장 적용

### 3. Server-Side Performance

#### React.cache() 사용
서버 컴포넌트에서 데이터 중복 요청 방지:

```tsx
import { cache } from 'react'

export const getUser = cache(async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`)
  return response.json()
})
```

#### 최소화된 클라이언트 데이터 전달
```tsx
// ❌ 전체 객체 전달
<ClientComponent user={user} />

// ✅ 필요한 것만 전달
<ClientComponent 
  userName={user.name} 
  userAvatar={user.avatar} 
/>
```

### 4. Client-Side Data Fetching

#### SWR 사용
```tsx
import useSWR from 'swr'

function CardList() {
  const { data, error, isLoading } = useSWR('/api/cards', fetcher)
  
  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage />
  return <Cards data={data} />
}
```

## 🟡 MEDIUM - 성능 최적화

### 5. Re-render Optimization

#### useMemo/useCallback 올바른 사용
```tsx
// ❌ 불필요한 리렌더링
const cards = cardList.filter(c => c.rarity === 'legendary')

// ✅ 메모이제이션
const legendaryCards = useMemo(
  () => cardList.filter(c => c.rarity === 'legendary'),
  [cardList]
)

// ❌ 매 렌더마다 새 함수 생성
<Button onClick={() => handleClick(id)} />

// ✅ 안정적인 콜백
const handleCardClick = useCallback(
  (id: string) => handleClick(id),
  [handleClick]
)
```

#### Lazy State Initialization
```tsx
// ❌ 매 렌더마다 실행
const [cards, setCards] = useState(expensiveComputation())

// ✅ 초기 렌더링에만 실행
const [cards, setCards] = useState(() => expensiveComputation())
```

### 6. Rendering Performance

#### content-visibility 사용 (긴 목록)
```css
.card-list-item {
  content-visibility: auto;
  contain-intrinsic-size: 200px;
}
```

#### 조건부 렌더링
```tsx
// ❌ && 사용 시 falsy 값 문제
{count && <Badge>{count}</Badge>}

// ✅ 삼항 연산자 사용
{count > 0 ? <Badge>{count}</Badge> : null}
```

## 🟢 LOW - 마이크로 최적화

### 7. JavaScript Performance

#### Set/Map 사용 (O(1) 조회)
```tsx
// ❌ 배열 includes (O(n))
const selectedIds = ['id1', 'id2', 'id3']
if (selectedIds.includes(cardId)) { ... }

// ✅ Set 사용 (O(1))
const selectedIds = new Set(['id1', 'id2', 'id3'])
if (selectedIds.has(cardId)) { ... }
```

#### Early Exit
```tsx
// ❌ 중첩된 조건문
function processCard(card) {
  if (card) {
    if (card.isValid) {
      // 로직
    }
  }
}

// ✅ 빠른 반환
function processCard(card) {
  if (!card || !card.isValid) return
  // 로직
}
```

---

## AI War 특화 가이드라인

### Firebase 최적화
```tsx
// 배치 쓰기 사용
import { writeBatch, doc } from 'firebase/firestore'

const batch = writeBatch(db)
cards.forEach(card => {
  batch.set(doc(db, 'cards', card.id), card)
})
await batch.commit()
```

### 이미지 최적화
```tsx
import Image from 'next/image'

// 항상 next/image 사용
<Image
  src={cardImage}
  alt={cardName}
  width={300}
  height={400}
  priority={isAboveFold}
  placeholder="blur"
/>
```

### 애니메이션 최적화
```tsx
// GPU 가속 속성만 사용
// 좋음: transform, opacity
// 나쁨: width, height, top, left

const cardVariants = {
  hover: {
    scale: 1.05,      // ✅ transform
    opacity: 0.9,     // ✅ opacity
    // width: '110%', // ❌ layout thrashing
  }
}
```
