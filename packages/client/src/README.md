# src/ — 계층형 도메인 아키텍처 (app / domains / shared)

이 프로젝트는 개발가이드의 계층형 아키텍처를 따른다. 이전에 부분 도입했던 FSD
레이어(`features/` `entities/` `widgets/`)는 백엔드 모듈 기준 **도메인**(`domains/`)으로
재편했고, 계층 경계는 `eslint-plugin-boundaries`(루트 `eslint.config.mjs`)로 강제한다.

## 레이어 구조

```
src/
├── app/         # 앱 전역 설정 (providers, layout shells)
├── pages/       # 라우트 셸 — app 계층으로 매핑
├── domains/     # 도메인 단위 기능 (resumes, auth, community, interview, ...)
│   ├── resumes/        # 이력서 엔티티·편집·건강도 위젯·최근 본·커리어 레벨
│   ├── auth/           # 인증 모델, 사용자 엔티티/프로필 배지
│   ├── community/      # 커뮤니티 글, 스터디그룹
│   ├── interview/      # 면접 준비·룰렛, 코치/채용 엔티티
│   ├── notifications/  # 알림
│   ├── admin/          # 관리자 탭/테이블
│   ├── home/           # 홈 대시보드 위젯, 히어로
│   └── policies/       # 약관/개인정보 정책
├── shared/      # 공용 ui kit + lib (schemas, cn, time)
│
├── components/  # shared 계층으로 매핑 (물리 이동 안 함)
├── hooks/       # shared 계층으로 매핑
├── lib/         # shared 계층으로 매핑 (api, routes, 한국어 분석 모듈)
├── stores/      # shared 계층으로 매핑 (zustand)
├── types/       # shared 계층으로 매핑
├── i18n/        # shared 계층으로 매핑
└── mocks/       # MSW 모킹
```

## 의존성 방향 (eslint-plugin-boundaries 강제)

```
app ─▶ domains ─▶ shared
        └────────▶ infrastructure ─▶ shared
```

- `app` → 모든 계층
- `domains` → `domains` · `shared` · `infrastructure`
- `infrastructure` → `shared` · `infrastructure`
- `shared` → `shared` 만 (상위 계층 역참조 금지)

`components/ hooks/ lib/ stores/ types/ i18n/` 는 물리적으로 옮기지 않고 elements 패턴으로
`shared` 에 매핑한다. 경계 위반은 `pnpm lint` 에서 실패한다.

## 참고

- alias: `@/*` → `./src/*` (`tsconfig.json`)
- 도메인별 세부 규칙: `src/domains/README.md`
- 한국어 분석 모듈 맵: `src/lib/README.md`
