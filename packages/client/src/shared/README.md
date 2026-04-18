# shared Layer

도메인에 종속되지 않는 공용 코드. 어떤 앱에서도 재사용 가능한 단위여야 합니다.

## 무엇이 여기 속하는가

- `ui/`: 재사용 가능한 UI 키트 (`Button`, `Dialog`, `ConfirmDialog`, `Input`, `Badge` 등)
  - **도메인 로직이 없는** 순수 UI 컴포넌트만
- `lib/`: 공용 유틸 함수 (`time`, `cache`, `debounce`, `theme`)
- `api/`: 공용 API 클라이언트 (`axios` 인스턴스, 인터셉터, 에러 핸들러)
- `config/`: 환경변수, 상수
- `hooks/`: 도메인 독립 훅 (`useDebounce`, `useSwipe`, `useScrollReveal`)
- `i18n/`: 국제화 설정

## Import 규칙

- `shared`는 **어떤 상위 레이어도 import 하지 않습니다** (가장 낮은 레이어)
- 모든 상위 레이어에서 자유롭게 import 가능

## 마이그레이션 계획

- `src/lib/time.ts`, `cache.ts`, `config.ts`, `theme.ts` → `src/shared/lib/`
- `src/lib/api.ts` → `src/shared/api/` (또는 엔티티별로 분해)
- `src/lib/i18n.ts`, `src/i18n/` → `src/shared/i18n/`
- `src/hooks/useDebounce.ts`, `useSwipe.ts`, `useScrollReveal.ts` → `src/shared/hooks/`
- `src/components/` 중 도메인 중립 UI (Dialog, Button, Toast, Spinner, Skeleton 등)
  → `src/shared/ui/`
- `ConfirmDialog.tsx` → `src/shared/ui/ConfirmDialog.tsx` (이동 완료)

기존 파일은 유지하고 신규 코드부터 이 구조를 따릅니다.
