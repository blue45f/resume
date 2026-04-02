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
      totalUsers, totalResumes, totalTemplates, totalTags,
      totalComments, totalApplications, totalVersions, totalTransforms,
      newUsersToday, newUsersWeek, newUsersMonth,
      newResumesToday, newResumesWeek,
      totalViews, publicResumes,
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
    ]);

    return {
      users: { total: totalUsers, today: newUsersToday, week: newUsersWeek, month: newUsersMonth },
      resumes: { total: totalResumes, today: newResumesToday, week: newResumesWeek, public: publicResumes },
      content: { templates: totalTemplates, tags: totalTags, comments: totalComments, versions: totalVersions },
      activity: { applications: totalApplications, transforms: totalTransforms, totalViews: totalViews._sum.viewCount || 0 },
    };
  }
}
