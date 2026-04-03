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
| 테스트 | Jest, Supertest (230+ 테스트, 23 스위트) |

## 주요 기능

### 이력서 작성/관리
- **9개 섹션**: 인적사항(사진/생년/병역/복수 링크), 경력(부서/성과/기술스택), 학력(학점), 기술, 프로젝트(소속회사/기술스택), 자격증, 어학, 수상, 활동
- **증명사진 업로드**: base64 저장, 미리보기 좌측 배치
- **자동 버전 관리**: 수정 시마다 자동 스냅샷, 이전 버전 복원
- **이력서 복제**: 기존 이력서를 복사하여 새 이력서 생성
- **키보드 단축키**: Ctrl+S 저장, Arrow Key 탭 전환
- **내보내기**: 텍스트(.txt), 마크다운(.md) 형식으로 이력서 다운로드
- **멀티 테마 프리뷰**: 15종(클래식/모던/미니멀/프로페셔널/크리에이티브/이그제큐티브/스타트업/아카데믹/테크/엘레강트/뉴스페이퍼/파스텔/다크/코퍼레이트/포트폴리오) 실시간 전환
- **섹션 순서 변경**: 항목별 위/아래 버튼으로 순서 조정
- **빠른 가져오기**: LinkedIn/기존 이력서 텍스트 붙여넣기 → AI 자동 생성
- **이력서 비교**: 2개 이력서 섹션별 시각 비교
- **자동 저장**: 30초 비활성 후 자동 저장 + 상태 표시
- **작성 체크리스트**: 12개 항목 완성도 체크 (필수/권장/선택)
- **중복 감지**: 경력/프로젝트 간 유사 콘텐츠 경고
- **이력서 통계**: 글자수, 단어수, 읽기 시간, 섹션 수
- **기술 분포 차트**: 카테고리별 기술 스택 시각화
- **경력 타임라인**: 경력+학력 시간순 시각화
- **북마크 페이지**: /bookmarks 전용 관리
- **자소서 저장**: 이력서↔자소서↔지원내역 연결 (/my-cover-letters)
- **첨부파일 미리보기**: 미리보기에서 첨부파일 자동 표시

### AI 기능
- **AI 양식 변환**: 8가지 양식(표준/경력기술서/자기소개서/LinkedIn/영문/개발자/디자이너/커스텀) + 스트리밍
- **AI 이력서 자동 생성**: 비정형 텍스트 → 구조화된 이력서 JSON
- **AI 이력서 피드백**: 점수(0-100), 등급, 강점/개선점, 섹션별 분석
- **AI JD 매칭 분석**: 채용공고 매칭도(%), 매칭/부족 스킬, 수정 제안, 자소서 포인트
- **AI 면접 질문 생성**: 8-10개 예상 질문 + 면접관 의도 + 모범 답변
- **ATS 호환성 검사**: 이력서 ATS 통과율 분석 (0-100점), 문제점/팁 제공
- **자기소개서 생성기**: 이력서+채용공고+어조 선택 → 맞춤 자기소개서
- **AI 코칭**: 섹션별 작성 팁 + 맥락 기반 코칭
- **키워드 분석**: 이력서 키워드 빈도/분포 분석
- **AI 이력서 번역**: 영어/일본어/중국어/한국어로 AI 번역 + 다운로드
- **AI 변환 이력**: 변환 결과 목록 + 원클릭 복사

### 소셜
- **팔로우/팔로잉**: 관심 사용자 팔로우
- **스카우트 제안**: 리크루터/기업이 구직자에게 직접 제안 (/scouts)
- **스카우트 알림 자동 생성**: 스카우트 수신 시 알림 자동 발송
- **1:1 쪽지**: 채팅 스타일 다이렉트 메시지 (/messages)
- **쪽지 알림 자동 생성**: 쪽지 수신 시 알림 자동 발송
- **댓글**: 공개 이력서/지원에 의견 작성
- **북마크**: 관심 이력서 저장 및 관리
- **알림**: 댓글/북마크/스카우트/쪽지 실시간 알림 (30초 폴링)

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
- **상태 타임라인**: 지원 상태 변경 이력 시각화
- **대시보드 통계**: 이력서 수, 공개 수, 총 조회수, AI 변환 수, 최근 편집
- **공개/비공개 설정**: 지원 목록 visibility 전환
- **지원 댓글**: 공개 지원에 의견 남기기
- **검색/정렬**: 회사명 검색 + 상태/날짜 정렬

### 템플릿 & 태그
- **30개 템플릿**: 26개 직종별 + 4개 기본 (개발자, 디자이너, 기획/PM, 마케터, 영업, 데이터, 연구, 의료, 교육, 회계, 법률, HR, 공무원, 물류, 건축, 외식, 무역, 크리에이터, 제조, 프리랜서, 신입 등)
- **태그 시스템**: 이력서 분류 및 필터링, 소유권 관리

### 채용
- **채용 공고 등록/검색/수정/삭제**: 리크루터/기업 전용 (/jobs)
- **인재 검색 모드**: 탐색 페이지 리크루터 전용 뷰
- **리크루터 대시보드**: 공고 통계, 스카우트 현황, 빠른 작업 (/recruiter)
- **채용 공고 ↔ 자소서 연동**: 채용 공고 기반 맞춤 자소서 생성

### 수익화
- **구직자 요금제**: 무료/스탠다드(₩2,900)/프리미엄(₩5,900)
- **채용담당 요금제**: 무료/비즈니스(₩19,900)/프리미엄(₩49,900)
- **어드민 4탭**: 통계/사용자/콘텐츠/요금제
- **기능 게이팅**: FeatureGate 컴포넌트로 유료 기능 접근 제어
- **프리미엄 테마 잠금**: Pro 이상 전용 테마
- **이력서 수 제한**: 플랜별 이력서 생성 한도
- **AI 크레딧**: 플랜별 월간 AI 사용 크레딧
- **사용량 추적**: 기능별 사용량 모니터링
- **Toss Payments 6종 결제**: 카카오페이/네이버페이/토스페이/카드/계좌이체/휴대폰 결제
- **AI 크레딧 구매**: 추가 AI 사용량 크레딧 결제
- **관리자 설정**: 플랜별 가격/기능 ON/OFF 실시간 조정
- **요금제 페이지**: /pricing 기능 비교표

### 관리자
- **사이트 통계**: 회원/이력서/콘텐츠/활동 현황 대시보드 (/admin)
- **사용자 관리**: 전체 회원 목록, 관리자 역할 지정/해제, 검색 + 페이징
- **이력서 관리**: 공개 이력서 숨기기/삭제, 페이징 지원
- **댓글 관리**: 모든 댓글 삭제 가능
- **요금제 설정**: 플랜별 가격/기능 ON/OFF, 접이식 UI
- **통계 새로고침**: 실시간 통계 갱신 버튼
- **주간 활동 차트**: 7일간 회원가입/이력서 생성 추이

### 보안 & 권한
- **superadmin/admin/user 3단계 역할**: 역할 계층 기반 권한 관리
- **personal/recruiter/company 회원 유형**: 용도별 기능 분리
- **httpOnly 쿠키 + Bearer 토큰 이중 인증**: JWT를 쿠키/헤더 양방향 지원 (XSS 방어)
- **소셜 로그인**: Google, GitHub, Kakao (OAuth2 + HMAC state)
- **Rate Limiting (3-tier + 소셜 + 댓글)**: short 10/1s, medium 100/60s, long 1000/1h, 소셜 10/분, 댓글 5/분
- **DTO 입력 검증 + 요청 살균**: class-validator 검증, HTML 태그 제거, NoSQL 인젝션 방지
- **Cloudinary 파일 저장**: 첨부파일 클라우드 스토리지 (MIME + 확장자 이중 검증)
- **소유권 검증**: 이력서/태그/템플릿 CRUD 전체
- **보안 헤더**: Helmet + CSP (프로덕션), X-Content-Type-Options, Referrer-Policy
- **이메일 회원가입/로그인**: bcrypt 비밀번호 해싱, 8자 최소
- **비밀번호 변경**: 로그인 후 설정 페이지에서 변경
- **계정 삭제**: GDPR 준수, 모든 데이터 cascade 삭제
- **요청 추적**: X-Request-ID 헤더 자동 생성
- **메시지 길이 제한**: 쪽지 1000자, 스카우트 2000자 제한
- **알림 시스템**: 댓글 알림, 북마크 알림, 스카우트 알림, 쪽지 알림 (30초 폴링)
- **기타**: CORS, JWT, Path Traversal 방지

### 다국어
- **다국어 지원**: 한국어, English, 日本語 (헤더 언어 스위처)
- **AI 이력서 번역**: 영어/일본어/중국어/한국어로 AI 번역 + 다운로드

### UI/UX
- **다크 모드**: 라이트/다크/시스템 자동 감지 (헤더 토글)
- **반응형 디자인**: 모바일 퍼스트, PC/태블릿/모바일 대응
- **애니메이션**: fadeInUp, scaleIn, slideIn 등 매끄러운 전환 + 카드 스태거 효과
- **스켈레톤 로딩**: 목록/폼/미리보기/대시보드 전체
- **토스트 알림**: 성공/실패/경고/정보 4종
- **퀵 액션 FAB**: 플로팅 버튼 (새 이력서/AI/자소서)
- **스크롤 리셋**: 페이지 이동 시 자동 스크롤 초기화
- **ScrollToTop**: 스크롤 시 맨위 이동 버튼
- **공유 Footer**: 4컬럼 사이트맵 푸터
- **Breadcrumb**: 편집 페이지 경로 탐색
- **EmptyState**: 7가지 상황별 SVG 일러스트
- **알림 벨**: 헤더 알림 뱃지 + 드롭다운
- **프로필 뱃지**: 활동 기반 성취 뱃지
- **온보딩 배너**: 신규 사용자 3단계 가이드
- **쿠키 동의 배너**: GDPR 준수
- **PWA 지원**: 모바일 홈 화면 추가 가능
- **404 페이지**: 사용자 친화적 에러 페이지
- **검색 기록**: 최근 5개 검색어 저장
- **탐색 뷰 모드**: 그리드/리스트 뷰 전환
- **직종 필터**: 탐색 페이지 카테고리 필터
- **에러 바운더리**: 전역 에러 처리
- **키보드 단축키**: `?` 도움말, `N` 새 이력서, `Ctrl+S` 저장, `Ctrl+P` 인쇄
- **음성 입력**: Web Speech API 기반 자기소개 음성 작성
- **접근성**: ARIA, 키보드 네비게이션, 스크린 리더, focus-visible
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
npm run test:unit      # 유닛 테스트 (175개+)
npm run test:unit:cov  # 유닛 테스트 + 커버리지
npm run test:e2e       # E2E 테스트 (55개+)
# 전체: 230+ 테스트 (23 스위트)
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

## API 엔드포인트 (100+)

### 인증
| 메서드    | 경로                         | 설명     |
|--------|----------------------------|--------|
| POST   | /api/auth/register         | 이메일 회원가입 |
| POST   | /api/auth/login            | 이메일 로그인 |
| POST   | /api/auth/logout           | 로그아웃 |
| GET    | /api/auth/me               | 내 정보 조회 |
| GET    | /api/auth/providers        | 소셜 로그인 목록 |
| POST   | /api/auth/change-password  | 비밀번호 변경 |
| DELETE | /api/auth/account          | 계정 삭제 |
| GET    | /api/auth/linked-accounts  | 연결된 계정 목록 |
| GET    | /api/auth/link/:provider   | 계정 연결 |

### 이력서
| 메서드    | 경로                         | 설명     |
|--------|----------------------------|--------|
| GET    | /api/resumes               | 이력서 목록 |
| POST   | /api/resumes               | 이력서 생성 |
| GET    | /api/resumes/:id           | 이력서 상세 |
| PUT    | /api/resumes/:id           | 이력서 수정 |
| DELETE | /api/resumes/:id           | 이력서 삭제 |
| PATCH  | /api/resumes/:id/visibility | 공개/비공개 전환 |
| POST   | /api/resumes/:id/duplicate | 이력서 복제 |
| GET    | /api/resumes/:id/export/text | 텍스트 내보내기 |
| GET    | /api/resumes/:id/export/markdown | 마크다운 내보내기 |
| GET    | /api/resumes/public        | 공개 이력서 목록 |
| GET    | /api/resumes/@:username/:slug | 슬러그 URL 조회 |
| GET    | /api/resumes/:id/bookmark/status | 북마크 상태 |

### AI 변환 (유료/무료 LLM)
| 메서드  | 경로                                   | 설명           |
|------|--------------------------------------|--------------|
| POST | /api/resumes/:id/transform           | LLM 양식 변환 / AI 번역 |
| POST | /api/resumes/:id/transform/stream    | LLM 스트리밍 변환  |
| POST | /api/resumes/:id/transform/feedback  | AI 이력서 피드백   |
| POST | /api/resumes/:id/transform/job-match | AI JD 매칭 분석  |
| POST | /api/resumes/:id/transform/interview | AI 면접 질문 생성  |
| GET  | /api/resumes/:id/transform/history   | 변환 이력        |
| GET  | /api/resumes/:id/transform/providers | LLM 프로바이더 목록 |

### AI 자동 생성
| 메서드  | 경로                                   | 설명           |
|------|--------------------------------------|--------------|
| POST | /api/resumes/:id/transform/preview   | 텍스트 → 이력서 미리보기 |
| POST | /api/resumes/:id/transform/create    | 텍스트 → 이력서 생성   |

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
| POST                | /api/templates/seed                    | 템플릿 시드    |
| GET/POST/DELETE     | /api/tags                              | 태그 CRUD   |
| POST/DELETE         | /api/tags/:tagId/resumes/:resumeId     | 태그-이력서 매핑 |
| GET                 | /api/resumes/:id/versions              | 버전 목록     |
| GET                 | /api/resumes/:id/versions/:vid         | 버전 상세     |
| POST                | /api/resumes/:id/versions/:vid/restore | 버전 복원     |
| POST                | /api/resumes/:id/share                 | 공유 링크 생성  |
| GET                 | /api/resumes/:id/share                 | 공유 링크 조회  |
| DELETE              | /api/share/:id                         | 공유 링크 삭제  |
| GET                 | /api/shared/:token                     | 공유 이력서 조회 |

### 첨부파일
| 메서드    | 경로                                     | 설명         |
|--------|----------------------------------------|------------|
| POST   | /api/resumes/:id/attachments           | 첨부파일 업로드  |
| GET    | /api/resumes/:id/attachments           | 첨부파일 목록   |
| GET    | /api/attachments/:id/download          | 첨부파일 다운로드 |
| DELETE | /api/attachments/:id                   | 첨부파일 삭제   |

### 결제
| 메서드  | 경로               | 설명      |
|------|------------------|---------|
| POST | /payment         | 결제 페이지  |
| GET  | /payment/success | 결제 성공   |
| GET  | /payment/fail    | 결제 실패   |

### 헬스체크 + 사용량
| 메서드  | 경로                | 설명         |
|------|-------------------|------------|
| GET  | /api/health       | 서버 상태 확인  |
| GET  | /api/health/usage | 내 사용량 조회  |

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

### 소셜
| 메서드   | 경로                                | 설명         |
|--------|-------------------------------------|------------|
| POST   | /api/social/follow/:userId          | 팔로우        |
| DELETE | /api/social/follow/:userId          | 언팔로우       |
| GET    | /api/social/followers               | 내 팔로워     |
| GET    | /api/social/following               | 내 팔로잉     |
| POST   | /api/social/scout                   | 스카우트 전송   |
| GET    | /api/social/scouts                  | 받은 스카우트   |
| POST   | /api/social/scouts/:id/read         | 스카우트 읽음  |
| POST   | /api/social/messages/:receiverId    | 쪽지 전송     |
| GET    | /api/social/messages                | 대화 목록     |
| GET    | /api/social/messages/:partnerId     | 대화 내용     |
| GET    | /api/social/messages/unread/count   | 읽지 않은 쪽지 수 |

### 채용 공고
| 메서드    | 경로                     | 설명         |
|--------|------------------------|------------|
| GET    | /api/jobs              | 채용 공고 목록  |
| GET    | /api/jobs/my           | 내 채용 공고   |
| GET    | /api/jobs/:id          | 채용 공고 상세  |
| POST   | /api/jobs              | 채용 공고 등록  |
| PUT    | /api/jobs/:id          | 채용 공고 수정  |
| DELETE | /api/jobs/:id          | 채용 공고 삭제  |

### 자소서
| 메서드    | 경로                     | 설명         |
|--------|------------------------|------------|
| GET    | /api/cover-letters     | 내 자소서 목록  |
| POST   | /api/cover-letters     | 자소서 저장    |
| GET    | /api/cover-letters/:id | 자소서 상세    |
| PUT    | /api/cover-letters/:id | 자소서 수정    |
| DELETE | /api/cover-letters/:id | 자소서 삭제    |

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
│   ├── auth/                 # JWT + OAuth2 + 이메일 인증
│   ├── resumes/              # 이력서 CRUD + 분석 + 내보내기
│   ├── llm/                  # LLM 변환 (다중 프로바이더)
│   │   ├── providers/        # Gemini, Groq, Anthropic, n8n, OpenAI Compatible
│   │   └── dto/              # 변환/자동생성 DTO
│   ├── templates/            # 템플릿 + 로컬 변환
│   ├── versions/             # 버전 관리
│   ├── tags/                 # 태그 CRUD
│   ├── share/                # 공유 링크
│   ├── attachments/          # 첨부파일 (Cloudinary)
│   ├── applications/         # 지원 관리
│   ├── comments/             # 커뮤니티 댓글
│   ├── notifications/        # 알림 시스템
│   ├── social/               # 팔로우 + 스카우트 + 쪽지
│   ├── cover-letters/        # 자소서 CRUD
│   ├── jobs/                 # 채용 공고
│   ├── health/               # 헬스체크 + 통계 + 사용량
│   ├── prisma/               # DB 연결
│   └── common/               # 미들웨어 + 인터셉터 + 역할
├── src/                       # React 프론트엔드
│   ├── components/ (65+)
│   │   ├── ErrorBoundary.tsx # 전역 에러 바운더리
│   │   ├── Header.tsx        # 반응형 헤더 (모바일 메뉴)
│   │   ├── ResumeForm.tsx    # 9탭 이력서 편집 폼
│   │   ├── ResumePreview.tsx # 이력서 미리보기 (15 테마)
│   │   ├── KeyboardShortcuts.tsx  # 키보드 단축키 모달
│   │   ├── LlmTransformPanel.tsx  # 로컬/AI 변환 패널
│   │   ├── AiAnalysisPanel.tsx    # AI 분석 (피드백/JD매칭/면접)
│   │   ├── AiCoachTip.tsx         # AI 코칭 팁
│   │   ├── AtsScorePanel.tsx  # ATS 호환성 검사
│   │   ├── KeywordAnalysis.tsx    # 키워드 분석
│   │   ├── DashboardStats.tsx # 대시보드 통계
│   │   ├── VoiceInput.tsx     # 음성 입력
│   │   ├── RichEditor.tsx     # Tiptap 리치 텍스트 에디터
│   │   ├── SafeHtml.tsx       # DOMPurify XSS 방지 렌더링
│   │   ├── QuickImportModal.tsx # 빠른 가져오기
│   │   ├── BookmarkButton.tsx # 북마크 토글
│   │   ├── NotificationBell.tsx  # 알림 벨
│   │   ├── QrCodeModal.tsx       # QR 코드 공유
│   │   ├── AppCommentSection.tsx  # 지원 목록 댓글
│   │   ├── CommentSection.tsx # 댓글 섹션
│   │   ├── CompletenessBar.tsx   # 완성도 바
│   │   ├── AttachmentPanel.tsx   # 첨부파일 관리
│   │   ├── Footer.tsx        # 공유 푸터
│   │   ├── ScrollToTop.tsx   # 맨위 이동
│   │   ├── Breadcrumb.tsx    # 경로 탐색
│   │   ├── ResumeChecklist.tsx   # 작성 체크리스트
│   │   ├── ResumeStats.tsx       # 이력서 통계
│   │   ├── ResumeTrend.tsx       # 이력서 변경 추이
│   │   ├── SimilarityPanel.tsx   # 중복 감지
│   │   ├── TransformHistory.tsx  # 변환 이력
│   │   ├── SkillChart.tsx        # 기술 분포 차트
│   │   ├── CareerTimeline.tsx    # 경력 타임라인
│   │   ├── RecentActivity.tsx    # 최근 활동
│   │   ├── QuickActions.tsx      # 플로팅 액션
│   │   ├── ProfileBadges.tsx     # 프로필 뱃지
│   │   ├── FeatureGate.tsx       # 유료 기능 접근 제어
│   │   ├── OnboardingBanner.tsx  # 온보딩 가이드
│   │   ├── CookieConsent.tsx     # 쿠키 동의
│   │   ├── Skeleton.tsx          # 스켈레톤 로딩
│   │   ├── TagSelector.tsx       # 태그 선택기
│   │   ├── Toast.tsx             # 토스트 알림
│   │   ├── VersionPanel.tsx      # 버전 관리
│   │   ├── ScrollReset.tsx       # 라우트 스크롤
│   │   └── EmptyState.tsx    # 빈 상태 UI
│   ├── lib/
│   │   ├── api.ts            # API 클라이언트
│   │   ├── auth.ts           # 인증 유틸
│   │   ├── theme.ts          # 다크모드 테마 관리
│   │   ├── completeness.ts   # 이력서 완성도 계산
│   │   ├── ats.ts            # ATS 호환성 분석
│   │   ├── resumeThemes.ts   # 멀티 테마 정의 (15종)
│   │   ├── plans.ts          # 구독 플랜 설정
│   │   ├── payment.ts        # Toss Payments 결제
│   │   ├── i18n.ts           # 다국어 번역
│   │   ├── similarity.ts     # 중복 감지 알고리즘
│   │   ├── cache.ts          # 클라이언트 캐시
│   │   ├── time.ts           # 상대 시간 유틸
│   │   ├── useDebounce.ts    # 디바운스 훅
│   │   └── writingTips.ts    # 섹션별 작성 팁
│   ├── mocks/                # MSW 목업 (백엔드 없이 개발)
│   │   ├── handlers.ts       # API 핸들러
│   │   ├── data.ts           # 샘플 데이터
│   │   └── browser.ts        # 브라우저 워커
│   ├── pages/ (37+)                 # 31 페이지 + 6 서브 라우트
│   │   ├── HomePage.tsx         # 메인 대시보드
│   │   ├── LoginPage.tsx        # 로그인/회원가입
│   │   ├── AuthCallbackPage.tsx # OAuth 콜백
│   │   ├── NewResumePage.tsx    # 이력서 생성
│   │   ├── EditResumePage.tsx   # 이력서 편집
│   │   ├── PreviewPage.tsx      # 이력서 미리보기
│   │   ├── ExplorePage.tsx      # 공개 이력서 탐색
│   │   ├── ProfileResumePage.tsx # 슬러그 URL 프로필
│   │   ├── ApplicationsPage.tsx # 지원 관리
│   │   ├── CoverLetterPage.tsx  # 자소서 생성기
│   │   ├── ComparePage.tsx      # 이력서 비교
│   │   ├── AutoGeneratePage.tsx # AI 자동 생성
│   │   ├── TranslatePage.tsx    # AI 번역
│   │   ├── PricingPage.tsx      # 요금제
│   │   ├── PaymentPage.tsx      # 결제 페이지
│   │   ├── PaymentResultPage.tsx # 결제 결과
│   │   ├── TemplatesPage.tsx    # 템플릿 관리
│   │   ├── TagsPage.tsx         # 태그 관리
│   │   ├── SettingsPage.tsx     # 사용자 설정
│   │   ├── AdminPage.tsx        # 관리자 통계
│   │   ├── AboutPage.tsx        # 소개 페이지
│   │   ├── TutorialPage.tsx     # 튜토리얼
│   │   ├── BookmarksPage.tsx     # 북마크 관리
│   │   ├── ScoutsPage.tsx       # 스카우트 제안
│   │   ├── MessagesPage.tsx     # 쪽지
│   │   ├── JobsPage.tsx           # 채용 공고
│   │   ├── JobPostPage.tsx        # 공고 등록
│   │   ├── RecruiterDashboardPage.tsx # 리크루터 대시보드
│   │   ├── MyCoverLettersPage.tsx # 내 자소서
│   │   ├── TermsPage.tsx        # 이용약관
│   │   └── NotFoundPage.tsx     # 404 에러
│   └── types/resume.ts       # TypeScript 타입
├── prisma/
│   ├── schema.prisma         # DB 스키마 (27 모델)
│   ├── seed.ts               # 시드 데이터
│   └── migrations/           # 마이그레이션 이력
├── test/app.e2e-spec.ts       # E2E 테스트 (55개+)
└── jest-unit.config.js        # 유닛 테스트 설정
```