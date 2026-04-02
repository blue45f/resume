import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new ForbiddenException('자신을 팔로우할 수 없습니다');
    try {
      await this.prisma.follow.create({ data: { followerId, followingId } });
    } catch {} // unique constraint
    return { followed: true };
  }

  async unfollow(followerId: string, followingId: string) {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
    return { followed: false };
  }

  async getFollowers(userId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    return follows.map(f => ({ ...f.follower, followedAt: f.createdAt }));
  }

  async getFollowing(userId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    return follows.map(f => ({ ...f.following, followedAt: f.createdAt }));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findFirst({ where: { followerId, followingId } });
    return !!follow;
  }

  // Scout messages
  async sendScout(senderId: string, data: { receiverId: string; resumeId?: string; company: string; position: string; message: string }) {
    if (data.message.length > 2000) throw new ForbiddenException('스카우트 메시지는 2000자 이내로 입력해주세요');
    return this.prisma.scoutMessage.create({
      data: { senderId, ...data },
    });
  }

  async getReceivedScouts(userId: string) {
    return this.prisma.scoutMessage.findMany({
      where: { receiverId: userId },
      include: { sender: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markScoutRead(id: string, userId: string) {
    await this.prisma.scoutMessage.updateMany({
      where: { id, receiverId: userId },
      data: { read: true },
    });
    return { success: true };
  }

  // Direct Messages
  async sendMessage(senderId: string, receiverId: string, content: string) {
    if (senderId === receiverId) throw new ForbiddenException('자신에게 메시지를 보낼 수 없습니다');
    if (!content || content.trim().length < 1) throw new ForbiddenException('메시지를 입력해주세요');
    if (content.length > 1000) throw new ForbiddenException('메시지는 1000자 이내로 입력해주세요');
    return this.prisma.directMessage.create({
      data: { senderId, receiverId, content: content.trim() },
    });
  }

  async getConversations(userId: string) {
    const sent = await this.prisma.directMessage.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });
    const received = await this.prisma.directMessage.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const partnerIds = new Set([
      ...sent.map(s => s.receiverId),
      ...received.map(r => r.senderId),
    ]);

    const conversations = [];
    for (const partnerId of partnerIds) {
      const lastMessage = await this.prisma.directMessage.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      const unreadCount = await this.prisma.directMessage.count({
        where: { senderId: partnerId, receiverId: userId, read: false },
      });
      const partner = await this.prisma.user.findUnique({
        where: { id: partnerId },
        select: { id: true, name: true, email: true, avatar: true },
      });
      if (partner && lastMessage) {
        conversations.push({
          partner,
          lastMessage: { content: lastMessage.content, createdAt: lastMessage.createdAt, isMine: lastMessage.senderId === userId },
          unreadCount,
        });
      }
    }

    return conversations.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
  }

  async getMessages(userId: string, partnerId: string) {
    await this.prisma.directMessage.updateMany({
      where: { senderId: partnerId, receiverId: userId, read: false },
      data: { read: true },
    });

    return this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    return this.prisma.directMessage.count({
      where: { receiverId: userId, read: false },
    });
  }
}
