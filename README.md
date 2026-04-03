# 이력서공방

**AI 기반 이력서 관리 플랫폼**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 29개 데이터 모델 | 33개 라우트 | 15개 이력서 테마 | 멀티 LLM 지원

---

## 주요 기능

### 이력서 관리

- 섹션별 편집 (인적사항, 경력, 학력, 프로젝트, 자격증, 어학, 수상, 활동 등 10개 섹션)
- 15개 디자인 테마 (클래식, 모던, 미니멀, 테크, 다크, 포트폴리오 등)
- Tiptap 리치 텍스트 에디터 + DOMPurify XSS 방지
- 버전 관리 및 스냅샷 복원
- 이력서 비교 (diff), 복제, 자동 저장
- 태그 분류 및 북마크
- PDF/TXT/MD 내보내기
- 공유 링크 (비밀번호 보호, 만료 설정)
- 완성도 분석, 중복 감지, 통계 (글자수/단어수/읽기시간)

### AI 도구

- AI 이력서 자동 생성 (비정형 텍스트 -> 구조화된 이력서, 26개 직종별 템플릿)
- AI 양식 변환 (표준/경력기술서/자기소개서/LinkedIn/영문/개발자/디자이너/커스텀)
- AI 피드백 (0-100점 점수, 등급, 강점/개선점, 섹션별 분석)
- JD 매칭 분석 (매칭도%, 매칭/부족 스킬, 수정 제안)
- 면접 질문 생성 (8-10개 예상 질문 + 모범 답변)
- AI 자기소개서 생성 (이력서 + 채용공고 + 어조 선택)
- 이력서 번역 (다국어)
- ATS 호환성 점검 (0-100점)
- AI 코칭 및 키워드 분석

### 채용 / 스카우트

- 채용 공고 등록 및 검색 (정규직/계약직/파트타임/인턴)
- 리크루터 대시보드
- 스카우트 메시지 발송
- 지원 현황 추적 (applied -> screening -> interview -> offer/rejected)
- 1:1 다이렉트 메시지

### 커뮤니티

- 이력서 탐색 (공개 이력서 갤러리)
- 댓글 및 피드백
- 팔로우 / 팔로잉
- 알림 시스템 (댓글, 북마크, 스카우트 등)
- 프로필 페이지 (`/@username/slug`)

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

# AI (LLM)
ANTHROPIC_API_KEY=your-anthropic-api-key

# 파일 업로드
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# 클라이언트
VITE_API_URL=http://localhost:3000
```

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
├── src/                    # 프론트엔드 (React)
│   ├── components/         # 공통 UI 컴포넌트
│   ├── pages/              # 페이지 컴포넌트 (33개 라우트)
│   ├── lib/                # 유틸리티, API 클라이언트, 테마, 플랜
│   ├── types/              # TypeScript 타입 정의
│   └── mocks/              # MSW 핸들러 (개발 모드)
├── server/                 # 백엔드 (NestJS)
│   ├── auth/               # 인증 (OAuth + JWT)
│   ├── resumes/            # 이력서 CRUD
│   ├── llm/                # AI LLM 연동
│   ├── templates/          # 템플릿 관리
│   ├── cover-letters/      # 자기소개서
│   ├── jobs/               # 채용 공고
│   ├── social/             # 팔로우, 스카우트, DM
│   ├── notifications/      # 알림
│   └── common/             # 가드, 데코레이터, 필터
├── prisma/
│   └── schema.prisma       # 29개 모델 정의
├── public/                 # 정적 파일
└── package.json
```

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
- **Rate Limiting** - NestJS Throttler 기반 API 요청 제한
- **XSS 방지** - DOMPurify로 모든 리치 텍스트 입력 sanitize
- **httpOnly 쿠키** - JWT 토큰 쿠키 저장 (XSS 토큰 탈취 방지)
- **CORS** - 허용된 오리진만 접근 가능
- **입력 검증** - class-validator 기반 DTO 검증

---

## 테스트

```bash
# 단위 테스트
pnpm test:unit

# 커버리지 포함
pnpm test:unit:cov

# E2E 테스트
pnpm test:e2e
```

---

## License

[MIT](LICENSE)
