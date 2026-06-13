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

    const [
      totalUsers,
      totalResumes,
      totalTemplates,
      totalTags,
      totalComments,
      totalApplications,
      totalVersions,
      totalTransforms,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      newResumesToday,
      newResumesWeek,
      totalViews,
      publicResumes,
      totalCoaches,
      activeCoaches,
      sessionsByStatus,
      commissionAgg,
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
      this.prisma.coachProfile.count(),
      this.prisma.coachProfile.count({ where: { isActive: true } }),
      this.prisma.coachingSession.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.coachingSession.aggregate({
        where: { status: { in: ['completed', 'confirmed'] } },
        _sum: { commission: true },
      }),
    ]);

    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, provider: true, createdAt: true },
    });

    // i18n 통계 — preferredLocale 별 사용자 수. 빈 문자열은 'unset' 으로.
    const localeGroups = await this.prisma.user.groupBy({
      by: ['preferredLocale'],
      _count: { _all: true },
    });
    const localeStats: Record<string, number> = { unset: 0, ko: 0, en: 0, ja: 0 };
    for (const g of localeGroups) {
      const key = g.preferredLocale || 'unset';
      localeStats[key] = (localeStats[key] || 0) + (g._count?._all || 0);
    }

    // 신규 기능 사용량 — 2026-04 사이클 추가 기능들
    const [
      coffeeChatTotal,
      coffeeChatPending,
      coffeeChatAccepted,
      coffeeChatCompleted,
      resumeViewerTotal,
      selectiveResumes,
      jobUrlCacheTotal,
      jobUrlCacheRecent,
      interviewAnswers,
      interviewAnswersWeek,
      avatarUploads,
    ] = await Promise.all([
      this.prisma.coffeeChat.count(),
      this.prisma.coffeeChat.count({ where: { status: 'pending' } }),
      this.prisma.coffeeChat.count({ where: { status: 'accepted' } }),
      this.prisma.coffeeChat.count({ where: { status: 'completed' } }),
      this.prisma.resumeViewer.count(),
      this.prisma.resume.count({ where: { visibility: 'selective' } }),
      this.prisma.jobUrlCache.count(),
      this.prisma.jobUrlCache.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.interviewAnswer.count(),
      this.prisma.interviewAnswer.count({ where: { createdAt: { gte: weekAgo } } }),
      // 아바타 업로드: User.avatar 가 cloudinary URL 인 사용자 수 (대략적 추정)
      this.prisma.user.count({ where: { avatar: { contains: 'cloudinary' } } }),
    ]);

    // Aggregate coaching status counts
    const statusList = Array.isArray(sessionsByStatus) ? sessionsByStatus : [];
    const statusCounts: Record<string, number> = {
      requested: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
    };
    let totalSessions = 0;
    for (const row of statusList) {
      const key = String(row?.status ?? '');
      const n = Number(row?._count?._all ?? 0);
      statusCounts[key] = (statusCounts[key] || 0) + n;
      totalSessions += n;
    }
    const totalCommission = Number(commissionAgg._sum.commission ?? 0);

    return {
      users: { total: totalUsers, today: newUsersToday, week: newUsersWeek, month: newUsersMonth },
      resumes: {
        total: totalResumes,
        today: newResumesToday,
        week: newResumesWeek,
        public: publicResumes,
      },
      content: {
        templates: totalTemplates,
        tags: totalTags,
        comments: totalComments,
        versions: totalVersions,
      },
      activity: {
        applications: totalApplications,
        transforms: totalTransforms,
        totalViews: totalViews._sum.viewCount || 0,
      },
      coaching: {
        totalCoaches,
        activeCoaches,
        totalSessions,
        totalCommission,
        byStatus: statusCounts,
      },
      locales: localeStats,
      // 2026-04 신규 기능 사용량
      newFeatures: {
        coffeeChat: {
          total: coffeeChatTotal,
          pending: coffeeChatPending,
          accepted: coffeeChatAccepted,
          completed: coffeeChatCompleted,
        },
        selective: {
          resumes: selectiveResumes,
          viewers: resumeViewerTotal,
        },
        jobUrlParser: {
          totalCached: jobUrlCacheTotal,
          weeklyParsed: jobUrlCacheRecent,
        },
        interviewAnalysis: {
          totalAnswers: interviewAnswers,
          weeklyAnswers: interviewAnswersWeek,
        },
        avatars: {
          uploaded: avatarUploads,
        },
      },
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        provider: u.provider,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }
}
