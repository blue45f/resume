# 이력서 관리 플랫폼

LLM 기반 이력서 양식 변환 + 로컬 변환을 지원하는 풀스택 이력서 관리 서비스입니다.

## 기술 스택

| 영역    | 기술                                                                  |
|-------|---------------------------------------------------------------------|
| 서버    | NestJS 11, SWC, Prisma ORM                                          |
| DB    | PostgreSQL (Neon), Prisma ORM                                       |
| LLM   | Gemini / Groq / Anthropic / n8n Webhook / OpenAI Compatible        |
| 프론트엔드 | React 19, Vite 8, Tailwind CSS 4, MSW (목업)                         |
| 테스트   | Jest, Supertest (E2E 55개 + Unit 75개)                                |

## 주요 기능

- **이력서 CRUD** - 경력, 학력, 기술, 프로젝트, 자격증, 어학, 수상, 활동/봉사
- **LLM 양식 변환** - AI를 통해 7가지 양식으로 변환 (스트리밍, LLM 프로바이더 선택 가능)
- **로컬 변환** - LLM 없이 무료로 프리셋/커스텀 템플릿 기반 구조 변환
- **다중 LLM 프로바이더** - Anthropic, n8n, Ollama/Groq 등 (비용 최소화)
- **템플릿 관리** - 추가/수정/삭제 가능한 커스텀 템플릿 (layout 설정)
- **버전 관리** - 수정 시 자동 스냅샷, 이전 버전 복원
- **태그 시스템** - 이력서 분류 및 필터링
- **공유 링크** - 고유 URL, 만료 시간, 비밀번호 보호 (bcrypt)
- **PDF/인쇄** - 브라우저 인쇄 연동
- **반응형 UI** - PC/모바일 대응, 웹접근성 (ARIA)
- **보안** - Helmet, CORS, Rate Limiting, DTO 검증, Swagger (dev only)

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

# LLM 프로바이더 (아래 중 하나 이상 설정)
# 기본 우선순위: n8n(무료) > openai-compatible(로컬) > anthropic(유료)

# Option 1: Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Option 2: n8n Webhook (무료)
# N8N_WEBHOOK_URL=http://localhost:5678/webhook/resume-transform

# Option 3: Ollama/Groq 등 OpenAI 호환 API
# OPENAI_COMPATIBLE_URL=http://localhost:11434/v1
# OPENAI_COMPATIBLE_MODEL=llama3
```

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
npm run test:unit      # 유닛 테스트 (57개)
npm run test:unit:cov  # 유닛 테스트 + 커버리지
npm run test:e2e       # E2E 테스트 (55개)
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

### 이력서
| 메서드    | 경로                         | 설명     |
|--------|----------------------------|--------|
| GET    | /api/resumes               | 이력서 목록 |
| POST   | /api/resumes               | 이력서 생성 |
| GET    | /api/resumes/:id           | 이력서 상세 |
| PUT    | /api/resumes/:id           | 이력서 수정 |
| DELETE | /api/resumes/:id           | 이력서 삭제 |
| POST   | /api/resumes/:id/duplicate | 이력서 복제 |

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

### 템플릿 / 태그 / 버전 / 공유
| 메서드                 | 경로                                     | 설명        |
|---------------------|----------------------------------------|-----------|
| GET/POST/PUT/DELETE | /api/templates                         | 템플릿 CRUD  |
| GET/POST/DELETE     | /api/tags                              | 태그 CRUD   |
| GET                 | /api/resumes/:id/versions              | 버전 목록     |
| POST                | /api/resumes/:id/versions/:vid/restore | 버전 복원     |
| POST                | /api/resumes/:id/share                 | 공유 링크 생성  |
| GET                 | /api/shared/:token                     | 공유 이력서 조회 |

## 프로젝트 구조

```
├── server/                    # NestJS 백엔드
│   ├── main.ts               # 앱 진입점 (Helmet, CORS, Swagger, Graceful Shutdown)
│   ├── app.module.ts          # 루트 모듈 (Rate Limiting)
│   ├── common/filters/       # 글로벌 예외 필터
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
│   └── attachments/          # 첨부파일 (MIME + 확장자 이중 검증)
├── src/                       # React 프론트엔드
│   ├── components/
│   │   ├── ErrorBoundary.tsx # 전역 에러 바운더리
│   │   ├── Header.tsx        # 반응형 헤더 (모바일 메뉴)
│   │   ├── ResumeForm.tsx    # 9탭 이력서 편집 폼
│   │   ├── ResumePreview.tsx # 이력서 미리보기
│   │   └── LlmTransformPanel.tsx  # 로컬/AI 변환 패널
│   ├── mocks/                # MSW 목업 (백엔드 없이 개발)
│   │   ├── handlers.ts       # API 핸들러
│   │   ├── data.ts           # 샘플 데이터
│   │   └── browser.ts        # 브라우저 워커
│   ├── pages/                # HomePage, Edit, New, Preview, Explore
│   ├── lib/api.ts            # API 클라이언트
│   └── types/resume.ts       # TypeScript 타입
├── prisma/
│   ├── schema.prisma         # DB 스키마 (16개 테이블)
│   ├── seed.ts               # 시드 데이터
│   └── migrations/           # 마이그레이션 이력
├── test/app.e2e-spec.ts       # E2E 테스트 (55개)
└── jest-unit.config.js        # 유닛 테스트 설정
```