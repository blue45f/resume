import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BillingService, PLANS } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const mockNotifications = { create: jest.fn().mockResolvedValue({}) };

const mockPrisma: any = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get(BillingService);
    jest.clearAllMocks();
  });

  describe('listPlans', () => {
    it('3 plan 모두 반환 (free/pro/enterprise)', () => {
      const plans = service.listPlans();
      expect(plans.map((p) => p.id).sort()).toEqual(['enterprise', 'free', 'pro']);
    });
  });

  describe('getMyBilling', () => {
    it('plan + active subscription 반환', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ plan: 'pro', planExpiresAt: new Date() });
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 's1',
        plan: 'pro',
        status: 'active',
      });
      const r = await service.getMyBilling('u1');
      expect(r.currentPlan.id).toBe('pro');
      expect(r.subscription?.id).toBe('s1');
    });

    it('user 없으면 NotFound', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMyBilling('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('grantPlan', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.subscription.create.mockResolvedValue({ id: 's-new' });
    });

    it('유효하지 않은 plan → BadRequest', async () => {
      await expect(service.grantPlan('u1', { plan: 'unknown' as any, days: 30 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('days 범위 밖 → BadRequest', async () => {
      await expect(service.grantPlan('u1', { plan: 'pro', days: 0 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.grantPlan('u1', { plan: 'pro', days: 99999 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('정상 grant — 기존 active cancel + 새 sub create + user.plan 업데이트 + 알림', async () => {
      mockNotifications.create.mockClear();
      await service.grantPlan('u1', { plan: 'pro', days: 30 });
      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1', status: 'active' },
          data: expect.objectContaining({ status: 'cancelled' }),
        }),
      );
      expect(mockPrisma.subscription.create).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({ plan: 'pro' }),
        }),
      );
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'u1',
        'subscription_activated',
        expect.stringContaining('Pro'),
        expect.any(String),
      );
    });
  });

  describe('cancelMyPlan', () => {
    it('active sub 없음 → NotFound', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      await expect(service.cancelMyPlan('u1')).rejects.toThrow(NotFoundException);
    });

    it('이미 cancel 예약 → BadRequest', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 's1',
        cancelAtPeriodEnd: true,
      });
      await expect(service.cancelMyPlan('u1')).rejects.toThrow(BadRequestException);
    });

    it('정상 cancel — cancelAtPeriodEnd=true 로 update', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 's1',
        cancelAtPeriodEnd: false,
      });
      mockPrisma.subscription.update.mockResolvedValue({});
      await service.cancelMyPlan('u1');
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's1' },
          data: expect.objectContaining({ cancelAtPeriodEnd: true }),
        }),
      );
    });
  });

  describe('expireOverdueSubscriptions', () => {
    it('overdue 없음 → expired: 0', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);
      const r = await service.expireOverdueSubscriptions();
      expect(r.expired).toBe(0);
    });

    it('overdue 있으면 status=expired + user plan=free + 알림', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([
        { id: 's1', userId: 'u1', plan: 'pro' },
        { id: 's2', userId: 'u2', plan: 'enterprise' },
      ]);
      mockNotifications.create.mockClear();
      const r = await service.expireOverdueSubscriptions();
      expect(r.expired).toBe(2);
      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['s1', 's2'] } },
        data: { status: 'expired' },
      });
      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Plan features', () => {
    it('free / pro / enterprise 기능 카탈로그 일관성', () => {
      expect(PLANS.free.features.aiAnalyzePerMonth).toBe(30);
      expect(PLANS.pro.features.aiAnalyzePerMonth).toBe(300);
      expect(PLANS.enterprise.features.aiAnalyzePerMonth).toBe(-1); // unlimited
      expect(PLANS.free.features.coachingNudgeLLM).toBe(false);
      expect(PLANS.pro.features.coachingNudgeLLM).toBe(true);
    });
  });

  describe('checkQuota (사용량 enforce)', () => {
    it('Pro 플랜 (한도 100) — 50 사용 → 통과', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ plan: 'pro' });
      await expect(service.checkQuota('u1', 'interviewAnalyze', 50)).resolves.toBeUndefined();
    });

    it('Free 플랜 (한도 5) — 5 사용 → 한도 도달 BadRequest', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ plan: 'free' });
      await expect(service.checkQuota('u1', 'interviewAnalyze', 5)).rejects.toThrow(/한도/);
    });

    it('Enterprise 무제한 — 9999 사용해도 통과', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ plan: 'enterprise' });
      await expect(service.checkQuota('u1', 'aiAnalyze', 9999)).resolves.toBeUndefined();
    });

    it('user 없음 → free 로 fallback', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.checkQuota('u1', 'aiAnalyze', 30)).rejects.toThrow();
    });
  });

  describe('currentMonthStart', () => {
    it('현재 월의 1일 UTC 00:00 반환', () => {
      const r = BillingService.currentMonthStart();
      expect(r.getUTCDate()).toBe(1);
      expect(r.getUTCHours()).toBe(0);
    });
  });
});
