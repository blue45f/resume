# Monorepo 마이그레이션 계획

루트 단일 패키지에서 pnpm workspace 기반 monorepo 로 점진 이전하는 공식 로드맵입니다.

---

## 1. 왜 Monorepo 로 가는가

### 1.1 독립 배포

- **현재**: `vite build && nest build` 가 한 번에 돌고, 전체 이미지가 GCP Cloud Run 으로 올라감
- **문제**: 프런트엔드 HTML/CSS 1줄만 바꿔도 서버 컨테이너가 재빌드·재배포됨 → 배포 시간↑, 불필요한 리스크
- **목표**: client 는 Vercel, server 는 Cloud Run 으로 각각 독립 파이프라인

### 1.2 의존성 분리

- **현재**: `package.json` 한 곳에 React / NestJS / Prisma / Cloudinary 가 모두 섞여 있음 → 서버 컨테이너에 React 까지 포함됨
- **문제**: 컨테이너 사이즈↑, 보안 표면↑ (서버에 불필요한 DOMPurify, tiptap 등 포함), `npm audit` 노이즈↑
- **목표**: client 는 브라우저 의존성만, server 는 Node 의존성만, `@resume/shared` 는 순수 TS 만

### 1.3 그 외 부수 효과

- 타입 공유 공식화 (`@resume/shared`) → API 계약 drift 방지
- CI 에서 영향 범위 기반 선별 빌드 (`pnpm --filter ...` )
- 각 팀(향후)의 코드 오너십 분리

---

## 2. 현재 구조 → 목표 구조

### 2.1 현재 (As-Is)

```
resume/
├── package.json              # client + server 의존성 전부
├── pnpm-lock.yaml
├── pnpm-workspace.yaml       # [신규] 루트만 포함
├── vite.config.ts
├── nest-cli.json
├── tsconfig.app.json         # client
├── tsconfig.server.json      # server
├── index.html
├── src/                      # React 프런트엔드
├── server/                   # NestJS 백엔드
├── prisma/
└── packages/                 # [신규] 플레이스홀더
    ├── client/README.md
    ├── server/README.md
    └── shared/README.md
```

### 2.2 목표 (To-Be)

```
resume/
├── package.json              # 루트 도구 (husky, prettier, concurrently) 만
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── packages/
    ├── client/
    │   ├── package.json      # React, Vite, Tailwind
    │   ├── vite.config.ts
    │   ├── tsconfig.json
    │   ├── index.html
    │   └── src/
    ├── server/
    │   ├── package.json      # NestJS, Prisma
    │   ├── nest-cli.json
    │   ├── tsconfig.json
    │   ├── Dockerfile
    │   ├── prisma/           # (또는 루트 유지)
    │   └── src/
    └── shared/
        ├── package.json      # zod, dayjs 정도
        ├── tsconfig.json
        └── src/
            ├── types/
            ├── schemas/
            ├── constants/
            └── utils/
```

---

## 3. 단계별 마이그레이션 계획

> 각 단계는 **독립적으로 머지 가능**하고, **다음 단계 시작 전 1주 관찰** 을 원칙으로 합니다.

### 단계 1 — Workspace 스캐폴딩 (현재 단계, 완료)

**작업**

- [x] `pnpm-workspace.yaml` 생성 (루트만 등록)
- [x] `packages/{client,server,shared}/README.md` 플레이스홀더 생성
- [x] `MIGRATION.md` 작성

**동작 보장**

- 기존 `pnpm install`, `pnpm run dev`, `pnpm run build` 전부 이전과 동일
- 소스 이동 **전혀 없음**

**예상 기간**: 1일

**리스크**: 없음 (메타 파일만 추가)

**롤백**: `pnpm-workspace.yaml` 및 `packages/` 삭제

---

### 단계 2 — `@resume/shared` 분리

**작업**

1. `packages/shared/package.json` 생성 (`"name": "@resume/shared"`, `"version": "0.0.0"`)
2. `packages/shared/tsconfig.json` + `src/index.ts` 초기화
3. `pnpm-workspace.yaml` 에서 `packages/shared` 주석 해제
4. 루트 `package.json` 에 `"@resume/shared": "workspace:*"` 추가
5. 현재 `src/types/`, `server/**/dto/` 에서 **공용** 타입만 순차 이동
   - User, Resume, Job 도메인 타입
   - API response envelope 타입
   - Zod 스키마 (폼 검증 공용)
6. Vite / Nest 양쪽 빌드에서 `@resume/shared` 해석 확인 (tsconfig paths)

**예상 기간**: 1~2주

**리스크**

- tiptap Node 타입, Prisma 생성 타입 등 **한쪽에만 속하는 타입**을 잘못 옮기면 빌드 깨짐
- Nest 의 DTO 는 `class-validator` 데코레이터 사용 → shared 로 옮기면 의존성이 shared 에 끼게 됨. **Zod 기반 재작성** 선행 필요
- vite 가 workspace 패키지의 `exports` 필드를 해석 못 하는 경우 있음 → `resolve.alias` 로 보강

**롤백**

- `workspace:*` 의존성 제거 + 기존 경로로 타입 원복 (git revert 가능한 작은 커밋 단위 유지)

---

### 단계 3 — `@resume/client` 이동

**작업**

1. `src/` → `packages/client/src/`
2. `index.html`, `vite.config.ts`, `tsconfig.app.json`, `tsconfig.node.json` → `packages/client/`
3. `packages/client/package.json` 생성 — React, Vite, Tailwind, tiptap 등 **프런트엔드 전용 의존성만** 이동
4. `tailwindcss` import 경로 재조정 (`@tailwindcss/vite`)
5. Vercel 프로젝트의 root directory 를 `packages/client` 로 변경
6. `public/` 이동 (msw worker 포함)
7. 루트 `package.json.scripts.dev:client` 를 `pnpm --filter @resume/client dev` 로 전환

**예상 기간**: 2주

**리스크**

- Vercel 배포 경로 변경 → **preview 배포 먼저 검증**
- `public/mockServiceWorker.js` 경로 변경 → MSW dev 모드 깨질 수 있음
- 절대 경로 import (`@/components/...`) alias 가 tsconfig / vite 양쪽에서 일치해야 함
- i18n 리소스 파일 경로

**롤백**

- git revert + Vercel root directory 원복 (UI 작업이므로 Cloud Run 과 무관 → 격리됨)

---

### 단계 4 — `@resume/server` 이동

**작업**

1. `server/` → `packages/server/src/`
2. `nest-cli.json`, `tsconfig.server.json` → `packages/server/`
3. `Dockerfile` → `packages/server/Dockerfile` (빌드 컨텍스트 재조정)
4. `prisma/` 위치 결정:
   - **옵션 A**: `packages/server/prisma/` 로 이동 (단순, 추천)
   - **옵션 B**: 루트 유지 + 서버에서 상대경로 참조 (마이그레이션 히스토리 보존)
5. `packages/server/package.json` 생성 — NestJS, Prisma, 인증/업로드 관련 의존성만
6. `scripts/deploy:gcp` 의 `--source .` 를 `--source packages/server` 로 변경
7. GitHub Actions / Cloud Build trigger 의 빌드 컨텍스트 수정
8. 환경변수(.env) 위치 결정 — **루트 유지 추천** (로컬 DX ↑)

**예상 기간**: 2~3주

**리스크** (**가장 높음**)

- **운영 배포 영향** — Cloud Run 빌드 컨텍스트 변경 실패 시 서비스 중단
- Prisma `schema.prisma` 경로와 `prisma generate` 의 output 경로
- `@nestjs/config` 의 `.env` 탐색 경로
- Docker 레이어 캐시 전략이 달라짐 → 첫 빌드 시간↑

**롤백 (중요)**

1. **Cloud Run revision traffic split** — 기존 revision 을 100% 유지한 채 새 revision 테스트
2. **Blue/Green** — `resume-api` 와 별도 서비스 `resume-api-next` 로 병행 배포 후 도메인 스위칭
3. 실패 시 `gcloud run services update-traffic resume-api --to-revisions=OLD=100`

---

### 단계 5 — 루트 정리 (선택)

- 루트 `package.json` 을 도구 전용으로 축소 (husky, prettier, concurrently, turbo?)
- `turbo.json` 또는 `nx` 도입 검토 (캐시, 병렬 빌드)
- CI 에서 `pnpm --filter ...^{{base}}` 로 변경 영향 패키지만 빌드
- 루트 테스트 설정(`jest-*.config.js`) 을 각 패키지로 분산

**예상 기간**: 1주

---

## 4. 전체 타임라인

| 단계 | 내용 | 기간 | 누적 |
|-----|------|-----|-----|
| 1 | Workspace 스캐폴딩 | 1일 | 1일 |
| 2 | `@resume/shared` 분리 | 1~2주 | ~2주 |
| 3 | `@resume/client` 이동 | 2주 | ~4주 |
| 4 | `@resume/server` 이동 | 2~3주 | ~7주 |
| 5 | 루트 정리 & 툴링 | 1주 | ~8주 |

**총 예상 기간: 6~8주 (실무 시간 기준, 다른 기능 개발 병행)**

---

## 5. 검증 체크리스트 (각 단계 공통)

- [ ] `pnpm install` 성공
- [ ] `pnpm run typecheck` 통과
- [ ] `pnpm run build` 통과 (client + server)
- [ ] `pnpm run test` 통과
- [ ] `pnpm run dev` 로 로컬 기동 OK
- [ ] Vercel preview 배포 성공 (client 영향 단계)
- [ ] Cloud Run staging 배포 성공 (server 영향 단계)
- [ ] `prisma migrate deploy` dry-run 통과 (prisma 영향 단계)
- [ ] E2E 스모크: 로그인 → 이력서 작성 → AI 피드백 → 저장

---

## 6. 의사결정 로그 (ADR)

향후 각 단계 진행 시 `docs/adr/` 에 결정 사항을 기록합니다.

- ADR-001: pnpm workspace vs Turborepo vs Nx → **pnpm only 로 시작, 필요 시 turbo 추가**
- ADR-002: Prisma schema 위치 → **단계 4 에서 결정**
- ADR-003: shared 패키지 빌드 방식 (tsc / tsup / 번들 없음) → **단계 2 에서 결정**
