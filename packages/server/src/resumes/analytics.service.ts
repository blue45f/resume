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
    const publicResumes = resumes.filter((r) => r.visibility === 'public').length;
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
      resumes: resumes.map((r) => ({
        id: r.id,
        title: r.title,
        viewCount: r.viewCount,
        visibility: r.visibility,
        updatedAt: r.updatedAt.toISOString(),
      })),
      recentVersions: recentVersions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        resumeId: v.resumeId,
        createdAt: v.createdAt.toISOString(),
      })),
    };
  }

  async getResumeTrend(resumeId: string) {
    const versions = await this.prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'asc' },
      select: { versionNumber: true, snapshot: true, createdAt: true },
      take: 20,
    });

    return versions.map((v) => {
      let sectionCount = 0;
      try {
        const data = typeof v.snapshot === 'string' ? JSON.parse(v.snapshot) : v.snapshot;
        if (data) {
          if (data.experiences?.length) sectionCount++;
          if (data.educations?.length) sectionCount++;
          if (data.skills?.length) sectionCount++;
          if (data.projects?.length) sectionCount++;
          if (data.certifications?.length) sectionCount++;
          if (data.languages?.length) sectionCount++;
          if (data.awards?.length) sectionCount++;
          if (data.activities?.length) sectionCount++;
        }
      } catch {}
      return {
        version: v.versionNumber,
        sections: sectionCount,
        createdAt: v.createdAt.toISOString(),
      };
    });
  }

  async getResumeAnalytics(resumeId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      select: { viewCount: true, visibility: true, createdAt: true, updatedAt: true },
    });
    if (!resume) return null;

    const [commentCount, bookmarkCount, shareCount, versionCount] = await Promise.all([
      this.prisma.comment.count({ where: { resumeId } }),
      this.prisma.bookmark.count({ where: { resumeId } }),
      this.prisma.shareLink.count({ where: { resumeId } }),
      this.prisma.resumeVersion.count({ where: { resumeId } }),
    ]);

    return {
      viewCount: resume.viewCount,
      commentCount,
      bookmarkCount,
      shareCount,
      versionCount,
      visibility: resume.visibility,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    };
  }

  async getPopularSkills(limit = 20) {
    const skills = await this.prisma.skill.findMany({
      where: { resume: { visibility: 'public' } },
      select: { items: true },
    });

    const counts: Record<string, number> = {};
    for (const skill of skills) {
      const items = skill.items
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const item of items) {
        const key = item.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }
}
