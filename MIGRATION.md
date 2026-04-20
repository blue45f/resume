# Monorepo 마이그레이션 계획

루트 단일 패키지에서 pnpm workspace 기반 monorepo 로 점진 이전하는 공식 로드맵입니다.

> **2026-04-20 상태 요약**: 단계 1~4 구조 이관 **완료**. 운영 Cloud Run (resume-api) ·
> Vercel (resume-gongbang) 정상. 단계 2 (`@resume/shared`) 는 스캐폴드만 있고 실제 타입
> 이관은 필요성 낮아 보류. 단계 5 (루트 정리) 부분 적용 · turbo/nx 도입은 보류.
>
> 별도로 `packages/client/src/lib/koreanChecker.ts` (원본 6289줄) 의 **모듈 분할**이
> 진행되었습니다 — monorepo 파티션이 아닌 **lib 수준 도메인 분할**입니다.
> 상세는 §7 참조.

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

### 단계 1 — Workspace 스캐폴딩 ✅ 완료

**작업**

- [x] `pnpm-workspace.yaml` 생성 (`.` + `packages/*` 등록)
- [x] `packages/{client,server,shared}/README.md` 플레이스홀더 생성
- [x] `MIGRATION.md` 작성

**동작 보장**

- 기존 `pnpm install`, `pnpm run dev`, `pnpm run build` 전부 이전과 동일
- 소스 이동 **전혀 없음**

**실 소요**: 1일

---

### 단계 2 — `@resume/shared` 분리 ✅ 완료 (구조)

**작업**

1. [x] `packages/shared/package.json` 생성 (`@resume/shared`, Zod deps 포함)
2. [x] `packages/shared/tsconfig.json` + `src/index.ts` 초기화
3. [x] `pnpm-workspace.yaml` 등록
4. [ ] 공용 타입 실제 이동 — **아직 최소 스텁만 존재, 점진 이관 대기**
   - User, Resume, Job 도메인 타입 → 필요 시 이동
   - API response envelope 타입 → 필요 시 이동
   - Zod 스키마 (폼 검증 공용) → 일부 `@hookform/resolvers` 용으로 client 에 유지
5. [x] Vite / Nest 양쪽 빌드에서 `@resume/shared` 해석 가능

**실 소요**: 구조 1일, 실제 타입 이관은 기능 요구 발생 시 반영 (현재는 필요성 낮음)

**리스크**

- tiptap Node 타입, Prisma 생성 타입 등 **한쪽에만 속하는 타입**을 잘못 옮기면 빌드 깨짐
- Nest 의 DTO 는 `class-validator` 데코레이터 사용 → shared 로 옮기면 의존성이 shared 에 끼게 됨. **Zod 기반 재작성** 선행 필요
- vite 가 workspace 패키지의 `exports` 필드를 해석 못 하는 경우 있음 → `resolve.alias` 로 보강

**롤백**

- `workspace:*` 의존성 제거 + 기존 경로로 타입 원복 (git revert 가능한 작은 커밋 단위 유지)

---

### 단계 3 — `@resume/client` 이동 ✅ 완료

**작업**

1. [x] `src/` → `packages/client/src/`
2. [x] `index.html`, `vite.config.ts`, `tsconfig.app.json`, `tsconfig.node.json` → `packages/client/`
3. [x] `packages/client/package.json` — React, Vite, Tailwind, tiptap 등 브라우저 전용 deps
4. [x] `tailwindcss` import 경로 재조정 (`@tailwindcss/vite`)
5. [x] Vercel 프로젝트 root directory = `packages/client`
6. [x] `public/` 이동 (msw worker 포함)
7. [x] 루트 `dev:client`/`build:client` 가 `cd packages/client && vite ...` 로 정리됨

**실 소요**: 1주 미만 (세션 중 대규모 마이그레이션)

**리스크**

- Vercel 배포 경로 변경 → **preview 배포 먼저 검증**
- `public/mockServiceWorker.js` 경로 변경 → MSW dev 모드 깨질 수 있음
- 절대 경로 import (`@/components/...`) alias 가 tsconfig / vite 양쪽에서 일치해야 함
- i18n 리소스 파일 경로

**롤백**

- git revert + Vercel root directory 원복 (UI 작업이므로 Cloud Run 과 무관 → 격리됨)

---

### 단계 4 — `@resume/server` 이동 ✅ 완료

**작업**

1. [x] `server/` → `packages/server/src/`
2. [x] `nest-cli.json`, `tsconfig.server.json` → `packages/server/`
3. [x] `Dockerfile` → `packages/server/Dockerfile` (빌드 컨텍스트 재조정)
4. [x] `prisma/` → **옵션 B (루트 유지)** 채택. schema.prisma · prisma.config.ts 루트
5. [x] `packages/server/package.json` — NestJS, Prisma, 인증/업로드 관련 deps
6. [x] `scripts/deploy:gcp` → `gcloud run deploy --source . --project resume-platform-prod`
7. [x] Cloud Run 배포 정상 (revision 00029-57w serving 100%)
8. [x] 환경변수: Cloud Run env vars 16개 + Vercel env vars. 로컬 `.env` 는 루트 유지

**실 소요**: 1~2주 (세션 중 마이그레이션 + Prisma 7 동시 업그레이드)

**운영 이슈 (해결됨)**: 2026-04-20 `--set-env-vars` 가 기존 env vars 덮어쓰는 문제 발생 →
`--update-env-vars` 로 수정 + YAML 재주입. 자세한 내용은 memory `feedback_gcp_deploy_envvars.md`.

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

| 단계 | 내용                  | 기간  | 누적 |
| ---- | --------------------- | ----- | ---- |
| 1    | Workspace 스캐폴딩    | 1일   | 1일  |
| 2    | `@resume/shared` 분리 | 1~2주 | ~2주 |
| 3    | `@resume/client` 이동 | 2주   | ~4주 |
| 4    | `@resume/server` 이동 | 2~3주 | ~7주 |
| 5    | 루트 정리 & 툴링      | 1주   | ~8주 |

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

## 7. lib 도메인 분할 (2026-04-20 진행)

`packages/client/src/lib/koreanChecker.ts` 가 원본 6289줄까지 커진 단일 파일이라
유지보수·코드리뷰·LLM 컨텍스트 적재에 부담이 커져, **도메인 응집 단위**로 분할했습니다.

### 7.1 분할 결과

| 모듈                      | 내용                                                                  | 줄수 |
| ------------------------- | --------------------------------------------------------------------- | ---- |
| `sectionAnalyzers.ts`     | splitByExperienceSection, balance/order/density, computeSectionHealth | ~329 |
| `starPattern.ts`          | STAR 불릿 구조 분석                                                   | ~85  |
| `pii.ts`                  | detectContactInfo, detectPersonalInfo                                 | ~154 |
| `dateAnalyzers.ts`        | analyzeDateConsistency                                                | ~76  |
| `numericFormat.ts`        | analyzeNumericFormat                                                  | ~49  |
| `techCasing.ts`           | detectInconsistentCasing (기술 용어 대소문자)                         | ~80  |
| `textFormat.ts`           | 괄호 균형 + 공백 이상                                                 | ~148 |
| `experience.ts`           | estimateExperienceYears + validateDateRanges                          | ~117 |
| `languageRisks.ts`        | 상투구 · 자곤 · 과장                                                  | ~231 |
| `readabilityAnalyzers.ts` | 가독성 · 길이 · 종결어미                                              | ~174 |
| `repetitionAnalyzers.ts`  | 어휘 다양성 · 근접 반복 · N-gram · 중복 문장                          | ~222 |
| `sentenceStructure.ts`    | 종결어미 분포 · 문장 시작 · 수동태                                    | ~182 |
| `achievementSignals.ts`   | 정량 지표 · 액션 동사 · 수상 키워드                                   | ~207 |
| `jdKeywords.ts`           | 키워드 추출 · JD 매칭 · 기술 스킬                                     | ~202 |
| `toneAnalyzers.ts`        | 문단 · 1인칭 · 한영 혼재 · 감성                                       | ~224 |
| `bulletStructure.ts`      | 평행구조 · 불릿 마커 · 문장부호                                       | ~133 |
| `wordSuggestions.ts`      | 약→강 동사 · 동의어 · 남용 대체                                       | ~100 |
| `informalLanguage.ts`     | 이모지 · 초성체 · 은어 · 구어체                                       | ~107 |
| `resumeScoring.ts`        | 섹션 커버리지 · 완성도 · 구체성 · 직급 · 시간순                       | ~230 |
| `softSkills.ts`           | 소프트 스킬 · 축약어                                                  | ~132 |
| `metaUtils.ts`            | 읽기 시간 · 링크 · 해시태그 · 문자 분포                               | ~168 |
| `coverLetterHelpers.ts`   | 오프닝 추천 · 자기비하 · CTA                                          | ~159 |
| `interviewQuestions.ts`   | 예상 면접 질문 생성                                                   | ~117 |
| `qualitySignals.ts`       | unquantified · empty claim · 시제 · ALL CAPS                          | ~250 |
| `derivedScores.ts`        | 면접 적합도 · 경력 공백                                               | ~119 |
| `resumeGenerators.ts`     | TLDR · STAR 템플릿 · Quotable · 유사도                                | ~165 |

**총 25개 서브 모듈 / 약 3800줄 (잘린 부분)**

`koreanChecker.ts` 자체는 2882줄로 축소 (−3407줄, **54% 감량**). 주로 남은 것:

- core spell checker (`checkText`, `checkKorean`, KOREAN_RULES)
- KoreanIssue 조작 유틸 (export/dedup/sort/fix)
- ANALYZERS catalog (82개)
- `analyzeEverything` · `summarizeAnalysis` · `generateQualityReport` 등 통합 진입점
- 25개 서브 모듈의 **re-export 허브**

### 7.2 호환성

- **모든 public API 가 `koreanChecker.ts` 에서 여전히 export 됨** (re-export 경유)
- 호출부 (components, pages) 는 **제로 변경** — `import { ... } from '@/lib/koreanChecker'` 유지
- 내부 cross-module import 는 명시적으로 from './pii'/'./experience' 등 작성
- 순환 참조 방지 위해 하위 모듈은 서로 직접 import (koreanChecker 경유 금지)

### 7.3 검증

- 타입체크: 0 errors
- 테스트: 76 suites · 1228 tests green (모든 추출 단계에서 유지)
- 배포: Cloud Run revision 00029-57w, Vercel resume-gongbang 정상
- 각 추출 = 1 commit + 즉시 push (pre-commit hook 전체 통과)

### 7.4 왜 분할했나

1. **LLM 컨텍스트**: 6289줄은 context 80% 차지 → 분할로 단일 사이클 20% 내 적재
2. **테스트 시간**: 변경 시 tsc 부분 빌드 허용 (`tsc -b --build` 증분)
3. **코드 리뷰**: 단일 도메인 커밋이 코드리뷰 단위로 적절
4. **부분 import**: 일부 UI 만 JD 매칭 쓰면 `jdKeywords.ts` 만 로드 (tree-shaking 이점)

### 7.5 다음 확장 시 원칙

- 단일 파일 500줄 초과하면 도메인 단위 분리 검토
- 모듈 간 의존성 → 단방향 그래프 유지 (A→B→C, A→C OK; A↔B 금지)
- `koreanChecker.ts` 는 허브 역할만, 새 분석기는 서브 모듈에 추가

---

## 6. 의사결정 로그 (ADR)

향후 각 단계 진행 시 `docs/adr/` 에 결정 사항을 기록합니다.

- ADR-001: pnpm workspace vs Turborepo vs Nx → **pnpm only 채택 (turbo 미도입)**
- ADR-002: Prisma schema 위치 → **루트 유지 (옵션 B) — 마이그레이션 히스토리 보존**
- ADR-003: shared 패키지 빌드 방식 → **번들 없이 tsc-on-demand (src/index.ts 직접 노출)**
- ADR-004 (신규): Cloud Run 배포 env vars → **`--set-env-vars` 금지, `--update-env-vars` +
  대량 재설정은 `--env-vars-file` YAML** (feedback_gcp_deploy_envvars 참조)
- ADR-005 (신규): lib 도메인 분할 구조 → **25개 서브 모듈 + koreanChecker.ts 허브**.
  호환성 유지를 위해 re-export 유지. 새 분석기는 서브 모듈에 추가.
