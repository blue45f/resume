# 코칭 프로세스 — 회원 가입부터 매칭까지

작성: 2026-04-18
상태: Phase 1 운영 중 (심사/결제 PG는 베타)

## 1. 전체 플로우 개요

```
[구직자 / 일반 회원]                     [코치 지망자]
       │                                     │
       ├─ /coaches (목록 탐색)               ├─ 회원가입 or 기존 계정
       │  ▼                                   │  ▼
       ├─ /coaches/:id (상세)                ├─ Settings → 역할 전환
       │  ▼                                   │  ─ or ─
       ├─ 예약 폼 작성                        ├─ /coaches → "나도 코치 되기" CTA
       │  • 일정 / 시간 / 요청사항             │  ▼
       │  • 이력서 공유 (선택) ★NEW           ├─ /coach/profile (프로필 등록 폼)
       │  ▼                                   │  • 전문 분야
       ├─ POST /api/coaching/sessions        │  • 시급 / 경력 / 언어 / 가능시간
       │  → status: 'requested'              │  • bio
       │  → 수수료 15% 자동 계산              │  ▼
       │                                      ├─ upsertCoachProfile
       │                                      │  → User.userType = 'coach' 자동 승격
       │                                      │  → CoachProfile 생성 또는 갱신
       ▼                                      ▼
 [코치가 수락]                        [/coach/dashboard]
       │                                     │
       ├─ PATCH /api/coaching/sessions/:id/status    │
       │  status='confirmed'                          │
       │                                              │
       ▼                                              ▼
 세션 진행 → 완료                   세션 관리 + 수수료 정산
       │
       ▼
 리뷰·평점 작성
```

## 2. 회원 → 코치 전환 진입점

### 2.1 Settings 역할 전환 (기존)

- URL: `/settings` → "역할 전환" 섹션
- 4종 (personal / recruiter / company / coach)
- coach 클릭 → `/coach/profile` 자동 이동

### 2.2 "나도 코치 되기" CTA (★ 이번 추가)

- CoachesPage (`/coaches`) 상단 **헤더 버튼** + **안내 배너** 둘 다 노출
- 비 코치 사용자가 코치 목록 탐색 중 전환 유도
- "15% 수수료 · 업계 최저" 명시
- 클릭 → `/coach/profile`

### 2.3 기획 제안

- HomePage 히어로 섹션에도 "전문가로 활동하기" 추가 가능 (향후)
- "이 분야 코치 더 필요" 같은 지능형 제안은 Phase 2

## 3. 코치 프로필 등록 (`/coach/profile`)

### 3.1 입력 필드

| 필드           | 형식    | 검증                      | 필수                |
| -------------- | ------- | ------------------------- | ------------------- |
| specialty      | string  | 2-100자                   | ✅                  |
| hourlyRate     | int     | 0 - 10,000,000원          | ✅                  |
| yearsExp       | int     | 0 - 80년                  | ✅                  |
| bio            | string  | ≤ 2000자                  | 선택                |
| languages      | string  | ≤ 200자 (`"ko, en"` 콤마) | 선택                |
| availableHours | string  | ≤ 500자 (자유 기술)       | 선택                |
| isActive       | boolean |                           | 선택 (default true) |

### 3.2 서버 처리

```ts
// coaching.service.ts
async upsertCoachProfile(userId, data) {
  // 1. User.userType = 'coach' 승격
  await prisma.user.update({ where: { id: userId }, data: { userType: 'coach' } });
  // 2. CoachProfile upsert
  return prisma.coachProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}
```

### 3.3 Phase 1 한계 (심사 없음)

- 누구나 즉시 활성 코치로 등록 가능
- 악용 방지: 첫 세션에서 클라이언트 신고 시 관리자가 차단
- Phase 2: 관리자 심사 탭 (`USER_ROLE_POLICY.md` § 3.3)

## 4. 매칭 (코치 찾기)

### 4.1 목록 필터 (`CoachesPage`)

- `specialty`, `minRate`, `maxRate` 서버 쿼리
- 정렬: `avgRating desc` (기본), `hourlyRate asc/desc`
- 카드 UI: 아바타, 이름, 분야 칩, 시급, 평균 평점

### 4.2 상세 페이지 (`CoachDetailPage`)

- 코치 프로필 헤더 + bio + 리뷰 리스트
- 우측 sticky 예약 폼:
  1. 일정 (datetime-local, 미래만)
  2. 세션 시간 (15~240분)
  3. 요청사항 (≤ 1000자)
  4. **공유할 이력서** ★ NEW — `select` 드롭다운에서 내 이력서 선택 (선택)
  5. 가격 미리보기: 기본 + 15% 수수료 = 총
- POST `/api/coaching/sessions` → `status: 'requested'`

### 4.3 이력서 공유 (★ 이번 추가)

- `CoachingSession.resumeId` 필드에 저장
- 서버 검증: `resume.userId === clientId` 일치해야 함 (권한 상승 방지)
- 코치 측에서 `ResumesService.findOne()` 호출 시 **세션 연결된 코치면 private 이력서도 열람 허용** (`isCoachOfResumeSession` 헬퍼)
- 세션 status in `[requested, confirmed, completed]` 일 때만 허용 — cancelled/refunded는 즉시 차단

### 4.4 매칭 알고리즘 (향후 고도화)

현재는 단순 리스트. 개선안:

- 이력서 키워드 × 코치 specialty TF-IDF
- 경력 연차 매칭 (신입 → 주니어 코치)
- 리뷰 평점 가중
- 응답률 / 활동성 지표

## 5. 상태 전이 (CoachingSession.status)

| 상태      | 트리거                   | 부작용                            |
| --------- | ------------------------ | --------------------------------- |
| requested | 클라이언트 예약 시       | 코치에게 알림                     |
| confirmed | 코치 수락                | 클라이언트 알림, 이력서 공유 활성 |
| completed | 세션 종료 후 코치가 표시 | 리뷰 작성 가능                    |
| cancelled | 양쪽 어느쪽이든 취소     | 이력서 공유 즉시 차단             |
| refunded  | 환불 처리                | 수수료 반환                       |

### 상태 전이 정책

- `requested → confirmed` : 코치만
- `confirmed → completed` : 코치만 (세션 날짜 이후)
- `any → cancelled` : 양쪽 (단, 24h 이내면 환불 정책 적용 — 현재 베타)
- `completed → refunded` : 관리자만 (분쟁 해결)

## 6. 수수료 정산 (Phase 1 계산만)

```ts
totalPrice = Math.round((hourlyRate * duration) / 60);
commission = Math.round(totalPrice * 0.15); // 15%
coachEarn = totalPrice - commission;
```

실제 이체·정산은 **베타** — PG 연동 후 활성화 예정.

## 7. 이번 사이클 추가 사항 요약

- ✅ CoachesPage 상단 **헤더 버튼** "🎓 나도 코치 되기"
- ✅ CoachesPage **안내 배너** (15% 수수료 업계 최저 강조)
- ✅ CoachDetailPage 예약 폼에 **이력서 공유 드롭다운**
- ✅ `bookingSchema`에 `resumeId` 옵션 추가
- ✅ `bookCoachingSession()` API 클라이언트 타입에 `resumeId` 추가
- ✅ 서버: 이미 `CoachingSession.resumeId` 컬럼 + 검증 로직 완비 (이전 사이클)
- ✅ 서버: `ResumesService.findOne()`에서 연결 코치 열람 허용 (이전 사이클)

## 8. 다음 단계 (권장)

| 우선 | 항목                                | 규모 |
| ---- | ----------------------------------- | ---- |
| P1   | 코치 프로필 완성도 바 (% 표시)      | S    |
| P1   | 세션 상세 페이지에 공유 이력서 링크 | S    |
| P2   | 코치별 평균 응답 시간 표시          | M    |
| P2   | 관리자 코치 심사 탭                 | M    |
| P3   | 매칭 알고리즘 (TF-IDF)              | L    |
| P3   | 실제 PG 결제·정산 연동              | L    |
