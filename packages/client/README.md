# @resume/client (Planned)

향후 `src/` 디렉토리를 이 위치로 이동할 예정입니다.

## 개요

- **역할**: React + Vite 기반 프런트엔드 SPA
- **현재 위치**: 루트 `src/`
- **목표 위치**: `packages/client/src/`

## 이동 계획

현재는 플레이스홀더입니다. 루트 프로젝트 `package.json` 이 여전히 프런트엔드 빌드(`vite build`)를 담당합니다.

### 향후 작업

1. `src/` → `packages/client/src/` 이동
2. `index.html`, `vite.config.ts`, `tsconfig.app.json` 이동
3. `packages/client/package.json` 생성 — React, Vite, Tailwind 관련 의존성만 분리
4. 공통 타입은 `@resume/shared` workspace 의존성으로 참조
5. 루트 `pnpm-workspace.yaml` 주석 해제

### 의존성 (예정)

- react, react-dom, react-router-dom
- @tanstack/react-query
- @tiptap/*
- tailwindcss
- vite, @vitejs/plugin-react

## 관련 문서

- 전체 마이그레이션 플랜: [../../MIGRATION.md](../../MIGRATION.md)
