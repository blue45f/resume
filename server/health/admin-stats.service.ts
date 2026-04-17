import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const prismaAny = this.prisma as any;
    const [
      totalUsers, totalResumes, totalTemplates, totalTags,
      totalComments, totalApplications, totalVersions, totalTransforms,
      newUsersToday, newUsersWeek, newUsersMonth,
      newResumesToday, newResumesWeek,
      totalViews, publicResumes,
      totalCoaches, activeCoaches,
      sessionsByStatus, commissionAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.resume.count(),
      this.prisma.template.count(),
      this.prisma.tag.count(),
      this.prisma.comment.count(),
      this.prisma.jobApplication.count(),
      this.prisma.resumeVersion.count(),
      this.prisma.llmTransformation.count(),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.resume.count({ where: { createdAt: { gte: today } } }),
      this.prisma.resume.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.resume.aggregate({ _sum: { viewCount: true } }),
      this.prisma.resume.count({ where: { visibility: 'public' } }),
      prismaAny.coachProfile?.count?.() ?? Promise.resolve(0),
      prismaAny.coachProfile?.count?.({ where: { isActive: true } }) ?? Promise.resolve(0),
      prismaAny.coachingSession?.groupBy?.({
        by: ['status'],
        _count: { _all: true },
      }) ?? Promise.resolve([] as Array<{ status: string; _count: { _all: number } }>),
      prismaAny.coachingSession?.aggregate?.({
        where: { status: { in: ['completed', 'confirmed'] } },
        _sum: { commission: true },
      }) ?? Promise.resolve({ _sum: { commission: 0 } }),
    ]);

    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, provider: true, createdAt: true },
    });

    // Aggregate coaching status counts
    const statusList = Array.isArray(sessionsByStatus) ? sessionsByStatus : [];
    const statusCounts: Record<string, number> = {
      requested: 0, confirmed: 0, completed: 0, cancelled: 0, refunded: 0,
    };
    let totalSessions = 0;
    for (const row of statusList) {
      const key = String(row?.status ?? '');
      const n = Number(row?._count?._all ?? 0);
      statusCounts[key] = (statusCounts[key] || 0) + n;
      totalSessions += n;
    }
    const totalCommission = Number((commissionAgg as any)?._sum?.commission ?? 0);

    return {
      users: { total: totalUsers, today: newUsersToday, week: newUsersWeek, month: newUsersMonth },
      resumes: { total: totalResumes, today: newResumesToday, week: newResumesWeek, public: publicResumes },
      content: { templates: totalTemplates, tags: totalTags, comments: totalComments, versions: totalVersions },
      activity: { applications: totalApplications, transforms: totalTransforms, totalViews: totalViews._sum.viewCount || 0 },
      coaching: {
        totalCoaches,
        activeCoaches,
        totalSessions,
        totalCommission,
        byStatus: statusCounts,
      },
      recentUsers: recentUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        provider: u.provider,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }
}
