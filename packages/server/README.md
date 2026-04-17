# @resume/server (Planned)

향후 `server/` 디렉토리를 이 위치로 이동할 예정입니다.

## 개요

- **역할**: NestJS 기반 백엔드 API (Prisma + PostgreSQL)
- **현재 위치**: 루트 `server/`
- **목표 위치**: `packages/server/src/`

## 이동 계획

현재는 플레이스홀더입니다. 루트 프로젝트 `package.json` 이 여전히 NestJS 빌드(`nest build`)를 담당합니다.

### 향후 작업

1. `server/` → `packages/server/src/` 이동
2. `nest-cli.json`, `tsconfig.server.json` 이동
3. `prisma/` 는 server 내부 혹은 루트 유지 (전략 결정 필요)
4. `packages/server/package.json` 생성 — NestJS, Prisma, 인증 관련 의존성 분리
5. 공통 DTO/타입은 `@resume/shared` workspace 의존성으로 참조
6. Dockerfile 경로 조정 (`packages/server` 기준 빌드)
7. `deploy:gcp` 스크립트의 소스 경로 수정

### 의존성 (예정)

- @nestjs/common, @nestjs/core, @nestjs/platform-express
- @nestjs/config, @nestjs/jwt, @nestjs/throttler, @nestjs/swagger
- @prisma/client, prisma
- class-validator, class-transformer
- bcryptjs, cookie-parser, helmet, compression
- @anthropic-ai/sdk, cloudinary

## 관련 문서

- 전체 마이그레이션 플랜: [../../MIGRATION.md](../../MIGRATION.md)
