# Claude Code 세션 가이드 — resume-platform

이 파일은 Claude Code 세션이 이 저장소에서 작업을 시작할 때 빠르게 프로젝트를 파악할 수 있도록 작성되었습니다.

## 프로젝트 개요

- **이름**: 이력서공방 (Resume Workshop)
- **목적**: 한국어 이력서·자기소개서 작성·분석·코칭 플랫폼
- **배포**: Cloud Run `resume-api` (backend) · Vercel `resume-gongbang` (frontend)
- **DB**: Neon PostgreSQL (공유)

## 스택

- **Frontend**: React 19 · Vite 8 · TypeScript strict · TailwindCSS 4 · Radix UI · tiptap · React Query · RHF+Zod
- **Backend**: NestJS 11 · Prisma 7 · Jest
- **Monorepo**: pnpm workspaces (`packages/client`, `packages/server`, `packages/shared`)
- **LLM**: Groq · Gemini · OpenRouter (cost-optimized fallback)

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

다음 사이클 후보(BENCHMARK.md §4):

- Peer Review 커뮤니티 "이력서 봐주세요" 카테고리 정착 (ReportButton 인프라 재활용)
- 채용공고 URL 붙여넣기 → 자동 파싱 (원티드/잡코리아 계약 없이 대체)
- PDF/이미지 OCR 한계 개선

---

작성일: 2026-04-20 · 최근 갱신: 이 세션
