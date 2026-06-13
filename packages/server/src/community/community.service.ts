import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenWordsService } from '../forbidden-words/forbidden-words.service';
import { SystemConfigService } from '../system-config/system-config.service';

export type CommunityAttachment = {
  url: string;
  name: string;
  size: number;
  type: string;
};

export type CreateCommunityPostBody = {
  title: string;
  content: string;
  category: string;
  attachments?: CommunityAttachment[];
};

export type UpdateCommunityPostBody = Partial<CreateCommunityPostBody> & {
  isPinned?: boolean;
  isHidden?: boolean;
};

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly forbiddenWords: ForbiddenWordsService,
    private readonly systemConfig: SystemConfigService,
  ) {}

  /**
   * view-count dedup: 같은 viewer 가 같은 post 를 짧은 시간에 반복 조회 시 viewCount 부풀림 방지.
   * key = `${postId}:${viewerId ?? 'anon'}` → 마지막 view 시각 (ms).
   * Map 크기가 10000 초과 시 오래된 entry 절반 제거.
   */
  private readonly recentViews = new Map<string, number>();
  private static readonly VIEW_DEDUP_MS = 5 * 60 * 1000;

  private shouldCountView(postId: string, viewerId?: string): boolean {
    const key = `${postId}:${viewerId ?? 'anon'}`;
    const now = Date.now();
    const last = this.recentViews.get(key);
    if (last !== undefined && now - last < CommunityService.VIEW_DEDUP_MS) return false;
    this.recentViews.set(key, now);
    if (this.recentViews.size > 10_000) {
      const cutoff = now - CommunityService.VIEW_DEDUP_MS;
      for (const [k, t] of this.recentViews) {
        if (t < cutoff) this.recentViews.delete(k);
      }
    }
    return true;
  }

  // ── 커뮤니티 게시물 신고 + autoHidden ─────────────────────
  async reportPost(postId: string, reporterId: string, reason: string, detail: string) {
    if (!reporterId) throw new ForbiddenException('로그인이 필요합니다');
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, isHidden: true },
    });
    if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다');
    if (post.userId === reporterId) {
      throw new BadRequestException('본인 게시물은 신고할 수 없습니다');
    }

    const allowedReasons = ['spam', 'inappropriate', 'fake', 'copyright', 'other'];
    const safeReason = allowedReasons.includes(reason) ? reason : 'other';
    const safeDetail = (detail || '').slice(0, 500);

    await this.prisma.communityPostReport.upsert({
      where: { postId_reporterId: { postId, reporterId } },
      create: { postId, reporterId, reason: safeReason, detail: safeDetail },
      update: { reason: safeReason, detail: safeDetail },
    });

    const count = await this.prisma.communityPostReport.count({ where: { postId } });
    const threshold = await this.systemConfig.getReportThreshold();
    const autoHidden = count >= threshold;
    await this.prisma.communityPost.update({
      where: { id: postId },
      data: { reportCount: count, autoHidden },
    });
    return { reportCount: count, autoHidden, threshold };
  }

  async adminListPostReports(opts: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(Math.max(1, opts.limit ?? 20), 100);
    const [items, total] = await Promise.all([
      this.prisma.communityPostReport.findMany({
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          post: {
            select: {
              id: true,
              title: true,
              reportCount: true,
              autoHidden: true,
              category: true,
            },
          },
          reporter: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.communityPostReport.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminUnhidePost(id: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다');
    return this.prisma.communityPost.update({
      where: { id },
      data: { autoHidden: false, reportCount: 0 },
    });
  }

  async getPosts(
    category?: string,
    search?: string,
    page = 1,
    limit = 20,
    showHidden = false,
    sort = 'recent',
  ) {
    const where: Prisma.CommunityPostWhereInput = {};
    if (!showHidden) {
      where.isHidden = false;
      where.autoHidden = false; // 신고 누적 자동숨김 제외
    }
    if (category && category !== 'all') where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // sort: recent | oldest | popular | views | trending
    // trending = 최근 7일 내 + 좋아요순 (최근 인기 글)
    const trendingCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (sort === 'trending') where.createdAt = { gte: trendingCutoff };

    const orderBy: Prisma.CommunityPostOrderByWithRelationInput[] = (() => {
      const pinFirst = { isPinned: 'desc' as const };
      switch (sort) {
        case 'popular':
          return [pinFirst, { likeCount: 'desc' }, { viewCount: 'desc' }];
        case 'views':
          return [pinFirst, { viewCount: 'desc' }, { createdAt: 'desc' }];
        case 'trending':
          return [pinFirst, { likeCount: 'desc' }, { viewCount: 'desc' }];
        case 'oldest':
          return [pinFirst, { createdAt: 'asc' }];
        case 'recent':
        default:
          return [pinFirst, { createdAt: 'desc' }];
      }
    })();

    const [items, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        orderBy,
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
    // 1) 존재 확인 먼저 — 없는 글에 update 가 발생하던 P2007 / viewCount 부풀림 차단.
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

    // 2) 본인 글 제외 + 5분 dedup 통과 시에만 viewCount 증가.
    if (post.userId !== viewerId && this.shouldCountView(id, viewerId)) {
      await this.prisma.communityPost
        .update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        })
        .catch(() => undefined);
      post.viewCount += 1;
    }

    let liked = false;
    if (viewerId) {
      const like = await this.prisma.communityLike.findUnique({
        where: { postId_userId: { postId: id, userId: viewerId } },
      });
      liked = !!like;
    }

    return { ...post, liked };
  }

  async createPost(userId: string, body: CreateCommunityPostBody) {
    await this.forbiddenWords.validateOrThrow(body.title, body.content);
    return this.prisma.communityPost.create({
      data: {
        title: body.title,
        content: body.content,
        category: body.category || 'free',
        userId,
        attachments: this.normalizeAttachments(body.attachments),
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });
  }

  async updatePost(id: string, userId: string, role: string, body: UpdateCommunityPostBody) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    if (post.userId !== userId && role !== 'admin' && role !== 'superadmin')
      throw new ForbiddenException('권한이 없습니다');

    // 금칙어 재검증 — createPost 와 동일. 깨끗하게 등록 후 수정으로 우회하는 것을 차단.
    if (body.title !== undefined || body.content !== undefined) {
      await this.forbiddenWords.validateOrThrow(body.title, body.content);
    }

    const data: Prisma.CommunityPostUpdateInput = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.category !== undefined) data.category = body.category;
    if (body.attachments !== undefined)
      data.attachments = this.normalizeAttachments(body.attachments);
    if ((role === 'admin' || role === 'superadmin') && body.isPinned !== undefined) {
      data.isPinned = body.isPinned;
    }
    if ((role === 'admin' || role === 'superadmin') && body.isHidden !== undefined) {
      data.isHidden = body.isHidden;
    }

    return this.prisma.communityPost.update({ where: { id }, data });
  }

  /** 첨부 허용 host — study-groups 의 normalizeAttachments 와 동일 정책. */
  private static readonly ALLOWED_ATTACHMENT_HOSTS = [
    'res.cloudinary.com',
    'storage.googleapis.com',
    'firebasestorage.googleapis.com',
    'lh3.googleusercontent.com',
    'images.unsplash.com',
  ];

  /** data: URL 허용 prefix — 렌더링이 안전한 이미지/PDF base64 만 (data:text/html·javascript: XSS 차단). */
  private static readonly ALLOWED_DATA_URL_PREFIXES = [
    'data:image/jpeg;base64,',
    'data:image/png;base64,',
    'data:image/webp;base64,',
    'data:image/gif;base64,',
    'data:application/pdf;base64,',
  ];

  private static readonly MAX_DATA_URL_LENGTH = 2_900_000;

  /**
   * 첨부 정규화 — 클라 /upload 화이트리스트를 우회한 직접 JSON 제출(javascript: href 등 stored XSS)을
   * 서버에서 차단한다. 허용: https 화이트리스트 host 또는 안전한 data: prefix.
   */
  private normalizeAttachments(
    raw: unknown,
  ): Array<{ url: string; name: string; size: number; type: string }> {
    if (!Array.isArray(raw)) return [];
    const out: Array<{ url: string; name: string; size: number; type: string }> = [];
    for (const item of raw) {
      if (out.length >= 10) break;
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      const url = typeof obj.url === 'string' ? obj.url.trim() : '';
      const name = typeof obj.name === 'string' ? obj.name.trim().slice(0, 200) : '';
      const size = typeof obj.size === 'number' && Number.isFinite(obj.size) ? obj.size : 0;
      const type = typeof obj.type === 'string' ? obj.type.trim().slice(0, 100) : '';

      if (!url) continue;
      if (size < 0 || size > 50 * 1024 * 1024) continue;

      if (url.startsWith('data:')) {
        const prefixOk = CommunityService.ALLOWED_DATA_URL_PREFIXES.some((p) => url.startsWith(p));
        if (!prefixOk || url.length > CommunityService.MAX_DATA_URL_LENGTH) continue;
        out.push({ url, name, size, type });
        continue;
      }

      if (url.length > 2048) continue;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        continue;
      }
      if (parsed.protocol !== 'https:') continue;
      const hostOk = CommunityService.ALLOWED_ATTACHMENT_HOSTS.some(
        (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`),
      );
      if (!hostOk) continue;

      out.push({ url, name, size, type });
    }
    return out;
  }

  async deletePost(id: string, userId: string, role: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    if (post.userId !== userId && role !== 'admin' && role !== 'superadmin')
      throw new ForbiddenException('권한이 없습니다');
    return this.prisma.communityPost.delete({ where: { id } });
  }

  /**
   * 좋아요 토글 — P2-2: like 삭제/생성 + likeCount 증감을 $transaction 으로 묶어 정합성 확보.
   * P2-7: 작성자 알림은 24h 내 같은 postId 의 community_like 알림이 있으면 spam 으로 간주, 발송 skip.
   */
  async toggleLike(postId: string, userId: string) {
    const existing = await this.prisma.communityLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.communityLike.delete({ where: { id: existing.id } }),
        this.prisma.communityPost.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        }),
      ]);
      return { liked: false, likeCount: updated.likeCount };
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.communityLike.create({ data: { postId, userId } }),
      this.prisma.communityPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
        select: { userId: true, title: true, likeCount: true },
      }),
    ]);

    if (updated.userId && updated.userId !== userId) {
      const threshold = updated.likeCount <= 5 || updated.likeCount % 10 === 0;
      if (threshold) {
        // P2-7: 24h 내 같은 postId 좋아요 알림이 이미 있으면 dedup
        const recentNotif = await this.prisma.notification.findFirst({
          where: {
            userId: updated.userId,
            type: 'community_like',
            link: `/community/${postId}`,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: { id: true },
        });
        if (!recentNotif) {
          await this.notifications
            .create(
              updated.userId,
              'community_like',
              `"${updated.title}" 게시글이 ${updated.likeCount}개의 좋아요를 받았어요 ❤️`,
              `/community/${postId}`,
            )
            .catch(() => undefined);
        }
      }
    }
    return { liked: true, likeCount: updated.likeCount };
  }

  async getComments(postId: string) {
    return this.prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(
    postId: string,
    userId: string | undefined,
    content: string,
    authorName?: string,
    parentId?: string,
  ) {
    await this.systemConfig.assertFeatureEnabled('community.comment');
    await this.forbiddenWords.validateOrThrow(content);
    const comment = await this.prisma.communityComment.create({
      data: {
        postId,
        userId: userId || null,
        content,
        authorName: authorName || null,
        parentId: parentId || null,
      },
    });

    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { userId: true, title: true },
    });
    const commenterName = authorName || '익명';

    if (parentId) {
      // Notify the parent comment's author (if different from the replier)
      const parent = await this.prisma.communityComment.findUnique({
        where: { id: parentId },
        select: { userId: true },
      });
      if (parent?.userId && parent.userId !== userId) {
        await this.notifications
          .create(
            parent.userId,
            'comment',
            `${commenterName}님이 내 댓글에 답글을 달았습니다.`,
            `/community/${postId}`,
          )
          .catch(() => {});
      }
    } else if (post?.userId && post.userId !== userId) {
      // Notify post author of new top-level comment
      await this.notifications
        .create(
          post.userId,
          'comment',
          `"${post.title.slice(0, 30)}" 게시글에 ${commenterName}님이 댓글을 달았습니다.`,
          `/community/${postId}`,
        )
        .catch(() => {});
    }

    return comment;
  }

  async deleteComment(commentId: string, userId: string, role: string) {
    const comment = await this.prisma.communityComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다');
    if (comment.userId !== userId && role !== 'admin' && role !== 'superadmin')
      throw new ForbiddenException('권한이 없습니다');
    return this.prisma.communityComment.delete({ where: { id: commentId } });
  }

  // ─────────────────────────────────────────────
  // Admin APIs
  // ─────────────────────────────────────────────

  async adminList(params: {
    q?: string;
    category?: string;
    hidden?: string;
    page: number;
    limit: number;
  }) {
    const { q, category, hidden, page, limit } = params;
    const where: Prisma.CommunityPostWhereInput = {};
    if (category && category !== 'all') where.category = category;
    if (hidden === 'true') where.isHidden = true;
    else if (hidden === 'false') where.isHidden = false;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, username: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminToggleHide(id: string, explicit?: boolean) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new Error('Not found');
    const isHidden = typeof explicit === 'boolean' ? explicit : !post.isHidden;
    return this.prisma.communityPost.update({ where: { id }, data: { isHidden } });
  }

  async adminTogglePin(id: string, explicit?: boolean) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new Error('Not found');
    const isPinned = typeof explicit === 'boolean' ? explicit : !post.isPinned;
    return this.prisma.communityPost.update({ where: { id }, data: { isPinned } });
  }

  async adminChangeCategory(id: string, category: string) {
    if (!category) throw new Error('카테고리가 필요합니다');
    return this.prisma.communityPost.update({ where: { id }, data: { category } });
  }

  async adminDelete(id: string) {
    await this.prisma.communityPost.delete({ where: { id } });
    return { success: true };
  }

  async adminBulk(action: 'hide' | 'delete' | 'show', ids: string[]) {
    if (!ids.length) return { affected: 0 };
    if (action === 'delete') {
      const result = await this.prisma.communityPost.deleteMany({ where: { id: { in: ids } } });
      return { affected: result.count };
    }
    const isHidden = action === 'hide';
    const result = await this.prisma.communityPost.updateMany({
      where: { id: { in: ids } },
      data: { isHidden },
    });
    return { affected: result.count };
  }
}
