# 이력서공방

AI 기반 이력서 관리 플랫폼. 이력서 작성, AI 분석/변환, 공유, 버전 관리를 지원하는 풀스택 서비스입니다.

> **운영 URL**: https://resume-silk-three.vercel.app

## 기술 스택

| 영역 | 기술 |
|------|------|
| 서버 | NestJS 11, Prisma ORM, PostgreSQL (Neon) |
| AI/LLM | Gemini (무료), Groq (무료), Anthropic Claude, n8n, OpenAI Compatible |
| 프론트엔드 | React 19, Vite 8, Tailwind CSS 4, TypeScript |
| 인프라 | Vercel (프론트), Render (백엔드), Neon (DB) |
| 보안 | JWT + OAuth2 (Google/GitHub/Kakao), Helmet + CSP, Rate Limiting (3-tier), HMAC, 요청 살균 |
| 테스트 | Jest, Supertest (200+ 테스트, 20+ 스위트) |

## 주요 기능

### 이력서 작성/관리
- **9개 섹션**: 인적사항(사진/생년/병역/복수 링크), 경력(부서/성과/기술스택), 학력(학점), 기술, 프로젝트(소속회사/기술스택), 자격증, 어학, 수상, 활동
- **증명사진 업로드**: base64 저장, 미리보기 좌측 배치
- **자동 버전 관리**: 수정 시마다 자동 스냅샷, 이전 버전 복원
- **이력서 복제**: 기존 이력서를 복사하여 새 이력서 생성
- **키보드 단축키**: Ctrl+S 저장, Arrow Key 탭 전환
- **내보내기**: 텍스트(.txt), 마크다운(.md) 형식으로 이력서 다운로드
- **멀티 테마 프리뷰**: 5종(클래식/모던/미니멀/프로페셔널/크리에이티브) 실시간 전환
- **섹션 순서 변경**: 항목별 위/아래 버튼으로 순서 조정
- **빠른 가져오기**: LinkedIn/기존 이력서 텍스트 붙여넣기 → AI 자동 생성
- **이력서 비교**: 2개 이력서 섹션별 시각 비교
- **자동 저장**: 30초 비활성 후 자동 저장 + 상태 표시
- **작성 체크리스트**: 12개 항목 완성도 체크 (필수/권장/선택)
- **중복 감지**: 경력/프로젝트 간 유사 콘텐츠 경고
- **이력서 통계**: 글자수, 단어수, 읽기 시간, 섹션 수
- **기술 분포 차트**: 카테고리별 기술 스택 시각화
- **경력 타임라인**: 경력+학력 시간순 시각화

### AI 기능 (5종)
- **AI 양식 변환**: 8가지 양식(표준/경력기술서/자기소개서/LinkedIn/영문/개발자/디자이너/커스텀) + 스트리밍
- **AI 이력서 자동 생성**: 비정형 텍스트 → 구조화된 이력서 JSON
- **AI 이력서 피드백**: 점수(0-100), 등급, 강점/개선점, 섹션별 분석
- **AI JD 매칭 분석**: 채용공고 매칭도(%), 매칭/부족 스킬, 수정 제안, 자소서 포인트
- **AI 면접 질문 생성**: 8-10개 예상 질문 + 면접관 의도 + 모범 답변
- **자기소개서 생성기**: 이력서+채용공고+어조 선택 → 맞춤 자기소개서
- **ATS 호환성 검사**: 이력서 ATS 통과율 분석 (0-100점), 문제점/팁 제공
- **섹션별 작성 팁**: 9개 섹션별 맥락 기반 코칭
- **AI 변환 이력**: 변환 결과 목록 + 원클릭 복사

### 공유 & 프로필
- **슬러그 URL**: `/@username/이력서-제목` 형태의 깔끔한 URL
- **공유 링크**: 고유 URL, 만료 시간, 비밀번호 보호 (bcrypt)
- **공개 이력서**: 탐색 페이지에서 검색/필터링
- **조회수 추적**: 공개 이력서 조회 카운트
- **이력서 완성도**: 섹션별 점수 + 개선 팁 (원티드 스타일)
- **커뮤니티 의견**: 공개 이력서에 의견/조언 댓글 (5-500자)
- **이력서 북마크**: 관심 있는 공개 이력서 저장
- **QR 코드 공유**: QR 코드 + Twitter/LinkedIn/이메일 공유
- **소셜 공유**: LinkedIn, Twitter 원클릭 공유
- **인기 기술**: 공개 이력서 기반 인기 기술 스택 순위

### 지원 관리
- **지원 내역 추적**: 회사별 지원 현황 CRUD, 상태별 필터(지원/서류/면접/합격/불합격)
- **대시보드 통계**: 이력서 수, 공개 수, 총 조회수, AI 변환 수, 최근 편집
- **공개/비공개 설정**: 지원 목록 visibility 전환
- **지원 댓글**: 공개 지원에 의견 남기기

### 기타
- **쿠키 동의**: GDPR 준수 배너
- **PWA 지원**: 모바일 홈 화면 추가 가능
- **404 페이지**: 사용자 친화적 에러 페이지
- **온보딩 배너**: 신규 사용자 3단계 가이드
- **자동 저장**: 30초 비활성 후 자동 저장
- **직종 필터**: 탐색 페이지 카테고리 필터

### 템플릿 & 태그
- **26개 직종별 템플릿**: 개발자, 디자이너, 기획/PM, 마케터, 영업, 데이터, 연구, 의료, 교육, 회계, 법률, HR, 공무원, 물류, 건축, 외식, 무역, 크리에이터, 제조, 프리랜서, 신입 등
- **태그 시스템**: 이력서 분류 및 필터링, 소유권 관리

### 관리자
- **사이트 통계**: 회원/이력서/콘텐츠/활동 현황 대시보드 (/admin)
- **사용자 관리**: 전체 회원 목록, 관리자 역할 지정/해제
- **이력서 관리**: 공개 이력서 숨기기/삭제
- **댓글 관리**: 모든 댓글 삭제 가능

### 보안 & 권한
- **소셜 로그인**: Google, GitHub, Kakao (OAuth2 + HMAC state)
- **소유권 검증**: 이력서/태그/템플릿 CRUD 전체
- **관리자 권한**: admin 역할 (전체 리소스 관리 가능)
- **보안 헤더**: Helmet + CSP (프로덕션), X-Content-Type-Options, Referrer-Policy
- **요청 살균**: HTML 태그 자동 제거, NoSQL 인젝션 방지 (`$` 접두사 차단)
- **이메일 회원가입/로그인**: bcrypt 비밀번호 해싱, 8자 최소
- **비밀번호 변경**: 로그인 후 설정 페이지에서 변경
- **계정 삭제**: GDPR 준수, 모든 데이터 cascade 삭제
- **httpOnly 쿠키**: JWT를 httpOnly 쿠키로 저장 (XSS 방어)
- **요청 추적**: X-Request-ID 헤더 자동 생성
- **Rate Limiting**: 3-tier (short: 10/1s, medium: 100/60s, long: 1000/1h)
- **DTO 입력 검증**: class-validator 기반 모든 입력 필드 검증
- **알림 시스템**: 댓글 알림, 북마크 알림 (30초 폴링)
- **댓글 스팸 방지**: Rate Limiting (5회/분)
- **기타**: CORS, JWT, DTO 검증, Path Traversal 방지

### UI/UX
- **다크 모드**: 라이트/다크/시스템 자동 감지 (헤더 토글)
- **반응형 디자인**: PC/태블릿/모바일 대응
- **애니메이션**: fadeInUp, scaleIn, slideIn 등 매끄러운 전환 + 카드 스태거 효과
- **스켈레톤 로딩**: 목록/폼/미리보기 전체
- **토스트 알림**: 성공/실패 피드백
- **에러 바운더리**: 전역 에러 처리
- **키보드 단축키**: `?` 도움말, `N` 새 이력서, `Ctrl+S` 저장, `Ctrl+P` 인쇄
- **공유 링크 복사**: 미리보기 페이지에서 원클릭 URL 복사
- **카드 통계**: 조회수, 공개 상태 표시
- **접근성**: ARIA, 키보드 네비게이션, 스크린 리더, focus-visible
- **음성 입력**: Web Speech API 기반 자기소개 음성 작성
- **공유 Footer**: 4컬럼 사이트맵 푸터 (8개 페이지)
- **Breadcrumb**: 편집 페이지 경로 탐색
- **ScrollToTop**: 스크롤 시 맨위 이동 버튼
- **EmptyState**: 7가지 상황별 SVG 일러스트
- **페이지 타이틀**: 13개 페이지 동적 document.title
- **알림 벨**: 헤더 알림 뱃지 + 드롭다운
- **사이트 통계**: 푸터 실시간 회원/이력서/조회수 표시
- **탐색 뷰 모드**: 그리드/리스트 뷰 전환
- **북마크 프리뷰**: 홈페이지 북마크 이력서 가로 스크롤
- **스크롤 리셋**: 페이지 이동 시 자동 스크롤 초기화
- **로딩 스켈레톤**: 통계 대시보드 스켈레톤
- **퀵 액션 FAB**: 플로팅 버튼 (새 이력서/AI/자소서)
- **프로필 뱃지**: 활동 기반 성취 뱃지
- **검색 기록**: 최근 5개 검색어 저장
- **쿠키 동의 배너**: GDPR 준수
- **MSW 목업**: 백엔드 없이 프론트엔드 개발 가능

## 시작하기

### 사전 요구사항

- Node.js 20+ (fnm, nvm 등으로 설치)
- npm 9+

### 설치

```bash
# 의존성 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# DB 마이그레이션 (SQLite 자동 생성)
npx prisma migrate dev

# 시드 데이터 (기본 템플릿 6개 + 태그 5개)
npx tsx prisma/seed.ts
```

### 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다:

```bash
DATABASE_URL="file:../data/resumes.db"
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001

tm# 기본 우선순위: n8n(무료) > openai-compatible(로컬) > anthropic(유료)

# Option 1: Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Option 2: n8n Webhook (무료)
# N8N_WEBHOOK_URL=http://localhost:5678/webhook/resume-transform

# Option 3: Ollama/Groq 등 OpenAI 호환 API
# OPENAI_COMPATIBLE_URL=http://localhost:11434/v1
# OPENAI_COMPATIBLE_MODEL=llama3
```

### 소셜 로그인 설정 (Google OAuth)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서 **OAuth 2.0 클라이언트 ID** 생성
2. **승인된 리디렉션 URI** 추가:
   - 로컬: `http://localhost:3001/api/auth/google/callback`
   - 프로덕션: `https://<your-api-domain>/api/auth/google/callback`
3. `.env`에 추가:
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
```

> GitHub, Kakao도 동일한 패턴으로 설정 가능. `.env.example` 참고.

### 개발 서버 실행

```bash
# 프론트엔드 + 백엔드 동시 실행
npm run dev

# 또는 각각 실행
npm run dev:client   # http://localhost:5173
npm run dev:server   # http://localhost:3001
```

### 프로덕션 빌드

```bash
npm run build:server   # NestJS → dist-server/
npm run build:client   # Vite → dist/
npm run start:server   # node dist-server/main.js
```

### 테스트

```bash
npm run test:unit      # 유닛 테스트 (145개+)
npm run test:unit:cov  # 유닛 테스트 + 커버리지
npm run test:e2e       # E2E 테스트 (55개)
# 전체: 200+ 테스트 (20+ 스위트)
```

### 프론트엔드 목업 모드 (백엔드 없이 개발)

```bash
npm run dev:mock       # MSW 목업 서버로 프론트엔드만 실행
```

## 접속 URL

### 로컬 개발

| 서비스           | URL                                         |
|---------------|---------------------------------------------|
| 프론트엔드         | http://localhost:5173                       |
| API 서버        | http://localhost:3001                       |
| Swagger 문서    | http://localhost:3001/api/docs              |
| Prisma Studio | `npx prisma studio` → http://localhost:5555 |

### 프로덕션

| 서비스     | URL                                  | 호스팅         |
|---------|--------------------------------------|-------------|
| 백엔드 API | https://resume-api-mm0o.onrender.com | Render (무료) |
| 프론트엔드   | https://resume-silk-three.vercel.app | Vercel (무료) |
| DB      | Neon PostgreSQL                      | Neon (무료)   |

## API 엔드포인트

### 인증
| 메서드    | 경로                         | 설명     |
|--------|----------------------------|--------|
| POST   | /api/auth/register         | 이메일 회원가입 |
| POST   | /api/auth/login            | 이메일 로그인 |
| POST   | /api/auth/logout           | 로그아웃 |
| POST   | /api/auth/change-password  | 비밀번호 변경 |
| DELETE | /api/auth/account          | 계정 삭제 |

### 이력서
| 메서드    | 경로                         | 설명     |
|--------|----------------------------|--------|
| GET    | /api/resumes               | 이력서 목록 |
| POST   | /api/resumes               | 이력서 생성 |
| GET    | /api/resumes/:id           | 이력서 상세 |
| PUT    | /api/resumes/:id           | 이력서 수정 |
| DELETE | /api/resumes/:id           | 이력서 삭제 |
| POST   | /api/resumes/:id/duplicate | 이력서 복제 |
| GET    | /api/resumes/:id/export/text | 텍스트 내보내기 |
| GET    | /api/resumes/:id/export/markdown | 마크다운 내보내기 |

### LLM 변환 (유료/무료 LLM)
| 메서드  | 경로                                   | 설명           |
|------|--------------------------------------|--------------|
| POST | /api/resumes/:id/transform           | LLM 양식 변환    |
| POST | /api/resumes/:id/transform/stream    | LLM 스트리밍 변환  |
| GET  | /api/resumes/:id/transform/history   | 변환 이력        |
| GET  | /api/resumes/:id/transform/providers | LLM 프로바이더 목록 |
| GET  | /api/resumes/:id/transform/usage     | 사용량 통계       |

### 로컬 변환 (무료, LLM 불필요)
| 메서드  | 경로                                       | 설명            |
|------|------------------------------------------|---------------|
| POST | /api/templates/local-transform/:resumeId | 프리셋/템플릿 기반 변환 |
| GET  | /api/templates/presets/list              | 프리셋 목록 (5종)   |

### 지원 관리
| 메서드    | 경로                         | 설명     |
|--------|----------------------------|--------|
| GET    | /api/applications          | 지원 목록 |
| GET    | /api/applications/stats    | 지원 통계 |
| POST   | /api/applications          | 지원 추가 |
| PUT    | /api/applications/:id      | 지원 수정 |
| DELETE | /api/applications/:id      | 지원 삭제 |

### 분석
| 메서드    | 경로                              | 설명     |
|--------|---------------------------------|--------|
| GET    | /api/resumes/dashboard/analytics | 대시보드 분석 |
| GET    | /api/resumes/trend/:resumeId     | 이력서 변경 추이 |
| GET    | /api/resumes/popular-skills      | 인기 기술 스택 |

### 템플릿 / 태그 / 버전 / 공유
| 메서드                 | 경로                                     | 설명        |
|---------------------|----------------------------------------|-----------|
| GET/POST/PUT/DELETE | /api/templates                         | 템플릿 CRUD  |
| GET/POST/DELETE     | /api/tags                              | 태그 CRUD   |
| GET                 | /api/resumes/:id/versions              | 버전 목록     |
| POST                | /api/resumes/:id/versions/:vid/restore | 버전 복원     |
| POST                | /api/resumes/:id/share                 | 공유 링크 생성  |
| GET                 | /api/shared/:token                     | 공유 이력서 조회 |

### 댓글
| 메서드    | 경로                                      | 설명         |
|--------|-------------------------------------------|------------|
| GET    | /api/resumes/:id/comments                 | 이력서 댓글 목록 |
| POST   | /api/resumes/:id/comments                 | 댓글 작성     |
| DELETE | /api/resumes/:id/comments/:commentId      | 댓글 삭제     |
| GET    | /api/applications/:id/comments            | 지원 댓글 목록 |
| POST   | /api/applications/:id/comments            | 지원 댓글 작성 |

### 북마크
| 메서드    | 경로                           | 설명         |
|--------|-------------------------------|------------|
| POST   | /api/resumes/:id/bookmark     | 북마크 추가    |
| DELETE | /api/resumes/:id/bookmark     | 북마크 해제    |
| GET    | /api/resumes/bookmarks/list   | 내 북마크 목록  |

### 알림
| 메서드    | 경로                              | 설명                     |
|--------|---------------------------------|------------------------|
| GET    | /api/notifications              | 알림 목록                  |
| GET    | /api/notifications/unread       | 읽지 않은 알림               |
| GET    | /api/notifications/count        | 읽지 않은 알림 수             |
| POST   | /api/notifications/read-all     | 모든 알림 읽음               |
| POST   | /api/notifications/:id/read     | 알림 읽음                  |
| DELETE | /api/notifications/cleanup      | 오래된 알림 정리 (관리자)        |

### 관리자
| 메서드  | 경로                                  | 설명                   |
|------|---------------------------------------|----------------------|
| GET  | /api/health/admin/stats               | 사이트 전체 통계           |
| GET  | /api/auth/admin/users                 | 전체 사용자 목록 (관리자)     |
| POST | /api/auth/admin/users/:id/role        | 사용자 역할 변경 (관리자)     |

## 프로젝트 구조

```
├── server/                    # NestJS 백엔드
│   ├── main.ts               # 앱 진입점 (Helmet, CORS, Swagger, Graceful Shutdown)
│   ├── app.module.ts          # 루트 모듈 (Rate Limiting)
│   ├── common/
│   │   ├── filters/          # 글로벌 예외 필터
│   │   ├── middleware/       # 요청 살균 + Request ID 미들웨어
│   │   └── interceptors/    # 요청 로깅 인터셉터
│   ├── health/               # 헬스체크 엔드포인트
│   ├── auth/                 # JWT + OAuth2 (Google/GitHub/Kakao) + CSRF State
│   ├── prisma/               # Prisma 서비스
│   ├── resumes/              # 이력서 CRUD + 소유권 검증 + 자동 버전 관리
│   ├── llm/                  # LLM 변환 (다중 프로바이더)
│   │   └── providers/        # Gemini, Groq, Anthropic, n8n, OpenAI Compatible
│   ├── templates/            # 템플릿 CRUD + 로컬 변환
│   ├── versions/             # 버전 조회/복원
│   ├── tags/                 # 태그 CRUD + 이력서 매핑
│   ├── share/                # 공유 링크 (bcrypt, 소유권 검증)
│   ├── applications/         # 지원 관리 CRUD
│   ├── comments/             # 커뮤니티 댓글 CRUD
│   ├── notifications/        # 알림 시스템
│   └── attachments/          # 첨부파일 (MIME + 확장자 이중 검증)
├── src/                       # React 프론트엔드
│   ├── components/
│   │   ├── ErrorBoundary.tsx # 전역 에러 바운더리
│   │   ├── Header.tsx        # 반응형 헤더 (모바일 메뉴)
│   │   ├── ResumeForm.tsx    # 9탭 이력서 편집 폼
│   │   ├── ResumePreview.tsx # 이력서 미리보기
│   │   ├── KeyboardShortcuts.tsx  # 키보드 단축키 모달
│   │   ├── LlmTransformPanel.tsx  # 로컬/AI 변환 패널
│   │   ├── AtsScorePanel.tsx  # ATS 호환성 검사
│   │   ├── DashboardStats.tsx # 대시보드 통계
│   │   ├── VoiceInput.tsx     # 음성 입력
│   │   ├── QuickImportModal.tsx # 빠른 가져오기
│   │   ├── BookmarkButton.tsx # 북마크 토글
│   │   ├── NotificationBell.tsx  # 알림 벨
│   │   ├── QrCodeModal.tsx       # QR 코드 공유
│   │   ├── AppCommentSection.tsx  # 지원 목록 댓글
│   │   ├── CommentSection.tsx # 댓글 섹션
│   │   ├── Footer.tsx        # 공유 푸터
│   │   ├── ScrollToTop.tsx   # 맨위 이동
│   │   ├── Breadcrumb.tsx    # 경로 탐색
│   │   ├── ResumeChecklist.tsx   # 작성 체크리스트
│   │   ├── ResumeStats.tsx       # 이력서 통계
│   │   ├── SimilarityPanel.tsx   # 중복 감지
│   │   ├── TransformHistory.tsx  # 변환 이력
│   │   ├── SkillChart.tsx        # 기술 분포 차트
│   │   ├── CareerTimeline.tsx    # 경력 타임라인
│   │   ├── QuickActions.tsx      # 플로팅 액션
│   │   ├── ProfileBadges.tsx     # 프로필 뱃지
│   │   ├── OnboardingBanner.tsx  # 온보딩 가이드
│   │   ├── CookieConsent.tsx     # 쿠키 동의
│   │   ├── ScrollReset.tsx       # 라우트 스크롤
│   │   └── EmptyState.tsx    # 빈 상태 UI
│   ├── lib/
│   │   ├── api.ts            # API 클라이언트
│   │   ├── theme.ts          # 다크모드 테마 관리
│   │   ├── completeness.ts   # 이력서 완성도 계산
│   │   ├── ats.ts            # ATS 호환성 분석
│   │   ├── resumeThemes.ts   # 멀티 테마 정의
│   │   ├── similarity.ts        # 중복 감지 알고리즘
│   │   ├── useDebounce.ts       # 디바운스 훅
│   │   └── writingTips.ts    # 섹션별 작성 팁
│   ├── mocks/                # MSW 목업 (백엔드 없이 개발)
│   │   ├── handlers.ts       # API 핸들러
│   │   ├── data.ts           # 샘플 데이터
│   │   └── browser.ts        # 브라우저 워커
│   ├── pages/
│   │   ├── ApplicationsPage   # 지원 관리
│   │   ├── CoverLetterPage    # 자소서 생성기
│   │   ├── ComparePage        # 이력서 비교
│   │   ├── SettingsPage       # 사용자 설정
│   │   ├── AdminPage          # 관리자 통계
│   │   └── ...                # HomePage, Edit, New, Preview, Explore
│   └── types/resume.ts       # TypeScript 타입
├── prisma/
│   ├── schema.prisma         # DB 스키마 (16개 테이블)
│   ├── seed.ts               # 시드 데이터
│   └── migrations/           # 마이그레이션 이력
├── test/app.e2e-spec.ts       # E2E 테스트 (55개)
└── jest-unit.config.js        # 유닛 테스트 설정
```