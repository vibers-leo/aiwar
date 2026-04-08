# aiwar/toss — 앱인토스 미니앱

AGI WAR 앱인토스 버전. 실시간 AI 전략 PVP 배틀.

## 앱인토스 개발 가이드

```
@~/.claude/skills/appintoss/SKILL.md
```

## 앱 정보

- **appName**: aiwar
- **displayName**: AI 대결
- **primaryColor**: #1B1B2F
- **흐름**: 진입 → 매칭 → 전략 선택 → 결과 → 포인트

## 기술 스택

- Vite + React + TypeScript
- Tailwind CSS v4
- framer-motion, lucide-react
- Vercel Serverless Functions (api/)
- 실제 배틀: Firebase Realtime DB 연동 예정

## 개발 명령어

```bash
npm run dev        # localhost:3410
npx vercel dev --listen 3411  # API 서버
npm run build
```

## 핵심 컴포넌트

- `src/components/BattlePage.tsx` — 메인 루트 컴포넌트 (홈/매칭/배틀/결과 4단계)
- `api/battle.ts` — 배틀 결과 API

## 콘솔

https://apps-in-toss.toss.im/ (bababapet@naver.com)
