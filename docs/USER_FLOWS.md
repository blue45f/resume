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

- **구직자 flow — 면접 준비 → 답변 분석 → 시간별 추세**: AI 답변 분석 결과 저장/시각화 없음
- **회사 flow — 지원자 → 메시지 send**: applicants list 에서 SendMessageButton 있지만 응답 pipeline 정리 부족
- **모바일 — `/coffee-chats/:id/room` WebRTC 통화**: 가로/세로 회전 시 video 비율, 마이크 권한 거부 시 fallback
- **공유 flow — selective 화이트리스트 user search**: 현재 username 입력 only, autocomplete 없음
- **코치 flow — 세션 완료 후 review 요청 알림**: 자동 알림 없이 사용자가 직접 평점 매겨야
