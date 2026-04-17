# Conventions

프로젝트 전반의 코드·네이밍·구조 규칙입니다. 새로운 코드는 반드시 이 규칙을 따릅니다.

## 파일명 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| React 컴포넌트 | **PascalCase.tsx** | `ResumeEditor.tsx`, `ConfirmDialog.tsx` |
| 페이지 컴포넌트 | **PascalCase + `Page` 접미사** | `HomePage.tsx`, `EditResumePage.tsx` |
| 커스텀 훅 | **camelCase + `use` 접두사** | `useDebounce.ts`, `useDraftStore.ts` |
| Zustand 스토어 | **`useXxxStore.ts`** | `useAuthStore.ts`, `useUIStore.ts` |
| 유틸 / 순수 함수 | **camelCase.ts** | `time.ts`, `completeness.ts` |
| 타입 정의 | **camelCase.ts 또는 domain.d.ts** | `types/resume.ts` |
| NestJS 모듈 파일 | `<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts` | `auth.module.ts` |
| NestJS DTO | `<name>.dto.ts` | `create-resume.dto.ts` |
| 테스트 | `<name>.spec.ts` (백엔드), `<name>.test.tsx` (프론트) | `resumes.service.spec.ts` |
| 스타일 전역 | `index.css` | 디자인 토큰은 여기 |

- 디렉터리명은 **kebab-case** (`cover-letters/`, `recent-views/`).
- 기본 export는 지양하고 named export를 사용합니다. 페이지 컴포넌트는 default export 허용.

## 컴포넌트 명명 규칙

- 컴포넌트명 = 파일명 = 기본 export 이름으로 통일합니다.
- 컴포넌트 props 타입은 `ComponentNameProps` 패턴을 사용합니다.
- 서버 상태를 쓰는 훅은 `useXxxQuery` / `useXxxMutation` 형식을 권장합니다.

## 폴더 구조 (FSD)

```
src/
├── app/          # 전역 Provider·라우터·에러 바운더리
├── pages/        # 라우트 단위 페이지 (조합만)
├── features/     # 사용자 시나리오
│   └── <feature>/
│       ├── model/   # 훅·상태
│       ├── api/     # API 호출
│       ├── ui/      # feature UI
│       └── lib/     # feature 헬퍼
├── entities/     # 도메인 엔티티 (User, Resume 등)
└── shared/       # 도메인 독립 UI·유틸·API
    ├── ui/
    └── lib/
```

Import 방향: `app` → `pages` → `features` → `entities` → `shared`. 하위 → 상위 import는 금지, 같은 레이어 간 cross-import도 금지합니다.

백엔드(`server/`)는 NestJS 관용 구조를 유지합니다.

```
server/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts
├── <domain>.service.ts
├── dto/
└── <domain>.service.spec.ts
```

## Zod 스키마 위치

- 공용 스키마는 `src/shared/lib/schemas/`에 배치합니다(마이그레이션 진행 중, 신규 스키마는 이 경로).
- feature 단독 스키마는 `src/features/<feature>/lib/schema.ts`에 둡니다.
- 스키마 파일은 한 도메인당 한 파일: `resume.schema.ts`, `auth.schema.ts`.
- 타입은 `z.infer<typeof xxxSchema>`로 파생하여 재사용합니다.
- 서버 DTO와 중복되는 스키마는 `packages/` 또는 `src/types/`에서 공유합니다.

```ts
// src/shared/lib/schemas/resume.schema.ts
import { z } from 'zod';

export const resumeSchema = z.object({
  title: z.string().min(1).max(80),
  sections: z.array(sectionSchema),
});

export type ResumeInput = z.infer<typeof resumeSchema>;
```

## Hook 명명 규칙

- 모든 커스텀 훅은 **`use`** 접두사를 사용합니다.
- 서버 상태: `useXxxQuery`, `useXxxMutation`, `useXxxInfiniteQuery`.
- 로컬 상태·이벤트: `useXxxState`, `useXxxListener`, `useOnClickOutside`.
- Zustand 셀렉터: `useAuthStore(state => state.user)` 형태로 직접 호출하고 래핑이 필요하면 `useCurrentUser` 같은 도메인 훅으로 노출합니다.
- 훅은 한 파일당 하나의 훅을 export 합니다. 내부 헬퍼 훅은 동일 파일에 두되 export 하지 않습니다.

## 커밋 메시지 규칙 (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

| type | 의미 |
|------|------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `test` | 테스트 추가/수정 |
| `refactor` | 기능 변경 없는 구조 개선 |
| `perf` | 성능 최적화 |
| `style` | 포맷·CSS·디자인 시스템 변경 |
| `docs` | 문서 변경 |
| `build` | 빌드 시스템·의존성 |
| `chore` | 그 외 유지보수 |
| `ci` | CI/CD 설정 |

규칙:

- 제목은 **한국어 허용**, 50자 이내를 권장합니다. (예: `fix: Dockerfile npm install + nest build 직접 실행 (GCP 호환)`)
- 본문은 "왜"를 설명하고 "무엇"은 diff로 증명합니다.
- Breaking change는 `!`를 타입에 붙이거나 footer `BREAKING CHANGE:`를 사용합니다.
- 브랜치 이름: `feat/<scope>`, `fix/<scope>`, `test/<scope>`, `refactor/<scope>`.

## 타입 안전성 규칙

- `any` 사용을 최소화하고 `unknown` + 타입 가드를 선호합니다.
- 모든 API 응답/요청은 Zod 또는 class-validator로 검증합니다.
- Prisma의 `Prisma.XxxGetPayload<...>` 타입으로 DB 결과 타입을 추론합니다.
- 프론트·백엔드에서 공유하는 타입은 `src/types/` 또는 `packages/`로 분리합니다.

## 스타일 규칙

- 디자인 토큰은 `src/index.css`의 CSS 변수(`--imp-*`)만 사용합니다.
- 카드·버튼 등 반복 패턴은 `imp-card`, `imp-button` 등 Impeccable 클래스를 우선 적용합니다.
- 임의 색상/간격 값(`#fff`, `padding: 17px`)은 금지합니다 — 토큰 또는 Tailwind 스케일만 사용.
- 컴포넌트 내부 styled-component·inline style은 지양하고 className 기반으로 작성합니다.

## 테스트 규칙

- 모든 신규 기능에 테스트 코드를 함께 커밋합니다.
- 배포 전 `pnpm test` + `pnpm test:e2e`가 통과해야 합니다.
- 스냅샷 테스트는 의도치 않은 회귀 방지용으로 최소한만 유지합니다.
- 외부 I/O(DB·LLM·Cloudinary)는 mock 처리합니다.
