# 회원 유형 전환·복수 역할 기획 검토

작성: 2026-04-18
상태: 검토 단계 (구현 전 기획 확정 필요)

## 1. 현재 구조 분석

### 1.1 User 스키마

```prisma
model User {
  role     String @default("user")           // user | admin | superadmin
  userType String @default("personal") @map("user_type")
  // personal | recruiter | company | coach
  companyName   String?  // recruiter/company 전용
  companyTitle  String?  // recruiter 소속 직함
  // (신규) marketingOptIn, llmOptIn
  // (신규) isOpenToWork, openToWorkRoles
}
```

### 1.2 현재 한계

- **`userType` 단일값** — 한 계정이 **한 가지 역할**만 가능. 실제로는 흔한 니즈:
  - "낮엔 본업 개발자(personal)로 구직 준비, 저녁엔 사이드로 코치(coach) 활동" → 지금은 한 계정에서 둘 다 불가
  - "스타트업 CEO가 본인 이력서도 관리(personal)하면서 팀원 채용(recruiter/company)도 함" → 한쪽만 선택
  - "대기업 리쿠르터가 이직 준비(personal)하며 기존 회사 채용도 진행" → 불가
- **역할 전환 UI 없음** — `userType`은 `UpdateProfileDto`로 수정은 가능하지만 UX/워크플로가 없음
- **권한 분기 산발** — 페이지/API별로 `isRecruiter = userType === 'recruiter' || 'company'` 같은 inline 체크가 퍼져있어 복수 역할 도입 시 수백 곳 수정 필요

## 2. 목표 시나리오

### S1. 단일 계정, 복수 역할 동시 보유

하나의 이메일로 로그인 후 역할을 자유롭게 ON/OFF. 예:

- 홍길동: [personal ✓] [recruiter ✓] [coach ✗] [company ✗]
- 시점에 따라 **활성 역할 1개**를 선택(= 현재 세션 모드)

### S2. 역할별 요구사항

| 역할      | 등록 조건                                       | 선택 후 플러스 기능                        |
| --------- | ----------------------------------------------- | ------------------------------------------ |
| personal  | 기본 (가입 시)                                  | 이력서·지원·스카우트 수신·커뮤니티         |
| coach     | 본인 프로필 + 분야/시급 + 관리자 심사(optional) | 예약 수락, 수수료 정산, 코치 대시보드      |
| recruiter | 본인 회사 이메일 인증 OR 회사 초대 코드         | 인재 탐색, 스카우트 발송, 채용공고 작성    |
| company   | 사업자 등록번호 + 대표자 인증 + 도메인 검증     | 팀 초대, 기업 브랜딩 페이지, 통합 대시보드 |

### S3. 역할 전환 트리거 지점

- 설정 > 역할 관리 페이지에서 신청
- 온보딩에서 "저는 어떤 사용자인가요?" 분기 (단일 선택, 추후 추가 가능)
- 프로필 배지 클릭 시 활성 역할 스위치 (Gmail 계정 전환 UX)

## 3. 제안 스키마 (복수 역할)

### 3.1 UserRole 조인 테이블

```prisma
model UserRoleGrant {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  role       String   // personal | recruiter | company | coach
  status     String   @default("active") // active | pending | suspended
  grantedAt  DateTime @default(now()) @map("granted_at")
  verifiedAt DateTime? @map("verified_at")
  metadata   Json     @default("{}") // 역할별 추가 정보 (companyId, specialty...)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
  @@index([userId])
  @@map("user_role_grants")
}

model User {
  // ... 기존 ...
  activeRole String @default("personal") @map("active_role")
  // 세션에서 현재 선택한 역할
  roleGrants UserRoleGrant[]
}
```

### 3.2 JWT payload 확장

```ts
interface JwtPayload {
  sub: string; // userId
  role: string; // admin | user (시스템 권한)
  activeRole: string; // personal | recruiter | company | coach (현재 세션 역할)
  grantedRoles: string[]; // ['personal', 'coach'] — 전환 가능한 역할
}
```

프론트에선 activeRole만 보면 되고, "역할 전환" 액션 시 `POST /api/auth/switch-role {role}` 호출 → 서버가 grantedRoles에 있는지 확인 후 새 JWT 발급.

## 4. 전환 워크플로 상세

### 4.1 personal → coach 전환 (신청형)

1. SettingsPage > 코치 활동 신청
2. CoachProfileEditPage: 전문분야/경력/시급/bio 입력
3. `POST /api/coach-profiles` → UserRoleGrant(status=pending) 생성
4. (선택) 관리자 심사 — AdminPage에 "코치 신청 대기" 탭
5. 승인 후 status=active, verifiedAt 기록
6. 이후 `POST /api/auth/switch-role {role:'coach'}` 가능

### 4.2 personal → recruiter 전환 (이메일 인증)

1. SettingsPage > 리쿠르터 전환
2. 회사 이메일 입력 → 인증 메일 발송 (6자리 코드)
3. 인증 완료 → UserRoleGrant(role=recruiter, metadata={verifiedEmail})
4. 즉시 활성화, switch-role 가능

### 4.3 personal → company 전환 (사업자 인증)

1. SettingsPage > 기업 계정 전환
2. 회사명 + 사업자 등록번호 + 대표 이메일
3. (수동 심사 또는 외부 API) 확인
4. 승인 → 기업 페이지 개설, UserRoleGrant 생성
5. 다른 유저를 recruiter로 초대 가능 (companyId metadata로 연결)

### 4.4 역할 선택 UX

- Header 우측 프로필 버튼에 현재 activeRole 배지
- 클릭 → DropdownMenu로 역할 리스트 (Gmail 계정 전환처럼)
- 다른 역할 클릭 → JWT 갱신 + 페이지 리로드
- 한 역할만 있을 땐 스위처 숨김

## 5. 기존 로직 마이그레이션

### 5.1 단방향 호환

새 컬럼 `activeRole`을 `userType`과 **동기화**. 기존 코드는 계속 `user.userType`을 읽어도 동작.

```ts
// 전환 시 둘 다 업데이트
await prisma.user.update({
  where: { id },
  data: { userType: newRole, activeRole: newRole },
});
```

### 5.2 점진적 리팩토링 체크포인트

- [ ] UserRoleGrant 모델 추가 + migration
- [ ] 기존 `userType === 'recruiter'` 체크를 `hasRole('recruiter')` 헬퍼로 단계 치환
- [ ] `hasRole`은 초기엔 `userType` 기반, 나중엔 grantedRoles 기반
- [ ] Header 역할 스위처 UI (feature flag: `ENABLE_MULTI_ROLE`)
- [ ] switch-role 엔드포인트 + JWT 재발급
- [ ] AdminPage 코치/리쿠르터/기업 심사 대기 목록 탭

## 6. 기획적 공백 (논의 필요)

1. **코치 심사 여부** — 현재는 누구나 코치 프로필 생성 가능. 수수료 15% 받는 구조에서 사기/무자격 코치 방지 필요. 옵션: (a) 관리자 심사 (b) 자동 승인 + 신고 기반 차단 (c) 증빙서류 업로드
2. **리쿠르터 이메일 인증** — 대기업 인사담당자가 gmail 쓰는 경우 많음. 도메인 whitelist만 고집하면 false-negative 큼. 옵션: (a) 자유 입력 + 관리자 리뷰 (b) LinkedIn OAuth로 회사 검증
3. **기업 계정의 Team 개념** — companyId를 조인 테이블로 만들어야 한 회사에 여러 recruiter 묶기 가능. 현재 User.companyName은 단순 문자열
4. **activeRole 전환 비용** — 리쿠르터 모드에서 이력서 상세 보면 "구직자 노출 알림" 발송, 다시 personal 모드로 돌아와서 같은 이력서 보면 중복 알림? 모드 전환 시 로그 분리 필요
5. **권한 상승 공격** — JWT activeRole을 클라이언트가 변조 가능한가? 서버는 매 요청마다 UserRoleGrant 체크 필수 (단순 JWT 신뢰 ❌)

## 7. 단기 실행 계획

1. **Phase 0 (현재)** — 본 문서로 기획 확정
2. **Phase 1** — UserRoleGrant 스키마 + migration
3. **Phase 2** — hasRole 헬퍼 + 기존 체크 점진 치환 (50+ 곳)
4. **Phase 3** — `/api/auth/switch-role` + JWT 재발급
5. **Phase 4** — Header 역할 스위처 UI
6. **Phase 5** — 각 전환 신청 플로우 (코치 → 리쿠르터 → 기업 순)
7. **Phase 6** — AdminPage 심사 탭

## 8. 결정 필요한 포인트 — @사용자

- [ ] 스키마 변경(`UserRoleGrant` 조인) 방향 OK?
- [ ] 코치 심사: 자동 승인 vs 관리자 심사 vs 증빙서류?
- [ ] 리쿠르터 이메일 인증: 도메인 whitelist vs 자유 입력 + 리뷰 vs OAuth?
- [ ] 기업 계정: 사업자등록번호 검증 API 사용? (국세청 API 비용/복잡도)
- [ ] 역할 스위처 UI: Gmail 스타일 드롭다운 vs 프로필 페이지에서만?

---

이 문서에 동의하시면 바로 Phase 1부터 구현 착수.
