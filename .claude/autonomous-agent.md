# Resume Platform 자율 고도화 에이전트 지침 (계속 업데이트됨)

## 프로젝트 정보
- 스택: NestJS (백엔드) + Prisma (ORM) + React + TypeScript (프론트엔드)
- DB: PostgreSQL (Neon)
- 비교 벤치마크: Resume.io, Zety, Canva Resume, LiveCareer, Jobscan, Kickresume, LinkedIn, Wanted, Saramin, Rallit

---

## 매 실행 절차

### STEP 1: 현황 파악
```bash
git log --oneline -30
```
최근 구현된 기능과 미구현 항목 파악. 이미 구현된 항목은 건너뜀.

---

### STEP 2: 전체 기능 검증 (반드시 수행, 에러 발견 시 즉시 수정)

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
cd ../backend && npx tsc --noEmit 2>&1 | head -40
cd backend && npm run build 2>&1 | tail -15
cd ../frontend && npm run build 2>&1 | tail -15
cd backend && npm test -- --passWithNoTests 2>&1 | tail -30
cd ../frontend && npm test -- --watchAll=false --passWithNoTests 2>&1 | tail -30
cd backend && npx prisma validate
```

발견된 모든 타입 에러, 빌드 에러, 테스트 실패를 수정한 후 다음 단계 진행.

---

### STEP 3: 하드코딩 제거 (발견 즉시 수정)

아래 파일들에 하드코딩된 임시 데이터가 있음. 발견 시 실제 API/DB로 교체:

#### 3-1. ProfileViewers.tsx
- 랜덤으로 뷰어 데이터 생성하는 코드 → 실제 `/api/resumes/dashboard/viewers` API로 교체
- 백엔드에 해당 엔드포인트 없으면 구현

#### 3-2. HomePage.tsx
- `stats?.templates || 26` 같은 하드코딩 폴백 → 0 또는 로딩 스켈레톤으로 교체

#### 3-3. RecruiterDashboardPage.tsx
- API 실패 시 빈 배열 반환 → 에러 상태 표시 + 재시도 버튼

#### 3-4. server/llm/llm.service.ts
- `TEMPLATE_PROMPTS` 하드코딩 → Template DB 모델의 prompt 필드에서 동적 로드

#### 3-5. server controllers (notifications, cover-letters, social, jobs, applications)
- 비로그인 시 빈 배열 반환 → 401 UnauthorizedException 반환

#### 3-6. src/mocks/ 디렉토리
- MSW mock 데이터를 개발 환경에서만 활성화되도록 확인
- 프로덕션 빌드에서 mock 핸들러 제거 확인

---

### STEP 4: 기능 고도화 (우선순위 순으로 미구현 항목 1~2개 선택)

#### [P1] 배너 시스템 *(미구현 시 최우선)*
- 메인 페이지 슬라이드 배너 (자동재생, dots, 터치 스와이프)
- 어드민 배너 CRUD (생성/수정/삭제/순서변경/활성화/기간설정)
- Prisma 모델:
  ```prisma
  model Banner {
    id        String    @id @default(uuid())
    title     String
    subtitle  String    @default("")
    imageUrl  String    @default("") @map("image_url")
    linkUrl   String    @default("") @map("link_url")
    bgColor   String    @default("#6366f1") @map("bg_color")
    isActive  Boolean   @default(true) @map("is_active")
    order     Int       @default(0)
    startAt   DateTime? @map("start_at")
    endAt     DateTime? @map("end_at")
    createdAt DateTime  @default(now()) @map("created_at")
    updatedAt DateTime  @updatedAt @map("updated_at")
    @@map("banners")
  }
  ```
- API: GET /banners/active (공개), GET/POST/PATCH/:id/DELETE/:id /admin/banners

#### [P2] 공지사항 시스템 *(미구현 시)*
- 공지사항 목록 (페이지네이션, 유형 필터), 상세, 메인 팝업 (localStorage dismiss)
- 어드민 공지 CRUD
- Prisma 모델:
  ```prisma
  model Notice {
    id        String    @id @default(uuid())
    title     String
    content   String
    type      String    @default("GENERAL")  // GENERAL, MAINTENANCE, EVENT
    isPopup   Boolean   @default(false) @map("is_popup")
    isPinned  Boolean   @default(false) @map("is_pinned")
    startAt   DateTime? @map("start_at")
    endAt     DateTime? @map("end_at")
    createdAt DateTime  @default(now()) @map("created_at")
    updatedAt DateTime  @updatedAt @map("updated_at")
    @@map("notices")
  }
  ```
- API: GET /notices, GET /notices/popup, GET /notices/:id, CRUD /admin/notices

#### [P3] 어드민 대시보드 고도화
- 통계 위젯 (실제 DB 집계): 총 유저, 오늘 가입, 총 이력서, 오늘 생성, DAU, 유료 플랜 수
- 유저 관리: 목록(검색/필터/페이지네이션), 역할 변경, 플랜 변경, 계정 정지
- 이력서 관리: 공개 이력서 목록, 추천 설정, 신고 처리
- 시스템 설정: 기능 ON/OFF, 점검 모드 활성화
- 어드민 사이드바 네비게이션 (대시보드/유저/이력서/배너/공지/채용/설정)

#### [P4] 기업 회원/리크루터 기능
- 기업 프로필 페이지 (회사명, 로고, 소개, 업종, 규모, 복지)
- 채용공고 CRUD (포지션/급여범위/위치/요건/혜택/마감일/고용형태)
- 채용공고 목록 페이지 (필터: 직군/위치/고용형태/경력)
- 리크루터 이력서 검색 (스킬/경력/위치/학력/연봉 필터)
- 지원자 관리 칸반 보드 (서류검토→면접→최종→합격/불합격)
- 스카우트 메시지 발송/수신 (읽음 확인, 답장)
- 기업 인증 배지 시스템
- 리크루터 구독 플랜
- 리크루터 대시보드 (공고별 지원자 통계, 스카우트 현황)

#### [P5] UI/UX 고도화
- 이력서 작성 진행률 바 (섹션별 채움 정도 계산, 상단 스티키)
- 자동저장 인디케이터 ("방금 저장됨", "저장 중...")
- 스켈레톤 로딩 (모든 목록/카드)
- Empty State 컴포넌트 (일러스트 + CTA)
- 모바일 반응형 전수 점검 (375px, 768px, 1024px)
- 인라인 폼 유효성 검사
- 다크모드 지원 (CSS 변수 기반, localStorage 저장)
- 디자인 토큰 (colors/spacing/typography CSS 변수)
- 키보드 단축키 (Ctrl+S 저장, Ctrl+P 미리보기)

#### [P6] ATS 점수 / 이력서 분석
- 이력서 완성도 점수 (0~100, 섹션 가중 합산)
- ATS 호환성 체크리스트
- 누락 섹션 경고 + 추가 권유 버튼
- 직무기술서 붙여넣기 → 키워드 매칭 분석
- 개선 제안 리스트 (우선순위 표시)

#### [P7] 템플릿 시스템 고도화
- 시각적 차별화 템플릿 3종+:
  - Minimal (1단 깔끔, 모노톤)
  - Modern (사이드바 2단, 컬러 포인트)
  - Executive (고급 헤더, 타임라인)
  - Creative (비대칭 레이아웃, 아이콘)
- 실시간 템플릿 전환
- 컬러 테마 5종
- 폰트 3종
- 템플릿별 미리보기 썸네일

#### [P8] 이력서 공개 프로필 / SNS 공유
- 공개 이력서 URL (slug 기반: /r/김개발-백엔드개발자)
- OG 이미지 자동 생성
- 조회수/방문자 통계
- SNS 공유 버튼 (카카오/링크드인/트위터)
- QR코드 생성
- 이력서 링크 비밀번호 보호

#### [P9] PDF / 내보내기 고도화
- 폰트 임베딩 PDF
- A4/Letter 사이즈 선택
- 페이지 분할 최적화
- Word (.docx) 내보내기
- 인쇄 최적화 CSS

#### [P10] AI 기능 고도화
- AI 자기소개 초안 생성 (경력 기반)
- AI 경력기술서 불릿 개선
- AI 직종별 키워드 추천
- AI 커버레터 생성 (회사/포지션 맞춤)
- AI 이력서 리뷰 (강점/약점 분석)
- 스트리밍 응답 (타이핑 효과)

#### [P11] 알림 시스템 고도화
- 실시간 알림 (WebSocket 또는 SSE)
- 이메일 알림 (NodeMailer): 스카우트 수신, 지원 현황 변경
- 알림 설정 페이지 (유형별 ON/OFF)
- 읽지 않은 알림 뱃지

#### [P12] 소셜 기능 고도화
- 이력서 피드 (공개 이력서 타임라인)
- 좋아요/북마크 기능 UI 개선
- 댓글 시스템 (이력서에 피드백)
- 팔로우/팔로워 페이지
- 인기 이력서 랭킹

#### [P13] 지원 현황 관리 고도화
- 지원 현황 칸반 보드 (드래그 앤 드롭)
- 지원 일정 캘린더
- 면접 준비 노트
- 합격률 통계
- 목표 회사 위시리스트

#### [P14] 검색 고도화
- 이력서 전문 검색 (ElasticSearch 또는 PostgreSQL 전문검색)
- 자동완성 (기술스택, 회사명)
- 검색 필터 (경력/학력/스킬/지역)
- 인기 검색어

#### [P15] 보안 / 성능
- Rate limiting (API 엔드포인트별)
- CSRF 보호
- SQL injection 방지 확인
- XSS 방지 확인
- API 응답 캐싱 (Redis 또는 인메모리)
- 이미지 최적화 (WebP 변환)
- 코드 스플리팅 확인
- Lighthouse 점수 90+ 목표

#### [P16] 다국어(i18n) 지원
- i18next + react-i18next 설치 및 설정
- 지원 언어: 한국어(ko, 기본), 영어(en), 일본어(ja), 중국어 간체(zh)
- 번역 파일 구조: `src/locales/{lang}/translation.json`
- 번역 대상:
  - 모든 UI 텍스트 (버튼, 레이블, 메시지, 플레이스홀더)
  - 에러 메시지
  - 이메일 알림 템플릿
  - 이력서 섹션명 (경력/학력/기술 등)
- 언어 전환 UI (헤더 드롭다운, 국기 아이콘)
- 언어 설정 localStorage 저장
- URL 기반 언어 라우팅 선택적 지원 (/en/*, /ja/*)
- 날짜 형식 자동 변환 (한국: 2024년 3월, 영어: March 2024)
- 숫자/통화 형식 현지화

#### [P17] UI/UX 디자인 시스템 고도화
- **디자인 토큰 완성**: CSS 변수로 color/spacing/typography/shadow/border-radius 통일
- **컴포넌트 라이브러리 구축**:
  - Button (primary/secondary/ghost/danger, size: sm/md/lg, loading state)
  - Input (text/select/textarea, error state, helper text)
  - Card (기본/호버/선택됨)
  - Badge (색상 변형, 크기)
  - Modal (사이즈 변형, 애니메이션)
  - Toast/Snackbar (success/error/warning/info)
  - Dropdown Menu
  - Tabs
  - Accordion
  - Pagination
  - DataTable (정렬/필터/페이지네이션)
  - Avatar (이미지/이니셜 폴백)
  - Progress (bar/circle)
  - Skeleton
- **애니메이션**:
  - 페이지 전환 애니메이션 (Framer Motion 또는 CSS transition)
  - 카드 호버 효과
  - 버튼 클릭 ripple 효과
  - 스켈레톤 shimmer 효과
  - 모달 오픈/클로즈 애니메이션
- **다크모드**:
  - CSS 변수 기반 완전한 다크모드
  - 시스템 설정 자동 감지 (prefers-color-scheme)
  - 수동 토글 (헤더 버튼)
  - localStorage 저장
- **반응형 개선**:
  - 모바일 햄버거 메뉴
  - 모바일 최적화 이력서 편집기
  - 모바일 탭 바 네비게이션 (하단 고정)
  - 태블릿 레이아웃 최적화
- **접근성(a11y)**:
  - 키보드 네비게이션
  - ARIA 레이블
  - 색상 대비 4.5:1 이상
  - 스크린 리더 지원
  - Focus visible 스타일
- **마이크로인터랙션**:
  - 이력서 섹션 드래그앤드롭 순서 변경
  - 태그 추가/삭제 애니메이션
  - 저장 성공 체크마크 애니메이션
  - 숫자 카운트업 애니메이션 (통계)

#### [P18] 온보딩 / 튜토리얼
- 첫 로그인 시 온보딩 플로우 (3~5단계 위저드)
- 인터랙티브 튜토리얼 (Shepherd.js 또는 커스텀)
- 도움말 툴팁 (? 아이콘 호버)
- 빈 상태 가이드 (처음 이력서 만들기 CTA)
- 샘플 이력서 템플릿 미리보기

#### [P19] 대시보드 홈 고도화
- 개인화 대시보드 (최근 이력서, 지원 현황, 알림)
- 위클리 리포트 카드
- 이력서 조회수 트렌드 차트 (Recharts)
- 지원 현황 도넛 차트
- 추천 채용공고 (스킬 매칭)
- 이력서 완성도 위젯
- 커뮤니티 인기 이력서 피드

#### [P20] 이메일 / 알림 시스템
- NodeMailer + 이메일 템플릿 (React Email 또는 HTML)
- 이메일 종류: 회원가입 인증, 비밀번호 재설정, 스카우트 수신, 지원 현황 변경
- 인앱 알림 실시간화 (SSE 또는 폴링)
- 푸시 알림 (PWA Web Push)
- 알림 설정 페이지 (채널별/유형별 ON/OFF)

#### [P21] 무료/유료 운영 모드 전환 시스템 (어드민 ON/OFF)
현재는 무료 운영, 추후 유료 전환 대비:

- **어드민 시스템 설정 페이지**에 `monetization_enabled` 토글 추가
  - OFF (현재): 모든 기능 무료, 플랜 UI 숨김
  - ON: 플랜별 기능 제한 활성화

- **Prisma SystemConfig 모델**:
  ```prisma
  model SystemConfig {
    id    String @id @default(uuid())
    key   String @unique
    value String
    @@map("system_configs")
  }
  ```
  - key: `monetization_enabled` value: `false`
  - key: `maintenance_mode` value: `false`
  - key: `max_free_resumes` value: `5`
  - key: `site_name` value: `이력서 플랫폼`

- **유료화 준비 구조** (코드는 완성, ON/OFF만 어드민에서 제어):
  - **플랜 정의** (DB 또는 상수):
    - FREE: 이력서 3개, AI 변환 월 5회, 기본 템플릿
    - PRO (월 9,900원): 이력서 무제한, AI 변환 무제한, 프리미엄 템플릿, PDF 고화질, 우선지원
    - ENTERPRISE (월 29,900원): PRO 포함 + 기업 채용 기능, 팀 관리, API 접근
  - **플랜 페이지** `/pricing`: monetization_enabled=false면 "곧 출시" 배너 표시
  - **기능 제한 미들웨어**: monetization_enabled=false면 모든 제한 해제
  - **결제 연동 준비** (Toss Payments / Stripe 코드 스캐폴딩, 실제 키는 미입력)
  - **구독 관리 페이지**: 내 플랜 확인, 업그레이드/다운그레이드
  - **사용량 대시보드**: AI 사용 횟수, 이력서 개수, 스토리지 사용량

- **어드민 수익 대시보드** (유료 전환 시 활성화):
  - MRR (월간 반복 매출)
  - 유료 전환율
  - 플랜별 가입자 수
  - 이탈률

#### [P22] 모노레포 / 코드 아키텍처 개선
- 공통 타입 패키지 분리 (`packages/types/`)
- API 클라이언트 자동 생성 (OpenAPI/Swagger → TypeScript)
- 환경변수 타입 안전성 (Zod 스키마)
- 에러 코드 통일 (ErrorCode enum)
- 로깅 시스템 (Pino 또는 Winston, 요청/응답 로그)
- Health check 엔드포인트 실제 구현 (DB, Redis, 외부 API 상태)

---

### STEP 5: 테스트 작성 및 검증

새로운 기능 구현 후:
```bash
# 새 서비스/컨트롤러 단위 테스트 (Jest)
# 새 API 통합 테스트
cd backend && npm test -- --passWithNoTests 2>&1 | tail -30
```

---

### STEP 6: 커밋 및 푸시

```bash
git add -A
git commit -m "feat: [구현 내용 요약] — 빌드+테스트 검증 완료"
git push origin main
```

---

## 코드 품질 기준

- TypeScript strict 모드, 타입 에러 0개 목표
- 모든 API 에러 핸들링 (try/catch, HttpException)
- 한국어 UI 텍스트
- 컴포넌트 재사용성
- 빌드 성공 필수
- 모바일 반응형 (375px~)
- 접근성 기본 (aria-label, alt 텍스트)
- 하드코딩 금지: mock/dummy/임시 데이터 사용 금지, 실제 API/DB 연동
