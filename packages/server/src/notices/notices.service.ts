import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async getAll(type?: string, page = 1, limit = 10) {
    const where: any = {};
    if (type) where.type = type;
    const [items, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notice.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPopup() {
    const now = new Date();
    return this.prisma.notice.findMany({
      where: {
        isPopup: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  }

  async getOne(id: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { comments: true } },
      },
    });
    if (!notice) throw new NotFoundException('공지사항을 찾을 수 없습니다');
    // increment view count
    await this.prisma.notice.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return notice;
  }

  async create(data: any, authorId?: string) {
    return this.prisma.notice.create({
      data: { ...data, authorId: authorId || null },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, data: any, editorId?: string, reason?: string) {
    const existing = await this.prisma.notice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();

    // Save history before update
    if (editorId) {
      await this.prisma.noticeHistory.create({
        data: {
          noticeId: id,
          editorId,
          prevTitle: existing.title,
          prevContent: existing.content,
          prevType: existing.type,
          reason: reason || '',
        },
      });
    }

    return this.prisma.notice.update({
      where: { id },
      data,
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    return this.prisma.notice.delete({ where: { id } });
  }

  // ── Comments ──────────────────────────────────────────────────

  async addComment(noticeId: string, userId: string, content: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id: noticeId } });
    if (!notice) throw new NotFoundException();
    if (!notice.allowComments) throw new ForbiddenException('댓글이 허용되지 않은 공지사항입니다');
    return this.prisma.noticeComment.create({
      data: { noticeId, userId, content },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async deleteComment(commentId: string, userId: string, role: string) {
    const comment = await this.prisma.noticeComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException();
    if (comment.userId !== userId && role !== 'admin' && role !== 'superadmin')
      throw new ForbiddenException();
    return this.prisma.noticeComment.delete({ where: { id: commentId } });
  }

  async toggleComments(noticeId: string, allow: boolean) {
    return this.prisma.notice.update({ where: { id: noticeId }, data: { allowComments: allow } });
  }

  // ── History ───────────────────────────────────────────────────

  async getHistory(noticeId: string) {
    return this.prisma.noticeHistory.findMany({
      where: { noticeId },
      include: { editor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
