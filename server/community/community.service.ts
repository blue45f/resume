import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async getPosts(category?: string, search?: string, page = 1, limit = 20) {
    const where: any = {};
    if (category && category !== 'all') where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPost(id: string, viewerId?: string) {
    await this.prisma.communityPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { post: false },
          take: 100,
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post) return null;

    let liked = false;
    if (viewerId) {
      const like = await this.prisma.communityLike.findUnique({
        where: { postId_userId: { postId: id, userId: viewerId } },
      });
      liked = !!like;
    }

    return { ...post, liked };
  }

  async createPost(userId: string, body: { title: string; content: string; category: string }) {
    return this.prisma.communityPost.create({
      data: {
        title: body.title,
        content: body.content,
        category: body.category || 'free',
        userId,
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });
  }

  async updatePost(id: string, userId: string, role: string, body: { title?: string; content?: string; category?: string; isPinned?: boolean }) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new Error('Not found');
    if (post.userId !== userId && role !== 'admin' && role !== 'superadmin') throw new Error('Forbidden');

    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.category !== undefined) data.category = body.category;
    if ((role === 'admin' || role === 'superadmin') && body.isPinned !== undefined) {
      data.isPinned = body.isPinned;
    }

    return this.prisma.communityPost.update({ where: { id }, data });
  }

  async deletePost(id: string, userId: string, role: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new Error('Not found');
    if (post.userId !== userId && role !== 'admin' && role !== 'superadmin') throw new Error('Forbidden');
    return this.prisma.communityPost.delete({ where: { id } });
  }

  async toggleLike(postId: string, userId: string) {
    const existing = await this.prisma.communityLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.communityLike.delete({ where: { id: existing.id } });
      await this.prisma.communityPost.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
      return { liked: false };
    } else {
      await this.prisma.communityLike.create({ data: { postId, userId } });
      await this.prisma.communityPost.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
      return { liked: true };
    }
  }

  async getComments(postId: string) {
    return this.prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(postId: string, userId: string | undefined, content: string, authorName?: string) {
    return this.prisma.communityComment.create({
      data: { postId, userId: userId || null, content, authorName: authorName || null },
    });
  }

  async deleteComment(commentId: string, userId: string, role: string) {
    const comment = await this.prisma.communityComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new Error('Not found');
    if (comment.userId !== userId && role !== 'admin' && role !== 'superadmin') throw new Error('Forbidden');
    return this.prisma.communityComment.delete({ where: { id: commentId } });
  }
}
