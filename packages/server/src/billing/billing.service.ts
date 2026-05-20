import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Plan 카탈로그 — 가격 / 기능 gate / 한도.
 * 실 PG 연동 전엔 admin grant + 무료 trial 만 활성화.
 */
export const PLANS = {
  free: {
    id: 'free',
    name: '무료',
    priceMonthlyKRW: 0,
    priceYearlyKRW: 0,
    features: {
      aiAnalyzePerMonth: 30, // 이력서 AI 분석 횟수
      coachingNudgeLLM: false, // Pro 가입 사용자에게만 LLM 개인화 nudge
      interviewAnalyzePerMonth: 5,
      maxResumes: 5,
      maxAttachmentMb: 10,
      coffeeChatHosting: false,
      adminAnnouncementCustom: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthlyKRW: 9900,
    priceYearlyKRW: 99000, // 16.7% 할인 (9900×12=118800 대비)
    features: {
      aiAnalyzePerMonth: 300,
      coachingNudgeLLM: true,
      interviewAnalyzePerMonth: 100,
      maxResumes: 30,
      maxAttachmentMb: 50,
      coffeeChatHosting: true,
      adminAnnouncementCustom: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthlyKRW: 49000,
    priceYearlyKRW: 490000,
    features: {
      aiAnalyzePerMonth: -1, // unlimited
      coachingNudgeLLM: true,
      interviewAnalyzePerMonth: -1,
      maxResumes: -1,
      maxAttachmentMb: 200,
      coffeeChatHosting: true,
      adminAnnouncementCustom: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  listPlans() {
    return Object.values(PLANS);
  }

  /** 사용자 현재 plan + active subscription. */
  async getMyBilling(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    const planId = (user.plan as PlanId) || 'free';
    const plan = PLANS[planId] || PLANS.free;

    const activeSub = await (this.prisma as any).subscription.findFirst({
      where: { userId, status: 'active' },
      orderBy: { currentPeriodEnd: 'desc' },
    });

    return {
      currentPlan: plan,
      planExpiresAt: user.planExpiresAt,
      subscription: activeSub,
    };
  }

  /**
   * 무료 trial / admin grant — 실 결제 없이 plan 부여.
   * 실 PG 연동 시 createCheckoutSession + webhook 으로 대체.
   */
  async grantPlan(
    userId: string,
    body: { plan: PlanId; days: number; provider?: string; reason?: string },
  ) {
    if (!PLANS[body.plan]) throw new BadRequestException('유효하지 않은 plan');
    if (body.days < 1 || body.days > 3650) {
      throw new BadRequestException('days 는 1-3650 사이');
    }
    const days = Math.floor(body.days);
    const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    // 기존 active subscription cancel
    await (this.prisma as any).subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    const sub = await (this.prisma as any).subscription.create({
      data: {
        userId,
        plan: body.plan,
        status: 'active',
        billingCycle: 'monthly',
        provider: body.provider || 'manual',
        currentPeriodEnd: periodEnd,
      },
    });

    // User cache 업데이트
    await this.prisma.user.update({
      where: { id: userId },
      data: { plan: body.plan, planExpiresAt: periodEnd },
    });

    // 알림 발송
    await this.notifications
      .create(
        userId,
        'subscription_activated',
        `${PLANS[body.plan].name} 플랜이 활성화됐어요 (${days}일)`,
        '/payment',
      )
      .catch(() => {});

    this.logger.log(
      `Plan granted: user=${userId} plan=${body.plan} days=${days} reason=${body.reason || '-'}`,
    );

    return sub;
  }

  /**
   * 사용자가 호출하는 무료 trial — 사용자당 1회만 허용 (manual/trial).
   * 이미 활성 구독이 있거나 과거 trial 이력이 있으면 BadRequest.
   *
   * 실 PG 연동 시 createCheckoutSession + webhook 으로 대체 — 그때는 trial 이력 보다는
   * subscription.provider 가 'toss'/'stripe' 인지로 분기.
   */
  async startTrial(userId: string, plan: PlanId, days: number) {
    if (!PLANS[plan]) throw new BadRequestException('유효하지 않은 plan');
    if (plan === 'free') {
      throw new BadRequestException('무료 플랜은 trial 대상이 아닙니다');
    }

    // 이미 활성 sub 가 있으면 차단 — 이중 결제 방지
    const active = await (this.prisma as any).subscription.findFirst({
      where: { userId, status: 'active' },
      select: { id: true, plan: true, provider: true },
    });
    if (active) {
      throw new BadRequestException(
        `이미 ${PLANS[active.plan as PlanId]?.name || active.plan} 구독이 활성화되어 있습니다`,
      );
    }

    // 과거 manual/trial 이력 확인 — 1회만 허용
    const pastTrial = await (this.prisma as any).subscription.findFirst({
      where: { userId, provider: 'manual' },
      select: { id: true },
    });
    if (pastTrial) {
      throw new BadRequestException(
        '무료 trial 은 사용자당 1회만 가능합니다. 정식 결제를 진행해주세요.',
      );
    }

    return this.grantPlan(userId, {
      plan,
      days,
      provider: 'manual',
      reason: 'mock-checkout-trial',
    });
  }

  /** 사용자 본인 cancel — currentPeriodEnd 까지는 유효. */
  async cancelMyPlan(userId: string) {
    const sub = await (this.prisma as any).subscription.findFirst({
      where: { userId, status: 'active' },
      orderBy: { currentPeriodEnd: 'desc' },
    });
    if (!sub) throw new NotFoundException('활성 구독이 없습니다');
    if (sub.cancelAtPeriodEnd) {
      throw new BadRequestException('이미 해지 예약 상태입니다');
    }
    return (this.prisma as any).subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true, cancelledAt: new Date() },
    });
  }

  /** 만료된 plan downgrade — cron job 또는 수동 호출. */
  async expireOverdueSubscriptions() {
    const now = new Date();
    const overdue = await (this.prisma as any).subscription.findMany({
      where: { status: 'active', currentPeriodEnd: { lt: now } },
      select: { id: true, userId: true, plan: true },
    });
    if (overdue.length === 0) return { expired: 0 };

    await (this.prisma as any).subscription.updateMany({
      where: { id: { in: overdue.map((s: any) => s.id) } },
      data: { status: 'expired' },
    });
    await this.prisma.user.updateMany({
      where: { id: { in: overdue.map((s: any) => s.userId) } },
      data: { plan: 'free', planExpiresAt: null },
    });

    for (const s of overdue) {
      await this.notifications
        .create(
          s.userId,
          'subscription_expired',
          `${PLANS[s.plan as PlanId]?.name || s.plan} 플랜 기간이 만료됐어요`,
          '/payment',
        )
        .catch(() => {});
    }

    return { expired: overdue.length };
  }

  /** 결제 transaction 기록 — PG webhook 또는 mock checkout 에서 호출. */
  async recordPayment(
    userId: string,
    body: {
      amount: number;
      subscriptionId?: string;
      provider?: string;
      externalId?: string;
      method?: string;
      description?: string;
      status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
    },
  ) {
    return (this.prisma as any).payment.create({
      data: {
        userId,
        subscriptionId: body.subscriptionId,
        amount: body.amount,
        provider: body.provider || 'manual',
        externalId: body.externalId,
        method: body.method || 'card',
        description: body.description || '',
        status: body.status || 'pending',
        paidAt: body.status === 'succeeded' ? new Date() : null,
      },
    });
  }

  /** 사용자 결제 내역 (최근 50건). */
  async listMyPayments(userId: string) {
    return (this.prisma as any).payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * 결제 후 검증 (P1-5) — PaymentResultPage 가 서버 신뢰원에서 성공/실패 판정.
   * 클라가 URL 파라미터로 success/fail 을 결정하는 패턴은 위조 가능하므로 사용 금지.
   *
   * mock 단계: 사용자의 가장 최근 succeeded payment 가 last 10분 내에 있으면 검증 성공.
   * 실 PG 연동 시: 같은 endpoint 가 { paymentKey, orderId, amount } 를 받아
   *   - Toss/카카오페이 verify API 호출 → external 거래 id 매칭
   *   - amount 가 PG 가 confirm 한 금액과 일치하는지 검증
   *   - 일치 시 payment 상태 succeeded 로 업데이트 + subscription 활성화
   */
  async verifyRecentPayment(userId: string) {
    const cutoff = new Date(Date.now() - 10 * 60 * 1000);
    const payment = await (this.prisma as any).payment.findFirst({
      where: { userId, status: 'succeeded', paidAt: { gte: cutoff } },
      orderBy: { paidAt: 'desc' },
      include: { subscription: true },
    });

    if (!payment) {
      return { verified: false as const, reason: 'no_recent_payment' };
    }

    const sub = payment.subscription;
    if (!sub || sub.status !== 'active') {
      return { verified: false as const, reason: 'no_active_subscription' };
    }

    const planMeta = PLANS[sub.plan as PlanId] || null;
    return {
      verified: true as const,
      plan: sub.plan,
      planName: planMeta?.name,
      provider: sub.provider,
      currentPeriodEnd: sub.currentPeriodEnd,
      paidAt: payment.paidAt,
      amount: payment.amount,
    };
  }

  /**
   * 사용량 quota 검증 — feature gate enforcement.
   * 무료 플랜이 한도 도달 시 throw, Pro/Enterprise 는 통과 (-1 = unlimited).
   *
   * 사용처: AI 분석 endpoint 진입 시 (이력서 transform / 면접 답변 analyze).
   * 한도는 PLANS[plan].features 의 aiAnalyzePerMonth / interviewAnalyzePerMonth.
   *
   * @deprecated count + check 가 별도 트랜잭션이라 동시 요청 race 가능 — `checkQuotaAtomic` 사용.
   *   유지 사유: 기존 호출부 호환.
   */
  async checkQuota(
    userId: string,
    feature: 'aiAnalyze' | 'interviewAnalyze',
    countSinceMonthStart: number,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const planId = (user?.plan as PlanId) || 'free';
    const plan = PLANS[planId] || PLANS.free;
    const limit =
      feature === 'aiAnalyze'
        ? plan.features.aiAnalyzePerMonth
        : plan.features.interviewAnalyzePerMonth;
    if (limit === -1) return; // unlimited
    if (countSinceMonthStart >= limit) {
      throw new BadRequestException(
        `${plan.name} 플랜의 월간 ${
          feature === 'aiAnalyze' ? 'AI 분석' : '면접 답변 분석'
        } 한도(${limit}회)를 초과했습니다. 플랜을 업그레이드하거나 다음 달까지 기다려주세요.`,
      );
    }
  }

  /**
   * P2-6 — atomic quota check: Postgres advisory lock 으로 같은 (userId, feature) 동시 요청 직렬화.
   *
   * 흐름:
   *   1) $transaction 안에서 pg_advisory_xact_lock — 같은 user+feature 쌍에 대해 직렬 진입.
   *   2) lock 보유 상태에서 count(tx) 호출 → 신뢰 가능한 카운트.
   *   3) limit 초과 시 BadRequest.
   *   4) tx 종료 시 lock 자동 해제 (서로 다른 user+feature 는 막지 않음).
   *
   * 한계: LLM 호출 자체가 tx 내부에 있지는 않으므로 count → LLM 사이 시간차는 존재.
   *   하지만 이전 (count 와 검증이 별도 round-trip) 패턴 대비 race window 가 ms 단위로 축소됨.
   *   엄격한 atomicity 가 필요하면 caller 가 LLM 호출 전후로 placeholder row 를 reserve 하는 패턴 사용.
   */
  async checkQuotaAtomic(
    userId: string,
    feature: 'aiAnalyze' | 'interviewAnalyze',
    counterFn: (tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0]) => Promise<number>,
  ): Promise<void> {
    if (!userId) throw new BadRequestException('userId 가 필요합니다');
    // pg_advisory_xact_lock 은 64bit 정수 1개 또는 32bit×2 를 받음 — userId+feature 해시.
    const lockKey = BillingService.hashToInt(`${userId}:${feature}`);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock($1::bigint)', lockKey);

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });
      const planId = (user?.plan as PlanId) || 'free';
      const plan = PLANS[planId] || PLANS.free;
      const limit =
        feature === 'aiAnalyze'
          ? plan.features.aiAnalyzePerMonth
          : plan.features.interviewAnalyzePerMonth;
      if (limit === -1) return; // unlimited

      const used = await counterFn(tx);
      if (used >= limit) {
        throw new BadRequestException(
          `${plan.name} 플랜의 월간 ${
            feature === 'aiAnalyze' ? 'AI 분석' : '면접 답변 분석'
          } 한도(${limit}회)를 초과했습니다. 플랜을 업그레이드하거나 다음 달까지 기다려주세요.`,
        );
      }
    });
  }

  /**
   * 문자열을 64bit signed int 로 매핑 (advisory lock key 용).
   * djb2 변형 — 같은 입력 → 같은 출력, 분포는 큰 시드 공간으로 균등.
   */
  private static hashToInt(input: string): bigint {
    let h = 5381n;
    for (let i = 0; i < input.length; i++) {
      h = (h * 33n + BigInt(input.charCodeAt(i))) & 0x7fffffffffffffffn;
    }
    return h;
  }

  /** 이번 달 시작 시각 (UTC). countSince... 측정용. */
  static currentMonthStart(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
}
