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
}
