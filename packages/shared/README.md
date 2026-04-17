# @resume/shared (Planned)

클라이언트와 서버가 공유하는 타입/유틸리티 패키지입니다.

## 개요

- **역할**: client ↔ server 공유 타입, 상수, 순수 유틸리티
- **현재 상태**: 미구현 (각 영역에 중복 정의되어 있음)
- **목표 위치**: `packages/shared/src/`

## 담기게 될 내용

### 타입 (types/)
- API Request/Response DTO
- 도메인 모델 (User, Resume, CoverLetter, Job, Company 등)
- enum / union 타입 (ResumeStatus, PlanTier, LLMProvider 등)

### 상수 (constants/)
- 라우트 경로 (`/api/v1/...`)
- 에러 코드
- 요금제/한도 값 (Pricing tiers)
- LLM 프로바이더 메타데이터

### 유틸 (utils/)
- 순수 함수만 (날짜 포맷, 문자열 검증, 숫자 포맷)
- 브라우저/Node 어느 쪽에도 의존하지 않음

### 스키마 (schemas/)
- Zod 스키마 — 클라이언트 폼 검증 + 서버 DTO 검증 공용

## 제약사항

- 런타임 의존성 최소화 (zod, dayjs 정도만 허용)
- DOM API 사용 금지 (client 전용)
- Node API 사용 금지 (server 전용)
- 서브모듈별 entry 점 분리 (`@resume/shared/types`, `@resume/shared/utils` 등)

## 빌드 전략 (예정)

- `tsup` 또는 `tsc` 로 ESM + CJS 듀얼 빌드
- `exports` 필드로 서브패스 노출
- workspace protocol (`workspace:*`) 로 client/server 에서 참조

## 관련 문서

- 전체 마이그레이션 플랜: [../../MIGRATION.md](../../MIGRATION.md)
