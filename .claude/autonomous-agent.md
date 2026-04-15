# Resume Platform 자율 고도화 에이전트 지침
> 매 실행마다 이 파일을 읽고 전체 절차를 따릅니다. 지침은 계속 업데이트됩니다.

## 프로젝트 정보
- **스택**: NestJS (백엔드) + Prisma (ORM) + React 19 + TypeScript + Tailwind CSS 4
- **DB**: PostgreSQL (Neon)
- **스타일**: Tailwind CSS 4.2 + 커스텀 CSS 변수 (index.css 900줄+)
- **차트**: Recharts (설치됨)
- **i18n**: i18next + react-i18next (설치됨, ko/en 지원)
- **AI**: Anthropic SDK (Groq 멀티프로바이더)
- **파일**: Cloudinary
- **비교 벤치마크**: Resume.io, Zety, Canva Resume, LiveCareer, Jobscan, Kickresume, LinkedIn, Wanted, Saramin, Rallit

---

## 매 실행 절차

### STEP 1: 현황 파악
```bash
git log --oneline -30
```
최근 커밋으로 무엇이 구현되었는지 파악. 이미 구현된 항목 건너뜀.

---

### STEP 2: 전체 검증 (반드시 수행 — 에러 발견 즉시 수정)

#### 2-1. 빌드 / 타입 / 테스트
```bash
# 프론트엔드
npx tsc --noEmit 2>&1 | head -40
npm run build 2>&1 | tail -15

# 백엔드
cd server && npx tsc --noEmit 2>&1 | head -40
cd server && npm run build 2>&1 | tail -15
cd server && npm test -- --passWithNoTests 2>&1 | tail -30
cd server && npx prisma validate
```

#### 2-2. 핵심 API 존재 확인 (없으면 구현)
```bash
grep -r "@Get\|@Post\|@Patch\|@Delete" server/src --include="*.ts" -l 2>/dev/null | head -20
```
필수 엔드포인트:
- `GET /api/banners/active` — 활성 배너
- `GET /api/notices`, `GET /api/notices/popup` — 공지사항
- `GET /api/system-config/public` — 공개 설정
- `GET/POST/PATCH/DELETE /api/resumes` — 이력서 CRUD
- `POST /api/resumes/:id/transform` — AI 변환
- `GET /api/auth/me` — 현재 유저
- `GET /api/jobs`, `GET /api/jobs/my` — 채용공고
- `GET /api/applications` — 지원 현황
- `GET/POST /api/cover-letters` — 자기소개서
- `GET /api/templates` — 템플릿
- `GET /api/notifications` — 알림
- `GET /api/social/scouts` — 스카우트

#### 2-3. 어드민 기능 확인
- `AdminPage.tsx` — 실제 DB 통계 API 연동 여부 확인
- 배너/공지 CRUD UI 존재 여부
- 유저 관리 (목록/역할변경) 구현 여부
- `monetization_enabled`, `maintenance_mode` 시스템 설정 토글 UI

#### 2-4. 프론트엔드 핵심 페이지
- `HomePage` — BannerSlider + NoticePopup + 실제 API 통계
- `EditResumePage` — 섹션 편집 + 자동저장 인디케이터
- `PreviewPage` — 미리보기 + PDF 다운로드
- `AdminPage` — role=admin 접근 제한 + 실제 데이터
- `PricingPage` — `monetization_enabled` 반영

#### 2-5. 하드코딩 탐지 및 제거
```bash
grep -rn "Math\.random\(\)\|'mock\|\"mock\|TODO\|FIXME\|hardcod\|\|\| 26\|\|\| 0 \/\/" \
  src/ server/ --include="*.ts" --include="*.tsx" | grep -v "node_modules\|\.spec\." | head -20
```
발견 즉시 실제 API 연동으로 교체.

#### 2-6. 샘플 데이터 시드 (테이블이 비어있을 때)
**샘플 데이터 필수 규칙:**
- 모든 샘플 엔티티에 `isSample: true` 플래그
- 화면 표시: 이력서 카드 → 주황 "SAMPLE" 배지, 어드민 목록 → 연한 배경 + "샘플" 칩
- 샘플 회원 email: `sample-xxx@sample.local`
- 어드민 설정에 "샘플 데이터 일괄 삭제" 버튼

시드 스크립트: `server/prisma/seed-sample.ts` 생성 후 실행
포함해야 할 케이스:
- 회원 10명+ (신입/경력/리크루터/기업관리자 혼합)
- 이력서 20개+ (개발자/디자이너/마케터/신입/영문 다양하게)
- 채용공고 10개+ (프론트엔드/백엔드/디자이너/마케터/PM)
- 지원 현황 (모든 status 케이스)
- 배너 3개 (색상 다양), 공지 6개 (유형 다양)
- 스카우트 메시지 5개 (읽음/안읽음)

---

### STEP 3: 하드코딩 제거 우선순위

| 파일 | 문제 | 해결 |
|------|------|------|
| `ProfileViewers.tsx` | `Math.random()` 뷰어 생성 | `GET /api/resumes/:id/viewers` API 구현 후 연동 |
| `RecruiterDashboardPage.tsx` | API 실패 시 빈 배열 | 에러 상태 + 재시도 버튼 |
| `server/llm/llm.service.ts` | `TEMPLATE_PROMPTS` 상수 | Template DB의 prompt 필드에서 동적 로드 |
| 각 controller | 비로그인 빈 배열 반환 | `401 UnauthorizedException` |
| `src/mocks/` | MSW mock 데이터 | 개발 환경에서만 활성화 확인 |

---

### STEP 4: UI/UX 고도화 (매 실행마다 개선 항목 1~2개 선택)

#### [U1] 애니메이션 시스템 (CSS 기반 — Framer Motion 없음)
이미 구현된 것: `fadeInUp`, `shimmer`, `cardEnter`, `pageEnter`, `scroll-progress`
추가/개선해야 할 것:
- **scroll-reveal**: `.reveal` 클래스 + IntersectionObserver hook (`src/hooks/useScrollReveal.ts`)
  ```typescript
  // useScrollReveal.ts — 스크롤 시 .is-visible 클래스 추가
  ```
- **hover-lift 강화**: `translateY(-3px)` + `box-shadow` 더 세련되게
- **button ripple**: `.btn-ripple::after` pseudo-element
- **gradient border**: `::before` pseudo로 그라디언트 테두리 애니메이션
- **float**: 히어로 섹션 요소에 위아래 float 애니메이션
- **pulse-glow**: CTA 버튼에 은은한 글로우 효과
- **skeleton wave**: 더 자연스러운 shimmer 웨이브
- **CSS 변수**: `--ease-out-quart`, `--ease-out-expo` 추가

**prefers-reduced-motion 반드시 존중**

#### [U2] 컬러 시스템 현대화
현재 primary: `#2563eb` (blue-600) → 더 세련된 `#6366f1` (indigo-500)으로 통일
```css
:root {
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-light: #e0e7ff;
  --color-primary-dark: #3730a3;
}
```
모든 파란색 CTA 버튼을 indigo로 변경 (단 링크드인 연동 버튼 등 브랜드 컬러는 유지)

#### [U3] 이력서 카드 (ResumeThumbnail) 개선
- 카드 진입 stagger 애니메이션 (index prop 받아서 `stagger-${index}`)
- hover 시 편집/미리보기 액션 오버레이
- 완성도 표시 (circular SVG progress)
- 가시성 배지 (공개/비공개 아이콘)
- 샘플 배지 (주황색 "SAMPLE")
- 마지막 수정 시간 표시

#### [U4] 비로그인 랜딩 페이지 개선
히어로 섹션 아래에 추가:
- **Features Grid** (6개 기능 카드: AI 작성/ATS 분석/템플릿/공유/자소서/커리어)
- **소셜 프루프** (후기 카드 3개 + 별점)
- **통계 바** (회원수/이력서수/조회수 카운트업 — 실제 API)
- **CTA 섹션** (상단 + 하단 두 군데)

#### [U5] 로그인 페이지 개선
- 좌: 브랜드 패널 (그라디언트 배경 + 핵심 가치 3개)
- 우: 로그인 폼 (소셜 버튼 스타일 개선)
- 모바일: 단일 컬럼

#### [U6] Empty State 개선
`EmptyState.tsx` — SVG 일러스트 + float 애니메이션 + 명확한 CTA

#### [U7] Header 개선
- 스크롤 시 backdrop-blur + shadow 강화
- 네비 링크 active 상태 인디케이터
- 모바일 메뉴 슬라이드 애니메이션

#### [U8] Footer 개선
- 3단 그리드 (브랜드 / 링크 / 소셜)
- 그라디언트 divider
- SNS 링크 hover 애니메이션

#### [U9] 다크모드 완성도
- 모든 페이지/컴포넌트 다크모드 테스트
- 시스템 prefers-color-scheme 자동 감지
- 헤더 토글 버튼 (☀/🌙 아이콘)

#### [U10] 반응형 완성도
- 모든 페이지 375px / 768px / 1024px 검증
- 모바일 하단 탭 바 (`MobileBottomNav.tsx`) 모든 주요 화면 연결
- 테이블 → 카드 변환 (모바일에서 테이블 사용 금지)

---

### STEP 5: 데이터 시각화 (Recharts 사용)

Recharts 설치됨. 아래 컴포넌트에 적용:

#### 5-1. DashboardStats
- `AreaChart`: 이력서 조회수 7일 트렌드
- `PieChart` 또는 `RadialBarChart`: 이력서 상태 분포

#### 5-2. ResumeAnalytics
- `BarChart`: 섹션별 완성도
- `LineChart`: 조회수 추이

#### 5-3. AdminPage
- `AreaChart`: 사용자 가입 추이 (30일)
- `BarChart`: 일별 이력서 생성
- `PieChart`: 플랜별 분포

#### 5-4. CareerInsights
- `RadarChart` 또는 `BarChart`: 스킬 강도

**Recharts 스타일 통일:**
```tsx
const CHART_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
// ResponsiveContainer + 다크모드 stroke 대응
// CartesianGrid: strokeDasharray="3 3", stroke 다크모드 대응
// Tooltip: borderRadius 8, boxShadow, 다크모드 배경
```

---

### STEP 6: 기능 고도화 (우선순위 순)

#### [P1] 배너 시스템 ✅ 구현됨
- 추가 개선: 터치 스와이프 지원, 배너 클릭 통계

#### [P2] 공지사항 시스템 ✅ 구현됨
- 추가 개선: 공지 유형별 아이콘, 점검 모드 시 전체 화면 배너

#### [P3] SystemConfig (무료/유료 ON/OFF) ✅ 구현됨
- 추가 개선: 어드민 UI에서 실시간 토글, 변경 즉시 반영

#### [P4] i18n 다국어 ✅ 구현됨 (ko/en)
- 추가 언어: 일본어(ja), 중국어 간체(zh)
- LanguageSwitcher 헤더에 연결
- 날짜/숫자 형식 현지화

#### [P5] 어드민 대시보드 고도화 ⭐ 최우선
- Recharts 차트 추가 (가입 추이, 이력서 생성, 플랜 분포) — AreaChart/BarChart/PieChart
- **유저 관리** (AdminUsersTab): 검색/필터, 역할 변경(user/recruiter/company/admin), 플랜 변경, 계정 정지/복구, 이메일 발송
- **이력서 관리** (AdminResumesTab): 공개 이력서 목록, 추천 설정, 샘플 배지 표시
- **배너 관리** (AdminBannersTab): CRUD UI, 드래그 순서변경, 미리보기
- **공지 관리** (AdminNoticesTab): CRUD UI, 유형/팝업/고정 설정
- **시스템 설정** (AdminSettingsTab): monetization_enabled, maintenance_mode 실시간 토글
- **어드민 사이드바** 네비게이션 (탭별 분리)
- 모든 탭 실제 DB 데이터 API 연동 필수

#### [P6] 기업/리크루터(스카우트) 기능 고도화 ⭐ 최우선
- **기업 프로필 페이지**: 회사 정보, 복지/문화, 채용 중인 공고 목록, 기업 인증 배지
- **채용공고 CRUD**: 상세 작성 폼 (포지션/요건/우대/급여/위치/마감일)
- **리크루터 이력서 검색**: 스킬/경력년수/위치/학력 필터, 북마크 기능
- **지원자 칸반 보드**: 상태별 컬럼 (지원/서류검토/1차면접/2차면접/최종합격/불합격), 드래그
- **스카우트 메시지 UI** 개선: 읽음 확인 상태, 답장 기능, 발송 이력, 수신함/발신함
- **기업 인증 배지**: 공개 이력서 카드에 스카우트 가능 여부 표시
- **스카우트 제안 받기/거절 플로우**: 구직자 알림 연동

#### [P7] AI 기능 고도화
- AI 스트리밍 응답 (타이핑 효과 — SSE/ReadableStream)
- AI 경력 불릿 개선 버튼 (인라인)
- AI 직종별 키워드 추천 (JD 입력 → 매칭 키워드)
- AI 커버레터 생성 (회사/포지션 맞춤)
- AI 이력서 종합 피드백 (강점/약점/개선 제안)
- AI 사용량 트래킹 + 무료 한도 표시

#### [P8] ATS 점수 / 이력서 분석
- 완성도 점수 0~100 (섹션 가중합)
- ATS 호환성 체크리스트
- 키워드 갭 분석 (JD 붙여넣기 → 누락 키워드)
- 개선 제안 리스트

#### [P9] 템플릿 시스템 고도화
- 템플릿 3종 추가 (Minimal/Modern/Executive/Creative)
- 실시간 전환 미리보기
- 컬러 테마 5종
- 폰트 3종 선택

#### [P10] 이력서 공개 프로필 / 공유
- slug 기반 공개 URL `/r/{slug}`
- OG 이미지 메타태그
- SNS 공유 버튼 (카카오/링크드인)
- QR코드 생성
- 비밀번호 보호 공유링크 개선

#### [P11] PDF / 내보내기
- A4/Letter 사이즈 선택
- 페이지 분할 최적화
- Word(.docx) 내보내기 기초

#### [P12] 알림 시스템 고도화
- SSE 또는 polling 기반 실시간 알림
- 읽지 않은 뱃지 (헤더 NotificationBell)
- 알림 설정 페이지 (유형별 ON/OFF)

#### [P13] 소셜 기능
- 공개 이력서 피드/탐색 페이지 개선
- 북마크/좋아요 UI 개선
- 인기 이력서 랭킹

#### [P14] 지원 현황 관리
- 칸반 보드 (드래그)
- 면접 일정 캘린더
- 합격률 통계

#### [P15] 검색
- PostgreSQL 전문검색 (`@@tsquery`)
- 자동완성 (기술스택/회사명)
- 검색 필터 강화

#### [P16] 보안/성능
- Rate limiting 검증
- Lighthouse 90+ 목표
- 이미지 lazy loading
- 번들 크기 분석

#### [P17] 유료화 준비
- PricingPage: monetization_enabled=false → "곧 출시" 배너
- 플랜별 FeatureGate 컴포넌트
- Toss Payments 연동 코드 스캐폴딩
- 구독 관리 페이지

#### [P18] 온보딩 플로우
- 첫 로그인 시 3단계 위저드 (직종/경력/목표)
- 빈 이력서 Quick Start 가이드

#### [P19] PWA / 오프라인
- manifest.json 개선
- Service Worker 기초
- 오프라인 이력서 편집 (IndexedDB)

#### [P20] 테스트 커버리지 강화
- Jest 단위 테스트: 서비스 레이어 핵심 메서드
- Supertest: 핵심 API 엔드포인트
- React Testing Library: 주요 컴포넌트

---

### STEP 7: 테스트 작성

새 기능 구현 후:
```bash
cd server && npm test -- --passWithNoTests 2>&1 | tail -20
```
실패 테스트 수정.

---

### STEP 8: 커밋 전 최종 검증 (필수 — 생략 절대 금지)

> **이 단계를 건너뛰고 커밋하는 것은 절대 금지입니다.**
> 빌드/타입/테스트 중 하나라도 실패하면 먼저 수정한 후 커밋하세요.

```bash
# ① 프론트엔드 타입 검사
npx tsc --noEmit 2>&1 | head -30
# ② 프론트엔드 빌드
npm run build 2>&1 | tail -20
# ③ 백엔드 타입 검사
cd server && npx tsc --noEmit 2>&1 | head -30
# ④ 백엔드 빌드
cd server && npm run build 2>&1 | tail -20
# ⑤ 백엔드 테스트
cd server && npm test -- --passWithNoTests 2>&1 | tail -20
# ⑥ Prisma 스키마 유효성
cd server && npx prisma validate
```

모든 명령이 에러 없이 통과된 후에만:
```bash
cd /Users/hjunkim/WebstormProjects/resume
git add -A
git commit -m "feat/fix/style: [작업 내용 요약] — 빌드+타입+테스트 완료"
git push origin main
```

---

## 코드 품질 기준

| 항목 | 기준 |
|------|------|
| TypeScript | strict 모드, 타입 에러 0개 목표 |
| 빌드 | 반드시 성공 (실패 시 원인 파악 후 수정) |
| 하드코딩 | 금지 — mock/dummy/Math.random() 사용 금지 |
| API 연동 | 모든 데이터는 실제 API/DB에서 |
| 에러 처리 | try/catch + HttpException, 사용자 친화 에러 메시지 |
| UI 텍스트 | 한국어 (i18n 키 사용 권장) |
| 반응형 | 375px 이상 지원 |
| 다크모드 | 모든 컴포넌트 대응 |
| 접근성 | aria-label, alt, 키보드 네비게이션 |
| 애니메이션 | prefers-reduced-motion 존중 |
| 컬러 | primary = indigo (#6366f1) 계열 통일 |
| 차트 | Recharts 사용, 다크모드 대응 |
| 샘플 데이터 | isSample: true 필드로 구분, 화면에 배지 표시 |
