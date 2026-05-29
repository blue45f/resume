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
| 플랜 정의                    | `lib/plans.ts` (`PLANS`/`RECRUITER_PLANS`, free/standard/premium)                       | ✅                                                |
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

### 1. Toss Payments 가맹점 가입 + 실 키 발급

- https://www.tosspayments.com 가맹점 등록 → **클라이언트 키(live `ck_...`)** + **시크릿 키(live `sk_...`)** 발급.

### 2. 환경변수 설정

- **Vercel(클라이언트)**: `VITE_TOSS_CLIENT_KEY = <live ck>`
- **Cloud Run(서버)**: `TOSS_SECRET_KEY = <live sk>` — `--update-env-vars` 또는 `--env-vars-file` 사용(`--set-env-vars` 금지, 기존 16개 env 보존).

### 3. 서버 결제 확정(confirm) 엔드포인트 구현 ⚠️ 금전 핵심

현재 `verifyRecentPayment`/checkout 은 mock 단계(최근 succeeded payment 매칭)입니다. 실 PG 연동 시
`billing.service.ts:292` 주석의 확장점대로 **Toss 결제 승인 API**를 호출해야 합니다:

```
POST https://api.tosspayments.com/v1/payments/confirm
Authorization: Basic base64(`${TOSS_SECRET_KEY}:`)   // 콜론 뒤 비밀번호 공란
Body: { paymentKey, orderId, amount }
```

구현 요건(보안 필수):

- 클라가 보낸 `amount`를 **서버가 보관한 주문 금액과 대조**(클라 URL 파라미터 신뢰 금지).
- Toss 응답의 승인 금액 == 주문 금액 검증 후에만 `Payment(status=succeeded)` + `Subscription(active)` 생성/갱신.
- `orderId` 기준 **멱등 처리**(중복 confirm 방지) — 동일 orderId 재요청 시 기존 결과 반환.
- 실패/예외 시 plan 미부여 + `Payment(status=failed)` 기록.

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

## 보안 체크포인트

- 성공/실패는 **서버 신뢰원**으로만 판정(이미 `verifyRecentPayment` 패턴 적용).
- 금액 검증은 반드시 서버에서 PG 승인 금액과 대조.
- 시크릿 키는 서버 env에만(클라 번들 금지). 클라이언트 키만 `VITE_` 노출.
- confirm 멱등성으로 중복 과금/중복 구독 방지.

## 롤백

- 문제 발생 시 `setMonetizationEnabled(false)` 또는 env로 게이팅 해제 → 전 기능 무료(베타 상태)로 즉시 복귀.

---

작성: 2026-05-30 · 코드 인프라는 완료, 위 단계는 운영자의 PG 자격증명·샌드박스 검증을 요함.
