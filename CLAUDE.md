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

1. **자동 push**: 이 저장소에서 커밋 직후 `git push` 자동 실행 (memory `feedback_auto_push`).
2. **테스트 필수**: 기능 추가 시 반드시 테스트 동반, 배포 전 전체 테스트 green 확인 (memory `feedback_testing`).
3. **Cloud Run 배포**: `--set-env-vars` 금지. `--update-env-vars` 또는 `--env-vars-file` 사용 (memory `feedback_gcp_deploy_envvars`).
4. **사이트 소개 페이지 정적 유지**: HelpPage/TutorialPage/About 등은 동적 컨텐츠 시스템으로 전환 안 함 (memory `feedback_site_intro_static`).
5. **커밋 메시지**: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` 필수.
6. **purple 금지**: Impeccable 디자인 시스템 — neutral + blue/cyan/sapphire + 상태색(emerald/amber/rose) 사용.

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
- 메모리: `/Users/hjunkim/.claude/projects/-Users-hjunkim-WebstormProjects-resume/memory/`

## 현재 알려진 개선 여지 (Known Gaps)

최근 사이클(2026-04-20)에서 이전 5개 gap 모두 해결됨:

- ✅ **i18n** — OverallHealthGauge/QuotableHighlights/CareerGapPanel 전면 `tx()` 적용, ko/en/ja `resumeAnalysis` 블록 추가
- ✅ **Client unit test** — vitest + @testing-library/react + jsdom 도입, `test:client` 스크립트, 17 smoke test (buildResumePlainText/analyzers)
- ✅ **EditResumePage 분석 패널** — `buildResumePlainText` 헬퍼로 Partial<Resume> → 텍스트 직렬화, OverallHealthGauge/InterviewabilityRow/CareerGapPanel/QuotableHighlights/UnquantifiedClaimsRewritePanel 노출, grid 반응형
- ✅ **접근성** — `role="progressbar"` + aria-value, section/h3 랜드마크, aria-hidden 장식, aria-label range
- ✅ **성능** — `useDeferredValue` (타이핑 레이턴시 보호) + `memoizeByText` (scoreSpecificity/detectMissingResumeSections 중복 호출 제거)
- ✅ **AI 리라이트** — `UnquantifiedClaimsRewritePanel` 로 `inline-assist: quantify` 엔드포인트 연결, 문장 단위 수치 보강 + 복사

2026-04-27 후속 사이클 (오후) — 신규 기능 + 분석 고도화:

- ✅ **한글 OCR 후처리** — `postProcessKoreanOcr`: NFD→NFC, 단일 한글 음절 3+ 연속 분리 보정 ('경 력 사 항' → '경력사항'), 숫자+단위 결합, 회사/대학 suffix
- ✅ **Pro 플랜 LLM 개인화 nudge** — `AiCoachingNudgeService.generateLlmNudge`: pro/enterprise 사용자에게 LLM 1줄 코칭 + section, 실패 시 휴리스틱 자연 폴백
- ✅ **Myers/LCS word diff** — `VersionPanel.wordDiff` Set 기반 → LCS 기반(O(N\*M))으로 정확한 토큰 순서/중복 인식
- ✅ **i18n 사용 통계** — `User.preferredLocale` 컬럼 + UpdateProfileDto + AdminStatsService.locales (groupBy preferredLocale) + i18n.setLocale 자동 동기화
- ✅ **프로필 아바타** — `POST /auth/avatar` (Cloudinary 256x256 face crop) + `PATCH /auth/avatar/preset` (Dicebear/Cloudinary/OAuth URL whitelist) + `DELETE /auth/avatar` + AvatarEditor 컴포넌트 (12 preset 갤러리 + 업로드 + 삭제)
- ✅ **음성 자연성 보강** — `naturalnessScore`: neural/wavenet/premium hint +30, vendor 매칭 +10. 어색한 voice (fred/cellos/whisper 등) 추가 제외. rate/pitch 보수적 범위(0.88~1.05/0.85~1.1)
- ✅ **면접 답변 분석** — heuristic `interviewAnswerAnalyzer` (길이/필러/STAR/정량/1인칭 점수 + 항목별 tip) + LLM 기반 깊이 분석 endpoint `POST /interview/answers/analyze` (강점/약점/개선/리라이트 답변/STAR breakdown)
- ✅ **커피챗 + WebRTC P2P** — `CoffeeChat` 모델 + 신청/수락/거절/취소/완료 + `WebrtcSignal` 큐(폴링 모델, 30초 TTL) + `useWebrtcPeer` hook(STUN 만, TURN 없음 = 서버 비용 0). CoachDetailPage `☕ 커피챗 신청` CTA + /coffee-chats/:id/room 통화 페이지
- ✅ **스터디 문제 검색** — listQuestions 에 category/difficulty/q/sort 필터 + upvote endpoint

총 1305 → 1329 tests green. DB migrations: `add_preferred_locale`, `add_coffee_chat`.

2026-04-26~27 사이클 — BENCHMARK.md §4 의 3개 gap + 추가 feature 모두 해결:

- ✅ **Peer Review** — HomePage '🙋 피드백 받기' CTA → `/community/write?category=resume&body=...` 템플릿 prefill. 기존 community 의 `resume` 카테고리 진입점 확보.
- ✅ **채용공고 URL 자동 파싱** — `POST /api/jobs/parse-url` (JSON-LD JobPosting → OG → LLM fallback, 24h DB 캐시, 6 req/min throttle, SSRF 차단). 한국 사이트(원티드/잡코리아/사람인/점핏/프로그래머스/로켓펀치/그리팅) 자동 감지.
- ✅ **PDF/이미지 OCR** — `FileTextExtractorService`: PDF (pdf-parse) / DOCX (mammoth) / TXT / RTF / **이미지(.jpg/.png/.webp via Gemini Vision)** 모두 지원. AutoGeneratePage 파일 업로드 흐름 server side 완성.
- ✅ **선택 공개 (selective)** — `Resume.visibility="selective"` + `ResumeViewer` 화이트리스트 (expiresAt/message/lastViewedAt/viewCount). 진입점 4종: EditResume / CoachDetail / Scouts / Messages. 알림 자동 발송 + view 시 owner 알림. 권한 없는 viewer 에는 🔒 안내 (PreviewPage).
- ✅ **JobUrlInput 통합** — CoverLetter / Applications / JobPost / AutoGenerate 4개 페이지에서 URL 붙여넣기 → 폼 자동 채우기.
- ✅ **운영 hygiene cron** — `ResumeViewerCleanupService` (@nestjs/schedule, 매일 03:00 UTC) — 만료된 ResumeViewer + 24h 지난 JobUrlCache 자동 정리.
- ✅ **i18n 신규 컴포넌트** — sharing._ / jobUrl._ / resume.visibility.\* / common.anonymous 키 추가, ko/en/ja 3개 locale 모두. SharedWithMeSection / AllowedViewersDialog / JobUrlInput / ShareResumeWithUserDialog + 4개 caller 모두 `tx()` 적용.

2026-04-27 사이클 — 위 5개 후보 모두 한번에 처리:

- ✅ **스캔 PDF OCR** — pdf-parse 결과 < 50자 시 Gemini Vision (`application/pdf` direct input) 폴백. poppler 등 시스템 deps 불필요.
- ✅ **모바일 UX** — JobUrlInput stack on mobile + min-h-[44px] 터치 타깃 + inputMode=url. Dialog/viewport meta는 이미 OK.
- ✅ **버전 비교** — VersionPanel.DiffViewer 의 changed 타입에 word-level inline highlight (oldSet/newSet mark). 긴 텍스트 expand/collapse.
- ✅ **AI 코칭 자동화** — `AiCoachingNudgeService` (@Cron 매주 일요일 06:00 UTC). 휴리스틱 5순위(자기소개/경력/기술/60일 미수정/경력 1건만) → 가장 영향 큰 개선 1개 알림. LLM 호출 0, 7일 throttle, 주당 최대 500명. NotificationBell + NotificationsPage 에 `coaching_nudge` 매핑 (💡 amber).
- ✅ **Performance** — HomePage 의 charts 의존(recharts ~437KB) lazy load (`DashboardStats`/`CareerInsights`). 초기 index 235→209KB (-26KB).

2026-04-27 EOD — 7 sprint sweeps + 의존성/번들/운영 sweep:

- ✅ **4 유형 flow audit** — 25개 영역 처리 (코치 / 리쿠르터 / 회사 / 구직자, USER_FLOWS.md 참조)
- ✅ **신규 model 2** — JobPostApplication (회사 → 지원자 pipeline), InterviewAnswer 확장 (analysisScore/Json/At)
- ✅ **신규 endpoints 15** — apply / applicants / pipeline / pipeline-stats / recommended-candidates / withdraw / interview answer history+detail / user search / announcement push 등
- ✅ **알림 type 신규 8** — coaching*review_request/\_received, coffee_chat*\*, job_application_received/\_stage
- ✅ **컴포넌트 신규 5** — InterviewScoreHistory, MyPlatformApplications, ApplicantDetailDrawer, AnnouncementPushPanel 등
- ✅ **WebRTC TURN 도입** — OpenRelay anonymous public TURN default (env 있으면 override). 데모 단계 비용 0
- ✅ **운영 5xx fix** — GlobalExceptionFilter 의 ERR_HTTP_HEADERS_SENT (모든 500 의 원인) → headersSent 가드 추가
- ✅ **major dep bump** — eslint 10, ts 6, jest 30 (+ @swc/jest 3x faster 2.4s), @nestjs/schedule 6, recharts 3
- ✅ **번들 분할** — vendor.js 1.5MB → 사라짐. heic 1.3MB / docx / i18n / image-compress 등 분리 lazy
- ✅ **테스트** — 1305 → 1369 server (+64), 17 → 31 client (+14), 모두 green
- ✅ **prod login hotfix** — LoginPage fetch 가 상대경로(/api/...) 라 Vercel 404 → API_URL prefix
- ✅ **Prisma migrate** — 신규 2개 (interview_analysis + job_post_application) prod DB 적용 완료
- ✅ **gcloud + Python 3.13 (pyenv)** — 운영 로그 분석 가능 (CLOUDSDK_PYTHON 환경변수 사용)

2026-05-29 사이클 — 라이브 검증 기반 버그픽스 + a11y + 분석기 3종:

- ✅ **프로덕션 무한 렌더 루프 fix** — EditResume 진입 시 `Maximum update depth exceeded`. 원인 2개: ResumeForm 의 `watch()` 결과를 useEffect deps 에 넣어 매 렌더 onDataChange → setLiveData 루프(→ ref + RHF 구독으로 전환), EditResumePage 가 ResumeForm 에 `initialData` 를 인라인 객체 리터럴로 전달해 매 렌더 reset() 루프(→ `useMemo([resume])` 안정화). StrictMode 무관 = prod 영향. (7e99672)
- ✅ **RichEditor StrictMode 크래시 fix** — tiptap `getHTML()` 가 destroy 된 에디터(schema=null)에서 호출 → `immediatelyRender:false` + `isDestroyed` 가드. dev 전용. (142f47c)
- ✅ **a11y** — LoginPage 무효 `role="tab"` → `aria-pressed` 토글, 비번 강도 `aria-describedby`, NewResume 중첩 label 해소 + AI 진행 `role=status`, 시작카드 focus-visible(전역 규칙이 단일 소스라 per-card 중복 제거), CommandPalette/CommunityPage 접근명, TagsPage `aria-pressed`.
- ✅ **분석기 3종(순수 TS + vitest + 패널, 라이브 검증)** — `extractResumeCoreMessages`(핵심 메시지 강도·카테고리·배치 추천 / EditResume), `analyzeJdCompetitiveLandscape`(경쟁 강도·기술 장벽·암묵적 난제·적합성 / InterviewPrep), `analyzeCoverLetterJdResonance`(자소서↔공고 가치 정합성 / CoverLetter). (5105561·60615f1·f4eaf46)
- ✅ **개선 우선순위 종합(캡스톤, 이력서+자소서)** — 임팩트=(100-value)\*weight(종합점수 상승 잠재폭) 순으로 재가공해 수많은 품질 패널을 "무엇부터 고칠까" Top-3 결정 지원으로 종합. `buildResumeImprovementPlan`(scoreInterviewability breakdown, EditResume 최상단) + `buildCoverLetterImprovementPlan`(buildCoverLetterScore 4축, CoverLetter 피드백 최상단). coverLetterScore axis 에 정규화 weight 노출(단일 소스). (143b173·a447528)
- ✅ **a11y/UX 추가** — CommandPalette/CommunityPage 접근명, TagsPage aria-pressed, dead watch 구독 제거, CoverLetter 80자 분석 임계 안내. (957e55b·95588f2)
- ✅ **2차 견고성 스카우트** — 렌더루프/메모리릭/stale-closure 재탐색 → 실질 신규 버그 0 (setTimeout=React18 no-op, ScrollToTop/TagSelector/MobileBottomNav=오탐으로 검증·제외). 코드베이스 견고성 확인.
- ✅ **테스트** — client 1176 → 1212 green. 테스트 계정으로 dev 라이브 검증(공개 라우트는 프론트만, 인증 페이지는 백엔드 잠깐 후 즉시 종료 — prod Neon @Cron 주의). 신규 패널은 형제 detail 패널 관례대로 한글 하드코딩(i18n 미적용).
- 참고: `resumeKeywordDensityVariation`(섹션별 밀도)은 기존 `analyzeSectionDensity`/`analyzeSectionBalance`와 중복 확인 → 미진행.

2026-05-30 사이클 — 적대적 보안 감사 3라운드 (Workflow find→2검증자→confirmed + 직접 코드 검증):

모든 발견을 워크플로 적대적 검증 + 직접 코드 추적으로 confirmed 한 뒤에만 수정. **전역 AuthGuard 가
비-@Public 라우트도 토큰 없이 통과(req.user=null)시키므로, 가시성/소유권 검증이 빠진 read 경로는
미인증 IDOR 가 된다** — 이 패턴이 다수 발견의 공통 뿌리.

- ✅ **plan 모델 통일** — 클라(free/standard/premium) ↔ 서버(free/pro/enterprise) vocab 불일치로 유료 게이팅·mockCheckout 깨지던 버그. 클라 plans.ts 를 서버 기준 정렬 + 회귀 가드. (b187c5f·eb329c4)
- ✅ **R1 보안** — job-url-parser SSRF(IPv6/난독화 IP/DNS·redirect 재검증), attachments selective IDOR, social PII(email) 노출, custom-throttler GET 전체 우회, LoginPage open-redirect(protocol-relative/백슬래시/userinfo 차단), client plan-trust 문서화. (ad3df1d·5c55a87)
- ✅ **R2 보안 (CRITICAL 2 + HIGH 4)** — OAuth 계정연동 탈취(링크 state 의 userId 가 HMAC 미서명 → 위조 userId 로 피해자 계정에 공격자 소셜 연동 → `generateLinkOAuthState` 로 서명 바인딩), resume export/slug/shortcode IDOR(미인증 비공개 이력서 유출 → `assertCanAccess`/`canViewResume` 공유 게이트), setSuspended superadmin 정지 차단, coffee-chat recordJoin IDOR, community 금칙어 update 우회, JWT role staleness(guard isSuspended 30s 캐시에 role piggyback). (cbaf045·de7c625·d1b745e)
- ✅ **R3 보안** — LLM 전 엔드포인트 가시성 게이트(aiSpellCheck/enhanceWithDocument/getTransformationHistory 가 `prisma.resume.findUnique` 직접 호출 → `assertCanAccess` 추가; feedback/job-match/stream/interview 는 findOne 에 userId 스레딩으로 소유자 접근 복구+게이트), templates authz(미인증 create·isDefault mass-assignment·findOne 비공개 템플릿 IDOR), interview quota 우회(save=false 시 row 미생성으로 quota 미카운트 → 항상 기록). (f66495d·667b8fa)
- ✅ **적대적 검증 신뢰성** — 워크플로 confirmed 를 직접 코드 추적으로 재검증, refuted(POST role guard·mockCheckout·community 댓글 XSS·cover-letters mass-assign 등)는 전부 독립 분석과 일치. cover-letters/notifications/interview-ownership 은 직접 검증으로 깨끗 확인. R3 검증자 다수가 StructuredOutput 미호출로 실패 → 해당 미검증 claim 전량 직접 검증 처리(중요: 워크플로 verify 실패 시 reasons:[] 는 "반박"이 아니라 "미검증").
- ✅ **테스트** — server 1487 → 1513 green (+26 회귀). client 1218 green. tsc green. 전 커밋 pre-commit(tsc+lint-staged) 통과.
- ✅ **templates findAll 누출 수정** — 목록이 모든 사용자의 비공개 템플릿(layout/prompt)을 노출하던 것을 viewer 스코프(공개/기본/시스템 + 본인, admin 전체)로 제한. 서버 `@CacheTTL` 제거(클라 5분 캐시가 커버).
- ⏸️ 알려진 low-sev (제품 입력 필요 → 문서화·미수정): billing startTrial 멱등성 check-then-act 레이스(PAYMENT_ACTIVATION §8 — $0·향후 trial 차단 유지, 실 PG 연동 시 이 흐름 교체 예정).

다음 사이클 후보 (대부분 사용자/시간 의존):

- 본격 사용자 트래픽 발생 시: OpenRelay → Cloudflare Calls / Twilio NTS 마이그
- 24h 후 5xx 재측정해서 ERR_HTTP_HEADERS_SENT fix 효과 검증
- 결제 (PaymentPage Pro 플랜)
- 다국어 확장 (zh, vi 등)
- 모바일 native 또는 capacitor
- 스터디 문제 답변 모델 (StudyGroupQuestionAnswer 별도 테이블)

---

작성일: 2026-04-20 · 최근 갱신: 2026-05-30 (적대적 보안 감사 3라운드 — plan 통일 + SSRF/IDOR/OAuth 탈취/quota 우회 등)
