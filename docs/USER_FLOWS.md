# User Flows — 자율 routine 누적 audit log

매시간 routine이 1 유형 1 flow를 audit 하면서 발견한 끊긴 곳 / UX 부족 / 수정 내역 누적.

## 2026-04-27 (자율 sweep, 코치 + 리쿠르터 + 회사 + 구직자/auth)

### Coach flow — 받은 커피챗 가시성

**Audit**: 코치 대시보드(`/coach/dashboard`)에 들어가도 pending 커피챗 신청은 어디서도 안 보임. 알림 bell 만이 유일한 entry. 별도 `/coffee-chats` 페이지에 가야만 응답 가능.

**Fix** (`589c58c`): CoachDashboardPage 상단에 ☕ 받은 커피챗 신청 섹션 추가. fetchCoffeeChats('received', 'pending') 결과를 즉시 노출, 신청자/주제/메시지/모달리티 + 응답하기 CTA → /coffee-chats 이동.

### Recruiter flow — 첫 공고 없을 때 0/0/0/0 빈 상태

**Audit**: 브랜드뉴 리쿠르터가 `/recruiter` 진입 시 stats 모두 0, pipeline 4개 column "비어 있음", recommended/applicants 모두 empty. 빠른 작업 row만 있어 다음 step이 불명확.

**Fix** (`bb17b44`): jobs.length === 0 일 때만 sky-900 hero — 공고 등록 → 추천 인재 매칭 → 스카우트 3-step 카드. 이미 공고 있는 recruiter에는 노출 안 함.

### Company / 공고 owner flow — owner-only 액션 부재

**Audit**: 자기가 등록한 공고 detail page에서도 일반 사용자와 동일한 CTA만 (지원 추가 / 복사 / 자소서 / 회사 정보) — 정작 owner가 가장 필요한 "지원자 보기"와 "공고 마감"이 없음. 공고 등록 직후 일반 jobs.list 로 떨궈서 본인 공고가 어디 있는지 못 찾음.

**Fix** (`cea48a9`):

1. JobDetailPanel에 currentUserId prop 추가, isOwner 분기로 owner-only row (📋 지원자 보기 / 🔒 마감·재개 toggle)
2. JobPostPage onSubmit: createJob 응답 id로 jobs.detail(id) 이동 (없으면 recruiter dashboard fallback)
3. CompanyPage:621 잔존 text-violet-700 → text-sky-700 (purple 금지 위반)

### Personal/Auth flow — userType 무시한 단일 redirect + 분석 결과 dead-end

**Audit**:

1. LoginPage performAuth가 모든 userType에 대해 ROUTES.home으로 navigate. 코치/리쿠르터가 가입 직후 본인 dashboard 아닌 일반 home에 떨어짐.
2. AiAnalysisPanel feedback 분석 결과 보고나면 "다시 분석하기" 버튼만 있음. 분석 결과를 바탕으로 다음 행동(공유/코칭/자소서)에 진입할 수 없음.

**Fix** (`a44a87c`):

1. LoginPage performAuth: ?next= URL → coach → /coach/dashboard → recruiter/company → /recruiter → personal → home 순서로 분기.
2. AiAnalysisPanel feedback 결과 하단에 "📋 미리보기 / ☕ 코치 받기 / 📝 자소서 작성" 3-CTA row, onClick 시 panel 닫고 해당 페이지로 이동.

## 다음 turn 후보 (audit 안 된 영역)

(2026-04-27 sweep#2 — 5개 후보 한꺼번에 처리)

### 구직자 — 면접 답변 분석 저장 + 시간별 점수 추세

**Audit**: `analyzeAnswer` LLM endpoint 는 있었으나 결과를 저장하지 않아 사용자가 자기 점수 추세를 볼 수 없었음. heuristic analyzer / LLM analyzer 모두 client 에서 호출되는 곳이 없었음.

**Fix**:

- Schema: InterviewAnswer 에 `analysisScore`/`analysisJson`/`analyzedAt` 컬럼 + `[userId, createdAt]` index 추가 (migration `20260428000000_add_interview_analysis`)
- `POST /api/interview/answers/analyze` body 에 `save?: boolean` 옵션 추가, true 시 자동 row 저장
- 신규 endpoint `GET /api/interview/answers/history/scores` — 최근 90일 분석 점수 timeseries
- `<InterviewScoreHistory>` 컴포넌트 신규 — InterviewPrepPage 상단에 mini bar chart (점수별 색: emerald/sky/amber/rose). 데이터 없으면 hide.
- client: `analyzeInterviewAnswer` / `fetchInterviewScoreHistory` API wrapper

### 코치 — 세션 완료 직후 review 요청 알림

**Audit**: `updateStatus(completed)` 는 코치의 `totalSessions` 만 증가시키고 클라이언트에게 평점 요청을 알리지 않음. 클라이언트가 자발적으로 세션 페이지에 들어가서 평점을 매겨야 했음.

**Fix**:

- `CoachingService` 에 `NotificationsService` 주입
- 상태 → `completed` 전이 시 클라이언트에게 `coaching_review_request` 알림 발송, link `/coaching/sessions?focus=:id`
- 이미 `rating != null` 인 세션에는 발송 skip (refunded → completed 같은 edge case 방지)
- NotificationBell + NotificationsPage 에 `coaching_review_request` (⭐ yellow) 매핑 + system filter 분류

### 공유 — selective 화이트리스트 사용자 autocomplete

**Audit**: AllowedViewersDialog 에서 username/email 정확히 알고 있어야 추가 가능. 검색 기능 없어서 사용자가 어색한 마찰 경험.

**Fix**:

- Server: `GET /api/auth/users/search?q=` 신규 endpoint (≥2자, 자기 자신 제외, 최대 10건, 30 req/min throttle, email 부분 마스킹 `u***@domain`)
- Client: `searchUsers` API wrapper + `UserSearchResult` 타입
- AllowedViewersDialog input 에 디바운스 220ms autocomplete dropdown — 아바타/이름/@username/email/userType 노출, mouseDown 으로 즉시 선택 시 userId 직접 전달

### 모바일 — WebRTC 권한 거부 / 디바이스 없음 fallback + PiP layout

**Audit**: getUserMedia 실패 시 generic error 만 표시, 사용자는 무엇을 해야 할지 모름. 데스크톱 grid 가 모바일에서 두 비디오 stacked 로 보여 가독성 떨어짐. 한번 failed 후 재시도 불가.

**Fix**:

- `useWebrtcPeer` getUserMedia 실패 분류:
  - `NotAllowedError` → "브라우저 자물쇠 → 사이트 설정 → 마이크/카메라 허용 후 다시 시도"
  - `NotFoundError` → "장치를 찾을 수 없어요"
  - `NotReadableError` → "다른 앱이 사용 중이에요"
- 비디오 constraint: `width: 640` 고정 → `ideal: 1280` + facingMode user 로 변경 (모바일 회전 호환)
- `start()` guard 를 `state !== 'idle' && state !== 'failed'` 로 완화 → 재시도 가능
- CoffeeChatRoomPage: error 박스에 "다시 시도" 버튼 + 비디오 레이아웃을 remote 풀폭 + local PiP (모바일 우측 하단 28x20) 로 변경

### 회사 — 지원자 / 추천 후보 / pipeline 서버 미구현 (deferred)

**Audit**: RecruiterDashboardPage 가 호출하는 `/api/jobs/applicants`, `/api/jobs/pipeline`, `/api/jobs/recommended-candidates` 가 server 에 존재하지 않음. authedFetch fallback 으로 [] 반환되어 빈 dashboard 처럼 보임. JobApplication 모델은 구직자 자기 기록용이라 recruiter 발신 적용 안 됨. 이 기능 풀 구현은 model/endpoint/UI 다 만들어야 해서 별도 사이클 필요. 현재는 노트만 추가, 다음 sweep 에서 처리.

## 2026-04-27 sweep #3 — 4개 후보 전부 처리, 1개 deferred

### 회사 — recruiter-side applicant pipeline (서버 + UI 풀구현)

**Audit**: RecruiterDashboardPage 가 `/api/jobs/applicants`, `/api/jobs/pipeline`, `/api/jobs/recommended-candidates` 호출했지만 endpoint 자체가 미구현. fallback 으로 [] 반환되어 빈 dashboard 처럼 보임. 또한 구직자가 `이력서로 즉시 지원` 해도 회사 dashboard 에는 surface 안 됨 (legacy JobApplication 은 본인 추적용).

**Fix**:

- 신규 model `JobPostApplication` (jobId/applicantId/resumeId/coverLetter/stage/recruiterNote, unique [jobId, applicantId] — 중복 지원 차단) + migration `20260428010000_add_job_post_application`
- 신규 endpoints:
  - `POST /api/jobs/:id/apply` — 구직자가 내부 공고 직접 지원 (10 req/min throttle, 본인 공고 차단, 마감 차단, 이력서 ownership 검증, 회사에 알림 자동)
  - `GET /api/jobs/applicants` — recruiter 가 내 모든 공고에 들어온 application
  - `GET /api/jobs/pipeline` — stage 별 (interested/contacted/interview/hired/rejected/withdrawn)
  - `PATCH /api/jobs/pipeline/:id` — stage 변경 (소유 공고만, 변경 시 지원자에게 알림 — interested/withdrawn 제외)
  - `GET /api/jobs/recommended-candidates` — 활성 공고 skills 합집합 + 공개 이력서 user 매칭, matchScore 정렬 top 12
  - `GET /api/jobs/my-applications` — 구직자가 지원한 내부 공고 목록
- QuickApplyModal 이 createApplication (legacy) + applyToJobPost (신규) 모두 호출 — 본인 추적 + 회사 dashboard surface 동시. 중복 지원은 silent
- NotificationBell + NotificationsPage 에 `job_application_received` (📥) / `job_application_stage` (📋) 매핑

### 구직자 — InterviewPrepPage mock interview → AI 깊이 분석 wiring

**Audit**: 지난 sweep 에서 LLM `/analyze` endpoint + score history 컴포넌트는 추가했으나 실제 호출하는 UI 가 없어 dead-code 였음.

**Fix**:

- InterviewPrepPage mock interview feedback 패널 하단에 `🤖 AI 깊이 분석` 버튼 추가, save=true 로 호출 → InterviewAnswer row 누적 → InterviewScoreHistory chart 데이터로 흐름 연결
- AI 분석 결과: 점수/강점/약점/개선/리라이트 답변 inline 표시, "리라이트 답변 적용" 버튼으로 mockAnswer 교체 가능

### 코치 — 새 리뷰/평점 받았을 때 코치에게 알림

**Audit**: 클라이언트가 평점/리뷰 작성 시 코치는 dashboard 를 직접 열어서만 확인 가능. 즉시 푸시 알림 없음.

**Fix**:

- `reviewSession` 처리 끝에 코치에게 `coaching_review_received` 알림 발송 — 평점/리뷰 snippet 60자 포함, link `/coach/dashboard`
- NotificationBell + NotificationsPage 에 매핑 추가

### 공유 — ShareResumeWithUserDialog autocomplete (skipped)

**Audit**: 이 dialog 는 항상 parent 가 targetUserId 를 prop 으로 넘겨 호출됨 (커피챗 응답, 코치 상세, 스카우트 reply 등). 사용자가 검색해서 골라야 하는 entry point 가 현재는 AllowedViewersDialog 뿐 (지난 sweep 에서 처리됨). ShareResumeWithUserDialog 에 검색 기능 추가는 별도 entry point (예: HomePage `이력서 공유` 버튼) 가 생긴 후에 처리하는 게 더 자연스러움.

**결정**: skip — 별도 entry point UX 가 정의되면 그때 적용.

### WebRTC TURN 서버 (skipped)

**Audit**: STUN-only 로 strict NAT 환경 통화 실패율 미상. TURN 서버는 자체 운영 (coturn) 또는 Twilio/Xirsys 같은 매니지드 서비스가 필요해 비용 발생.

**결정**: skip — 비용/성공률 trade-off 결정은 사용자 협의 필요. 운영 계측 (성공률 telemetry) 부터 먼저 추가하는 게 합리적.

## 2026-04-27 sweep #4 — 4개 추가 후보 처리, 1개 deferred

### WebRTC 통화 성공/실패 telemetry

**Audit**: STUN-only 환경의 통화 성공률 측정 데이터가 없어서 TURN 도입 결정 근거가 부족함. 통계 없이는 비용 정당화 어려움.

**Fix**:

- `POST /api/coffee-chats/signal/telemetry` 신규 endpoint (30 req/min, fire-and-forget)
- `recordPeerTelemetry` 가 구조화 JSON 로그 (`event: "webrtc_peer_state"`) 출력 → Cloud Logging jsonPayload 로 인식, DB 저장 X (cost-min)
- useWebrtcPeer: `connected`/`failed`/`disconnected` state 변화 + getUserMedia 실패 시 errorName 포함 telemetry 발송
- 향후 admin stats 에서 24h success rate 집계: `gcloud logging read "jsonPayload.event=webrtc_peer_state"` 로 조회

### 구직자 `/applications` 페이지 — 플랫폼 공고 지원 현황 노출

**Audit**: ApplicationsPage 는 legacy JobApplication (구직자 본인 추적용 — 외부 공고 + 본인 입력) 만 보여줌. 신규 pipeline 으로 들어온 JobPostApplication 의 stage 가 안 보여서 회사가 stage 변경해도 구직자는 모름.

**Fix**:

- `<MyPlatformApplications>` 컴포넌트 신규 — fetchMyJobApplications 로 받아서 stage 별 색 badge (interested/contacted/interview/hired/rejected/withdrawn) 표시
- ApplicationsPage 상단에 mount, 빈 데이터면 자동 hide

### CoachDashboardPage — 새 리뷰 알림 badge

**Audit**: 코치가 새 리뷰 받았을 때 notification 만 가고 dashboard 상의 시각적 단서 없음. 알림 클릭 안 한 코치는 `최근 리뷰` 섹션 새로고침해야 알아챔.

**Fix**:

- CoachDashboardPage 가 `/api/notifications` fetch → `coaching_review_received` 미읽음 count 계산
- "최근 리뷰" h2 옆에 `⭐ NEW {count}` animate-pulse badge 표시 (count > 0 일 때만)

### Recruiter applicants list — stage badge inline 표시

**Audit**: 최근 지원자 row 에 현재 stage 표시 없어서 recruiter 가 pipeline 섹션과 비교해서 봐야 함.

**Fix**:

- 각 applicant row 에 stage 별 색 mini badge (👀 검토 / 📞 연락 / 🗓 면접 / ✅ 채용 / ✗ 거절) 표시 inline

### JobApplicantsList resumeId hover preview (skipped)

**Audit**: 이력서 클릭 전 미니 preview 는 UX 개선이지만 추가 컴포넌트 + lazy fetch + tooltip 위치 계산 필요. 현재 "이력서" 클릭으로 새 탭 여는 게 충분히 빠름.

**결정**: skip — 다른 영역 먼저 정리되면 cosmetic 개선으로 추가.

## 다음 sweep 후보

- **TURN 서버 도입 (telemetry 데이터 누적 후 결정)** — 1주일 telemetry 수집 → fail rate 집계 → TURN 도입 ROI 계산
- **회사 dashboard 의 평균 응답 시간 / pipeline 단계별 conversion rate stats**
- **구직자 application withdrawn → 이유 입력 prompt** — 회사 측 데이터 분석용
- **InterviewScoreHistory 차트 점수 클릭 → 해당 답변 detail 모달** — 시간별 답변 비교
- **AllowedViewersDialog autocomplete 키보드 navigation (↑↓ Enter)** — 마우스 외 a11y
