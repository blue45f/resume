# Claude Code 세션 가이드 — resume-platform

이 파일은 Claude Code 세션이 이 저장소에서 작업을 시작할 때 빠르게 프로젝트를 파악할 수 있도록 작성되었습니다.

## 프로젝트 개요

- **이름**: 이력서공방 (Resume Workshop)
- **목적**: 한국어 이력서·자기소개서 작성·분석·코칭 플랫폼
- **배포**: Cloud Run `resume-api` (backend) · Vercel `resume-gongbang` (frontend)
- **DB**: Neon PostgreSQL (공유)

## 스택

- **Frontend**: React 19 (React Compiler 활성화) · Vite 8 · TypeScript strict · TailwindCSS 4 · Radix UI · tiptap · React Query · RHF+Zod
- **Backend**: NestJS 11 · Prisma 7 · Jest
- **Monorepo**: pnpm workspaces (`packages/client`, `packages/server`, `packages/shared`)
- **LLM**: Groq · Gemini · OpenRouter (cost-optimized fallback)

## 라이브러리 (용도별)

클라이언트(`packages/client`) 핵심 의존성을 용도별로 정리. (런타임 의존성은 루트 `package.json` 에 모여 있고, `date-fns` 만 `packages/client/package.json` 에 둠)

- `@tanstack/react-query` — 서버 상태·캐싱·데이터 패칭 (`useResources` 훅 계층)
- `react-hook-form` + `@hookform/resolvers` + `zod` — 폼 상태·검증 (스키마는 `shared/lib/schemas`)
- `zustand` — 클라이언트 전역 상태 (`stores/useAuthStore` 등)
- `react-router-dom` — 라우팅 (`ROUTES` 헬퍼)
- `i18next` + `react-i18next` + `i18next-browser-languagedetector` — 다국어 (ko/en, `tx()`/`t()` + `lib/i18n`)
- `date-fns` (+ `date-fns/locale` ko/en-US) — 날짜 포맷 (`shared/lib/time#formatDate`, 활성 로케일 연동). 상대시간 `timeAgo` 는 한글 고정 버킷이라 유지
- `@tiptap/*` (react/starter-kit/extension-\*) — 리치 텍스트 에디터 (`RichEditor`)
- `@radix-ui/*` (dialog/dropdown/select/popover/tooltip 등) — 접근성 프리미티브
- `recharts` — 차트·통계 시각화 (lazy load)
- `tailwindcss` (+ `tw-animate-css`) — 스타일링 (Impeccable 디자인 토큰)
- `sonner` — 토스트 알림 (`components/Toast`)
- `dompurify` — 사용자 HTML XSS 살균 (`components/SafeHtml`; 서버는 `sanitize-html`)
- `swiper` — 배너 슬라이더 (`BannerSlider`)
- `react-to-print` — 이력서 인쇄·PDF 출력 (`PreviewPage`)
- `browser-image-compression` + `heic2any` — 이미지 업로드 압축·HEIC 변환 (`lib/imageProcess`)

## 주요 명령

```bash
# 개발
pnpm dev                  # client + server 동시 실행
pnpm dev:client           # Vite 개발 서버
pnpm dev:server           # Nest watch 모드

# 검증
pnpm exec tsc -b --noEmit # 타입체크 (client + server)
pnpm test                 # server 단위 테스트 (76 suites)
pnpm test:e2e             # server E2E

# 빌드·배포
pnpm build:client         # Vite 프로덕션 빌드
pnpm build:server         # Nest build
pnpm deploy:gcp           # Cloud Run 배포
```

## 작업 규칙

1. **자동 push**: 이 저장소에서 커밋 직후 `git push` 자동 실행.
2. **테스트 필수**: 기능 추가 시 반드시 테스트 동반, 배포 전 전체 테스트 green 확인.
3. **Cloud Run 배포**: `--set-env-vars` 금지. `--update-env-vars` 또는 `--env-vars-file` 사용.
4. **사이트 소개 페이지 정적 유지**: HelpPage/TutorialPage/About 등은 동적 컨텐츠 시스템으로 전환 안 함.
5. **purple 금지**: Impeccable 디자인 시스템 — neutral + blue/cyan/sapphire + 상태색(emerald/amber/rose) 사용.

## 핵심 아키텍처 포인트

### `packages/client/src/lib/` — 한국어 분석 모듈

원래 `koreanChecker.ts` 단일 6289줄 → 2882줄로 축소 (54% 감량). 25개 서브 모듈로 분할. 상세는 `packages/client/src/lib/README.md` 참조.

- **허브**: `koreanChecker.ts` — 모든 서브 모듈을 re-export. 호출부는 `import from '@/lib/koreanChecker'` 그대로 유지.
- **신규 분석기 추가 시**: 응집도 높은 기존 서브 모듈에 추가하거나 새 서브 모듈 생성. 반드시 `ANALYZERS` 카탈로그에 메타데이터 등록.

### Prisma

- schema.prisma + prisma.config.ts 는 **루트 유지** (옵션 B). `packages/server` 로 이동하지 않음.
- Prisma 7 migration 완료. `prisma generate` 는 루트에서 실행.

### 환경변수

- **Cloud Run**: 16개 env vars (DATABASE_URL, JWT_SECRET, GROQ/GEMINI/OPENAI keys, Cloudinary, Google OAuth 등)
- **Vercel**: VITE\_\* 빌드 시 env vars
- 로컬: `.env` 루트 유지

## 문서

- `MIGRATION.md` — monorepo 마이그레이션 계획 + lib 도메인 분할 §7
- `BENCHMARK.md` — 원티드/잡코리아/링크드인 비교 분석
- `packages/client/src/lib/README.md` — 25개 서브 모듈 맵

## 아키텍처 함정 (Known Gaps)

**전역 AuthGuard 가 비-@Public 라우트도 토큰 없이 통과(req.user=null)시키므로, 가시성/소유권 검증이 빠진 read 경로는 미인증 IDOR 가 된다** — 2026-05-30 적대적 보안 감사 3라운드에서 다수 발견의 공통 뿌리였던 패턴. 신규 read 엔드포인트에는 `assertCanAccess`/`canViewResume` 류 가시성 게이트를 반드시 적용한다. 사이클별 상세 이력은 git log(docs 커밋)가 원본이다.

### 보류 (제품 입력 필요 → 문서화·미수정)

- billing startTrial 멱등성 check-then-act 레이스 (PAYMENT_ACTIVATION §8 — $0·향후 trial 차단 유지, 실 PG 연동 시 이 흐름 교체 예정).

### 다음 사이클 후보 (대부분 사용자/시간 의존)

- 본격 사용자 트래픽 발생 시: OpenRelay → Cloudflare Calls / Twilio NTS 마이그
- 24h 후 5xx 재측정해서 ERR_HTTP_HEADERS_SENT fix 효과 검증
- 결제 (PaymentPage Pro 플랜)
- 다국어 확장 (zh, vi 등)
- 모바일 native 또는 capacitor — PWA/오프라인 우선 검토 (구 백로그 P19)
- 이력서 공개 프로필 / QR 공유 (구 백로그 P10)
- 스터디 문제 답변 모델 (StudyGroupQuestionAnswer 별도 테이블)

---

작성일: 2026-04-20 · 최근 갱신: 2026-06-10 (Known Gaps 체인지로그 정리 — 사이클 이력은 git log 로 이관)
