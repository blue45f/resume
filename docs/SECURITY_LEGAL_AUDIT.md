# 보안 및 법률 감사 보고서

- 감사일: 2026-04-17
- 대상: resume-platform (NestJS + React + Prisma + PostgreSQL)
- 운영 환경: GCP Cloud Run (asia-northeast3), Vercel, Neon DB, Cloudinary
- 감사자: Claude (Opus 4.7) 자동 분석

## 요약 (Overall Risk Posture)

**감사 후 위험도: Low-Medium** (Critical 3건 즉시 수정 완료)

감사 전 Critical(상) 3건, High 2건, Medium 5건, Low 다수가 식별되었다. Critical 3건은 이번 커밋에서
모두 수정되었고, 소유권 검증이 누락된 엔드포인트에 방어 코드가 추가되었다. 관련 단위 테스트
862건이 모두 통과한다.

## 감사 전 Critical 발견 및 수정 내역 (FIXED)

### C1. 첨부파일 IDOR (server/attachments) — FIXED

- **증상**: `POST /resumes/:id/attachments`, `GET /resumes/:id/attachments`, `DELETE /attachments/:id`
  세 엔드포인트가 이력서 소유권을 전혀 검증하지 않았다. 로그인한 사용자가 임의의 이력서 ID에
  파일을 업로드하거나 타인의 첨부파일을 삭제할 수 있었다.
- **영향**: 타인 이력서 훼손, Cloudinary 저장공간 오용, 악성 파일 삽입 가능.
- **수정**:
  - `attachments.controller.ts` — 모든 엔드포인트에 `req.user.id` 전달, 인증 필수화
  - `attachments.service.ts`
    - `upload()`: 이력서 소유자 또는 관리자만 가능 (ForbiddenException)
    - `findAll()`: 비공개 이력서는 소유자/관리자만 메타데이터 열람 가능
    - `remove()`: 이력서 소유자 또는 관리자만 삭제 가능
  - 단위 테스트 6건 추가 (소유자/타인/관리자 시나리오)

### C2. 버전 스냅샷 IDOR (server/versions) — FIXED

- **증상**: `GET /resumes/:id/versions`, `GET /resumes/:id/versions/:vid`
  엔드포인트가 소유권을 검증하지 않아 **비공개 이력서의 과거 스냅샷이 누구에게나 노출**되었다.
  Version snapshot은 이력서 전문(개인정보 포함)을 JSON으로 저장한다.
- **영향**: 개인정보 유출 (PIPA 위반 소지), 비공개 이력서 우회 열람.
- **수정**:
  - `versions.service.ts`에 `assertOwnership()` 헬퍼 추가 — versions 리소스는 공개/비공개와
    무관하게 **항상 이력서 소유자에게만** 접근 허용. 관리자는 예외.
  - `versions.controller.ts`에 인증 필수화, userId/role을 service에 전달
  - 단위 테스트 2건 추가

### C3. 공유 링크 삭제 IDOR (server/share) — FIXED

- **증상**: `DELETE /api/share/:id`가 링크 존재만 확인하고 소유권을 검증하지 않았다. 링크 ID를
  알면 누구나 타인의 공유 링크를 삭제할 수 있었다.
- **수정**:
  - `share.controller.ts` — userId/role 전달
  - `share.service.ts#removeLink()` — 이력서 소유자 또는 관리자만 삭제 가능
  - 단위 테스트 3건 추가

## High 등급 (권장 수정)

### H1. JWT를 localStorage에 저장 (XSS → 계정 탈취 위험)

- **현재**: `src/features/auth/model/auth.ts`에서 `localStorage.setItem('token', ...)` 사용.
  브라우저 XSS가 발생하면 토큰이 유출되어 계정이 탈취된다.
- **이미 부분적 방어 존재**: 서버는 httpOnly cookie에 토큰을 설정하고, `auth.guard.ts`가
  `Authorization: Bearer` 헤더 또는 쿠키 중 하나를 허용한다.
- **권장**: 프론트엔드에서 `Authorization: Bearer` 방식을 제거하고 cookie-only로 전환한다.
  전환 시 CSRF 방어가 필요 (`SameSite=lax`는 이미 적용됨, mutation에 CSRF token 권장).
- **파일**: `src/features/auth/model/auth.ts`, `src/stores/useAuthStore.ts`, `src/hooks/useApi.ts`,
  `src/lib/api.ts`, 각 Page.

### H2. LLM 엔드포인트가 비로그인으로도 호출 가능 (비용 및 남용 위험)

- **현재**: `server/llm/llm.controller.ts`의 transform/feedback/job-match/interview/inline-assist가
  `@Throttle`만 적용되고 인증을 강제하지 않는다. 익명 사용자도 LLM을 호출 가능.
- **완화 중**: IP 당 rate limit (5/min), 무료 LLM 프로바이더 우선 사용 중.
- **권장**: 비로그인 호출은 아예 차단하거나, IP + fingerprint 기반 월 쿼터 설정.
  특히 `Anthropic` 프로바이더가 선택되는 경로는 무조건 로그인 필수화.
- **파일**: `server/llm/llm.controller.ts`, `server/health/usage.service.ts`.

## Medium 등급

### M1. UpdateProfileDto 누락 필드 → 프로필 수정 실패 위험

- **현재**: `server/auth/dto/auth.dto.ts`의 `UpdateProfileDto`가 `isOpenToWork`, `openToWorkRoles`를
  정의하지 않았다. `main.ts`의 ValidationPipe는 `forbidNonWhitelisted: true`라서 요청이 400
  오류를 내야 한다. 그러나 `SettingsPage.tsx`는 이를 전송한다. 실제 동작 여부는 수동 테스트 필요.
- **권장**: DTO에 `@IsOptional @IsBoolean isOpenToWork?`, `@IsOptional @IsString @MaxLength(200) openToWorkRoles?`
  추가.

### M2. `findOrCreateUser`의 가짜 이메일 생성

- **현재**: `auth.service.ts:472`에서 OAuth 응답에 email이 없을 때 `${provider}_${id}@noemail`
  형식으로 가짜 이메일을 생성한다. 중복 가능성은 없지만 이메일 알림/비밀번호 재설정이 무의미.
- **권장**: email null 허용 및 UI에서 "이메일 재설정" 요청 흐름을 추가.

### M3. Markdown 렌더러의 신뢰도

- `src/pages/CommunityPostPage.tsx`/`CommunityWritePage.tsx`의 `renderMarkdown`은 입력 텍스트를
  escape 후 자체 태그로 감싸지만, DOMPurify를 **사용하지 않는다**. 현재 코드상 XSS 위험은
  없어 보이지만 향후 패턴 추가 시 쉽게 사고가 날 수 있다.
- **권장**: 최종 출력에 DOMPurify를 한 번 더 씌우거나, 신뢰할 수 있는 Markdown 라이브러리
  (`marked` + sanitize 옵션)로 교체.

### M4. Cookie consent UI는 있지만 실제 동의 없이도 쿠키가 설정됨

- `CookieConsent.tsx`는 단순 배너이며, 비필수 쿠키를 gate하지 않는다. GDPR 준수가 목표라면
  동의 전에는 analytics/비필수 쿠키 미설정이 필요.
- **현재는 필수 쿠키(인증)만 사용**하므로 사실상 문제 없음. GDPR opt-in은 추후 analytics 도입 시 고려.

### M5. 관리자 엔드포인트 일부가 guard 대신 inline check 사용

- `auth.controller.ts`의 `admin/users`, `admin/users/:id/role` 두 엔드포인트는 `AdminGuard`를 쓰지
  않고 `req.user?.role !== 'admin'` inline 검사 후 빈 배열/에러를 반환한다. 동작은 안전하지만
  일관성을 위해 `@UseGuards(AdminGuard)`로 통일 권장. `health/admin/stats` 동일.
- **권장**: 모든 admin-only 엔드포인트에 `@UseGuards(AdminGuard)` 데코레이터 적용.

## Low 등급

- `auth.service.ts:29` — `JWT_SECRET` 미설정 시 `'dev-only-state-secret'` 폴백. `auth.module.ts`가
  이미 프로덕션에서 JWT_SECRET 필수화를 강제하므로 실질적 영향 없음. 그러나 일관성을 위해
  state secret도 별도 환경변수 `OAUTH_STATE_SECRET`로 분리 권장.
- `share.service.ts` bcrypt rounds = 10 (passwordHash는 12). 공유 링크 비밀번호는 낮은 민감도이나
  10 → 12로 통일 권장.
- `common/middleware/sanitize.middleware.ts` — HTML_ALLOWED_FIELDS 목록에 `content`가 포함되지
  않아 커뮤니티 본문은 HTML 태그가 strip된다 (의도된 동작이지만, markdown 렌더러가 대체함).
- Swagger docs는 개발 환경에서만 노출 (안전).
- Helmet CSP 설정됨, HSTS 적용됨, X-Frame-Options DENY, X-Content-Type-Options nosniff OK.
- Request body limit 10MB (JSON), 50MB (urlencoded) — 적절.
- CORS `ALLOWED_ORIGINS` 환경변수로 제어, credentials: true — OK.
- 비밀번호 bcrypt rounds 12 (`auth.service.ts:514,546`) — 권장 수준.
- OAuth state는 HMAC 서명 + 10분 TTL + timing-safe compare (auth.service.ts:37-71) — 우수.

## 법률 및 컴플라이언스 (PIPA)

### 이행됨

- 이용약관/개인정보처리방침 제공: `src/pages/TermsPage.tsx` (이용약관 9조 + 개인정보처리방침 6조)
- 개인정보 수집 항목/목적/보관기간/제3자 제공 명시
- 회원 탈퇴 기능: `DELETE /api/auth/account` (계정 즉시 삭제, cascade)
- 이력서 즉시 삭제 기능 (cascade)
- 비밀번호 변경 기능
- OAuth state CSRF 방어
- 공유 링크 비밀번호 보호 + 만료 시간
- 쿠키 사용 고지 (`CookieConsent.tsx`)

### 미이행 / 권장

- **회원가입 시 필수/선택 동의 체크박스 분리** (PIPA 제22조): 현재 LoginPage는 "계속 진행 시
  동의한 것으로 간주" 문구만 있음. "이용약관 동의(필수)", "개인정보처리방침 동의(필수)",
  "마케팅 수신 동의(선택)"를 별도 체크박스로 분리 필요.
- **민감정보**: 이력서에 사진/주소/전화번호 등이 저장된다. 주민등록번호는 수집하지 않음 (OK).
- **개인정보처리방침 게시일이 `2026-04-02`** — 내용 변경 시 실제 시행일 업데이트 필요.
- **데이터 이전/내보내기(data portability)** 엔드포인트 존재 (`GET /resumes/:id/export/json`) — OK.
- **개인정보 보호책임자(DPO) 지정 및 연락처 게시** 미이행 (PIPA 권고). 문의 이메일/책임자명을
  Terms 페이지 하단에 추가 권장.
- **제3자 제공 로그**: LLM에 이력서 전문이 전송됨을 고지는 하고 있으나, 개별 사용자에게 "언제
  어디로 전송되었는지" 로그를 제공하지 않음. PIPA 엄격 해석 시 로그 저장/조회 기능 요구될 수 있음.
- 국외 이전 동의 (Anthropic API는 미국): 약관에 명시는 있으나 별도 동의 체크 없음.

## 의존성 / 라이선스

`package.json`의 런타임 의존성은 모두 MIT/Apache-2.0/ISC 등 허용형 라이선스. GPL/AGPL 없음.
상용 서비스 적용 가능.

## Follow-up 권장 파일

- `src/features/auth/model/auth.ts`, `src/stores/useAuthStore.ts` — H1 (cookie-only 전환)
- `server/llm/llm.controller.ts` — H2 (LLM 호출 인증 강제)
- `server/auth/dto/auth.dto.ts` — M1 (UpdateProfileDto 필드 추가)
- `src/pages/LoginPage.tsx` — PIPA 동의 체크박스 분리
- `src/pages/TermsPage.tsx` — DPO 연락처 추가
- `src/pages/CommunityPostPage.tsx` — Markdown 렌더러에 DOMPurify 적용 (방어 심화)

## 실행된 수정 파일

- `server/attachments/attachments.controller.ts`
- `server/attachments/attachments.service.ts`
- `server/attachments/attachments.service.spec.ts`
- `server/versions/versions.controller.ts`
- `server/versions/versions.service.ts`
- `server/versions/versions.service.spec.ts`
- `server/share/share.controller.ts`
- `server/share/share.service.ts`
- `server/share/share.service.spec.ts`

## 테스트 상태

- 단위 테스트: **44 suites, 862 tests — 전부 PASS**
- 타입 체크: `tsc --noEmit` — PASS
- 린트: 미실행 (변경 범위가 제한적, 기존 스타일 유지)

## 권장 후속 작업 우선순위

1. H2 (LLM 인증 강제) — 비용 및 남용 방지 직결, 빠른 수정 가능
2. M1 (UpdateProfileDto 필드) — 프로필 기능 정상 동작 보장
3. PIPA 동의 체크박스 분리 — 규제 리스크 감소
4. H1 (cookie-only 전환) — XSS 사고 시 피해 최소화 (리팩토링 범위 큼)
5. DPO 연락처 추가 + Markdown DOMPurify — 소폭 개선

---

_본 감사는 정적 코드 분석 기반이며, 실제 운영 트래픽/침투 테스트는 별도 수행 필요._
