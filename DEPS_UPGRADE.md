# DEPS_UPGRADE — resume-platform

작성일: 2026-05-21 · agent worktree: `agent-ae38a9fb3fbc09aaf`

## 요약

- **🟢 Safe bump 45개** 적용 (patch/minor). 모두 검증 green.
- **🟡 신중 bump 3개** 적용 (@anthropic-ai/sdk 0.91→0.97, lint-staged 16→17, @swc/cli 0.8→0.9). 사용 surface 좁아 안전.
- **🔴 보류 1개** — recharts 2.x → 3.x (CLAUDE.md 에는 3 도입 완료라 적혀있으나 실제는 2.15.x. 다른 worktree 영역 가능성. 충돌 회피).
- **🧹 제거** — deprecated `@types/bcryptjs`, `@types/dompurify` (둘 다 빌트인 types 보유).
- **🆕 신규 도입 후보** — 제안만, 미적용.
- **🏗 아키 개선 2건** — ReactQueryDevtools dev-only lazy chunk + `.nvmrc`/`.node-version` 통일 (22.12.0).

---

## 🟢 Safe (patch/minor) — 적용 완료

| Package                           | Before  | After    |
| --------------------------------- | ------- | -------- |
| @nestjs/common                    | 11.1.19 | 11.1.21  |
| @nestjs/core                      | 11.1.19 | 11.1.21  |
| @nestjs/platform-express          | 11.1.19 | 11.1.21  |
| @nestjs/swagger                   | 11.4.1  | 11.4.3   |
| @nestjs/testing                   | 11.1.19 | 11.1.21  |
| @swc/core                         | 1.15.30 | 1.15.33  |
| @tanstack/react-query             | 5.100.5 | 5.100.11 |
| @tanstack/react-query-devtools    | 5.100.5 | 5.100.11 |
| @tailwindcss/vite                 | 4.2.4   | 4.3.0    |
| @tiptap/\* (6종)                  | 3.22.4  | 3.23.5   |
| @types/node                       | 25.6.0  | 25.9.1   |
| @types/react                      | 19.2.14 | 19.2.15  |
| @vitejs/plugin-react              | 6.0.1   | 6.0.2    |
| @vitest/ui                        | 4.1.5   | 4.1.7    |
| @vitest/coverage-v8               | 4.1.7   | 4.1.7    |
| @capacitor/{android,cli,core,ios} | 8.3.1   | 8.3.4    |
| dompurify                         | 3.4.1   | 3.4.5    |
| eslint                            | 10.2.1  | 10.4.0   |
| globals                           | 17.5.0  | 17.6.0   |
| i18next                           | 26.0.8  | 26.2.0   |
| jest                              | 30.3.0  | 30.4.2   |
| jsdom                             | 29.0.2  | 29.1.1   |
| msw                               | 2.13.4  | 2.14.6   |
| pg                                | 8.20.0  | 8.21.0   |
| react / react-dom                 | 19.2.5  | 19.2.6   |
| react-hook-form                   | 7.74.0  | 7.76.0   |
| react-i18next                     | 17.0.3  | 17.0.8   |
| react-router-dom                  | 7.14.1  | 7.15.1   |
| sanitize-html                     | 2.17.3  | 2.17.4   |
| swiper                            | 12.1.3  | 12.1.4   |
| tailwindcss                       | 4.2.4   | 4.3.0    |
| ts-jest                           | 29.4.9  | 29.4.10  |
| tsx                               | 4.21.0  | 4.22.3   |
| typescript-eslint                 | 8.59.0  | 8.59.4   |
| vite                              | 8.0.10  | 8.0.13   |
| vitest                            | 4.1.5   | 4.1.7    |
| zod                               | 4.3.6   | 4.4.3    |
| zustand                           | 5.0.12  | 5.0.13   |

## 🟡 Major / 신중 — 적용 완료

| Package           | Before | After  | 근거                                                                                     |
| ----------------- | ------ | ------ | ---------------------------------------------------------------------------------------- |
| @anthropic-ai/sdk | 0.91.1 | 0.97.1 | 사용 surface 좁음 (`messages.create`/`messages.stream` 2 호출). 타입/런타임 호환 확인됨. |
| lint-staged       | 16.4.0 | 17.0.5 | v17 breaking 은 deprecated `--no-stash` 플래그 제거 + Node 20+ 요구. 우리는 둘 다 만족.  |
| @swc/cli          | 0.8.1  | 0.9.0  | 미사용 (NestJS 가 `@swc/core` 직접 사용). 호환 보장.                                     |

## 🔴 보류

| Package  | Current | Latest | 사유                                                                                                             |
| -------- | ------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| recharts | 2.15.4  | 3.8.1  | CLAUDE.md 는 "recharts 3 도입 완료"로 기재되어 있으나 실제는 v2.x. 다른 worktree 가 처리중일 가능성 → 충돌 회피. |

## 🧹 제거 (deprecated)

| Package          | 사유                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------- |
| @types/bcryptjs  | 본 패키지에 빌트인 types 존재 (`umd/index.d.ts`). DefinitelyTyped stub 더 이상 불필요. |
| @types/dompurify | 본 패키지에 빌트인 types 존재 (`dist/purify.cjs.d.ts`). DT stub 불필요.                |

## 🆕 신규 도입 후보 (제안만, 미적용)

- **`nestjs-pino`** — 구조화 JSON 로그. Cloud Run/Stackdriver 연동 시 ROI 큼. 단 GlobalExceptionFilter 와 통합 필요해 별도 PR 권장.
- **`@nestjs/throttler-storage-redis`** — 멀티 인스턴스 환경 대비 (Cloud Run 콜드스타트 분산). Redis 인프라 부재로 보류.
- **`zod-openapi`** — Swagger 와 Zod 통합. DTO class-validator 와 중복 작성 줄임.
- **`@vitest/ui` 활용도 점검** — 이미 dev dep 으로 설치되어 있으나 script 없음. `test:client:ui` 추가 고려.

## 🏗 아키텍처 개선 (적용)

### 1. ReactQueryDevtools dev-only lazy chunk

**파일**: `packages/client/src/App.tsx`

이전엔 static top-level import 후 `import.meta.env.DEV` 가드 사용 → Vite tree-shaking 의존. 명시적 `lazy()` + `Suspense` 로 변경하여 prod 번들에서 완전 분리 보장. `grep` 으로 dist 검증: devtools 코드 prod bundle 부재 확인.

### 2. Node 버전 파일 통일

**파일**: `.nvmrc`, `.node-version`

이전: `.nvmrc`=v24.14.1 / `.node-version`=20.19.0 (불일치).
변경: 두 파일 모두 **22.12.0** (Node 22 LTS, engines `>=20.0.0` 만족, Cloud Run / Vercel 권장).

## ✅ 검증

- `pnpm exec tsc -b --noEmit` → green (no errors)
- `pnpm exec jest --config packages/server/jest-unit.config.js` → **83 suites / 1402 tests pass** (5.4s)
- `cd packages/client && pnpm exec vitest run` → **44 files / 285 tests pass** (4.6s)
- `pnpm build:client` → 빌드 성공, devtools chunk prod 번들 제외 확인

## ⚠️ Merge 시 주의

- `package.json` 수정 범위 큼 (50+ deps). 다른 worktree 와 merge 시 lock 파일 충돌 가능 → `pnpm install` 재실행 권장.
- `.nvmrc`, `.node-version` 변경: CI/CD (Cloud Run / Vercel) 가 이 파일을 참조하면 Node 22 로 자동 전환됨. 배포 파이프라인 확인 필요.
- `packages/client/src/App.tsx`: ReactQueryDevtools import 구조 변경. Storybook worktree 와 충돌 없을 듯 (App.tsx 는 entry 가 아님).
