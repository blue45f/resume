# app Layer

최상위 앱 설정 레이어. 앱 전역 초기화 코드가 위치합니다.

## 무엇이 여기 속하는가

- **providers**: 전역 컨텍스트 프로바이더 (Theme, Auth, Query, i18n 등)
- **router**: 라우터 설정 및 라우트 정의 (`App.tsx`의 Routes)
- **layout shells**: 앱 전체를 감싸는 레이아웃 (Header/Sidebar/Footer 조합)
- **styles**: 글로벌 스타일 엔트리 (`index.css` 등)
- **main entry**: `main.tsx`, `App.tsx` 상위 세팅

## Import 규칙

- `app`은 모든 하위 레이어(`entities`, `features`, `shared`, `pages`)를 import 가능
- 다른 레이어에서 `app`을 import 하지 말 것 (하향 의존만 허용)

```
app → pages → features → entities → shared
```

## 마이그레이션 계획

현재 `src/App.tsx`, `src/main.tsx`, `src/index.css`는 관례상 `src/`에 남겨둡니다.
향후 규모가 커지면 다음으로 이동 검토:

- `src/App.tsx` → `src/app/App.tsx`
- `src/main.tsx` → `src/app/main.tsx` (Vite 엔트리 경로 조정 필요)
- Theme/Auth Provider → `src/app/providers/`
- Router 설정 분리 → `src/app/router/`
