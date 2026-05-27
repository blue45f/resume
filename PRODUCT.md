# 이력서공방 Design Context

## Product

이력서공방(Resume Workshop) — 한국어 AI 기반 이력서/경력 관리 플랫폼. 취업 준비생·경력자·리쿠르터·코치를 위한 통합 커리어 허브. 이력서 작성·변환·공유, 채용공고 탐색·지원, 커뮤니티, 모의 면접(카메라), 코칭 매칭, 스터디 그룹 등을 제공.

## Target audience

- **구직자(personal)**: 주 사용자. 이력서 작성·AI 변환·공유·채용지원·커뮤니티 참여.
- **리쿠르터(recruiter)**: 인재 탐색, 스카우트, 채용공고 등록·관리, 파이프라인 트래킹.
- **기업(company)**: 채용 대시보드, 팀 단위 스카우트, 기업 브랜딩 페이지.
- **코치(coach)**: 모의 면접관/경력 코칭 서비스 제공, 시간당 수수료 수령 (15% 플랫폼 수수료).
- 주요 연령대: 20~40대 한국인. 데스크톱 + 모바일 비율 비슷. 취업/이직 시즌에 집중 트래픽.

## Use cases (Jobs to be done)

- 이력서를 여러 양식(표준/영문/경력기술서/LinkedIn)으로 빠르게 변환
- 공개 이력서에 피드백·북마크·커뮤니티 상호작용
- 채용공고 검색·저장·지원 및 관리
- AI 피드백·JD 매칭·모의 면접 질문 생성
- 인재 스카우트 메시지 송수신, 응답 관리
- 코치 예약·세션 리뷰·커뮤니티 스터디 참여

## Brand personality / tone

**"Impeccable"** — 흠결 없음, 정제됨, 과함 없이 완성도 높은.

- **Refined / professional / calm**. 일을 잘하는 도구가 줘야 할 신뢰감.
- **Korean-first** (UI는 한국어 주), 다국어(영/일) 대응.
- **NOT** flashy, NOT playful, NOT retro-futuristic, NOT neon, NOT glassmorphic.
- 취업이라는 진지한 맥락과 어울리는 차분함 + 현대적 감각.

## Visual language (확정됨)

### Palette — 금지 및 허용

- **금지**: purple/violet/pink/magenta 일체 사용 금지. AI 슬롭 색상 조합(cyan-on-dark, purple→blue 그라디언트, 네온) 금지. 순수 #000 / #fff 금지(미세 tint).
- **Neutrals**: `--color-surface: #ffffff`, `--color-surface-raised: #fafafa`, `--color-surface-sunken: #f5f5f5`, `--color-border: #e8e8e8`, `--color-text: #1a1a1a`. Dark mode: `#0f0f0f`, `#171717`, `#262626`, `#f5f5f5`.
- **Accent (제한적)**: blue(`#2563eb`), sapphire(`#0c4a6e`), cyan(`#0891b2` / `#06b6d4` / `#38bdf8`). 주로 포커스링, 활성 상태, 소량 강조.
- **Semantic**: `.badge-green/amber/red` 의미 기반만 허용.

### Typography

- System UI 기본 (Inter, Roboto 금지하려 했으나 system fallback 허용). Body는 system-ui.
- Display/heading에 한국 sans-serif 또는 Playfair-style serif 변형 (Resume 템플릿에 따라 다름 — `src/lib/resumeThemes.ts` 참조).
- Scale: fluid (clamp), 명확한 위계(h1 1.35rem@mobile → 3rem@desktop).

### Spacing & radius

- `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-xl: 20px`.
- gap 리듬: `gap-2 md:gap-4 lg:gap-6` 패턴.
- 터치 타겟 44×44px 최소 (`.icon-btn`).

### Shadow & motion

- `--shadow-sm/md/lg/hover` 단계 (subtle → elevated).
- `--transition-fast: 150ms cubic-bezier(0.25, 1, 0.5, 1)` (ease-out quint)
- `--transition-normal: 250ms cubic-bezier(0.25, 1, 0.5, 1)`.
- bounce/elastic easing 금지.

### Card / button

- `.imp-card`: subtle border + shadow-sm + rounded-lg. Hover: shadow-hover + translateY(-2px).
- `.imp-btn`: scale(0.98) on active, weight 500, smooth transition.
- `.imp-divider`: 1px border-subtle, no heavy separators.

### Component libraries

- **Radix UI** for 프리미티브 (Dialog, AlertDialog, DropdownMenu, Popover, Select, Tooltip).
- **Swiper.js** v12 for carousel/slider (BannerSlider, hero).
- **TipTap** for rich text (이력서 bullet descriptions).
- **Sonner** for toast.
- **Recharts** for 통계 차트.

## Differentiation

- 한국어 취업 컨텍스트 (PIPA 준수, 이력서 양식의 한국적 관행).
- AI 변환 6종 (표준/경력기술서/자기소개서/LinkedIn/영문/개발자) — 프리셋 + 커스텀 프롬프트.
- 채용공고 기반 면접 질문 AI 생성 + 스터디 그룹 + 모의 면접 + 코치 매칭 수직 통합.
- Impeccable 무채색 팔레트로 경쟁사(흔한 purple/neon) 대비 차별화.

## Quality bar

**Flagship** — 완성도 높은 프로덕션. 소소한 디테일(정렬, 간격, 포커스링, 다크모드, 반응형)까지 철저히.

## Constraints

- React 19 + Vite 8 + TailwindCSS 4 + TypeScript strict.
- 프론트: Vercel Hosting.
- 백엔드: NestJS 11 + Prisma 7 on GCP Cloud Run (asia-northeast3).
- prefers-reduced-motion 존중.
- WCAG AA 최소 (텍스트 contrast ratio ≥ 4.5:1).
- 모바일 우선, PWA 설치 지원 (manifest.json).
