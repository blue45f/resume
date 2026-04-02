import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const applications = await this.prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return applications;
  }

  async getStats(userId: string) {
    const all = await this.prisma.jobApplication.findMany({ where: { userId } });
    const statusCounts: Record<string, number> = {};
    for (const app of all) {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    }
    return { total: all.length, byStatus: statusCounts };
  }

  async create(data: { company: string; position: string; url?: string; status?: string; appliedDate?: string; notes?: string; salary?: string; location?: string; resumeId?: string }, userId: string) {
    return this.prisma.jobApplication.create({
      data: { ...data, userId },
    });
  }

  async update(id: string, data: Partial<{ company: string; position: string; url?: string; status: string; notes?: string; salary?: string; location?: string; resumeId?: string }>, userId: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('지원 내역을 찾을 수 없습니다');
    if (app.userId !== userId) throw new ForbiddenException('권한이 없습니다');
    return this.prisma.jobApplication.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('지원 내역을 찾을 수 없습니다');
    if (app.userId !== userId) throw new ForbiddenException('권한이 없습니다');
    await this.prisma.jobApplication.delete({ where: { id } });
    return { success: true };
  }

  async findOne(id: string) {
    return this.prisma.jobApplication.findUnique({ where: { id } });
  }

  async getComments(applicationId: string) {
    return this.prisma.applicationComment.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(applicationId: string, content: string, userId?: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id: applicationId } });
    if (!app || app.visibility !== 'public') {
      throw new NotFoundException('공개된 지원 내역만 댓글을 작성할 수 있습니다');
    }
    if (!content || content.trim().length < 5) {
      throw new ForbiddenException('5자 이상 입력해주세요');
    }

    const cleanContent = content.trim().replace(/<[^>]*>/g, '');

    let authorName = '익명';
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) authorName = user.name || user.email;
    }

    return this.prisma.applicationComment.create({
      data: { applicationId, userId, authorName, content: cleanContent },
    });
  }
}
