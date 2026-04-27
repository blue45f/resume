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
    priceYearlyKRW: 99000, // 약 17% 할인
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
   * 사용량 quota 검증 — feature gate enforcement.
   * 무료 플랜이 한도 도달 시 throw, Pro/Enterprise 는 통과 (-1 = unlimited).
   *
   * 사용처: AI 분석 endpoint 진입 시 (이력서 transform / 면접 답변 analyze).
   * 한도는 PLANS[plan].features 의 aiAnalyzePerMonth / interviewAnalyzePerMonth.
   *
   * @param feature 'aiAnalyze' | 'interviewAnalyze' — 카운트 카테고리
   * @param countSinceMonthStart 이번 달 사용 횟수 (caller 가 측정)
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

  /** 이번 달 시작 시각 (UTC). countSince... 측정용. */
  static currentMonthStart(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
}
