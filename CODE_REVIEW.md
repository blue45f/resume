# Code Review — resume-platform (2026-05-21)

격리된 worktree 에서 리뷰. server / client / shared / schema 4영역을 빠르게 훑은 결과를 P1/P2/P3 로 분류했다.

---

## P1 (critical / security / data loss)

### P1-1. `StudyGroupsService.likePost` — 멤버 가드 부재 + 좋아요 무제한 증가

`packages/server/src/study-groups/study-groups.service.ts:615-623`

`likePost` 는 `assertMemberOrPublic` 만 검증하지만 같은 사용자가 N번 호출하면 `likeCount` 가 무한 증가한다 (community 의 `toggleLike` 와 달리 idempotent X). 봇/장난 한 명이 좋아요 인플레이션 가능. 별도 like 테이블 없으면 최소 throttle / 24h 1회 (Redis 없을 경우 in-memory LRU) 가드 필요.

### P1-2. `StudyGroupsService.upvoteQuestion` — 동일 사용자 중복 추천 무제한

`packages/server/src/study-groups/study-groups.service.ts:673-690`

코멘트도 "중복 방지는 향후 별도 테이블 추가 시 정밀화" 라고 적혀 있음. 같은 user 가 questionId 에 N번 POST 가능. `StudyGroupQuestionVote` 테이블 추가 필요.

### P1-3. `StudyGroupsService.addQuestion` — XSS / 길이 제한 부재

`packages/server/src/study-groups/study-groups.service.ts:272-303`

`question` / `sampleAnswer` 길이 검증이 없음 (DB 가 String 무제한). 거대한 페이로드 → DB 비용 증가. 다른 곳은 `slice(0, N)` 적용되어 있는데 여기는 누락. `forbiddenWords` 검증도 없음.

### P1-4. `BillingService.mockCheckout` — 멱등성 부재

`packages/server/src/billing/billing.controller.ts:60-82` + `billing.service.ts:105-157`

mockCheckout 이 같은 사용자가 7일 trial 을 N번 호출하면 매번 새 subscription 을 만들고 plan 을 갱신함. trial 횟수 제한이 없어서 무한 갱신 가능. 사용자당 `manual / trial` 1회 enforce 필요. 사용자가 `pro` 일 때 `pro` checkout 보내면 새 sub 가 또 만들어짐.

### P1-5. `PaymentResultPage` 성공 판정 신뢰 못함

`packages/client/src/pages/PaymentResultPage.tsx:8`

`success = !params.has('fail')` — 클라이언트가 URL 만 보고 성공/실패를 판정. 서버 verify 없이 "프로 플랜이 활성화되었습니다" 라고 사용자에게 알린다. Mock 단계라 OK 이지만 실제 PG 연동 시 SSRF + 사용자 영수증 위조 위험. `paymentKey` / `orderId` 를 서버 `verifyPayment` 로 전달해야 함.

### P1-6. `community.service.getPost` — view count race + 미발견 시 viewCount 증가

`packages/server/src/community/community.service.ts:148-178`

존재하지 않는 id 에 대해서도 `prisma.communityPost.update` 가 먼저 실행됨 → 404 발생 (P2007). 또한 viewCount 증가 후 findUnique 가 별도 트랜잭션이라 race condition. 같은 user 의 짧은 시간 반복 호출도 조회수 부풀림.

---

## P2 (중요 — 정합성 / 사용성)

### P2-1. `StudyGroupQuestion` 답변 모델 부재

`packages/server/prisma/schema.prisma:1231-1247`

CLAUDE.md `다음 사이클 후보` 에 명시. 현재 sampleAnswer 가 1개만 — 멤버들이 답변을 비교/공유할 수 없음. `StudyGroupQuestionAnswer` 별도 테이블 + nested replies + upvote 필요.

### P2-2. `StudyGroupQuestion.upvotes` 처럼 `CommunityPost.likeCount` 도 dual write 정합성 위험

`community.service.ts:240-275`

`communityLike.delete` 후 `communityPost.update({ likeCount: { decrement: 1 } })` 가 2개 별도 쿼리. 실패 시 정합성 깨짐 (likeCount = real count - 1). `$transaction` 으로 감싸야 함.

### P2-3. `StudyGroupsService.findAll` openOnly 가 페이지 정확성 깨뜨림

`study-groups.service.ts:124-126`

DB 에서 `take: limit` 뒤에 in-memory `filter` 하면 페이지 응답에 표시되는 아이템 수가 limit 보다 작아짐 — pagination 깨짐. PG raw SQL (`memberCount < maxMembers`) 사용해서 DB-level 필터링하거나 Prisma 7 의 `where: { memberCount: { lt: prisma.studyGroup.fields.maxMembers } }` 사용.

### P2-4. `HttpExceptionFilter` 가 streaming 응답 abort 시 finalize 안함

`packages/server/src/common/filters/http-exception.filter.ts:54-57`

`headersSent` 가드는 있지만 `response.writableEnded` 체크는 없음. SSE / streaming chunked 응답 중간에 client abort 시 `res.end()` 호출 안되면 socket leak. 또한 `request.aborted` 케이스도 별도 로그 분리 필요.

### P2-5. `StudyGroupDetailPage` 가 멤버가 아닌 사용자에게도 게시판 컴포넌트는 안 보이지만 group.members 가 비어 있을 가능성에 대해 방어 안 됨

`packages/client/src/pages/StudyGroupDetailPage.tsx:106`

`group.members?.some` — 만약 server 가 members 를 빈 배열로 반환하면 (멤버 0명 그룹) join 후에도 `isMember` 가 false 로 계산되어 게시판이 안 보일 수 있음. group fetch 캐시 invalidate 누락 케이스 방어 필요. (실제로 join 후 invalidateQueries 호출은 있음, 그러나 race 가능)

### P2-6. `BillingService.checkQuota` — 사용량 측정 race

`billing.service.ts:254-277`

`countSinceMonthStart` 를 caller 가 측정 후 비교. 측정과 사용 사이 race (동시 요청 N개 → 모두 한도 미만으로 보임 → 모두 통과). atomic check-and-increment 필요 (postgres `RETURNING` 또는 unique constraint).

### P2-7. `community-service.toggleLike` 알림 — 같은 사람이 좋아요 토글 반복 시 알림 spam

`community.service.ts:260-273`

`likeCount` 가 정확히 10 의 배수일 때 알림. 같은 사용자가 like → unlike → like 반복하면 매번 알림 fire. like 알림은 별도 dedupe 필요 (예: 24h 내 같은 postId 알림은 1건).

### P2-8. `auth.service.ts` 토큰 만료 시간 / refresh 토큰 부재 (검토만)

`auth.service.ts` 전반

JWT 1개로 sliding session 없음. refresh token 미구현 — `feedback_testing` 무효화 어려움. 운영 진입 직전 P1.

### P2-9. shared 타입 일관성 — `StudyGroupPost.attachments` 가 `Json` 인데 클라이언트 타입은 `Array<{url,name,size,type}>` 강제. 서버는 길이/안전성 검증 없음.

`schema.prisma:1259` + `study-groups.service.ts:545-553`

`attachments: (data.attachments ?? []) as any` — 사용자가 임의 JSON 을 보내면 통과. URL 형식·길이 검증 없음. SSRF / XSS 위험.

### P2-10. 다국어 (zh-CN / vi) 미지원

`packages/client/src/lib/i18n.ts:1`

CLAUDE.md `다음 사이클 후보` 에 명시. 글로벌 진출 차단 요인.

---

## P3 (polish / DX)

### P3-1. `StudyGroupsController` `@Throttle` 누락

컨트롤러 어디에도 throttle 가드 없음. spam 가드는 service 내부에서만. POST 류 모두 `@Throttle` 적용 권장.

### P3-2. `Notification.type` 가 free-form string 인데 클라이언트는 hardcode switch

`schema.prisma:663-675` + `NotificationBell`

`type` 이 enum 이 아니라 새 알림 추가 시 클라 누락 위험. shared/notification-types.ts 의 중앙화 필요.

### P3-3. `prisma/schema` 의 일부 인덱스 누락

- `StudyGroupQuestion.upvotes` desc 정렬에 index 없음 → 큰 그룹 listQuestions sort=upvotes 시 full scan.
- `CommunityPost.createdAt` index 없음 (recent sort + pinFirst).
- `Notification.createdAt` index 없음.

### P3-4. `pages/PaymentPage.tsx:167` — `hover:from-blue-700 hover:to-sky-700` 가 not gradient. typo / dead class.

### P3-5. `study-groups.service.ts:557 normalizeTags` 가 한국어 태그를 `slice(0,30)` 으로 강제 자름 — 유니코드 grapheme 인식 안하면 깨진 자모 가능. Intl.Segmenter 사용 권장 (Node 16+).

### P3-6. `BillingService.PLANS` 의 `pro.priceYearlyKRW = 99000` 주석 "약 17% 할인" 인데 실제는 9900\*12=118800 → 16.7% 할인. OK 지만 명시.

### P3-7. `CoffeeChat.rate-limit` 가 hardcoded — system config 로 옮겨서 admin 이 토글 가능하게.

### P3-8. 클라이언트 `i18n` 의 `currentLocale` 가 모듈 로드 시 한번 계산되어 setLocale 후 `window.reload()` 강제. SPA 라 reload 비용. React Context 로 옮기는 게 이상적이나 큰 작업.

---

## 상위 10개 요약 (각 1줄)

1. **P1-1**: `likePost` 무제한 증가 — like 토글 / per-user dedupe 필요
2. **P1-2**: `upvoteQuestion` 중복 추천 — vote 테이블 필요
3. **P1-3**: `addQuestion` 길이/forbidden words 검증 누락
4. **P1-4**: `mockCheckout` 멱등성 — trial 무한 갱신 가능
5. **P1-5**: `PaymentResultPage` 가 서버 verify 없이 성공 표시
6. **P1-6**: `getPost` 가 없는 글에도 viewCount 갱신 + race
7. **P2-1**: `StudyGroupQuestionAnswer` 모델 누락 — CLAUDE.md 후보
8. **P2-2**: `community toggleLike` dual write 정합성
9. **P2-3**: `findAll openOnly` pagination 깨짐
10. **P2-10**: zh-CN / vi locale 누락 — 글로벌 진출 차단

---

## 구현 계획 (이번 사이클)

1. **P2-1 (S)**: `StudyGroupQuestionAnswer` 모델 + migration + endpoints + 클라이언트 UI + tests
2. **P1-2 / P2-1 결합**: `StudyGroupQuestionVote` 테이블로 upvote 중복 방지
3. **P1-3**: addQuestion 길이/forbiddenWords 검증
4. **P1-4**: mockCheckout 멱등성 (사용자당 trial 1회 enforce)
5. **P2-4**: GlobalExceptionFilter 에 streaming / abort 가드
6. **P2-10**: zh-CN locale 베이스 추가
