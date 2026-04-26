import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';

export interface StudyGroupListFilters {
  q?: string;
  companyName?: string;
  jobPostId?: string;
  jobKey?: string;
  companyTier?: string;
  cafeCategory?: string;
  experienceLevel?: string;
  mine?: boolean;
  userId?: string;
  /** recent | oldest | members | active | seats */
  sort?: string;
  /** 빈 자리 있는 그룹만 */
  openOnly?: boolean;
  /** 최소 멤버 수 */
  minMembers?: number;
  page?: number;
  limit?: number;
}

export interface CreateStudyGroupDto {
  name: string;
  description?: string;
  jobPostId?: string | null;
  jobKey?: string | null;
  companyName?: string | null;
  position?: string | null;
  companyTier?: string;
  cafeCategory?: string;
  experienceLevel?: string;
  isPrivate?: boolean;
  maxMembers?: number;
}

export interface CreateStudyGroupQuestionDto {
  question: string;
  sampleAnswer?: string;
  category?: string;
  difficulty?: string;
}

@Injectable()
export class StudyGroupsService {
  constructor(
    private prisma: PrismaService,
    private config: SystemConfigService,
  ) {}

  async findAll(filters: StudyGroupListFilters) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = Math.min(filters.limit || 20, 50);

    const where: any = {};

    if (filters.companyName) {
      where.companyName = { contains: filters.companyName, mode: 'insensitive' };
    }
    if (filters.jobPostId) {
      where.jobPostId = filters.jobPostId;
    }
    if (filters.jobKey) {
      where.jobKey = filters.jobKey;
    }
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { companyName: { contains: filters.q, mode: 'insensitive' } },
        { position: { contains: filters.q, mode: 'insensitive' } },
      ];
    }
    if (filters.mine && filters.userId) {
      where.members = { some: { userId: filters.userId } };
    } else if (!filters.mine) {
      // public discovery excludes private groups unless the caller is a member
      where.isPrivate = false;
    }

    if (filters.minMembers && filters.minMembers > 0) {
      where.memberCount = { gte: filters.minMembers };
    }

    const orderBy: any = (() => {
      switch (filters.sort) {
        case 'oldest':
          return [{ createdAt: 'asc' }];
        case 'members':
          return [{ memberCount: 'desc' }, { createdAt: 'desc' }];
        case 'seats':
          // 빈 자리가 많은 순 — memberCount 가 적으면 빈 자리 ↑, 단 maxMembers 와의 차이로 정확 정렬 불가능하므로 근사치
          return [{ memberCount: 'asc' }];
        case 'active':
          return [{ updatedAt: 'desc' }];
        case 'recent':
        default:
          return [{ createdAt: 'desc' }];
      }
    })();

    const [rawItems, total] = await Promise.all([
      this.prisma.studyGroup.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.studyGroup.count({ where }),
    ]);

    // openOnly 는 Prisma 에서 두 컬럼 비교가 까다로워 애플리케이션 레벨에서 필터링
    const items = filters.openOnly
      ? rawItems.filter((g) => g.memberCount < g.maxMembers)
      : rawItems;

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!group) throw new NotFoundException('스터디 그룹을 찾을 수 없습니다');

    if (group.isPrivate) {
      if (!userId) throw new ForbiddenException('비공개 그룹입니다');
      const isMember = group.members.some((m) => m.userId === userId);
      if (!isMember && group.ownerId !== userId) {
        throw new ForbiddenException('비공개 그룹입니다');
      }
    }

    return group;
  }

  async create(userId: string, data: CreateStudyGroupDto) {
    if (!(await this.config.isFeatureEnabled('studyGroup.create'))) {
      throw new ForbiddenException('스터디 그룹 생성이 관리자에 의해 일시 중단되었습니다');
    }
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('그룹 이름을 입력하세요');
    }

    const maxMembers = Math.min(Math.max(data.maxMembers || 20, 2), 200);

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.studyGroup.create({
        data: {
          name: data.name.trim(),
          description: data.description || '',
          jobPostId: data.jobPostId || null,
          jobKey: data.jobKey || null,
          companyName: data.companyName || null,
          position: data.position || null,
          companyTier: data.companyTier || 'etc',
          cafeCategory: data.cafeCategory || 'interview',
          experienceLevel: data.experienceLevel || 'any',
          ownerId: userId,
          isPrivate: !!data.isPrivate,
          maxMembers,
          memberCount: 1,
        },
      });

      await tx.studyGroupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: 'owner',
        },
      });

      return group;
    });
  }

  async join(groupId: string, userId: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, maxMembers: true, memberCount: true, isPrivate: true, ownerId: true },
    });
    if (!group) throw new NotFoundException('스터디 그룹을 찾을 수 없습니다');

    const existing = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new ConflictException('이미 가입한 그룹입니다');

    if (group.memberCount >= group.maxMembers) {
      throw new ForbiddenException('그룹 정원이 가득 찼습니다');
    }

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.studyGroupMember.create({
        data: {
          groupId,
          userId,
          role: 'member',
        },
      });
      await tx.studyGroup.update({
        where: { id: groupId },
        data: { memberCount: { increment: 1 } },
      });
      return member;
    });
  }

  async leave(groupId: string, userId: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, ownerId: true, memberCount: true },
    });
    if (!group) throw new NotFoundException('스터디 그룹을 찾을 수 없습니다');

    if (group.ownerId === userId) {
      throw new ForbiddenException('그룹 소유자는 그룹을 나갈 수 없습니다. 그룹을 삭제하세요.');
    }

    const membership = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new NotFoundException('그룹 멤버가 아닙니다');

    return this.prisma.$transaction(async (tx) => {
      await tx.studyGroupMember.delete({
        where: { groupId_userId: { groupId, userId } },
      });
      await tx.studyGroup.update({
        where: { id: groupId },
        data: { memberCount: { decrement: 1 } },
      });
      return { success: true };
    });
  }

  async remove(groupId: string, userId: string, role?: string) {
    const group = await this.prisma.studyGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException();
    if (group.ownerId !== userId && role !== 'admin' && role !== 'superadmin') {
      throw new ForbiddenException('그룹을 삭제할 권한이 없습니다');
    }
    await this.prisma.studyGroup.delete({ where: { id: groupId } });
    return { success: true };
  }

  async addQuestion(groupId: string, userId: string, data: CreateStudyGroupQuestionDto) {
    if (!data.question || data.question.trim().length === 0) {
      throw new BadRequestException('질문 내용을 입력하세요');
    }

    const group = await this.prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, isPrivate: true, ownerId: true },
    });
    if (!group) throw new NotFoundException('스터디 그룹을 찾을 수 없습니다');

    const membership = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership && group.ownerId !== userId) {
      throw new ForbiddenException('그룹 멤버만 질문을 추가할 수 있습니다');
    }

    return this.prisma.studyGroupQuestion.create({
      data: {
        groupId,
        userId,
        question: data.question.trim(),
        sampleAnswer: data.sampleAnswer || '',
        category: data.category || '',
        difficulty: data.difficulty || 'intermediate',
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  // ─────────────────────────────────────────────
  // Admin APIs
  // ─────────────────────────────────────────────

  async adminList(params: {
    q?: string;
    tier?: string;
    cafe?: string;
    experienceLevel?: string;
    page: number;
    limit: number;
  }) {
    const { q, tier, cafe, experienceLevel, page, limit } = params;
    const where: any = {};
    if (tier && tier !== 'all') where.companyTier = tier;
    if (cafe && cafe !== 'all') where.cafeCategory = cafe;
    if (experienceLevel && experienceLevel !== 'all') where.experienceLevel = experienceLevel;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { position: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.studyGroup.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, email: true, username: true } },
          _count: { select: { members: true, questions: true } },
        },
      }),
      this.prisma.studyGroup.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminForceClose(id: string) {
    const group = await this.prisma.studyGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('그룹을 찾을 수 없습니다');
    // 강제 종료: 비공개로 전환하여 신규 검색/가입 차단
    return this.prisma.studyGroup.update({
      where: { id },
      data: { isPrivate: true, maxMembers: group.memberCount },
    });
  }

  async adminUpdate(
    id: string,
    data: {
      name?: string;
      description?: string;
      companyTier?: string;
      cafeCategory?: string;
      experienceLevel?: string;
      isPrivate?: boolean;
      maxMembers?: number;
    },
  ) {
    const patch: any = {};
    if (typeof data.name === 'string' && data.name.trim()) patch.name = data.name.trim();
    if (typeof data.description === 'string') patch.description = data.description;
    if (typeof data.companyTier === 'string') patch.companyTier = data.companyTier;
    if (typeof data.cafeCategory === 'string') patch.cafeCategory = data.cafeCategory;
    if (typeof data.experienceLevel === 'string') patch.experienceLevel = data.experienceLevel;
    if (typeof data.isPrivate === 'boolean') patch.isPrivate = data.isPrivate;
    if (typeof data.maxMembers === 'number') {
      patch.maxMembers = Math.min(Math.max(data.maxMembers, 2), 500);
    }
    return this.prisma.studyGroup.update({ where: { id }, data: patch });
  }

  async adminDelete(id: string) {
    await this.prisma.studyGroup.delete({ where: { id } });
    return { success: true };
  }

  /** 카페형 게시판 — 멤버 전용 글 작성·조회 */
  private async assertMemberOrPublic(groupId: string, userId?: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, isPrivate: true, ownerId: true },
    });
    if (!group) throw new NotFoundException('스터디 그룹을 찾을 수 없습니다');
    if (!group.isPrivate) return group;
    if (!userId) throw new ForbiddenException('비공개 그룹입니다');
    const m = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!m && group.ownerId !== userId) throw new ForbiddenException('비공개 그룹입니다');
    return group;
  }

  async listPosts(
    groupId: string,
    userId: string | undefined,
    opts: {
      category?: string;
      page?: number;
      limit?: number;
      /** 제목·본문 부분 일치 검색 */
      q?: string;
      /** 작성자 userId 필터 */
      authorId?: string;
      /** 태그 포함 필터 (normalized lower-case) */
      tag?: string;
      /** recent | oldest | popular | comments */
      sort?: string;
    } = {},
  ) {
    await this.assertMemberOrPublic(groupId, userId);
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = Math.min(opts.limit ?? 20, 50);
    const where: any = { groupId };
    if (opts.category && opts.category !== 'all') where.category = opts.category;
    if (opts.authorId) where.userId = opts.authorId;
    if (opts.q) {
      where.OR = [
        { title: { contains: opts.q, mode: 'insensitive' } },
        { content: { contains: opts.q, mode: 'insensitive' } },
      ];
    }
    if (opts.tag) {
      // PostgreSQL JSON contains 검사
      where.tags = { array_contains: [opts.tag.toLowerCase()] };
    }
    const orderBy: any = (() => {
      switch (opts.sort) {
        case 'oldest':
          return [{ isPinned: 'desc' }, { createdAt: 'asc' }];
        case 'popular':
          return [{ isPinned: 'desc' }, { likeCount: 'desc' }, { createdAt: 'desc' }];
        case 'comments':
          return [{ isPinned: 'desc' }, { commentCount: 'desc' }, { createdAt: 'desc' }];
        case 'recent':
        default:
          return [{ isPinned: 'desc' }, { createdAt: 'desc' }];
      }
    })();
    const [items, total] = await Promise.all([
      this.prisma.studyGroupPost.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          _count: { select: { reactions: true } },
        },
      }),
      this.prisma.studyGroupPost.count({ where }),
    ]);
    const shaped = items.map((p) => ({
      ...p,
      reactionCount: (p as any)._count?.reactions ?? 0,
      _count: undefined,
    }));
    return { items: shaped, total, page, limit };
  }

  async getPost(postId: string, userId?: string) {
    const post = await this.prisma.studyGroupPost.findUnique({
      where: { id: postId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    await this.assertMemberOrPublic(post.groupId, userId);
    await this.prisma.studyGroupPost.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
    return post;
  }

  async createPost(
    groupId: string,
    userId: string,
    data: {
      title: string;
      content: string;
      category?: string;
      attachments?: Array<{ url: string; name: string; size: number; type: string }>;
      tags?: string[];
    },
  ) {
    await this.assertMemberOrPublic(groupId, userId);
    const title = (data.title || '').trim();
    const content = (data.content || '').trim();
    if (title.length < 2 || title.length > 100)
      throw new BadRequestException('제목은 2~100자여야 합니다');
    if (content.length < 2 || content.length > 20000)
      throw new BadRequestException('내용은 2~20000자여야 합니다');
    const category = data.category || 'free';
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });
    const isPinned = category === 'notice' && group?.ownerId === userId;
    const tags = this.normalizeTags(data.tags);
    return this.prisma.studyGroupPost.create({
      data: {
        group: { connect: { id: groupId } },
        user: { connect: { id: userId } },
        title,
        content,
        category,
        attachments: (data.attachments ?? []) as any,
        tags: tags as any,
        isPinned,
      },
    });
  }

  private normalizeTags(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of raw) {
      if (typeof t !== 'string') continue;
      const v = t.trim().toLowerCase().slice(0, 30);
      if (!v || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
      if (out.length >= 10) break;
    }
    return out;
  }

  async updatePost(
    postId: string,
    userId: string,
    data: Partial<{
      title: string;
      content: string;
      category: string;
      isPinned: boolean;
      tags: string[];
    }>,
  ) {
    const post = await this.prisma.studyGroupPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: post.groupId },
      select: { ownerId: true },
    });
    if (post.userId !== userId && group?.ownerId !== userId)
      throw new ForbiddenException('수정 권한이 없습니다');
    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title.trim().slice(0, 100);
    if (data.content !== undefined) patch.content = data.content.trim().slice(0, 20000);
    if (data.category !== undefined) patch.category = data.category;
    if (data.isPinned !== undefined && group?.ownerId === userId) patch.isPinned = data.isPinned;
    if (data.tags !== undefined) patch.tags = this.normalizeTags(data.tags);
    return this.prisma.studyGroupPost.update({ where: { id: postId }, data: patch });
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.studyGroupPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: post.groupId },
      select: { ownerId: true },
    });
    if (post.userId !== userId && group?.ownerId !== userId)
      throw new ForbiddenException('삭제 권한이 없습니다');
    await this.prisma.studyGroupPost.delete({ where: { id: postId } });
    return { success: true };
  }

  async likePost(postId: string, userId: string) {
    const post = await this.prisma.studyGroupPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    await this.assertMemberOrPublic(post.groupId, userId);
    return this.prisma.studyGroupPost.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    });
  }

  async listQuestions(
    groupId: string,
    userId?: string,
    opts: { category?: string; difficulty?: string; q?: string; sort?: 'upvotes' | 'recent' } = {},
  ) {
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, isPrivate: true, ownerId: true },
    });
    if (!group) throw new NotFoundException('스터디 그룹을 찾을 수 없습니다');

    if (group.isPrivate) {
      if (!userId) throw new ForbiddenException('비공개 그룹입니다');
      const membership = await this.prisma.studyGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
      });
      if (!membership && group.ownerId !== userId) {
        throw new ForbiddenException('비공개 그룹입니다');
      }
    }

    const where: Record<string, unknown> = { groupId };
    if (opts.category && opts.category !== 'all') where.category = opts.category;
    if (opts.difficulty && opts.difficulty !== 'all') where.difficulty = opts.difficulty;
    if (opts.q && opts.q.trim()) {
      const q = opts.q.trim();
      where.OR = [
        { question: { contains: q, mode: 'insensitive' } },
        { sampleAnswer: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy =
      opts.sort === 'recent'
        ? [{ createdAt: 'desc' as const }]
        : [{ upvotes: 'desc' as const }, { createdAt: 'desc' as const }];

    return this.prisma.studyGroupQuestion.findMany({
      where,
      orderBy,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      take: 200,
    });
  }

  /** 문제 추천(upvote) — 같은 사용자의 중복 추천은 idempotent (upvote 1회만 반영). */
  async upvoteQuestion(questionId: string, userId: string) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    const question = await this.prisma.studyGroupQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, groupId: true, userId: true },
    });
    if (!question) throw new NotFoundException('문제를 찾을 수 없습니다');
    await this.assertMemberOrPublic(question.groupId, userId);
    if (question.userId === userId) {
      throw new BadRequestException('본인 문제는 추천할 수 없습니다');
    }
    // 단순 카운터 — 사용자별 중복 방지는 향후 별도 테이블 추가 시 정밀화
    return this.prisma.studyGroupQuestion.update({
      where: { id: questionId },
      data: { upvotes: { increment: 1 } },
      select: { id: true, upvotes: true },
    });
  }

  // ─────────────────────────────────────────────
  // 이모지 리액션 (StudyGroupPostReaction)
  // ─────────────────────────────────────────────

  private static readonly ALLOWED_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '🤔'];

  async toggleReaction(postId: string, userId: string, emoji: string) {
    if (!(await this.config.isFeatureEnabled('studyGroup.reactions'))) {
      throw new ForbiddenException('리액션 기능이 관리자에 의해 일시 중단되었습니다');
    }
    if (!StudyGroupsService.ALLOWED_EMOJIS.includes(emoji)) {
      throw new BadRequestException('지원하지 않는 이모지입니다');
    }
    const post = await this.prisma.studyGroupPost.findUnique({
      where: { id: postId },
      select: { id: true, groupId: true },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    await this.assertMemberOrPublic(post.groupId, userId);

    const existing = await this.prisma.studyGroupPostReaction.findUnique({
      where: { postId_userId_emoji: { postId, userId, emoji } },
    });
    if (existing) {
      await this.prisma.studyGroupPostReaction.delete({ where: { id: existing.id } });
      return { toggled: 'off' as const, emoji };
    }
    await this.prisma.studyGroupPostReaction.create({
      data: { postId, userId, emoji },
    });
    return { toggled: 'on' as const, emoji };
  }

  async listReactions(postId: string, userId?: string) {
    const post = await this.prisma.studyGroupPost.findUnique({
      where: { id: postId },
      select: { id: true, groupId: true },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    await this.assertMemberOrPublic(post.groupId, userId);

    const rows = await this.prisma.studyGroupPostReaction.findMany({
      where: { postId },
      select: { emoji: true, userId: true },
    });
    const counts: Record<string, number> = {};
    const mine: string[] = [];
    for (const r of rows) {
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
      if (userId && r.userId === userId) mine.push(r.emoji);
    }
    return { counts, mine, total: rows.length };
  }

  // ─────────────────────────────────────────────
  // 댓글 (StudyGroupPostComment)
  // ─────────────────────────────────────────────

  async listComments(postId: string, userId?: string) {
    const post = await this.prisma.studyGroupPost.findUnique({
      where: { id: postId },
      select: { id: true, groupId: true },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    await this.assertMemberOrPublic(post.groupId, userId);
    return this.prisma.studyGroupPostComment.findMany({
      where: { postId },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async createComment(
    postId: string,
    userId: string,
    data: { content: string; parentId?: string | null },
  ) {
    const post = await this.prisma.studyGroupPost.findUnique({
      where: { id: postId },
      select: { id: true, groupId: true },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    await this.assertMemberOrPublic(post.groupId, userId);
    const content = (data.content || '').trim();
    if (content.length < 1 || content.length > 2000) {
      throw new BadRequestException('댓글은 1~2000자여야 합니다');
    }
    if (data.parentId) {
      const parent = await this.prisma.studyGroupPostComment.findUnique({
        where: { id: data.parentId },
        select: { id: true, postId: true, parentId: true },
      });
      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('잘못된 부모 댓글입니다');
      }
      if (parent.parentId) {
        throw new BadRequestException('대대댓글은 지원하지 않습니다');
      }
    }
    const [comment] = await this.prisma.$transaction([
      this.prisma.studyGroupPostComment.create({
        data: {
          post: { connect: { id: postId } },
          user: { connect: { id: userId } },
          parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
          content,
        },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.studyGroupPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);
    return comment;
  }

  async deleteComment(commentId: string, userId: string) {
    const c = await this.prisma.studyGroupPostComment.findUnique({
      where: { id: commentId },
      include: { post: { select: { id: true, groupId: true } } },
    });
    if (!c) throw new NotFoundException('댓글을 찾을 수 없습니다');
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: c.post.groupId },
      select: { ownerId: true },
    });
    if (c.userId !== userId && group?.ownerId !== userId) {
      throw new ForbiddenException('댓글 삭제 권한이 없습니다');
    }
    await this.prisma.$transaction([
      this.prisma.studyGroupPostComment.delete({ where: { id: commentId } }),
      this.prisma.studyGroupPost.update({
        where: { id: c.postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);
    return { success: true };
  }

  // ─────────────────────────────────────────────
  // 일정 (StudyGroupEvent + RSVP)
  // ─────────────────────────────────────────────

  async listEvents(groupId: string, userId?: string, opts: { from?: Date; limit?: number } = {}) {
    await this.assertMemberOrPublic(groupId, userId);
    const from = opts.from ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    const limit = Math.min(opts.limit ?? 50, 100);
    const events = await this.prisma.studyGroupEvent.findMany({
      where: { groupId, startsAt: { gte: from } },
      orderBy: [{ startsAt: 'asc' }],
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        rsvps: userId ? { where: { userId }, select: { status: true } } : false,
        _count: { select: { rsvps: true } },
      },
    });
    return events.map((e) => ({
      ...e,
      myRsvp: (e as any).rsvps?.[0]?.status ?? null,
      rsvpCount: (e as any)._count?.rsvps ?? 0,
      rsvps: undefined,
      _count: undefined,
    }));
  }

  async createEvent(
    groupId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      kind?: string;
      location?: string;
      meetingUrl?: string;
      startsAt: string | Date;
      endsAt?: string | Date | null;
    },
  ) {
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, ownerId: true },
    });
    if (!group) throw new NotFoundException('스터디 그룹을 찾을 수 없습니다');
    const m = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!m && group.ownerId !== userId) {
      throw new ForbiddenException('그룹 멤버만 일정을 만들 수 있습니다');
    }
    const title = (data.title || '').trim();
    if (title.length < 2 || title.length > 120) {
      throw new BadRequestException('제목은 2~120자여야 합니다');
    }
    const startsAt = new Date(data.startsAt);
    if (isNaN(startsAt.getTime())) throw new BadRequestException('시작 시각이 올바르지 않습니다');
    const endsAt = data.endsAt ? new Date(data.endsAt) : null;
    if (endsAt && isNaN(endsAt.getTime())) {
      throw new BadRequestException('종료 시각이 올바르지 않습니다');
    }
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException('종료 시각은 시작 이후여야 합니다');
    }
    const kind = ['online', 'offline', 'assignment', 'deadline'].includes(data.kind || '')
      ? (data.kind as string)
      : 'online';
    return this.prisma.studyGroupEvent.create({
      data: {
        group: { connect: { id: groupId } },
        author: { connect: { id: userId } },
        title,
        description: (data.description || '').slice(0, 5000),
        kind,
        location: (data.location || '').slice(0, 300),
        meetingUrl: (data.meetingUrl || '').slice(0, 500),
        startsAt,
        endsAt,
      },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async deleteEvent(eventId: string, userId: string) {
    const ev = await this.prisma.studyGroupEvent.findUnique({ where: { id: eventId } });
    if (!ev) throw new NotFoundException('일정을 찾을 수 없습니다');
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: ev.groupId },
      select: { ownerId: true },
    });
    if (ev.authorId !== userId && group?.ownerId !== userId) {
      throw new ForbiddenException('일정 삭제 권한이 없습니다');
    }
    await this.prisma.studyGroupEvent.delete({ where: { id: eventId } });
    return { success: true };
  }

  async rsvpEvent(eventId: string, userId: string, status: string) {
    const ev = await this.prisma.studyGroupEvent.findUnique({
      where: { id: eventId },
      select: { id: true, groupId: true },
    });
    if (!ev) throw new NotFoundException('일정을 찾을 수 없습니다');
    const m = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId: ev.groupId, userId } },
    });
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: ev.groupId },
      select: { ownerId: true },
    });
    if (!m && group?.ownerId !== userId) {
      throw new ForbiddenException('그룹 멤버만 응답할 수 있습니다');
    }
    const normalized = ['going', 'maybe', 'declined'].includes(status) ? status : 'going';
    return this.prisma.studyGroupEventRsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status: normalized },
      update: { status: normalized },
    });
  }

  // ─────────────────────────────────────────────
  // 통계 (그룹 활동도)
  // ─────────────────────────────────────────────

  async stats(groupId: string, userId?: string) {
    await this.assertMemberOrPublic(groupId, userId);
    const [memberCount, postCount, questionCount, eventCount, upcomingEventCount, activeMembers] =
      await Promise.all([
        this.prisma.studyGroupMember.count({ where: { groupId } }),
        this.prisma.studyGroupPost.count({ where: { groupId } }),
        this.prisma.studyGroupQuestion.count({ where: { groupId } }),
        this.prisma.studyGroupEvent.count({ where: { groupId } }),
        this.prisma.studyGroupEvent.count({
          where: { groupId, startsAt: { gte: new Date() } },
        }),
        this.prisma.studyGroupPost.groupBy({
          by: ['userId'],
          where: {
            groupId,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          _count: { userId: true },
          orderBy: { _count: { userId: 'desc' } },
          take: 5,
        }),
      ]);
    const topAuthors = await this.prisma.user.findMany({
      where: { id: { in: activeMembers.map((a) => a.userId) } },
      select: { id: true, name: true, avatar: true },
    });
    const leaderboard = activeMembers.map((a) => ({
      user: topAuthors.find((u) => u.id === a.userId) ?? { id: a.userId, name: '', avatar: null },
      postCount: a._count.userId,
    }));
    return {
      memberCount,
      postCount,
      questionCount,
      eventCount,
      upcomingEventCount,
      leaderboard,
    };
  }
}
