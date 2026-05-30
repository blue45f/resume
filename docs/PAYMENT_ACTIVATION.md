# 결제(Pro) 프로덕션 활성화 가이드

> 이력서공방 결제 인프라는 **베타 기준 사실상 완성** 상태입니다. 이 문서는 실제 유료 결제를
> 켜기 위해 남은 단계만 정리합니다. 모든 단계는 **운영자의 PG 가맹점 자격증명과 샌드박스
> 검증**을 필요로 하므로, 코드 자동화 대상이 아니라 운영 결정 사항입니다.

## 이미 구축된 것 (코드 완료)

| 영역                         | 위치                                                                                    | 상태                                              |
| ---------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Toss Payments 클라이언트 SDK | `packages/client/src/lib/payment.ts` (`requestPayment`)                                 | ✅ 카드 결제 요청 + success/fail 리다이렉트 wired |
| 결제 페이지                  | `PaymentPage.tsx` (월/연 선택, 약관 동의, 베타 안내)                                    | ✅                                                |
| 결제 결과 페이지             | `PaymentResultPage.tsx` (`/payment/success`·`/payment/fail`)                            | ✅ 서버 신뢰원 검증 사용                          |
| 플랜 정의                    | `lib/plans.ts` (`PLANS`/`RECRUITER_PLANS`, free/pro/enterprise — 서버 정렬됨)           | ✅                                                |
| 기능 게이팅                  | `FeatureGate.tsx` + `canAccess`/`isMonetizationEnabled`                                 | ✅                                                |
| 백엔드 billing               | `server/src/billing/` (controller·service·module, `Subscription`·`Payment` Prisma 모델) | ✅ mock checkout·구독·검증·취소·admin grant       |
| 서버 신뢰원 검증             | `billing.service.ts > verifyRecentPayment`                                              | ✅ URL 위조 방지(클라가 아닌 서버가 성공 판정)    |
| 테스트                       | `billing.service.spec.ts`                                                               | ✅                                                |

기본값은 **Toss 테스트 키**(`payment.ts`의 `test_ck_...` 폴백)라, 샌드박스 모드로 흐름 자체는 동작합니다. `PaymentPage`의 "결제 연동 준비 중" 안내는 의도적으로 보수적인 문구이며, 실 결제를 켜기 전까지 유지하세요(사용자에게 과금되지 않음을 명시).

## 프로덕션 활성화 체크리스트

### 0. 클라↔서버 plan 모델 통일 — ✅ 시커 정렬 완료 (commit b187c5f·eb329c4)

과거 클라(`free/standard/premium`)와 서버(`free/pro/enterprise`)의 plan vocab 불일치로, 서버가
`user.plan='pro'` 저장 시 클라 `getPlan('pro')`이 `free`로 폴백 → 유료/trial 사용자가 무료로
게이팅되고 `mockCheckout`(plan='standard')이 서버에 거부되던 버그가 있었음.

**조치 완료(서버 기준 통일)**: 클라 `plans.ts`를 `free/pro/enterprise` + 서버 가격(pro 9900/99000,
enterprise 49000/490000)으로 정렬, 소비처(PaymentPage·SettingsPage) 갱신, `plans.test.ts` 회귀 가드
추가, cross-package `common/plans.spec.ts` 갱신. `user.plan`은 이미 서버 vocab이라 **DB
마이그레이션 불필요**. → 게이팅·mockCheckout 정상화.

**남은 항목**:

- **리쿠르터 차등 가격**: 클라 `RECRUITER_PLANS`는 19900/49900 표시이나 서버 billing은 단일
  카탈로그(9900/49000)만 charge. 리쿠르터 차등 과금이 필요하면 서버 billing에 리쿠르터 카탈로그
  추가가 선행되어야 함(현재는 게이팅 ID만 정렬됨).
- 아래 step 1~4(Toss 키·confirm 엔드포인트)는 그대로 유효.

검증: 통일 후 `mockCheckout`(trial)로 plan 부여 → 클라에서 해당 유료 기능 게이팅이 실제로 풀리는지 확인.

### 0.1 유료 한도·기능 게이트의 서버 enforcement ⚠️ 모네타이제이션 선행 (보안 감사 발견)

**현황**: 클라의 plan은 `getUser().plan`(로그인 시 localStorage 저장) → `getPlan()`으로 features 해석.
즉 **클라 plan은 신뢰 불가**(사용자가 localStorage를 `enterprise`로 위조 가능). 현재 무료 베타에서는
무해하나, 결제 활성화 후에는 다음 게이트가 **클라이언트 전용이라 우회 가능**:

- **이력서 개수 한도** — `NewResumePage.tsx`의 `atLimit`(`plan.features.maxResumes` 비교)은 클라
  계산. 서버 `resumes.create`에 plan별 개수 상한 검증이 없으면 위조 plan으로 무제한 생성 가능.
- **프리미엄 템플릿/테마** — `PreviewPage`의 프리미엄 잠금은 클라 표시만. 서버 렌더·내보내기 경로에
  plan 검증이 없으면 잠긴 템플릿 사용 가능.

**성격**: 데이터 유출/권한 상승이 아닌 **매출(revenue) 우회**. AI quota(`checkQuota`)와 admin 기능은
이미 서버에서 검증되므로 보안 침해 경로는 아님. 따라서 **무료 베타 동안은 의도적으로 미강제**하고,
하드 enforcement는 결제 활성화와 함께 처리(제품/매출 결정).

**활성화 시 조치**: 서버를 단일 신뢰원으로 — `resumes.create`에 `user.plan` 기반 개수 상한(서버
`PLANS[plan].maxResumes`) 검증 추가, 프리미엄 템플릿은 서버 렌더/내보내기에서 plan 검증. 클라
게이팅은 UX 힌트로 유지하되 **한도는 서버가 최종 판정**. (cf. `## 보안 체크포인트`)

### 1. Toss Payments 가맹점 가입 + 실 키 발급

- https://www.tosspayments.com 가맹점 등록 → **클라이언트 키(live `ck_...`)** + **시크릿 키(live `sk_...`)** 발급.

### 2. 환경변수 설정

- **Vercel(클라이언트)**: `VITE_TOSS_CLIENT_KEY = <live ck>`
- **Cloud Run(서버)**: `TOSS_SECRET_KEY = <live sk>` — `--update-env-vars` 또는 `--env-vars-file` 사용(`--set-env-vars` 금지, 기존 16개 env 보존).

### 3. 서버 결제 확정(confirm) 엔드포인트 구현 ⚠️ 금전 핵심

> 이 스펙은 초안 confirm 엔드포인트를 **5개 렌즈 적대적 검증**(금액변조·멱등/race·Toss계약·인가/소유권·실패상태)으로
> 감사해 도출한 요건입니다. 검증 결과 critical 4 / high 6 결함이 확인돼, **아래 요건을 모두 충족하기 전에는 confirm을
> 활성화(TOSS_SECRET_KEY 설정)하면 안 됩니다.** 초안은 금액 검증만 견고했고(amount-tampering 렌즈 통과), 나머지가 미흡했음.

기본 호출:

```
POST https://api.tosspayments.com/v1/payments/confirm
Authorization: Basic base64(`${TOSS_SECRET_KEY}:`)   // 콜론 뒤 비밀번호 공란
Body: { paymentKey, orderId, amount }
```

**(C-1) 주문 사전 등록 + 소유권 바인딩 [critical · 스키마 마이그레이션 필요]**
클라가 `orderId`를 생성해 그대로 confirm에 보내므로, 서버에 사전 등록이 없으면 **타 사용자의 paymentKey/orderId를
탈취해 자기 계정에 구독을 얻는 cross-user hijacking**이 가능. 결제 요청 전 서버가 주문을 생성해야 함:

- `CheckoutSession` 모델 신설: `{ id, userId, orderId @unique, plan, period, amount, status('pending'|'confirmed'), expiresAt }`.
- 신규 `POST /billing/checkout-session` (인증) → orderId 발급 + userId/plan/period/amount 바인딩. 클라 `requestPayment`는 이 orderId를 사용.
- confirm 시: `CheckoutSession(orderId, userId=req.user.id, status='pending', expiresAt>now)` 조회 → 없으면 `Forbidden`. amount/plan/period는 **세션 값**으로 검증(클라 입력 신뢰 금지).

**(C-2) 멱등성 + race 차단 [critical · 스키마 마이그레이션 필요]**
`findFirst → grant`가 비원자적이라 동일 orderId 동시 2회 시 이중 구독/결제. →

- `Payment`에 `@@unique([provider, externalId])` 추가(externalId=orderId). 두 번째 insert가 unique violation → 자동 멱등.
- confirm 전체를 `prisma.$transaction`으로 감싸 grant+record 원자화. 동일 paymentKey가 다른 orderId로 재전송되는 경우도 차단(paymentKey도 unique 고려).

**(C-3) 트랜잭션 + 실패 보상 [critical]**
Toss 승인(DONE) 후 `grantPlan`/`recordPayment`가 try 밖이라, 중간 DB 실패 시 **사용자는 과금됐는데 구독/기록 없음**(데이터 손실).

- Toss 승인 성공 후의 grant+record를 한 트랜잭션으로. 실패 시: `Payment(status='failed', description='post-approval failure')` 기록 + `logger.error(수동 정합성 필요)` + (가능하면) Toss 취소 API 호출로 보상.

**(H) Toss 응답 계약 견고화 [high]**

- `status`가 정확히 `'DONE'`인지(그 외 `CANCELED`/`ABORTED`/`WAITING_FOR_DEPOSIT` 등 분기·미부여).
- `totalAmount` 타입 검증(숫자 강제) 후 `=== amount` 비교(문자열 응답 대비).
- `res.json()` 파싱 자체를 try/catch로 감싸 네트워크/파싱 실패를 명확히 구분·로깅.

**(공통, 검증 통과한 부분 유지)** 클라 `amount` == 서버 `PLANS[plan][priceMonthlyKRW|priceYearlyKRW]` 대조는 견고하므로 유지하되, **세션 값과 이중 대조**.

> 초안 구현(미커밋)은 위 critical 미충족으로 머지하지 않음. 활성화 시 이 스펙대로 구현 + Toss 샌드박스 검증 필수.

### 4. 결과 페이지 연결

- `PaymentResultPage`에서 Toss success 리다이렉트의 `paymentKey`·`orderId`·`amount`를 위 confirm 엔드포인트로 전달하도록 연결(현재는 `verifyRecentPayment`만 호출).

### 5. 모네타이제이션 토글

- `isMonetizationEnabled()`는 기본 true(명시적 `setMonetizationEnabled(false)` 시에만 off). 게이팅을 실제로 적용하려면 이 상태가 true인지 확인하고, `PaymentPage`의 베타 안내 문구를 실 결제용으로 교체.

### 6. 샌드박스 → 라이브 순서

1. Toss **테스트 키**로 end-to-end(요청 → confirm → 구독 활성 → 게이팅 해제) 검증.
2. 환불/취소(`POST /billing/me/cancel`) 동작 확인.
3. 라이브 키로 전환 후 소액 실결제 1건으로 최종 확인.

### 7. (권장) 웹훅 리컨실

- Toss 웹훅 수신 엔드포인트 추가 → 비동기 결제 상태 변화(가상계좌 입금 등) 반영. 카드 단건 결제만 쓸 경우 후순위.

### 8. trial 멱등성 경합 (비크리티컬 — 활성화 시 정리)

- `startTrial`(billing.service.ts)의 "사용자당 trial 1회" 검사는 _check-then-act_ 라, 동시 2요청이
  레이스로 통과해 `provider:'manual'` 구독이 2건 생성될 수 있다(보안 감사 R2, medium). 단 **활성
  sub 는 1건·금액 $0·향후 trial 은 여전히 차단**이라 매출/권한 영향은 없다(cosmetic).
- 활성화 시 조치: 실 PG 연동에서 이 흐름은 `subscription.provider==='toss'` 분기로 교체될 예정이므로,
  그때 `checkQuotaAtomic` 가 쓰는 `pg_advisory_xact_lock` 패턴으로 per-user 직렬화하거나
  `(userId, provider='manual')` 부분 unique 인덱스를 추가해 데이터 레이어에서 멱등성을 보장한다.

## 보안 체크포인트

- 성공/실패는 **서버 신뢰원**으로만 판정(이미 `verifyRecentPayment` 패턴 적용).
- 금액 검증은 반드시 서버에서 PG 승인 금액과 대조.
- 시크릿 키는 서버 env에만(클라 번들 금지). 클라이언트 키만 `VITE_` 노출.
- confirm 멱등성으로 중복 과금/중복 구독 방지.
- 유료 한도(이력서 개수)·프리미엄 템플릿은 **서버에서 최종 판정**(클라 plan은 localStorage 신뢰
  불가). 상세 §0.1.

## 롤백

- 문제 발생 시 `setMonetizationEnabled(false)` 또는 env로 게이팅 해제 → 전 기능 무료(베타 상태)로 즉시 복귀.

---

작성: 2026-05-30 · 코드 인프라는 완료, 위 단계는 운영자의 PG 자격증명·샌드박스 검증을 요함.
