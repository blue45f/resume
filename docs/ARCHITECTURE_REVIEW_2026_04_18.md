# 아키텍처·폴더 구조 재검토

작성: 2026-04-18
목적: 현 구조 진단 + 중장기 개선 로드맵

## 1. 현재 구조 요약

```
resume/
├── .github/workflows/       ✅ CI + GCP 자동배포
├── .claude/                 Claude Code 설정 (auto-memory 등)
├── dist/                    빌드 산출물 (Vite)
├── dist-server/             빌드 산출물 (NestJS, git tracked — Render 호환)
├── docs/                    설계·운영 문서 (ARCH/SECURITY/PIPA/USER_TYPE)
├── packages/                ✅ Stage 1 워크스페이스 (구성만)
│   ├── client/              package.json만 — 실제 src는 루트
│   ├── server/              package.json만 — 실제 코드는 루트
│   └── shared/              ✅ 실제 타입·상수 공유 모듈
├── prisma/                  schema.prisma + migrations
├── server/                  NestJS 본체 (실제 위치)
│   ├── auth/ resumes/ jobs/ ...  (modular monolith)
│   └── common/ prisma/
├── src/                     프론트엔드 본체 (실제 위치)
│   ├── app/ pages/ features/ entities/ widgets/ shared/ components/
│   │     ^^^^^ FSD-Lite 적용, entities/widgets 첫 구현, 대부분 미이전
│   ├── hooks/ lib/ stores/ types/ mocks/ i18n/
├── test/                    E2E 19 파일 (시나리오별)
├── public/                  robots/sitemap/sw/manifest
├── package.json             루트 — 모든 deps 집중
├── pnpm-workspace.yaml      packages/*
├── tsconfig.json            references [app, node, server, test]
└── Dockerfile               pnpm + corepack, .npmrc shamefully-hoist
```

## 2. 진단

### 2.1 장점

- **Modular Monolith 서버** — 기능별 모듈 깔끔 (auth/resumes/jobs/coaching/community...)
- **FSD-Lite 프론트** — app/pages/features/entities/widgets/shared 5레이어 골격 완성
- **pnpm 워크스페이스** — @resume/shared로 클라/서버 타입 공유 가능
- **검증 자산** — 868 단위 + 254+ E2E 시나리오별, CI 자동화
- **디자인 토큰** — Impeccable CSS 변수, badge/icon-btn/색상 유틸
- **보안 기반** — IDOR 3건 수정, PIPA 동의, JWT httpOnly cookie 지원

### 2.2 약점

1. **이중 구조** — packages/{client,server} 가 빈 껍데기, 실제 파일은 루트 `src/`·`server/`. 의존성은 root에 몰려있고 workspace 규약과 어긋남
2. **components/ 비대화** — src/components/ 97개 파일, 절반 이상은 entities/widgets로 분리 가능한데 backward-compat stub만 3개 적용
3. **src/types/ 중복** — @resume/shared와 src/entities/\*/model에 같은 타입 중복 선언
4. **routes 하드코딩** — 각 Link 컴포넌트에 절대경로 직접 기재, 오타/변경 시 전 프로젝트 수정 필요
5. **Header.tsx 1087줄** — 모드별 분기·더보기 드롭다운·GNB가 단일 파일에 섞여있어 수정·테스트 난이도 급증
6. **i18n 사용률 낮음** — `t('nav.templates')` 같은 사용은 극히 일부, 대부분 한국어 하드코딩
7. **dist-server git 추적** — 빌드 산출물을 커밋 중. Render 호환 위해 유지하나 diff 잡음 매우 큼
8. **LLM/third-party 호출 환경변수 관리 분산** — ConfigService 통합 없이 페이지별 process.env 직접 접근 곳 다수

## 3. 중장기 로드맵 (Phase 제안)

### Phase A — 실전 모노레포 전환 (대공사)

- `src/` → `packages/client/src/` 전면 이동
- `server/` → `packages/server/src/` 전면 이동
- `prisma/` → `packages/server/prisma/`
- 각 package.json에 **해당 패키지 deps**만 (root는 devDeps만)
- `vite.config.ts`, `tsconfig.*`, `nest-cli.json` 경로 전면 수정
- Dockerfile: `pnpm --filter @resume/server build`
- vercel.json: `rootDirectory: packages/client`
- 리스크: 배포 중단 가능성 있으므로 브랜치 작업 + 스테이징 검증 필수

### Phase B — components → FSD 완전 이전

1. Dumb 엔티티 카드 → `entities/<name>/ui/` (40+ 컴포넌트 대상)
2. 도메인 조합 위젯 → `widgets/<name>/` (RelatedJobsWidget, DashboardStats, AiCoachPanel 등)
3. 복잡 feature → `features/<name>/{ui,api,model}/` (이미 auth/interview-prep/community 일부 있음)
4. `src/components/` 최종 목표: ≤20개 순수 공용 (Footer/Header/MobileBottomNav 등)

### Phase C — 중앙화 라우팅

- `src/lib/routes.ts` 에 모든 경로 상수 (`ROUTES.resumes.edit(id)`)
- `react-router-dom` v7의 loader 활용
- 타입 안전성 + 변경 용이성

### Phase D — Header 분해

- `widgets/header/ui/Header.tsx` 축소 (~150줄)
- `widgets/header/ui/UserMenu.tsx`
- `widgets/header/ui/ModeSwitcher.tsx` (복수 역할 도입 시)
- `widgets/header/ui/SearchBar.tsx`
- `widgets/header/ui/NotificationBell.tsx` (이미 별도)
- `widgets/header/model/navItems.ts` — 구직자/리쿠르터/코치 모드별 nav 선언적 구성

### Phase E — i18n 확대

- `src/i18n/locales/ko.json`에 주요 문자열 이관
- `t()` 호출 점진 적용
- 영어 번역은 이미 있는 en.json 유지

### Phase F — 환경변수 통합

- `src/lib/env.ts` (zod 검증)
- `server/config/` NestJS ConfigService 규약화
- 비공개 변수 클라이언트 노출 방지 검증

### Phase G — dist-server 정리

- Render 의존 해제 (GCP 단일화 검토)
- 성공 시 `.gitignore`에 `dist-server/` 추가, diff 잡음 제거

## 4. 우선순위 (작은 것부터)

| 순번 | Phase                | 규모 | 리스크 | 효과                    |
| ---- | -------------------- | ---- | ------ | ----------------------- |
| 1    | C (routes 상수화)    | S    | 저     | 타입안전, 리팩터 용이   |
| 2    | F (env 통합)         | S    | 저     | 운영 안정               |
| 3    | E (i18n 부분)        | M    | 저     | UX 개선                 |
| 4    | D (Header 분해)      | M    | 중     | 유지보수 대폭↑          |
| 5    | B (components 이전)  | L    | 중     | 구조 청결               |
| 6    | A (모노레포 실전환)  | XL   | 고     | 배포·빌드 독립성        |
| 7    | G (dist-server 제거) | S    | 저     | 레포 청결 (A 선행 권장) |

## 5. 현 상태 요약

- ✅ 기능: 구직자/리쿠르터/기업/코치 + 이력서/채용/커뮤니티/면접/스터디 전부 가동
- ✅ 배포: Vercel(프론트) + GCP Cloud Run(백엔드) + Neon(DB), CI/CD 자동화
- ✅ 테스트: 단위 868 + E2E 254 통과, tsc 0 errors
- ⚠️ 모노레포: Stage 1만 실구현 (Stage 2는 Phase A로 별도)
- ⚠️ components/: 대부분 레거시 위치 유지, 점진 이전 중
- 🆕 Impeccable 디자인 시스템, Radix 프리미티브, Swiper, tw-animate-css, PIPA, FSD entities+widgets 골격
