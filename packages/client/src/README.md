# src/ — Feature-Sliced Design (부분 도입)

이 프로젝트는 [Feature-Sliced Design (FSD)](https://feature-sliced.design/) 아키텍처를
**점진적으로** 도입하고 있습니다. 기존 flat 구조(`components/`, `hooks/`, `pages/`, `lib/`)는
유지하면서, **신규 코드는 FSD 레이어**에 배치합니다.

## 레이어 구조

```
src/
├── app/         # 앱 전역 설정 (providers, router, layout shells)
├── pages/       # (기존) 페이지 컴포넌트 — 점진적 마이그레이션
├── features/    # 사용자 시나리오 단위 (auth, resume-crud, bookmark, ...)
├── entities/    # 비즈니스 엔티티 (resume, user, job, post, company)
├── shared/      # 공용 코드 (ui kit, lib, hooks, api, i18n, config)
│
├── components/  # (기존) flat 컴포넌트 — 점진적으로 features/entities/shared로 이동
├── hooks/       # (기존) flat 훅 — 점진적으로 features/shared/hooks로 이동
├── lib/         # (기존) 유틸 — 점진적으로 shared/lib로 이동
├── types/       # (기존) 공용 타입 — 점진적으로 entities/*/model로 이동
├── i18n/        # (기존) 번역 파일 — shared/i18n로 이동 예정
└── mocks/       # (기존) MSW 모킹
```

## 의존성 방향 (단방향)

```
app ─▶ pages ─▶ features ─▶ entities ─▶ shared
```

- 상위 레이어는 하위 레이어를 import 할 수 있습니다.
- **반대 방향 import는 금지**. 예: `shared`는 `features`를 참조할 수 없음.
- 같은 레이어 내부 cross-import 지양. 필요하면 한 단계 위 레이어에서 조합.

## 현재 이동된 파일 (PoC)

| Before                             | After                                               |
| ---------------------------------- | --------------------------------------------------- |
| `src/hooks/useRecentViews.ts`      | `src/features/recent-views/model/useRecentViews.ts` |
| `src/components/ConfirmDialog.tsx` | `src/shared/ui/ConfirmDialog.tsx`                   |

import 경로는 `@/` alias 경유로 업데이트되었습니다.

## 마이그레이션 가이드

1. **새 기능**은 반드시 `features/` 또는 `entities/` 하위에 배치.
2. **기존 파일 수정 시**, 적절한 FSD 위치로 이동 검토 (단, 대량 수정 유발 시 보류).
3. 각 레이어 `README.md`의 "마이그레이션 계획" 섹션 참고.
4. 이동 후 `npx tsc --noEmit` 과 테스트 전체 통과 확인.

## 참고

- alias: `@/*` → `./src/*` (`tsconfig.app.json`에 정의됨)
- 각 레이어별 세부 규칙: `src/<layer>/README.md`
