# 이력서공방

**AI 기반 이력서 관리 플랫폼**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![pnpm](https://img.shields.io/badge/pnpm-9.14-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 42개 데이터 모델 | 46개 페이지 | 97개 컴포넌트 | 22개 NestJS 모듈 | 15개 이력서 테마 | 44 테스트 스위트 | 멀티 LLM 자동 Fallback | FSD Architecture | React Query + Zod

---

## 아키텍처

```
                        이력서공방 아키텍처
  ┌──────────────────────────────────────────────────────┐
  │                    Frontend (React 19)               │
  │  45 Pages / 94 Components / Tiptap Editor / React Query│
  │  Vite 8 + TailwindCSS 4 + React Router 7             │
  └──────────────┬───────────────────────────────────────┘
                 │ REST API (JSON)
  ┌──────────────▼───────────────────────────────────────┐
  │              Backend (NestJS 11)                      │
  │  16 Controllers / JWT Auth / Rate Limiting            │
  │  Swagger API Docs / Compression / Helmet              │
  ├──────────┬──────────────┬────────────────────────────┤
  │          │              │                            │
  │  ┌───────▼──────┐ ┌────▼─────────┐ ┌───────────────┐│
  │  │ PostgreSQL   │ │ LLM Provider │ │  Cloudinary   ││
  │  │ (Prisma ORM) │ │ Gemini/Groq/ │ │ (파일 저장소) ││
  │  │ 29 Models    │ │ Claude/n8n   │ │               ││
  │  └──────────────┘ └──────────────┘ └───────────────┘│
  └──────────────────────────────────────────────────────┘
       Neon (서버리스)      자동 Fallback        CDN
```

---

## 주요 기능

### 이력서 관리

- 섹션별 편집 (인적사항, 경력, 학력, 프로젝트, 자격증, 어학, 수상, 활동 등 10개 섹션)
- 15개 디자인 테마 (클래식, 모던, 미니멀, 테크, 다크, 포트폴리오 등)
- Tiptap 리치 텍스트 에디터 + DOMPurify XSS 방지
- 버전 관리 및 스냅샷 복원
- 이력서 비교 (diff), 복제, 자동 저장
- 태그 분류 및 북마크
- PDF/TXT/MD/JSON 내보내기
- 공유 링크 (비밀번호 보호, 만료 설정, QR 코드)
- 완성도 분석, 중복 감지, 통계 (글자수/단어수/읽기시간)
- 공개 URL 슬러그 (`/@username/slug`)

### AI 기능

- **AI 이력서 자동 생성** - 비정형 텍스트/파일 업로드에서 구조화된 이력서 자동 생성 (26개 직종별 템플릿)
- **AI 양식 변환** - 표준/경력기술서/자기소개서/LinkedIn/영문/개발자/디자이너/커스텀 8종 변환 (SSE 스트리밍 지원)
- **AI 피드백** - 0-100점 점수, 등급, 강점/개선점, 섹션별 분석
- **JD 매칭 분석** - 매칭도%, 매칭/부족 스킬, 구체적 수정 제안
- **면접 질문 생성** - 8-10개 예상 질문 + 모범 답변 (난이도/카테고리/타이머 포함)
- **AI 면접 시뮬레이터** - 실시간 모의 면접 연습 + 답변 저장 + 타이머
- **AI 코칭 시스템** - 이력서 개선 코칭 팁 + 인라인 AI 어시스트 (문장 개선/요약/확장)
- **AI 커리어 어드바이저** - 커리어 경로 제안 + 시장 인사이트 + 스킬 갭 분석
- **AI 자기소개서 생성** - 이력서 + 채용공고 + 어조 선택으로 맞춤 자소서
- **이력서 번역** - 다국어 사이드바이사이드 번역
- **ATS 호환성 점검** - 0-100점 ATS 통과율 분석
- **AI 키워드 분석** - 이력서 키워드 최적화 제안
- **멀티 LLM 자동 Fallback** - 무료 프로바이더(Gemini, Groq) 성능순 자동 선택, 유료(Claude) 대체

### 소셜 / 네트워킹

- 이력서 탐색 (공개 이력서 갤러리 + 사용자 탭)
- 댓글 및 피드백
- 팔로우 / 팔로잉 (팔로워/팔로잉 목록 페이지)
- 1:1 다이렉트 메시지 (읽음 상태 표시, 실시간 대화)
- 스카우트 메시지 발송/수신 (리크루터 전용)
- 알림 시스템 (댓글, 북마크, 스카우트, 팔로우 등)
- 공개 프로필 페이지 (`/@username/slug`)
- 숏 링크 공유 (`/r/:code`)
- 유사 이력서 추천
- SNS 공유 메뉴

### 채용 / 리크루터 기능

- 채용 공고 등록 및 검색 (정규직/계약직/파트타임/인턴)
- 리크루터 대시보드 (AI 매칭률, 커리어 인사이트)
- 스카우트 메시지 발송
- 지원 현황 추적 (applied -> screening -> interview -> offer/rejected)
- 지원 관리 칸반 보드 + 타임라인
- 면접 후기 통합
- 채용 트렌드 / 급여 비교
- 기업 정보 카드

### 기타

- **피드백 게시판** - 사용자 의견 수집 및 개선 요청 관리 (FeedbackPage)
- **광고 배너** - 페이지 내 광고 배너 컴포넌트 (AdBanner)
- **숏 링크** - 이력서 공유용 단축 URL 생성 (`/r/:code`), 짧은 링크로 빠르게 공유

### 관리자

- 사용자 관리 (역할 변경: user/admin/superadmin)
- 글로벌 공지 배너 관리
- 사이트 전체 통계 대시보드
- 오래된 알림 정리
- 이력서 소유권 이전

---

## 기술 스택

### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19 | UI 프레임워크 |
| Vite | 8 | 빌드 도구 |
| TailwindCSS | 4 | 스타일링 |
| Tiptap | 3 | 리치 텍스트 에디터 |
| React Router | 7 | 클라이언트 라우팅 |
| MSW | 2 | 목 서비스 워커 (개발용) |

### Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| NestJS | 11 | API 서버 프레임워크 |
| Prisma | 6 | ORM / 마이그레이션 |
| PostgreSQL | - | 데이터베이스 |
| Anthropic SDK | 0.39 | AI LLM 연동 |
| Helmet | 8 | HTTP 보안 헤더 |
| Throttler | 6 | Rate Limiting |

### Infra

| 서비스 | 용도 |
|--------|------|
| Vercel | 프론트엔드 호스팅 |
| Render | 백엔드 호스팅 |
| Neon | PostgreSQL (서버리스) |
| Cloudinary | 이미지/파일 저장소 |

---

## 시작하기

### 사전 요구사항

- **Node.js** >= 20.0.0
- **pnpm** (권장) 또는 npm
- **PostgreSQL** 데이터베이스 (로컬 또는 Neon)

### 환경 변수

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/resume

# 인증
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# ─── LLM 프로바이더 (하나 이상 설정) ───
# 우선순위: Gemini(무료) > Groq(무료) > OpenAI Compatible > Anthropic(유료)
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key
# ANTHROPIC_API_KEY=sk-ant-...  (유료, 선택)

# 파일 업로드
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# 클라이언트
VITE_API_URL=http://localhost:3000
```

### LLM 프로바이더 설정 가이드

AI 기능을 사용하려면 최소 1개의 LLM 프로바이더 API 키가 필요합니다. 무료 프로바이더만으로 모든 AI 기능을 이용할 수 있습니다.

| 프로바이더 | 무료 티어 | 모델 | 발급 URL |
|-----------|----------|------|---------|
| **Gemini** (추천) | 무료 (15 RPM) | `gemini-2.0-flash` | [Google AI Studio](https://aistudio.google.com/apikey) |
| **Groq** | 무료 (30 RPM) | `llama-3.3-70b-versatile` | [Groq Console](https://console.groq.com/keys) |
| **OpenAI Compatible** | 로컬 무료 | Ollama 등 | `OPENAI_COMPATIBLE_URL=http://localhost:11434/v1` |
| **Anthropic** | 유료 | `claude-opus-4-6` | [Anthropic Console](https://console.anthropic.com) |

**자동 Fallback:** Gemini -> Groq -> OpenAI Compatible -> Anthropic 순으로 자동 전환됩니다. 하나의 프로바이더가 rate limit에 걸리면 다음 프로바이더를 자동으로 시도합니다.

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# Prisma 클라이언트 생성
pnpm prisma:generate

# 데이터베이스 마이그레이션
pnpm prisma:migrate

# 시드 데이터 (템플릿, 태그 등)
pnpm prisma:seed

# 개발 서버 (프론트엔드 + 백엔드 동시 실행)
pnpm dev

# 또는 개별 실행
pnpm dev:client   # Vite 프론트엔드 (포트 5173)
pnpm dev:server   # NestJS 백엔드 (포트 3000)
```

---

## 프로젝트 구조

```
resume/
├── src/                    # 프론트엔드 (React, FSD 적용)
│   ├── app/                # 전역 Provider·라우팅
│   ├── pages/              # 페이지 컴포넌트 (46개)
│   ├── features/           # 사용자 시나리오 (auth, community, notifications, recent-views)
│   ├── entities/           # 도메인 엔티티 (점진적 도입)
│   ├── shared/             # 도메인 독립 UI·유틸 (ui/, lib/)
│   ├── components/         # 공통 UI 컴포넌트 (97개, 레거시·마이그레이션 중)
│   ├── stores/             # Zustand 스토어 (auth, draft, UI)
│   ├── lib/                # 유틸리티, API 클라이언트, 테마, 플랜
│   ├── types/              # TypeScript 타입 정의
│   └── mocks/              # MSW 핸들러 (개발 모드)
├── server/                 # 백엔드 (NestJS)
│   ├── auth/               # 인증 (OAuth + JWT)
│   ├── resumes/            # 이력서 CRUD + 분석 + 내보내기
│   ├── llm/                # AI LLM 연동 + 자동 생성
│   ├── templates/          # 템플릿 관리 + 로컬 변환
│   ├── cover-letters/      # 자기소개서
│   ├── jobs/               # 채용 공고
│   ├── applications/       # 지원 관리
│   ├── social/             # 팔로우, 스카우트, DM
│   ├── comments/           # 이력서 댓글
│   ├── notifications/      # 알림
│   ├── health/             # 헬스체크 + 관리자 통계 + 사용량
│   ├── share/              # 공유 링크
│   ├── versions/           # 버전 관리
│   ├── tags/               # 태그
│   ├── attachments/        # 첨부파일
│   └── common/             # 가드, 데코레이터, 필터, 인터셉터
├── prisma/
│   └── schema.prisma       # 42개 모델 정의
├── docs/                   # API 문서, OAuth 가이드, 역할 가이드
├── public/                 # 정적 파일
└── package.json
```

---

## 번들 크기 (빌드 성능)

Vite 8 코드 스플리팅 적용. 각 페이지/컴포넌트는 lazy load됩니다.

| 번들 | 크기 | Gzip |
|------|------|------|
| `react-vendor` (React + Router) | 443 KB | 135 KB |
| `tiptap` (리치 텍스트 에디터) | 368 KB | 115 KB |
| `index` (앱 코어) | 193 KB | 40 KB |
| `index.css` (TailwindCSS) | 169 KB | - |
| `ResumeForm` (편집기) | 103 KB | 21 KB |
| `PreviewPage` (미리보기) | 105 KB | 22 KB |
| 기타 페이지 청크 | 12-64 KB | 3-12 KB |

> 총 JS 번들: ~2.2 MB (gzip ~450 KB). 초기 로드에는 `react-vendor` + `index`만 필요 (gzip ~175 KB).

---

## 배포

### Vercel (프론트엔드)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 설정
vercel env add VITE_API_URL
```

**Build Settings:**
- Framework Preset: Vite
- Build Command: `pnpm build`
- Output Directory: `dist`

### Render (백엔드)

1. Render 대시보드에서 **Web Service** 생성
2. Repository 연결
3. 설정:
   - **Build Command:** `pnpm install && pnpm prisma:generate && pnpm build:server`
   - **Start Command:** `node dist-server/main.js`
   - **Environment:** Node
4. 환경 변수 추가: `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ANTHROPIC_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ALLOWED_ORIGINS`, `NODE_ENV=production`

### Neon (데이터베이스)

1. [Neon Console](https://console.neon.tech)에서 프로젝트 생성
2. Connection string을 `DATABASE_URL`로 설정
3. `pnpm prisma:migrate`로 스키마 적용

---

## 요금제

### 개인 사용자

| | 무료 | 스탠다드 | 프리미엄 |
|---|---|---|---|
| **가격** | 0원 | 2,900원/월 | 5,900원/월 |
| 이력서 | 3개 | 10개 | 무제한 |
| AI 변환 | 5회/월 | 30회/월 | 무제한 |
| 테마 | 3개 | 10개 | 15개 |
| 자기소개서 | - | O | O |
| 번역 | - | - | O |
| 우선 지원 | - | - | O |

### 리크루터

| | 무료 | 비즈니스 | 프리미엄 |
|---|---|---|---|
| **가격** | 0원 | 19,900원/월 | 49,900원/월 |
| 스카우트 | 3건/월 | 30건/월 | 무제한 |
| 채용 공고 | 1건 | 10건 | 무제한 |
| 우선 지원 | - | O | O |

---

## 보안

- **CSP (Content Security Policy)** - Helmet 기반 HTTP 보안 헤더
- **Rate Limiting** - NestJS Throttler 기반 API 요청 제한 (AI 엔드포인트: 3-5 req/min)
- **XSS 방지** - DOMPurify로 모든 리치 텍스트 입력 sanitize
- **httpOnly 쿠키** - JWT 토큰 쿠키 저장 (XSS 토큰 탈취 방지)
- **CORS** - 허용된 오리진만 접근 가능
- **입력 검증** - class-validator 기반 DTO 검증 (whitelist + forbidNonWhitelisted)
- **OAuth State 검증** - CSRF 공격 방지
- **파일 업로드 검증** - MIME 타입 + 확장자 이중 검증

---

## 테스트

```bash
# 단위 테스트 (44 suites)
pnpm test:unit

# 커버리지 포함
pnpm test:unit:cov

# E2E 테스트
pnpm test:e2e
```

---

## 문서

### 프로젝트 가이드

- **아키텍처**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 시스템 구조·FSD·디자인 시스템·상태 관리 전략
- **개발 환경**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — 로컬 설정·환경 변수·테스트·빌드·배포
- **라이브러리**: [docs/LIBRARIES.md](docs/LIBRARIES.md) — 도입 라이브러리 목록 및 선택 이유
- **컨벤션**: [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — 파일명·폴더 구조·커밋·훅·스키마 규칙

### API

- **Swagger UI** (개발 환경): `http://localhost:3001/api/docs`
- **API 레퍼런스**: [docs/API.md](docs/API.md)
- **OAuth 설정 가이드**: [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md)
- **역할 가이드**: [docs/ROLES.md](docs/ROLES.md)

---

## 기여 가이드

### 개발 환경 설정

1. 레포지토리를 포크합니다.
2. 로컬에 클론합니다: `git clone https://github.com/your-username/resume.git`
3. 의존성을 설치합니다: `pnpm install`
4. `.env` 파일을 설정합니다 (위의 환경 변수 섹션 참조).
5. 데이터베이스를 마이그레이션합니다: `pnpm prisma:migrate`

### 개발 규칙

- **브랜치**: `feat/기능명`, `fix/버그명`, `test/테스트명` 형식
- **커밋 메시지**: `feat:`, `fix:`, `test:`, `build:`, `perf:`, `docs:` 접두사 사용
- **코드 스타일**: ESLint + Prettier 설정을 따름
- **테스트**: 새 기능 추가 시 해당 테스트도 함께 작성
- **타입 안전성**: `any` 사용 최소화, DTO 기반 입력 검증 필수

### PR 제출

1. 기능/버그 수정 브랜치를 생성합니다.
2. 변경사항을 커밋합니다.
3. 테스트가 통과하는지 확인합니다: `pnpm test:unit`
4. PR을 생성하고 변경 내용을 설명합니다.

---

## License

[MIT](LICENSE)
