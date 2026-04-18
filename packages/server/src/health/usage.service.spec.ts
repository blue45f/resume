import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsageService } from './usage.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma: any = {
  user: { findUnique: jest.fn() },
  usageLog: {
    create: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
};

describe('UsageService', () => {
  let service: UsageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsageService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(UsageService);
    jest.clearAllMocks();
  });

  describe('checkAndLog', () => {
    it('사용자 없으면 Forbidden', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.checkAndLog('u1', 'ai_transform')).rejects.toThrow(ForbiddenException);
    });

    it('admin은 한도 무관 + 로그만 기록', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'admin', plan: 'free' });
      await service.checkAndLog('u1', 'ai_transform');
      expect(mockPrisma.usageLog.count).not.toHaveBeenCalled();
      expect(mockPrisma.usageLog.create).toHaveBeenCalledWith({
        data: { userId: 'u1', feature: 'ai_transform' },
      });
    });

    it('superadmin도 동일하게 허용', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        role: 'superadmin',
        plan: 'free',
      });
      await service.checkAndLog('u1', 'cover_letter');
      expect(mockPrisma.usageLog.create).toHaveBeenCalled();
    });

    it('free 플랜 cover_letter(limit=0) → Forbidden', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'user', plan: 'free' });
      await expect(service.checkAndLog('u1', 'cover_letter')).rejects.toThrow(ForbiddenException);
    });

    it('free 플랜 ai_transform 한도 내(3/5) → 허용', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'user', plan: 'free' });
      mockPrisma.usageLog.count.mockResolvedValueOnce(3);
      await service.checkAndLog('u1', 'ai_transform');
      expect(mockPrisma.usageLog.create).toHaveBeenCalled();
    });

    it('free 플랜 ai_transform 한도 도달(5/5) → Forbidden', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'user', plan: 'free' });
      mockPrisma.usageLog.count.mockResolvedValueOnce(5);
      await expect(service.checkAndLog('u1', 'ai_transform')).rejects.toThrow(/월 5회 사용 한도/);
    });

    it('pro 플랜은 -1 (무제한) 처리 — count 체크 없이 바로 로그', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'user', plan: 'pro' });
      await service.checkAndLog('u1', 'ai_transform');
      expect(mockPrisma.usageLog.count).not.toHaveBeenCalled();
      expect(mockPrisma.usageLog.create).toHaveBeenCalled();
    });

    it('free 플랜에 없는 feature → limit 0 fallback → Forbidden', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'user', plan: 'free' });
      await expect(service.checkAndLog('u1', 'unknown_feature')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('count 쿼리 시 이번달 시작 시점 이후 집계', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', role: 'user', plan: 'free' });
      mockPrisma.usageLog.count.mockResolvedValueOnce(0);
      await service.checkAndLog('u1', 'ai_transform');
      const call = mockPrisma.usageLog.count.mock.calls[0][0];
      expect(call.where.userId).toBe('u1');
      expect(call.where.feature).toBe('ai_transform');
      expect(call.where.createdAt.gte).toBeInstanceOf(Date);
      // 이번달 1일 00:00 이어야 함
      const d = call.where.createdAt.gte as Date;
      expect(d.getDate()).toBe(1);
      expect(d.getHours()).toBe(0);
    });
  });

  describe('getUsage', () => {
    it('이번달 feature별 count 집계', async () => {
      mockPrisma.usageLog.groupBy.mockResolvedValueOnce([
        { feature: 'ai_transform', _count: 3 },
        { feature: 'cover_letter', _count: 1 },
      ]);
      const res = await service.getUsage('u1');
      expect(res).toEqual([
        { feature: 'ai_transform', count: 3 },
        { feature: 'cover_letter', count: 1 },
      ]);
    });
  });
});
