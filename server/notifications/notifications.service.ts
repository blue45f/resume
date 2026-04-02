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

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }
}
