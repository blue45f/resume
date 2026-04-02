import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Plan limits (same as frontend plans.ts)
const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free: { ai_transform: 5, cover_letter: 0, translation: 0, ai_coaching: 0 },
  pro: { ai_transform: -1, cover_letter: -1, translation: -1, ai_coaching: -1 },
  enterprise: { ai_transform: -1, cover_letter: -1, translation: -1, ai_coaching: -1 },
};

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  async checkAndLog(userId: string, feature: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('사용자를 찾을 수 없습니다');

    // admin/superadmin은 모든 기능 무제한
    const role = user.role || 'user';
    if (role === 'admin' || role === 'superadmin') {
      await this.prisma.usageLog.create({ data: { userId, feature } });
      return;
    }

    const plan = user.plan || 'free';
    const limit = PLAN_LIMITS[plan]?.[feature] ?? 0;

    // -1 means unlimited
    if (limit === 0) {
      throw new ForbiddenException(`이 기능은 ${plan === 'free' ? '프로' : '엔터프라이즈'} 플랜에서 사용 가능합니다`);
    }

    if (limit > 0) {
      // Count this month's usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const count = await this.prisma.usageLog.count({
        where: { userId, feature, createdAt: { gte: startOfMonth } },
      });

      if (count >= limit) {
        throw new ForbiddenException(`월 ${limit}회 사용 한도에 도달했습니다. 프로 플랜으로 업그레이드하세요.`);
      }
    }

    // Log usage
    await this.prisma.usageLog.create({ data: { userId, feature } });
  }

  async getUsage(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.usageLog.groupBy({
      by: ['feature'],
      where: { userId, createdAt: { gte: startOfMonth } },
      _count: true,
    });

    return usage.map(u => ({ feature: u.feature, count: u._count }));
  }
}
