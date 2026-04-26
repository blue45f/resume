import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(userId: string, notificationId?: string) {
    if (notificationId) {
      await this.prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { read: true },
      });
    } else {
      await this.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
    }
    return { success: true };
  }

  async create(userId: string, type: string, message: string, link?: string) {
    return this.prisma.notification.create({
      data: { userId, type, message, link },
    });
  }

  /**
   * 일괄 공지 발송 — 여러 사용자에게 동일 메시지. 중복 방지(idempotency):
   * 같은 (type, message) 조합으로 이미 받은 사용자는 skip — 같은 announcement 중복 발송 방지.
   * activeWithin 일 이내 활동(알림 받음/이력서 수정 등) 기준으로 대상 좁히고 싶으면 service-level 에서 필터.
   *
   * 반환: { sent, skipped } 카운트.
   */
  async createBulk(
    userIds: string[],
    type: string,
    message: string,
    link?: string,
  ): Promise<{ sent: number; skipped: number }> {
    if (!userIds.length) return { sent: 0, skipped: 0 };
    // 이미 같은 announcement 받은 사용자 제외
    const existing = await this.prisma.notification.findMany({
      where: { userId: { in: userIds }, type, message },
      select: { userId: true },
    });
    const seenSet = new Set(existing.map((n) => n.userId));
    const targets = userIds.filter((id) => !seenSet.has(id));
    if (targets.length === 0) return { sent: 0, skipped: userIds.length };

    await this.prisma.notification.createMany({
      data: targets.map((userId) => ({ userId, type, message, link })),
      skipDuplicates: true,
    });
    return { sent: targets.length, skipped: userIds.length - targets.length };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async deleteOne(userId: string, id: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { success: true };
  }

  async deleteBulk(userId: string, ids: string[]) {
    const { count } = await this.prisma.notification.deleteMany({
      where: { id: { in: ids }, userId },
    });
    return { success: true, deleted: count };
  }

  async cleanupOld() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count } = await this.prisma.notification.deleteMany({
      where: { read: true, createdAt: { lt: thirtyDaysAgo } },
    });
    return { deleted: count };
  }
}
