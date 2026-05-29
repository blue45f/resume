---
target: 로그인/회원가입 화면 (LoginPage)
total_score: 35
p0_count: 0
p1_count: 2
timestamp: 2026-05-29T04-32-41Z
slug: packages-client-src-pages-loginpage-tsx
---

# Critique: 로그인/회원가입 화면 (LoginPage)

대상: `packages/client/src/pages/LoginPage.tsx` (+ `index.css`의 `.auth-*`). Impeccable 디자인 시스템으로 방금 고도화된 인증 화면. Register: product.

## Design Health Score

| #         | Heuristic                      | Score     | Key Issue                                                  |
| --------- | ------------------------------ | --------- | ---------------------------------------------------------- |
| 1         | Visibility of System Status    | 4         | 스피너+"처리 중", 비번 강도바, aria-live 양호              |
| 2         | Match System / Real World      | 4         | 자연스러운 한국어, [필수]/[선택] 라벨 명확                 |
| 3         | User Control and Freedom       | 3         | 탭 전환 시 입력값 유지 불명확; "비로그인 사용" 탈출구 존재 |
| 4         | Consistency and Standards      | 3         | 소셜 버튼 무게 불균형; 비번보기 tabIndex=-1로 키보드 차단  |
| 5         | Error Prevention               | 4         | zod 검증, noValidate, 강도 가이드, 필수 동의 분리          |
| 6         | Recognition Rather Than Recall | 4         | 회원유형 선택 결과를 즉시 안내                             |
| 7         | Flexibility and Efficiency     | 3         | autoComplete 정확하나 매 방문 탭 전환 필요                 |
| 8         | Aesthetic and Minimalist       | 3         | 회원가입 폼 길이 과다(유형카드+안내+회사+약관4)            |
| 9         | Error Recovery                 | 3         | 에러는 뜨나 서버 raw 메시지 노출 위험                      |
| 10        | Help and Documentation         | 4         | 좌측 가치제안 + 신뢰 배지로 맥락 충분                      |
| **Total** |                                | **35/40** | **실 UI 상위권 (양호)**                                    |

## Anti-Patterns Verdict

**LLM assessment: AI slop 아님 (신뢰함).** mesh blob/floating squares 제거, gradient-text 부재, 평면 기본 + 상태 응답 그림자 패턴이 DESIGN.md와 정합. 카드 중첩 금지를 보더 없는 sunken 틴트로 모범 구현(`:573`, `:814`), 에러 박스는 full-border + 선행 아이콘(side-stripe 회피), bounce 없음 + reduced-motion 가드 존재. 단 미세 어긋남: GitHub 소셜 버튼이 solid black(`#000` 계열, `:70`)이라 1차 신호인 blue CTA보다 시각 무게가 무거워 The One Signal Rule 정신과 충돌.

**Deterministic scan: unavailable.** 번들 detector(`detect.mjs`)가 "bundled detector not found"로 로드 실패 → 자동 스캔 생략, 브라우저/수동 리뷰로 대체.

**Visual (browser):** 데스크톱은 deep sapphire 히어로 패널 + 흰 폼의 split 레이아웃으로 깔끔. 모바일(390px)은 좌측 패널이 숨고 폼이 단일 컬럼으로 잘 스택됨. 단 **쿠키 동의 배너가 비밀번호 필드~로그인 버튼 영역과 겹쳐** 모바일에서 1차 CTA를 일시 가릴 수 있음.

## Overall Impression

흠결 없는 완성도를 지향한 결과가 실제로 드러난다. 취업이라는 고스트레스 맥락에 맞는 차분한 신뢰감, 모범적인 카드중첩 회피, 완비된 상태 머신과 접근성 기본기가 강점이다. 가장 큰 기회는 **시각이 아니라 동작·문구의 디테일**(키보드 접근, 에러 문구, 모바일 배너 겹침)이다. 디자인은 이미 좋고, 인터랙션 품질을 마저 끌어올리면 35 → 38+가 가능하다.

## What's Working

1. **카드 중첩 회피의 정석.** 정보 그룹(회원유형 안내·약관)을 보더 대신 sunken 배경 틴트로 묶어 "카드 안 카드"를 정확히 피함.
2. **상태 머신 완비.** `.auth-field`의 default/hover/focus-visible/disabled/error 5상태가 토큰 기반 일관, focus는 glow 아닌 2px outline.
3. **고스트레스 맥락 배려.** 좌측 가치제안("서류 합격률, 데이터로 올립니다") + 하단 무료/안전/오픈소스 배지로 진입 불안을 낮추는 감정 설계.

## Priority Issues

- **[P1] 비밀번호 보기 버튼 키보드 차단.** `tabIndex={-1}`(`:713`)로 키보드·스크린리더 사용자가 토글 불가 (WCAG 위반). **Fix:** tabIndex 제거, aria-pressed 부여. **Command:** `clarify` 또는 `harden`.
- **[P1] 서버 raw 에러 노출.** `authError`가 백엔드 메시지를 그대로 출력(`:144`,`:173`) → "Unauthorized" 같은 영문/기술 문구가 노출. **Fix:** 상태코드별 한국어 매핑(401="이메일 또는 비밀번호를 확인해 주세요"). **Command:** `clarify`.
- **[P2] 모바일 쿠키 배너 ↔ CTA 겹침.** 390px에서 동의 배너가 로그인 버튼/비번 필드를 가림. **Fix:** 배너에 폼 영역 패딩 확보 또는 배너 우선순위/위치 조정. **Command:** `adapt`.
- **[P2] 소셜 버튼 시각 무게 역전.** GitHub solid black이 blue 1차 CTA보다 무거움(One Signal 위반). **Fix:** 3개 소셜을 ghost/outline로 통일, 색은 아이콘에만. **Command:** `colorize` 또는 `polish`.
- **[P3] 회원가입 인지부하 + 무동작 컨트롤.** 유형안내·약관 두 틴트 박스가 융합돼 6단 흐름이 무겁고, "로그인 상태 유지" 체크박스(`:799`)가 form 미연결로 무동작. **Fix:** 약관 박스 톤 차이/접기 + 체크박스 연결 또는 제거. **Command:** `distill`/`harden`.

## Persona Red Flags

**구직 첫 사용자:** 회원가입 폼이 한 화면에 6단 쌓여 "이걸 다 써야 하나" 위축. 비번 강도 "약함"(rose)이 첫 타이핑부터 빨갛게 떠 부정 신호로 시작.

**재방문 구직자:** 로그인 기본 탭은 OK이나, "로그인 상태 유지"가 무동작이면 재로그인 반복 시 신뢰 훼손. 비번보기 키보드 차단은 비번 매니저 자동입력 검증 시 마찰.

## Minor Observations

- 좌측 상단 "이" 로고 박스가 모바일에서 다소 큼(브랜드 마크 비중 조정 여지).
- 비번 강도바의 즉시 rose는 "충족 진행" 톤(neutral→amber→emerald)으로 바꾸면 부정 신호 완화.

## Questions to Consider

- 회원가입의 회사명·약관 4종을 첫 화면에서 모두 받아야 하는가, 가입 후 점진 수집이 가능한가?
- 소셜 로그인 3종이 이메일 폼보다 위에 있는데, 주 사용자(구직자)의 실제 1순위 경로와 일치하는가?
