# 아키텍처·폴더 구조 재검토 (모노레포 Stage 2 완료 후)

작성: 2026-04-18 (모노레포 실전환 직후)
목적: 새 구조 진단 + 후속 로드맵 갱신

## 1. 새 루트 구조

```
resume/
├── .github/workflows/    ✅ CI + GCP 자동배포
├── .claude/              auto-memory, 스킬 설정
├── .impeccable.md        디자인 컨텍스트 (target/tone/palette)
├── .npmrc                shamefully-hoist=true (pnpm workspace)
├── Dockerfile            pnpm --filter @resume/server build
├── docs/                 9개 설계·운영 문서
├── data/, uploads/       런타임 파일
├── scripts/              유틸 스크립트
├── packages/             ✅ 실제 모노레포
│   ├── client/           @resume/client
│   ├── server/           @resume/server
│   └── shared/           @resume/shared
├── package.json          오케스트레이터 (cd packages/...)
├── pnpm-workspace.yaml   "packages/*"
├── pnpm-lock.yaml
├── tsconfig.json         references [client, node, server, test]
├── tsconfig.node.json    vite.config 타입체크
├── tsconfig.test.json    jest 타입체크
├── vercel.json           rootDirectory via --filter
└── eslint.config.js      globalIgnores packages: false
```

## 2. packages 구조 상세

### 2.1 @resume/client (Vite + React 19)

```
packages/client/
├── index.html
├── vite.config.ts         7개 manualChunks
├── tsconfig.json
├── package.json           deps: @resume/shared workspace:*
├── public/                manifest, sw, robots, sitemap, icons
├── dist/                  Vite 빌드 output (Vercel이 여기 배포)
└── src/
    ├── app/               FSD app layer (entry/provider)
    ├── pages/             53개 페이지 (React Router)
    ├── widgets/           🆕 1개 (HomeHero)
    ├── features/          6개 (auth/community/interview-prep/notifications/recent-views/study-groups)
    ├── entities/          🆕 4개 (coach/job/resume/user model)
    ├── shared/            ui + lib/schemas (Radix 프리미티브 + zod)
    ├── components/        97개 (레거시 위치, 점진 이전 중)
    ├── hooks/             useApi, useDraft, useResources, useScrollReveal, useSwipe
    ├── lib/               api, auth, config, i18n, plans, theme, resumeThemes 등
    ├── stores/            Zustand 글로벌 상태
    ├── i18n/locales/      ko.json, en.json, ja.json
    ├── types/             프론트엔드 전용 타입
    └── mocks/             MSW handlers (dev/test)
```

### 2.2 @resume/server (NestJS 11 + Prisma 7)

```
packages/server/
├── nest-cli.json          sourceRoot: src, outDir: dist
├── tsconfig.json
├── prisma.config.ts       schema path + dotenv
├── package.json
├── jest-unit.config.js
├── jest-e2e.config.js
├── dist/                  nest build output
├── prisma/
│   ├── schema.prisma      User, Resume, JobPost, Application, Comment, Coach, Coaching,
│   │                      StudyGroup, CommunityPost, Notice, Attachment, Version, Tag,
│   │                      Template, Notification, Bookmark, Follow, Message...
│   ├── migrations/        8개 마이그레이션 (20260330 시리즈 + 20260401)
│   └── seed.ts, seed-sample.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── prisma/            PrismaService (PrismaPg adapter)
│   ├── auth/              OAuth(Google/GitHub/Kakao) + JWT + PIPA
│   ├── resumes/           이력서 + 버전 + 태그 + 첨부 + 추천 + 슬러그
│   ├── jobs/              채용 공고 (내부 + 큐레이션)
│   ├── applications/      지원 내역 + 댓글 + 상태 알림
│   ├── cover-letters/     자기소개서
│   ├── community/         커뮤니티 게시판 (9 카테고리)
│   ├── comments/          이력서 의견
│   ├── coaching/          코치 예약 + 수수료 + 리뷰
│   ├── study-groups/      스터디 카페 (3축 필터: tier/cafe/experience)
│   ├── interview/         면접 답변 저장
│   ├── job-interview-questions/ JD 기반 질문 + AI 생성 + 투표
│   ├── social/            팔로우 + 쪽지 + 스카우트
│   ├── share/             공유 링크 (비밀번호, 만료)
│   ├── attachments/       Cloudinary 업로드 (소유권 검증)
│   ├── versions/          이력서 스냅샷
│   ├── templates/         로컬 변환 + LLM 변환
│   ├── llm/               Anthropic/Gemini/Groq 공통 인터페이스 + 폴백
│   ├── notifications/     알림 생성/읽음
│   ├── notices/           공지
│   ├── tags/              태그
│   ├── banners/           배너
│   ├── forbidden-words/   금칙어 필터
│   ├── system-config/     시스템 설정 (어드민)
│   ├── health/            헬스체크 + 통계 + usage + admin-stats
│   └── common/            filters, guards(AdminGuard), interceptors, middleware
└── test/                  22개 E2E 파일 (시나리오별) + e2e-helper
```

### 2.3 @resume/shared

```
packages/shared/
├── package.json           main: src/index.ts (ts 직접 export)
├── tsconfig.json
└── src/index.ts           UserType, UserRole, ResumeVisibility, CoachingStatus,
                           COMMUNITY_CATEGORIES, STUDY_GROUP_COMPANY_TIERS,
                           STUDY_GROUP_CAFE_CATEGORIES, STUDY_GROUP_EXPERIENCE_LEVELS,
                           COMMISSION_RATE, COACHING_DURATIONS
```

## 3. 이전 진단과 비교

### 이전 약점 → 해결 여부

| 이전 약점                         | 상태                                            |
| --------------------------------- | ----------------------------------------------- |
| 1. 이중 구조 (packages 빈 껍데기) | ✅ **해결** — 실제 파일 이동 완료               |
| 2. components/ 비대 (97)          | ⚠️ 동일 — 점진 이전 필요                        |
| 3. src/types 중복                 | ⚠️ 일부 — @resume/shared 도입 후 점진 통합 필요 |
| 4. routes 하드코딩                | ⚠️ 동일 — Phase C 대기                          |
| 5. Header 1087줄                  | ⚠️ 동일 — Phase D 대기                          |
| 6. i18n 사용률 낮음               | ⚠️ 동일                                         |
| 7. dist-server git 추적           | ✅ **해결** — 삭제 완료                         |
| 8. env 관리 분산                  | ⚠️ 동일                                         |

### 새로 생긴 강점

- **실제 워크스페이스**: `pnpm --filter @resume/client build` 같은 대상 지정 가능
- **independent build**: 클라/서버가 각자 `dist/`에 빌드
- **@resume/shared 타입 공유**: 컴파일 타임 단일 source of truth
- **dist-server 제거**: git diff 노이즈 대폭 감소
- **의존성 트리 분리 가능**: 현재는 hoisted지만 추후 client/server 고유 deps 분리 가능

### 새 약점

- **root package.json 여전히 거대**: 모든 deps가 루트 한 곳에. 의도적 (shamefully-hoist)이나 장기적으로 packages별 분리가 더 명확
- **script 대부분 `cd packages/...`**: pnpm --filter로 더 짧게 쓸 수 있음
- **E2E가 server 테스트와 같은 jest**: client E2E(Playwright 등)는 아직 없음

## 4. FSD-Lite 레이어 현황 (packages/client/src)

| 레이어      | 현황                                                                  | 완성도               |
| ----------- | --------------------------------------------------------------------- | -------------------- |
| app/        | 진입점 + 라우터 + 프로바이더                                          | ✅                   |
| pages/      | 53개 (라우트 매핑)                                                    | ✅ 전환 완료         |
| widgets/    | 1개 (HomeHero)                                                        | ⚠️ 10개+ 필요        |
| features/   | 6개                                                                   | ⚠️ 10개+로 확장 가능 |
| entities/   | 4개 (coach/job/resume/user) — model만, ui는 이전 중                   | 🆕 시작              |
| shared/     | ui(Dialog/Alert/Dropdown/Popover/Breadcrumb) + lib/schemas (10개 zod) | ✅ 확립              |
| components/ | 97개 (대부분 widgets/features/entities로 이전 대상)                   | ⚠️ 기존 잔존         |

## 5. 배포 검증 (현 시점)

| 환경                   | 상태                    | 확인                           |
| ---------------------- | ----------------------- | ------------------------------ |
| GCP Cloud Run (백엔드) | ✅ revision `00023-r6v` | `/api/health` 200              |
| Vercel 운영 프론트     | ✅ 200                  | resume-gongbang.vercel.app     |
| Vercel 개발 프론트     | ✅ 200                  | resume-silk-three.vercel.app   |
| tsc -b --noEmit        | ✅ 0 errors             | monorepo references 동작       |
| 단위 테스트            | ✅ 868/868              | jest-unit from packages/server |
| E2E                    | 255 (22 파일)           | scenario별 분리 + admin 포함   |

## 6. 갱신된 로드맵 (Phase 우선순위)

| Phase                         | 내용                                | 규모 | 상태            |
| ----------------------------- | ----------------------------------- | ---- | --------------- |
| A — 모노레포 실전환           | 파일 이동 + configs                 | XL   | ✅ **완료**     |
| B — components→FSD 이전       | 97 → ≤20 공용                       | L    | 시작 (3개 이전) |
| C — routes 상수화             | src/lib/routes.ts                   | S    | 대기            |
| D — Header 분해               | 1087줄 → 5 파일                     | M    | 대기            |
| E — i18n 확대                 | ko.json 채움                        | M    | 대기            |
| F — env 통합                  | src/lib/env.ts zod                  | S    | 대기            |
| G — dist-server 제거          | git 정리                            | S    | ✅ **완료**     |
| H — client E2E (Playwright)   | 새                                  | M    | 신규            |
| I — packages 의존성 분리      | root package.json 슬림화            | L    | 신규            |
| J — UserRoleGrant (복수 역할) | `USER_TYPE_MULTI_ROLE_PLAN.md` 구현 | L    | 대기            |

## 7. 최근 개선 요약 (커밋 기준)

- `8930917` **모노레포 Stage 2 파일 이동** ← 이번 사이클
- `38efe0d` userType 전환 UI 4종 + 지원 상태 알림
- `c346725` 스터디 카페 + 기능 연계 검토 문서
- `61e5f3c` 아키텍처 재검토 (이전 버전)
- `a816ad3` 회원 유형 복수 역할 기획
- `0b730c7` Footer 5단 IA
- `8158d44` 모노레포 Stage 1 (워크스페이스)
- `47d2bba` PIPA 동의 체크박스 4종
- `0227f43` 디자인 토큰 (badge/icon-btn)

## 8. 결론

### 현재 상태 (2026-04-18)

- ✅ **실제 모노레포** 가동 (Stage 2 완료)
- ✅ 프로덕션 정상 (GCP + Vercel)
- ✅ 868 unit + 255 E2E + tsc 0 errors
- ✅ Impeccable 디자인 시스템 정착
- ✅ 보안 Critical 3건 수정 + PIPA 준수
- ✅ 9개 설계·운영 문서 완비

### 다음 1-2 스프린트 권장

1. **Phase C (routes 상수화)** — 가장 작고 효과 큼
2. **Phase D (Header 분해)** — 유지보수 급상승
3. **Phase B (components → widgets/entities)** — 점진 이전
4. **P0 (결제 PG 베타 배지)** — 현실성 명시
5. **J (UserRoleGrant)** — 복수 역할 기획 구현

### 판정

구조적으로 **production-ready monorepo**. 남은 건 점진적 청결화와 제품 기능 확장이지, 구조적 결함이 아님.
