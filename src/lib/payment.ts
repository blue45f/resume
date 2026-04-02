// Toss Payments 연동 설정
// 실제 운영 시 VITE_TOSS_CLIENT_KEY 환경변수로 설정
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'; // 테스트 키

export interface PaymentRequest {
  planId: string;
  planName: string;
  amount: number;
  period: 'monthly' | 'yearly';
  customerEmail: string;
  customerName: string;
}

export function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function requestPayment(params: PaymentRequest): Promise<void> {
  // Toss Payments SDK 로드
  const script = document.querySelector('script[src*="tosspayments"]');
  if (!script) {
    const s = document.createElement('script');
    s.src = 'https://js.tosspayments.com/v1/payment';
    document.head.appendChild(s);
    await new Promise(resolve => s.onload = resolve);
  }

  const tossPayments = (window as any).TossPayments(TOSS_CLIENT_KEY);
  const orderId = generateOrderId();

  await tossPayments.requestPayment('카드', {
    amount: params.amount,
    orderId,
    orderName: `이력서공방 ${params.planName} (${params.period === 'yearly' ? '연간' : '월간'})`,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    successUrl: `${window.location.origin}/payment/success?planId=${params.planId}&period=${params.period}`,
    failUrl: `${window.location.origin}/payment/fail`,
  });
}

export const PAYMENT_METHODS = [
  { id: 'card', name: '신용/체크카드', icon: '💳' },
  { id: 'kakaopay', name: '카카오페이', icon: '🟡' },
  { id: 'naverpay', name: '네이버페이', icon: '🟢' },
  { id: 'tosspay', name: '토스페이', icon: '🔵' },
  { id: 'phone', name: '휴대폰 결제', icon: '📱' },
  { id: 'transfer', name: '계좌이체', icon: '🏦' },
];
