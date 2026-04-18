import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const STATUS_LABEL: Record<string, string> = {
  applied: '지원 완료',
  screening: '서류 심사 중',
  interview: '면접 진행',
  offer: '오퍼 제안',
  rejected: '불합격',
  withdrawn: '지원 취소',
};

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

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

  async create(
    data: {
      company: string;
      position: string;
      url?: string;
      status?: string;
      appliedDate?: string;
      notes?: string;
      salary?: string;
      location?: string;
      resumeId?: string;
    },
    userId: string,
  ) {
    // 외부 채용공고 자동 등록 중복 방지 — 동일 URL 또는 동일 회사·포지션 조합이 최근 7일 내 있으면 갱신만.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const existing = await this.prisma.jobApplication.findFirst({
      where: {
        userId,
        OR: [
          data.url ? { url: data.url } : undefined,
          { company: data.company, position: data.position },
        ].filter(Boolean) as any[],
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (existing) {
      return this.prisma.jobApplication.update({
        where: { id: existing.id },
        data: {
          notes: data.notes || existing.notes,
          status: data.status || existing.status,
          url: data.url || existing.url,
        },
      });
    }
    return this.prisma.jobApplication.create({
      data: { ...data, userId },
    });
  }

  async update(
    id: string,
    data: Partial<{
      company: string;
      position: string;
      url?: string;
      status: string;
      notes?: string;
      salary?: string;
      location?: string;
      resumeId?: string;
      visibility?: string;
    }>,
    userId: string,
  ) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('지원 내역을 찾을 수 없습니다');
    if (app.userId !== userId) throw new ForbiddenException('권한이 없습니다');

    const updated = await this.prisma.jobApplication.update({ where: { id }, data });

    // 상태 변경 시 본인에게 알림 (본인이 바꾼 경우도 기록용)
    if (data.status && data.status !== app.status && app.userId) {
      const label = STATUS_LABEL[data.status] || data.status;
      await this.notifications
        .create(
          app.userId,
          'application_status',
          `"${app.company} ${app.position}" 지원 상태가 "${label}"로 변경되었습니다`,
          `/applications`,
        )
        .catch(() => undefined);
    }

    return updated;
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
