import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getUserDashboard(userId: string) {
    const [resumes, totalViews, recentVersions, transformCount] = await Promise.all([
      this.prisma.resume.findMany({
        where: { userId },
        select: { id: true, title: true, viewCount: true, visibility: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.resume.aggregate({
        where: { userId },
        _sum: { viewCount: true },
      }),
      this.prisma.resumeVersion.findMany({
        where: { resume: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, versionNumber: true, createdAt: true, resumeId: true },
      }),
      this.prisma.llmTransformation.count({
        where: { resume: { userId } },
      }),
    ]);

    const totalResumes = resumes.length;
    const publicResumes = resumes.filter(r => r.visibility === 'public').length;
    const views = totalViews._sum.viewCount || 0;

    // Activity by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await this.prisma.resumeVersion.count({
      where: { resume: { userId }, createdAt: { gte: sevenDaysAgo } },
    });

    return {
      summary: {
        totalResumes,
        publicResumes,
        totalViews: views,
        totalTransforms: transformCount,
        recentEdits: recentActivity,
      },
      resumes: resumes.map(r => ({
        id: r.id,
        title: r.title,
        viewCount: r.viewCount,
        visibility: r.visibility,
        updatedAt: r.updatedAt.toISOString(),
      })),
      recentVersions: recentVersions.map(v => ({
        id: v.id,
        versionNumber: v.versionNumber,
        resumeId: v.resumeId,
        createdAt: v.createdAt.toISOString(),
      })),
    };
  }
}
