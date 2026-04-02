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
}
