# 회원 유형·역할 전환 정책 (운영 기준)

작성: 2026-04-18
상태: **Phase 1 시행 중** (단일 activeType). Phase 2 (복수 역할)는 구현 로드맵에 있음.

## 1. 목적

이력서공방은 한 사람이 구직자·채용담당자·코치·기업 담당 여러 역할을 병행하는 경우가 흔해, 역할 전환 정책이 운영 가능·데이터 무결성·수익 정산에 직결됨. 본 문서는 **현 운영 정책(Phase 1)과 향후 확장(Phase 2~3) 설계**를 함께 정의.

---

## 2. Phase 1 (현재, 2026-04-18 기준)

### 2.1 구조

- `User.userType`: **단일값** (`personal` | `recruiter` | `company` | `coach`)
- `User.role`: 시스템 권한 (`user` | `admin` | `superadmin`)
- 한 시점에 **활성 역할은 정확히 1개**
- 전환은 `PATCH /api/auth/profile { userType }` 한 번의 API 호출

### 2.2 전환 UI (Settings > 역할 전환)

| 대상        | 조건                                       | 전환 방식                                                                           |
| ----------- | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| → personal  | 없음                                       | 즉시 전환                                                                           |
| → recruiter | 없음 (경고: 회사 이메일 권장)              | 즉시 전환                                                                           |
| → company   | `companyName` 필수 — 없으면 먼저 입력 유도 | 즉시 전환                                                                           |
| → coach     | 코치 프로필 등록 필요                      | `/coach/profile`로 이동 후 프로필 작성 → upsert 시 자동으로 `userType='coach'` 승격 |

### 2.3 데이터 보존

- 전환해도 기존 데이터 **그대로 유지** (이력서 / 커뮤니티 게시글 / 스카우트 기록 등)
- 다른 역할로 바꾸면 해당 역할 메뉴만 UI에서 전환됨 (DB는 그대로)
- 예: personal → recruiter 전환 후 다시 personal 복귀 → 이력서 그대로 남아있음

### 2.4 권한·제한

| 액션             | personal | recruiter | company | coach | admin |
| ---------------- | -------- | --------- | ------- | ----- | ----- |
| 이력서 CRUD      | ✅       | ✅        | ✅      | ✅    | ✅    |
| 채용공고 작성    | ❌       | ✅        | ✅      | ❌    | ✅    |
| 스카우트 발송    | ❌       | ✅        | ✅      | ❌    | ✅    |
| 코치 프로필 등록 | ❌       | ❌        | ❌      | ✅    | ✅    |
| 코칭 세션 수락   | ❌       | ❌        | ❌      | ✅    | ❌    |
| 코칭 세션 예약   | ✅       | ✅        | ✅      | ✅    | ✅    |
| 스카우트 수신    | ✅       | ❌        | ❌      | ✅    | ✅    |
| 관리자 기능      | ❌       | ❌        | ❌      | ❌    | ✅    |

### 2.5 현재 한계 (알려진 구멍)

| 한계                                             | 영향                                     | 우회                                 |
| ------------------------------------------------ | ---------------------------------------- | ------------------------------------ |
| 한 계정 = 한 역할                                | 낮에 본업 구직, 저녁 코치 활동 병행 불가 | 별도 계정                            |
| 인증 없이 recruiter 전환                         | 허위 채용담당자 차단 어려움              | 관리자 모니터링 + 신고 처리          |
| 기업 인증 없이 company                           | 가짜 회사 등록 가능                      | 동일                                 |
| 코치 심사 없음                                   | 무자격 코치 수수료 수령 가능             | 첫 세션 신고 기반 정지               |
| recruiter→personal 전환 시 본인 이력서 공개 여부 | 의도치 않은 노출                         | 프로필 전환 시 visibility 경고 (TBD) |

---

## 3. Phase 2 (차기) — 복수 역할 동시 보유

자세한 설계는 `docs/USER_TYPE_MULTI_ROLE_PLAN.md`. 요약:

### 3.1 스키마 변경

```prisma
model UserRoleGrant {
  userId     String
  role       String   // personal | recruiter | company | coach
  status     String   // active | pending | suspended
  verifiedAt DateTime?
  metadata   Json     // 역할별 추가 데이터
  @@unique([userId, role])
}
model User {
  activeRole String @default("personal")
  roleGrants UserRoleGrant[]
}
```

### 3.2 Phase 2 워크플로

1. 가입 시 `personal` 자동 부여 (UserRoleGrant status=active)
2. 추가 역할 신청 → `UserRoleGrant` 생성 (status=pending or active)
3. Header 프로필 메뉴에서 활성 역할 스위처 (Gmail 계정 전환 UX)
4. `POST /api/auth/switch-role {role}` → JWT 재발급 (activeRole + grantedRoles)
5. 각 요청마다 서버가 grantedRoles 실제 보유 여부 검증 (JWT 신뢰 ❌)

### 3.3 Phase 2에서 도입될 검증 정책

| 역할      | 검증 방법                                       | 승인 주체          |
| --------- | ----------------------------------------------- | ------------------ |
| personal  | 없음 (가입 시 자동)                             | 자동               |
| coach     | 프로필 + 경력 증빙 (선택) → 관리자 심사         | 관리자             |
| recruiter | 회사 이메일 인증 (6자리 코드) OR LinkedIn OAuth | 자동 + 관리자 리뷰 |
| company   | 사업자등록번호 + 대표 이메일 + 도메인 소유권    | 관리자             |

### 3.4 Phase 2 전환 표준 flow

```
Settings → 역할 관리 → [신규 역할 신청]
  → 역할별 요구 정보 입력 (약관 동의 포함)
  → 서버 검증/심사
  → (통과) UserRoleGrant.status = active
  → 알림 발송 + Header 역할 스위처에 추가 노출
```

---

## 4. Phase 3 (미래) — 팀·조직

### 4.1 Team 개념

- `Team` 모델 신설 (회사 단위)
- `TeamMember` 조인 (userId + teamId + role in team: owner | recruiter | viewer)
- 한 회사에 여러 recruiter 묶기 가능
- 팀 대시보드에서 통합 스카우트/파이프라인 관리

### 4.2 B2B 코칭 상품

- `CoachingProduct` — 기업이 코치에게 일괄 세션 구매
- 팀 멤버들이 개별 예약 (limit per member)

---

## 5. 기능 간 개연성 검토 (Phase 1 관점)

### 5.1 잘 연결됨 ✅

- **구직 여정**: register → personal → 이력서 → 채용 탐색 → 지원 → 면접 준비 → 모의 면접 → 코칭 예약 → 수수료 15% 정산(계산)
- **커뮤니티**: 9개 카테고리 (notice/free/tips/resume/cover-letter/interview/question/scrapped/all) + 댓글 + 대댓글 + 좋아요 + 신고
- **스터디 카페**: 3축 필터 (기업 유형 × 카페 주제 × 경력) + 카페별 카테고리 + JobPost 연결
- **보안**: IDOR 3건 해결 + PIPA 동의 (마케팅/국외이전 선택) + DB 저장 완료

### 5.2 개연성 부족 ⚠️

1. **recruiter 전환 → 이력서 공개 여부 경고**: 전환했을 때 본인 구직자 이력서가 recruiter 메뉴에서 보이면 혼란
   - 수정안: `Settings > 역할 전환`에 "내 공개 이력서 visibility를 private으로 바꿀까요?" 체크박스 (기본 꺼짐)
2. **company 전환 → 회사명만 입력받음**: 실제 사업자 없이도 전환 가능
   - 수정안: Phase 2 도입 전까지는 "베타" 배지 + 공개 페이지에 "미인증 기업" 노출
3. **coach 세션 예약 후 이력서 열람 권한 없음**
   - 수정안: CoachingSession에 `resumeId` 추가 → 예약 시 공유 → 서비스 로직에서 coach가 해당 resumeId 열람 허용
4. **지원 상태 변경 알림**: 직접 바꿔도 알림 발송 (의미 약함)
   - 수정안: recruiter가 파이프라인에서 다른 지원자 status 바꿀 때만 알림
5. **커뮤니티 게시글 작성 → 카테고리 기본값 없음**
   - 수정안: 현재 URL `?category=interview` 등에서 들어오면 그 카테고리 자동 선택
6. **팔로우·스카우트 교차**: personal 팔로우한 recruiter가 역할 바꿔 personal이 돼도 팔로우 유지 (의미 변질)
   - 수정안: 팔로우는 "사람" 단위이므로 그대로 두되, 타임라인 필터링 시 상대방 activeRole 고려

### 5.3 결제·정산 현실성

- **현재**: PaymentPage/PaymentResultPage stub, 실제 PG 연동 없음
- **코칭 수수료 15%**: 계산만 되고 실제 이체 없음
- **Pro/Enterprise 플랜**: PricingPage 존재 but 실제 구독 처리 없음
- **수정안**: 모든 결제 관련 UI에 "🧪 베타" 배지 + `Settings > 결제`에 "실결제는 아직 활성화되지 않았습니다" 안내 (P0 우선순위)

---

## 6. 우선순위 (Phase 1 내 보완)

| 순위 | 이슈                                        | 규모 | 효과             |
| ---- | ------------------------------------------- | ---- | ---------------- |
| P0   | 결제 UI에 베타 배지 + 안내                  | S    | 사용자 신뢰      |
| P0   | coach 세션에 resumeId 연결                  | M    | 코칭 품질↑       |
| P1   | recruiter 전환 시 내 이력서 visibility 경고 | S    | 개인정보 보호    |
| P1   | 커뮤니티 ?category= 쿼리 자동 선택          | S    | UX               |
| P1   | 합격 처리 후 후기 작성 유도                 | S    | 사회 기여·리텐션 |
| P2   | 세션 녹화본 저장/공유                       | M    | 차별화           |
| P2   | 커뮤니티 좋아요 알림                        | S    | 참여도           |
| P3   | 기업 B2B 상품                               | L    | 수익             |

---

## 7. 실행 결정 필요 (사용자 승인 포인트)

각 Phase로 넘어가려면 다음 결정 필요:

### Phase 2 진입 조건

- [ ] UserRoleGrant 스키마 도입 승인?
- [ ] 코치 심사 방식: **(A) 자동 승인** / (B) 관리자 심사 / (C) 증빙 업로드?
- [ ] 리쿠르터 인증: **(A) 회사 이메일** / (B) LinkedIn OAuth / (C) 자유 + 리뷰?
- [ ] 기업 계정 인증: **(A) 사업자등록번호** / (B) 수동 심사?

### Phase 3 진입 조건

- Phase 2 안정화 후 재논의. B2B 판로 우선순위에 따라 결정.

---

## 8. 현 상태 요약 (2026-04-18)

- ✅ Phase 1 정책 명문화 완료
- ✅ 4종 userType 전환 UI (`SettingsPage`)
- ✅ PIPA 동의 (필수 2 + 선택 2)
- ✅ 코치 프로필 기반 자동 승격 (CoachProfile upsert)
- ⚠️ Phase 2 설계만 존재, 구현은 대기
- ⚠️ 결제·정산 실연동 미구현 (P0)
- ⚠️ 5.2의 6개 개연성 이슈 수정 대기

**이 문서는 Phase 2·3 구현 시점에 주기적으로 갱신.**
