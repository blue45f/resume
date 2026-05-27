# Contributing

## 개발 환경

```bash
pnpm install
pnpm run dev
```

이 저장소는 React 클라이언트, NestJS 서버, shared 패키지를 함께 관리합니다. Prisma schema와 migration은 루트 기준으로 유지합니다.

## 작업 흐름

1. 기능 변경은 client/server/shared 영향 범위를 먼저 확인합니다.
2. DB schema 변경은 migration, seed, API 응답 타입을 함께 점검합니다.
3. LLM 프롬프트나 provider fallback 변경은 실패 경로와 비용 영향을 같이 기록합니다.
4. PR 전에는 `pnpm run verify`를 기준 검증으로 사용합니다.

## 품질 기준

| 명령                 | 목적                                       |
| -------------------- | ------------------------------------------ |
| `pnpm run verify`    | lint, typecheck, test, build, format check |
| `pnpm run typecheck` | workspace 타입 검사                        |
| `pnpm run test`      | 서버 단위 테스트                           |

## 코드 스타일

사용자 유형(`personal`, `recruiter`, `company`, `coach`) 분기는 page guard, API guard, schema 수준에서 함께 관리합니다. shared 타입을 우회한 임의 shape는 만들지 않습니다.
