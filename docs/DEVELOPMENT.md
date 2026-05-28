# Development Guide

## 사전 요구사항

- Node.js >= 20.0.0
- pnpm 9.14.4 (권장) — `corepack enable` 또는 `npm i -g pnpm`
- PostgreSQL (로컬 Docker 또는 Neon)
- Git + Husky 훅 지원 환경

## 로컬 개발 환경 설정

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 파일 생성 (.env.example 참고)
cp .env.example .env.development

# 3. Prisma 클라이언트 생성
pnpm prisma:generate

# 4. 마이그레이션 실행
pnpm prisma:migrate

# 5. 시드 데이터 투입
pnpm prisma:seed

# 6. 개발 서버 동시 실행 (프론트 + 백엔드)
pnpm dev
```

개별 실행:

```bash
pnpm dev:client   # Vite 프론트엔드 (http://localhost:5173)
pnpm dev:server   # NestJS 백엔드 (http://localhost:3000)
pnpm dev:mock     # MSW 기반 목 서버 구동 (VITE_MSW=true)
```

## 환경 변수

| 파일               | 용도                                 | 커밋 여부 |
| ------------------ | ------------------------------------ | --------- |
| `.env.example`     | 템플릿·참조용                        | 커밋 O    |
| `.env.development` | 로컬 개발 (Vite 자동 로드)           | 커밋 X    |
| `.env.production`  | 프로덕션 빌드                        | 커밋 X    |
| `.env.local`       | 개인 오버라이드 (가장 높은 우선순위) | 커밋 X    |

주요 키:

```env
# 데이터베이스
DATABASE_URL=postgresql://...

# 인증
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# LLM 프로바이더 (Gemini → Groq → Claude 순 Fallback)
GEMINI_API_KEY=
GROQ_API_KEY=
ANTHROPIC_API_KEY=   # 선택 (유료)

# 파일 저장소
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# 클라이언트
VITE_API_URL=http://localhost:3000
VITE_MSW=false
```

Vite는 `VITE_` 접두어가 붙은 변수만 브라우저 번들에 노출합니다. 서버 전용 시크릿은 절대 `VITE_` 접두어를 사용하지 마세요.

## 테스트

```bash
# 유닛 테스트 (Jest, 44 suites)
pnpm test
pnpm test:unit
pnpm test:unit:cov   # 커버리지 포함

# E2E 테스트 (Supertest 기반)
pnpm test:e2e
```

테스트 설정: `jest-unit.config.js`, `jest-e2e.config.js`. 모든 신규 기능에는 테스트 코드를 함께 작성하고 배포 전 전체 테스트 통과를 확인합니다.

## 빌드 & 배포

### 로컬 빌드

```bash
pnpm build          # vite build + nest build
pnpm build:client   # Vite 전용
pnpm build:server   # Nest 전용
pnpm preview        # 프론트엔드 프리뷰 서버
```

### Vercel (프론트엔드)

```bash
vercel              # 프리뷰 배포
vercel --prod       # 프로덕션
```

설정(`vercel.json`): Vite 프리셋, `outputDirectory: dist`, SPA rewrites + 정적 에셋 캐시 헤더. 환경 변수는 Vercel 대시보드에서 관리합니다.

### GCP Cloud Run (백엔드)

```bash
pnpm deploy:gcp
# = gcloud run deploy resume-api --source . \
#     --region asia-northeast3 --allow-unauthenticated
```

서비스명: `resume-api`, 프로젝트: `resume-platform-prod`, 리전: `asia-northeast3`. `Dockerfile`이 `npm install + nest build`로 컨테이너를 구성합니다.

### Neon (데이터베이스)

마이그레이션: `pnpm prisma:migrate deploy` (프로덕션) / `pnpm prisma:migrate dev` (개발).

## React 빌드 도입 가이드

React를 처음 도입하거나 React 런타임/번들러를 교체할 때는 기능 개발 이전에 빌드 파이프라인부터 고정해야 합니다.

### 1) 최소 빌드 스크립트 기준

레포에서 React 산출물을 다루는 최소 기준은 아래와 같습니다.

| 영역                  | 스크립트           | 목적                                                   |
| --------------------- | ------------------ | ------------------------------------------------------ |
| 앱(`packages/client`) | `build:client`     | `vite build` 실행                                      |
| 앱(`packages/client`) | `preview`          | `vite preview` 실행                                    |
| 앱 타입체크           | `typecheck` (루트) | `tsc -b --noEmit` + Prisma 생성까지 포함               |
| 루트                  | `build`            | `build:client` + `build:server` + Prisma generate 결합 |

### 2) 도입/업그레이드 실행 순서

1. 패키지 정합성 확인
   - React/ReactDOM/Vite/ESLint 관련 패키지 버전 일치
   - `vite.config.ts`에 `@vitejs/plugin-react` 적용 여부 확인
   - `tsconfig`의 JSX 모드(`react-jsx`) 확인
2. 정적 빌드 점검

   ```bash
   pnpm typecheck    # 타입 게이트
   pnpm build        # 전체 산출물 생성
   pnpm preview      # 생성물 실행 확인
   ```

3. 산출물 점검
   - `packages/client/dist`에 진입점 HTML/CSS/JS 아티팩트 생성 여부 확인
   - `vite build --mode production` 과 `--mode development` 로그 차이를 비교해 sourcemap/트리셰이킹 이슈 탐지
   - 번들 크기 급증 구간은 `--json` 기반 산출물 로그로 회귀 이슈 분리

### 3) CI에서의 게이트 반영

- PR/푸시에서 최소 `pnpm build`가 필수로 통과되도록 유지
- `pnpm ci` 또는 `pnpm verify`에 `build`/`typecheck`를 명시적으로 포함
- Storybook이 추가되는 경우 `build-storybook`을 별도 job으로 분리해 타임아웃·메모리 부담을 줄임

### 4) 회귀 대응 체크리스트

- 번들 크기 급증: 중복 번들링 라이브러리나 peerDependency 중복, `exclude` 누락 여부를 우선 점검
- SSR/CSR 경계 오류: `window`, `document` 접근부의 클라이언트 분기 검증
- 타입 체인 실패: `tsc -b` 기준으로 루트에서 재현(패키지별 `node_modules` 차이보다 우선)
- 증분 빌드 불안정: cache key 입력(패키지 매니저/lockfile/tsconfig/build 설정)에 캐시 키를 반영

문서와 PR에는 `pnpm typecheck`, `pnpm build`, `pnpm preview` 실행 결과 또는 요약 증빙을 남기고 병합하세요.

## Husky pre-commit

`.husky/pre-commit` 훅은 아래를 순차 실행하며 하나라도 실패하면 커밋을 중단합니다.

1. `pnpm exec tsc -b --noEmit` — 전체 TypeScript 타입 체크
2. `npx lint-staged` — 스테이지된 파일만 ESLint + Prettier

`lint-staged` 설정(`package.json`):

- `*.{ts,tsx}` → `eslint --fix` + `prettier --write`
- `*.{json,md,css}` → `prettier --write`

훅 건너뛰기(`--no-verify`)는 사용자 명시적 요청이 있을 때만 사용합니다.

## 주요 스크립트 레퍼런스

| 스크립트               | 설명                                 |
| ---------------------- | ------------------------------------ |
| `pnpm dev`             | Vite + Nest 동시 기동 (concurrently) |
| `pnpm dev:mock`        | MSW 활성화된 프론트 단독 구동        |
| `pnpm build`           | 클라이언트 + 서버 동시 빌드          |
| `pnpm lint`            | 전체 ESLint 검사                     |
| `pnpm format`          | Prettier 포맷 적용                   |
| `pnpm format:check`    | 포맷 체크 (CI)                       |
| `pnpm typecheck`       | `tsc --noEmit`                       |
| `pnpm prisma:generate` | Prisma Client 재생성                 |
| `pnpm prisma:migrate`  | 마이그레이션 개발 모드               |
| `pnpm prisma:push`     | 스키마 즉시 push (초기 프로토타입)   |
| `pnpm prisma:studio`   | Prisma Studio GUI                    |
| `pnpm prisma:reset`    | DB 전체 리셋 + 시드                  |
| `pnpm start:server`    | 프로덕션 Nest 구동                   |

## 디버깅 팁

- Swagger UI: 개발 모드에서 `http://localhost:3000/api/docs`
- React Query Devtools: 개발 번들에 자동 포함
- MSW 핸들러: `src/mocks/handlers.ts`에서 네트워크 응답 mock
- SSE 스트리밍 응답은 `curl -N` 또는 브라우저 DevTools Network 탭의 EventStream으로 검증
