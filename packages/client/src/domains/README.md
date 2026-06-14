# domains Layer

개발가이드의 계층형 아키텍처(app / domains / shared / infrastructure)에서 **도메인** 계층.
이전 FSD 레이어(`features/` `entities/` `widgets/`)의 슬라이스를 백엔드 모듈
(`packages/server/src/{resumes,applications,templates,comments,tags,share,llm,auth}`)
기준 도메인으로 묶었다.

## 구조

각 `domains/<domain>/<slice>/` 는 단일 도메인에 속하는 응집된 기능 단위다.

- `domains/resumes/` — 이력서 엔티티/편집/건강도 위젯/최근 본 이력서/커리어 레벨
- `domains/auth/` — 인증 모델, 사용자 엔티티/프로필 배지
- `domains/community/` — 커뮤니티 글, 스터디그룹
- `domains/interview/` — 면접 준비, 면접 룰렛, 코치/채용 엔티티
- `domains/notifications/` — 알림
- `domains/admin/` — 관리자 탭/테이블
- `domains/home/` — 홈 대시보드 위젯, 히어로
- `domains/policies/` — 약관/개인정보 정책

## Import 규칙 (eslint-plugin-boundaries 로 강제)

- `app` → 모든 계층
- `domains` → `domains` · `shared` · `infrastructure`
- `infrastructure` → `shared` · `infrastructure`
- `shared` → `shared` 만

`components/ hooks/ lib/ stores/ types/ i18n/` 는 물리적으로 옮기지 않고 `shared`
계층으로 매핑한다(루트 `eslint.config.mjs` 의 `boundaries()` elements 참고). 경계
위반은 `pnpm lint` 에서 실패하며, 정당한 계층 부채는 같은 파일에서 정당화와 함께
완화한다.
