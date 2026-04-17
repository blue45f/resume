# Libraries

주요 도입 라이브러리와 선택 이유를 정리합니다. 상세 버전은 `package.json` 기준.

## 프론트엔드 코어

| 라이브러리 | 버전 | 용도 | 도입 이유 |
|-----------|------|------|----------|
| **React** | 19.2 | UI 프레임워크 | 최신 동시성·서버 컴포넌트 호환, 거대한 생태계 |
| **React DOM** | 19.2 | 브라우저 렌더러 | React 18+ 자동 배칭, Suspense 안정화 |
| **Vite** | 8 | 번들러·개발 서버 | ESBuild/Rollup 기반 초고속 HMR, 코드 스플리팅 기본 제공 |
| **React Router** | 7 | 클라이언트 라우팅 | 데이터 API·lazy route, TanStack Query와 궁합 |
| **TypeScript** | 5.9 | 정적 타입 | DTO·스키마·컴포넌트 경계 타입 안전성 확보 |
| **TailwindCSS** | 4 | 유틸리티 CSS | 디자인 토큰과 조합, 미사용 CSS 자동 제거 |

## 상태 관리 · 데이터 페칭

| 라이브러리 | 버전 | 용도 | 도입 이유 |
|-----------|------|------|----------|
| **TanStack Query** | 5.99 | 서버 상태 캐시 | 재검증·재시도·낙관적 업데이트 표준, Devtools 포함 |
| **Zustand** | 5.0 | 클라이언트 상태 | Redux 대비 보일러플레이트 최소화, 3 KB 번들 |
| **React Hook Form** | 7.72 | 폼 상태 | 비제어 컴포넌트로 렌더 최소화 |
| **@hookform/resolvers** | 5.2 | 스키마 연결 | RHF + Zod 바인딩 공식 리졸버 |
| **Zod** | 4.3 | 런타임 스키마 | 타입 추론 + 검증 단일 소스, 서버/클라 공유 가능 |

## UI · UX

| 라이브러리 | 버전 | 용도 | 도입 이유 |
|-----------|------|------|----------|
| **Radix UI** (`dialog`, `select`, `tooltip`) | 1.x | 접근성 UI 프리미티브 | ARIA 기본 구현, 스타일 비의존 headless |
| **Sonner** | 2.0 | 토스트 알림 | 성능·애니메이션 품질 우수, 배경 블러 지원 |
| **Embla Carousel** | 8.6 | 캐러셀 | 가벼우며 터치 제스처·접근성 탄탄 |
| **Tiptap** (`react`, `starter-kit`, `link`, `placeholder`, `character-count`) | 3.22 | 리치 텍스트 에디터 | ProseMirror 기반, 확장성 및 JSON 직렬화 |
| **@use-gesture/react** | 10.3 | 제스처 | 드래그·스와이프 편집 UX |
| **Recharts** | 2.15 | 차트 | React 친화적 선언형 차트 |
| **DOMPurify** | 3.4 | XSS 정화 | Tiptap HTML 출력 안전성 확보 |
| **sanitize-html** | 2.17 | 서버 측 sanitize | 저장 전 이중 방어 |

## 국제화 · 유틸

| 라이브러리 | 버전 | 용도 | 도입 이유 |
|-----------|------|------|----------|
| **i18next** + `react-i18next` | 26 / 17 | 다국어 | KO/EN 동시 지원 |
| **i18next-browser-languagedetector** | 8.2 | 언어 감지 | 브라우저 로케일 자동 감지 |
| **dayjs** | 1.11 | 날짜 | moment 대체 경량 라이브러리 |
| **react-to-print** | 3.3 | 인쇄 출력 | 이력서 PDF 출력 워크플로 |
| **docx** | 9.6 | Word 내보내기 | DOCX 포맷 지원 |

## 백엔드 코어

| 라이브러리 | 버전 | 용도 | 도입 이유 |
|-----------|------|------|----------|
| **NestJS** (`common`, `core`, `platform-express`) | 11.1 | API 프레임워크 | 모듈·DI·데코레이터 기반 대규모 확장성 |
| **@nestjs/jwt** | 11 | JWT 발급 | 표준화된 Guard 통합 |
| **@nestjs/config** | 4 | 환경변수 | 타입 안전한 ConfigService |
| **@nestjs/swagger** | 11.3 | API 문서 | 데코레이터 → OpenAPI 자동 생성 |
| **@nestjs/throttler** | 6.5 | Rate Limit | AI 엔드포인트 남용 방지 |
| **Prisma** | 6.19 | ORM | 타입 안전한 쿼리, 마이그레이션 DX |
| **class-validator / class-transformer** | 0.15 / 0.5 | DTO 검증 | Whitelist·ForbidNonWhitelisted로 입력 보안 |
| **bcryptjs** | 3.0 | 패스워드 해시 | 순수 JS 구현, 크로스 플랫폼 |
| **helmet** | 8.1 | 보안 헤더 | CSP·HSTS 기본 보안 |
| **compression** | 1.8 | gzip 압축 | 응답 페이로드 축소 |
| **cookie-parser** | 1.4 | 쿠키 파싱 | httpOnly JWT 쿠키 |

## AI / 외부 연동

| 라이브러리 | 버전 | 용도 | 도입 이유 |
|-----------|------|------|----------|
| **@anthropic-ai/sdk** | 0.90 | Claude 호출 | 공식 SDK, SSE 스트리밍 지원 |
| **cloudinary** | 2.9 | 이미지 CDN | 트랜스폼·CDN 일체형 |

## 테스트 · 품질

| 라이브러리 | 버전 | 용도 | 도입 이유 |
|-----------|------|------|----------|
| **Jest** | 29.7 | 유닛·E2E 러너 | 스냅샷·mock 표준 |
| **ts-jest** | 29.4 | TS 트랜스폼 | Jest + TypeScript |
| **Supertest** | 7.2 | HTTP E2E | Express/Nest 엔드포인트 검증 |
| **MSW** | 2.13 | API Mock | 개발·테스트 네트워크 목킹 |
| **ESLint** | 9.39 | 정적 분석 | flat config 표준화 |
| **Prettier** | 3.8 | 포맷터 | 일관된 스타일 |
| **Husky** | 9.1 | Git 훅 | pre-commit 자동 검사 |
| **lint-staged** | 16.4 | 스테이지 파일 린트 | 커밋 시간 단축 |

## 버전 정책

- **Minor / Patch 업데이트**: 자동 허용(`^` 범위). Dependabot 또는 `pnpm update` 주기적 실행으로 적용하며, Husky + 전체 테스트 통과 시 머지.
- **Major 업데이트**: 수동 검토 필수. 변경 로그 확인, 영향 범위 조사, 마이그레이션 PR 분리. 특히 React·NestJS·Prisma·Vite·TailwindCSS 메이저 업그레이드는 별도 릴리스 노트로 관리합니다.
- **보안 패치**: CVE 보고가 있으면 major 여부와 무관하게 즉시 반영.
- **Pinned 버전**: `pnpm@9.14.4`, Node `>=20` 등 런타임 버전은 `packageManager` / `engines` 필드로 고정.
