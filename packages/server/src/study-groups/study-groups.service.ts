import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { ForbiddenWordsService } from '../forbidden-words/forbidden-words.service';

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

type StudyGroupAttachment = { url: string; name: string; size: number; type: string };

export type AdminStudyGroupUpdateInput = {
  name?: string;
  description?: string;
  companyTier?: string;
  cafeCategory?: string;
  experienceLevel?: string;
  isPrivate?: boolean;
  maxMembers?: number;
};

@Injectable()
export class StudyGroupsService {
  constructor(
    private prisma: PrismaService,
    private config: SystemConfigService,
    private forbiddenWords: ForbiddenWordsService,
  ) {}

  async findAll(filters: StudyGroupListFilters) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = Math.min(filters.limit || 20, 50);

    const where: Prisma.StudyGroupWhereInput = {};

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

    // P2-3 — openOnly 를 DB 레벨에서 처리 (member_count < max_members).
    // Prisma 의 컬럼-컬럼 비교 (fields 참조) 사용 → pagination 정확성 확보.
    if (filters.openOnly) {
      const existingMemberCount =
        typeof where.memberCount === 'object' && where.memberCount !== null
          ? where.memberCount
          : {};
      where.memberCount = {
        ...existingMemberCount,
        lt: this.prisma.studyGroup.fields.maxMembers,
      };
    }

    const orderBy: Prisma.StudyGroupOrderByWithRelationInput[] = (() => {
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

    const [items, total] = await Promise.all([
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
    // 길이 검증 — XSS / DB 비용 가드 (P1-3)
    const question = (data.question || '').trim();
    if (question.length < 2 || question.length > 1000) {
      throw new BadRequestException('질문은 2~1000자여야 합니다');
    }
    const sampleAnswer = (data.sampleAnswer || '').trim().slice(0, 5000);
    const category = (data.category || '').trim().slice(0, 50);
    const difficulty = ['beginner', 'intermediate', 'advanced'].includes(data.difficulty || '')
      ? (data.difficulty as string)
      : 'intermediate';
    await this.forbiddenWords.validateOrThrow(question, sampleAnswer);

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
        question,
        sampleAnswer,
        category,
        difficulty,
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
    const where: Prisma.StudyGroupWhereInput = {};
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

  /** Owner — 본인 그룹의 공개/비공개, 이름, 설명, 정원 변경. */
  async ownerUpdate(
    id: string,
    ownerId: string,
    data: {
      name?: string;
      description?: string;
      isPrivate?: boolean;
      maxMembers?: number;
    },
  ) {
    if (!ownerId) throw new ForbiddenException('로그인이 필요합니다');
    const group = await this.prisma.studyGroup.findUnique({
      where: { id },
      select: { ownerId: true, memberCount: true },
    });
    if (!group) throw new NotFoundException('스터디 그룹을 찾을 수 없습니다');
    if (group.ownerId !== ownerId) {
      throw new ForbiddenException('owner 만 수정할 수 있습니다');
    }
    const patch: Record<string, unknown> = {};
    if (typeof data.name === 'string' && data.name.trim()) {
      patch.name = data.name.trim().slice(0, 100);
    }
    if (typeof data.description === 'string') {
      patch.description = data.description.slice(0, 1000);
    }
    if (typeof data.isPrivate === 'boolean') patch.isPrivate = data.isPrivate;
    if (typeof data.maxMembers === 'number') {
      // 현 멤버 수보다 작게 설정 불가
      patch.maxMembers = Math.min(Math.max(data.maxMembers, group.memberCount), 500);
    }
    return this.prisma.studyGroup.update({ where: { id }, data: patch });
  }

  async adminUpdate(id: string, data: AdminStudyGroupUpdateInput) {
    const patch: Prisma.StudyGroupUpdateInput = {};
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

  /** [관리자] 전체 그룹 게시글 모더레이션 목록 — 그룹/작성자/첨부 포함, 최신순. */
  async adminListPosts(params: { q?: string; groupId?: string; page: number; limit: number }) {
    const { q, groupId, page, limit } = params;
    const where: Prisma.StudyGroupPostWhereInput = {};
    if (groupId) where.groupId = groupId;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.studyGroupPost.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          group: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.studyGroupPost.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** [관리자] 게시글 삭제 — 댓글/리액션/좋아요 cascade. */
  async adminDeletePost(postId: string) {
    const post = await this.prisma.studyGroupPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    await this.prisma.studyGroupPost.delete({ where: { id: postId } });
    return { success: true };
  }

  /** [관리자] 게시글에서 특정 첨부(url 일치) 제거. */
  async adminRemovePostAttachment(postId: string, url: string) {
    if (!url || typeof url !== 'string') {
      throw new BadRequestException('제거할 첨부 url 이 필요합니다');
    }
    const post = await this.prisma.studyGroupPost.findUnique({
      where: { id: postId },
      select: { id: true, attachments: true },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    const list = Array.isArray(post.attachments)
      ? (post.attachments as Array<{ url?: string }>)
      : [];
    const next = list.filter((a) => a?.url !== url);
    if (next.length === list.length) {
      throw new NotFoundException('해당 첨부를 찾을 수 없습니다');
    }
    return this.prisma.studyGroupPost.update({
      where: { id: postId },
      data: { attachments: next as Prisma.InputJsonValue },
      select: { id: true, attachments: true },
    });
  }

  /** [관리자] 댓글 삭제 — 권한 검증 없이 tombstone 코어 재사용. */
  async adminDeleteComment(commentId: string) {
    const c = await this.prisma.studyGroupPostComment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true, content: true },
    });
    if (!c) throw new NotFoundException('댓글을 찾을 수 없습니다');
    return this.deleteCommentCore(c);
  }

  /** [관리자] 문제 답변 삭제 — 권한 검증 없이 tombstone 코어 재사용. */
  async adminDeleteAnswer(answerId: string) {
    const answer = await this.prisma.studyGroupQuestionAnswer.findUnique({
      where: { id: answerId },
      include: { question: { select: { id: true } } },
    });
    if (!answer) throw new NotFoundException('답변을 찾을 수 없습니다');
    return this.deleteAnswerCore(answer);
  }

  /** [관리자] 게시글 댓글 목록 — 접근 게이트 없이 모더레이션용 조회 (tombstone 포함). */
  async adminListPostComments(postId: string) {
    const post = await this.prisma.studyGroupPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    return this.prisma.studyGroupPostComment.findMany({
      where: { postId },
      orderBy: [{ createdAt: 'asc' }],
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  /** [관리자] 전체 그룹 문제 답변 모더레이션 목록 — 질문/그룹/작성자 포함, 최신순. */
  async adminListAnswers(params: { q?: string; groupId?: string; page: number; limit: number }) {
    const { q, groupId, page, limit } = params;
    const where: Prisma.StudyGroupQuestionAnswerWhereInput = {};
    if (q) where.body = { contains: q, mode: 'insensitive' };
    if (groupId) where.question = { groupId };
    const [items, total] = await Promise.all([
      this.prisma.studyGroupQuestionAnswer.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          question: {
            select: {
              id: true,
              question: true,
              groupId: true,
              group: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.studyGroupQuestionAnswer.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
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
    const where: Prisma.StudyGroupPostWhereInput = { groupId };
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
    const orderBy: Prisma.StudyGroupPostOrderByWithRelationInput[] = (() => {
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
      reactionCount: p._count?.reactions ?? 0,
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
    const attachments = this.normalizeAttachments(data.attachments);
    return this.prisma.studyGroupPost.create({
      data: {
        group: { connect: { id: groupId } },
        user: { connect: { id: userId } },
        title,
        content,
        category,
        attachments,
        tags,
        isPinned,
      },
    });
  }

  /**
   * P3-5 — Intl.Segmenter 로 한국어/이모지 grapheme 안전한 truncate.
   * 기존 `slice(0, 30)` 는 string 의 코드유닛 기준이라 한글 자모/이모지가 깨질 수 있음.
   */
  private static readonly TAG_SEGMENTER =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter !== 'undefined'
      ? new Intl.Segmenter('ko', { granularity: 'grapheme' })
      : null;

  private static truncateByGrapheme(s: string, max: number): string {
    if (s.length <= max) return s; // 짧은 입력은 fast path
    const seg = StudyGroupsService.TAG_SEGMENTER;
    if (!seg) return s.slice(0, max);
    let count = 0;
    let cut = s.length;
    for (const { index } of seg.segment(s)) {
      if (count >= max) {
        cut = index;
        break;
      }
      count++;
    }
    return s.slice(0, cut);
  }

  private normalizeTags(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of raw) {
      if (typeof t !== 'string') continue;
      const v = StudyGroupsService.truncateByGrapheme(t.trim().toLowerCase(), 30);
      if (!v || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
      if (out.length >= 10) break;
    }
    return out;
  }

  /**
   * P2-9 — 게시글 첨부 JSON 검증 + sanitize.
   * URL 은 https + host whitelist, 또는 안전한 data: 이미지/PDF(업로드 폴백)만 허용.
   * file:// , javascript:, data:text/html 등은 차단.
   * shape: { url, name, size, type } 각 필드 길이/타입 검증. 최대 10개.
   */
  private static readonly ALLOWED_ATTACHMENT_HOSTS = [
    'res.cloudinary.com',
    'storage.googleapis.com',
    'firebasestorage.googleapis.com',
    'lh3.googleusercontent.com',
    'images.unsplash.com',
  ];

  /**
   * data: URL 허용 prefix — Cloudinary 미설정(개발) 업로드 폴백 전용.
   * 렌더링이 안전한 이미지/PDF mimetype 의 base64 만 통과 (data:text/html XSS 차단).
   */
  private static readonly ALLOWED_DATA_URL_PREFIXES = [
    'data:image/jpeg;base64,',
    'data:image/png;base64,',
    'data:image/webp;base64,',
    'data:image/gif;base64,',
    'data:application/pdf;base64,',
  ];

  /** 첨부 1개당 2MB 상한 — base64 팽창(4/3) + prefix 여유 포함 문자열 길이 상한 */
  private static readonly MAX_DATA_URL_LENGTH = 2_900_000;

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
      // size: 50MB 상한 (메타데이터)
      if (size < 0 || size > 50 * 1024 * 1024) continue;

      // 1) data: URL — 허용 prefix + 길이 상한 (업로드 폴백 경로)
      if (url.startsWith('data:')) {
        const prefixOk = StudyGroupsService.ALLOWED_DATA_URL_PREFIXES.some((p) =>
          url.startsWith(p),
        );
        if (!prefixOk || url.length > StudyGroupsService.MAX_DATA_URL_LENGTH) continue;
        out.push({ url, name, size, type });
        continue;
      }

      // 2) https URL — 허용 host 화이트리스트
      if (url.length > 2048) continue;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        continue;
      }
      if (parsed.protocol !== 'https:') continue;
      const hostOk = StudyGroupsService.ALLOWED_ATTACHMENT_HOSTS.some(
        (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`),
      );
      if (!hostOk) continue;

      out.push({ url, name, size, type });
    }
    return out;
  }

  /**
   * 업로드 전 그룹 접근 검증 — createPost 와 동일한 게이트 (멤버 또는 공개 그룹).
   * 첨부 업로드 endpoint (controller) 에서 사용.
   */
  async assertPostAccess(groupId: string, userId: string) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    return this.assertMemberOrPublic(groupId, userId);
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
      attachments: StudyGroupAttachment[];
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
    const patch: Prisma.StudyGroupPostUpdateInput = {};
    if (data.title !== undefined) patch.title = data.title.trim().slice(0, 100);
    if (data.content !== undefined) patch.content = data.content.trim().slice(0, 20000);
    if (data.category !== undefined) patch.category = data.category;
    if (data.isPinned !== undefined && group?.ownerId === userId) patch.isPinned = data.isPinned;
    if (data.tags !== undefined) patch.tags = this.normalizeTags(data.tags);
    // 첨부 교체(작성자 삭제 포함) — 동일한 sanitize 경로
    if (data.attachments !== undefined) {
      patch.attachments = this.normalizeAttachments(data.attachments);
    }
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

  /**
   * 게시글 좋아요 — 토글 동작.
   * `StudyGroupPostLike` unique 제약으로 사용자당 1회 좋아요.
   * 이미 좋아요한 경우 다시 호출하면 취소.
   */
  async likePost(postId: string, userId: string) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    const post = await this.prisma.studyGroupPost.findUnique({
      where: { id: postId },
      select: { id: true, groupId: true },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    await this.assertMemberOrPublic(post.groupId, userId);

    const existing = await this.prisma.studyGroupPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.studyGroupPostLike.delete({ where: { id: existing.id } }),
        this.prisma.studyGroupPost.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
          select: { id: true, likeCount: true },
        }),
      ]);
      return { id: updated.id, likeCount: updated.likeCount, liked: false };
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.studyGroupPostLike.create({ data: { postId, userId } }),
      this.prisma.studyGroupPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
        select: { id: true, likeCount: true },
      }),
    ]);
    return { id: updated.id, likeCount: updated.likeCount, liked: true };
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

  /**
   * 문제 추천(upvote) — 토글 방식.
   * `StudyGroupQuestionVote` unique 제약으로 사용자당 1회만 가능.
   * 이미 추천한 경우 다시 호출하면 취소 (toggle off).
   */
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

    const existing = await this.prisma.studyGroupQuestionVote.findUnique({
      where: { questionId_userId: { questionId, userId } },
    });

    if (existing) {
      // 이미 추천 → 취소
      const [, updated] = await this.prisma.$transaction([
        this.prisma.studyGroupQuestionVote.delete({ where: { id: existing.id } }),
        this.prisma.studyGroupQuestion.update({
          where: { id: questionId },
          data: { upvotes: { decrement: 1 } },
          select: { id: true, upvotes: true },
        }),
      ]);
      return { id: updated.id, upvotes: updated.upvotes, upvoted: false };
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.studyGroupQuestionVote.create({
        data: { questionId, userId },
      }),
      this.prisma.studyGroupQuestion.update({
        where: { id: questionId },
        data: { upvotes: { increment: 1 } },
        select: { id: true, upvotes: true },
      }),
    ]);
    return { id: updated.id, upvotes: updated.upvotes, upvoted: true };
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
        select: { id: true, postId: true, parentId: true, content: true },
      });
      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('잘못된 부모 댓글입니다');
      }
      if (parent.parentId) {
        throw new BadRequestException('대대댓글은 지원하지 않습니다');
      }
      if (parent.content === '') {
        throw new BadRequestException('삭제된 댓글에는 답글을 달 수 없습니다');
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
    return this.deleteCommentCore(c);
  }

  /**
   * 댓글 삭제 공통 코어 (권한 검증은 호출부 책임).
   * 답글이 달린 댓글은 hard delete 대신 content='' tombstone 으로 전환해
   * 스레드(답글)를 보존한다 — 클라이언트는 빈 content 를 "삭제된 댓글" 플레이스홀더로 렌더.
   * content==='' 는 작성 시 최소 1자 검증으로 정상 댓글에선 불가능한 sentinel.
   */
  private async deleteCommentCore(c: { id: string; postId: string; content: string }) {
    // 이미 tombstone — 멱등 처리 (count 이중 차감 방지)
    if (c.content === '') return { success: true, tombstoned: true };

    const replyCount = await this.prisma.studyGroupPostComment.count({
      where: { parentId: c.id },
    });

    if (replyCount > 0) {
      await this.prisma.$transaction([
        this.prisma.studyGroupPostComment.update({
          where: { id: c.id },
          data: { content: '' },
        }),
        this.prisma.studyGroupPost.update({
          where: { id: c.postId },
          data: { commentCount: { decrement: 1 } },
        }),
      ]);
      return { success: true, tombstoned: true };
    }

    const target = await this.prisma.studyGroupPostComment.findUnique({
      where: { id: c.id },
      select: { parentId: true },
    });
    await this.prisma.$transaction([
      this.prisma.studyGroupPostComment.delete({ where: { id: c.id } }),
      this.prisma.studyGroupPost.update({
        where: { id: c.postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);
    // 부모가 tombstone 인데 남은 답글이 없으면 빈 껍데기 정리 (count 는 tombstone 시점에 이미 차감됨)
    if (target?.parentId) {
      const parent = await this.prisma.studyGroupPostComment.findUnique({
        where: { id: target.parentId },
        select: { id: true, content: true, _count: { select: { replies: true } } },
      });
      if (parent && parent.content === '' && parent._count.replies === 0) {
        await this.prisma.studyGroupPostComment.delete({ where: { id: parent.id } });
      }
    }
    return { success: true, tombstoned: false };
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
      myRsvp: Array.isArray(e.rsvps) ? (e.rsvps[0]?.status ?? null) : null,
      rsvpCount: e._count?.rsvps ?? 0,
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

  // ─────────────────────────────────────────────
  // 스터디 문제 답변 (StudyGroupQuestionAnswer)
  //   - 멤버끼리 답변을 비교/공유하고 좋아요로 베스트 답변을 선별.
  //   - parentId 로 1단계 답글 (대대댓글은 차단).
  //   - upvote 는 별도 StudyGroupQuestionAnswerVote 테이블 (사용자당 1회).
  // ─────────────────────────────────────────────

  /** 스터디 문제의 답변 목록 — 멤버 또는 공개 그룹에서만 조회 가능. */
  async listAnswers(
    questionId: string,
    userId?: string,
    opts: { sort?: 'upvotes' | 'recent' } = {},
  ) {
    const question = await this.prisma.studyGroupQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, groupId: true },
    });
    if (!question) throw new NotFoundException('문제를 찾을 수 없습니다');
    await this.assertMemberOrPublic(question.groupId, userId);

    const orderBy =
      opts.sort === 'recent'
        ? [{ createdAt: 'desc' as const }]
        : [{ upvotes: 'desc' as const }, { createdAt: 'desc' as const }];

    const answers = await this.prisma.studyGroupQuestionAnswer.findMany({
      where: { questionId },
      orderBy,
      take: 200,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // 본인이 추천했는지 표시 (로그인 사용자만)
    let myVoteIds = new Set<string>();
    if (userId && answers.length > 0) {
      const votes = await this.prisma.studyGroupQuestionAnswerVote.findMany({
        where: {
          userId,
          answerId: { in: answers.map((a) => a.id) },
        },
        select: { answerId: true },
      });
      myVoteIds = new Set(votes.map((v) => v.answerId));
    }

    return answers.map((a) => ({
      ...a,
      upvoted: myVoteIds.has(a.id),
    }));
  }

  /** 답변 작성 — 멤버 또는 공개 그룹에서 작성 가능. parentId 지정 시 답글로 처리. */
  async createAnswer(
    questionId: string,
    userId: string,
    data: { body: string; parentId?: string | null },
  ) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    const body = (data.body || '').trim();
    if (body.length < 2 || body.length > 5000) {
      throw new BadRequestException('답변은 2~5000자여야 합니다');
    }

    const question = await this.prisma.studyGroupQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, groupId: true, userId: true, question: true },
    });
    if (!question) throw new NotFoundException('문제를 찾을 수 없습니다');
    await this.assertMemberOrPublic(question.groupId, userId);

    // parent 검증 — 대대댓글 차단
    if (data.parentId) {
      const parent = await this.prisma.studyGroupQuestionAnswer.findUnique({
        where: { id: data.parentId },
        select: { id: true, questionId: true, parentId: true, body: true },
      });
      if (!parent || parent.questionId !== questionId) {
        throw new BadRequestException('잘못된 부모 답변입니다');
      }
      if (parent.parentId) {
        throw new BadRequestException('답글에는 답글을 달 수 없습니다');
      }
      if (parent.body === '') {
        throw new BadRequestException('삭제된 답변에는 답글을 달 수 없습니다');
      }
    }

    const [answer] = await this.prisma.$transaction([
      this.prisma.studyGroupQuestionAnswer.create({
        data: {
          questionId,
          userId,
          parentId: data.parentId || null,
          body,
        },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      // answerCount cache 갱신 — top-level 답변만 카운트 (답글은 제외)
      ...(!data.parentId
        ? [
            this.prisma.studyGroupQuestion.update({
              where: { id: questionId },
              data: { answerCount: { increment: 1 } },
            }),
          ]
        : []),
    ]);
    return answer;
  }

  /** 답변 수정 — 본인만 가능. */
  async updateAnswer(answerId: string, userId: string, data: { body: string }) {
    const answer = await this.prisma.studyGroupQuestionAnswer.findUnique({
      where: { id: answerId },
      select: { id: true, userId: true, parentId: true, questionId: true },
    });
    if (!answer) throw new NotFoundException('답변을 찾을 수 없습니다');
    if (answer.userId !== userId) {
      throw new ForbiddenException('본인 답변만 수정할 수 있습니다');
    }
    const body = (data.body || '').trim();
    if (body.length < 2 || body.length > 5000) {
      throw new BadRequestException('답변은 2~5000자여야 합니다');
    }
    return this.prisma.studyGroupQuestionAnswer.update({
      where: { id: answerId },
      data: { body },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  /** 답변 삭제 — 본인 또는 그룹 owner. */
  async deleteAnswer(answerId: string, userId: string) {
    const answer = await this.prisma.studyGroupQuestionAnswer.findUnique({
      where: { id: answerId },
      include: { question: { select: { id: true, groupId: true } } },
    });
    if (!answer) throw new NotFoundException('답변을 찾을 수 없습니다');
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: answer.question.groupId },
      select: { ownerId: true },
    });
    if (answer.userId !== userId && group?.ownerId !== userId) {
      throw new ForbiddenException('답변 삭제 권한이 없습니다');
    }
    return this.deleteAnswerCore(answer);
  }

  /**
   * 답변 삭제 공통 코어 (권한 검증은 호출부 책임).
   * 답글이 달린 top-level 답변은 body='' tombstone 으로 전환해 답글 스레드를 보존.
   * body==='' 는 작성 시 최소 2자 검증으로 정상 답변에선 불가능한 sentinel.
   */
  private async deleteAnswerCore(answer: {
    id: string;
    parentId: string | null;
    body: string;
    question: { id: string };
  }) {
    // 이미 tombstone — 멱등 처리 (answerCount 이중 차감 방지)
    if (answer.body === '') return { success: true, tombstoned: true };

    const replyCount = await this.prisma.studyGroupQuestionAnswer.count({
      where: { parentId: answer.id },
    });

    if (!answer.parentId && replyCount > 0) {
      await this.prisma.$transaction([
        this.prisma.studyGroupQuestionAnswer.update({
          where: { id: answer.id },
          data: { body: '' },
        }),
        this.prisma.studyGroupQuestion.update({
          where: { id: answer.question.id },
          data: { answerCount: { decrement: 1 } },
        }),
      ]);
      return { success: true, tombstoned: true };
    }

    await this.prisma.$transaction([
      this.prisma.studyGroupQuestionAnswer.delete({ where: { id: answer.id } }),
      // top-level 답변 삭제 시 cache 갱신
      ...(!answer.parentId
        ? [
            this.prisma.studyGroupQuestion.update({
              where: { id: answer.question.id },
              data: { answerCount: { decrement: 1 } },
            }),
          ]
        : []),
    ]);
    // 답글 삭제 후 tombstone 부모에 남은 답글이 없으면 빈 껍데기 정리
    if (answer.parentId) {
      const parent = await this.prisma.studyGroupQuestionAnswer.findUnique({
        where: { id: answer.parentId },
        select: { id: true, body: true, _count: { select: { replies: true } } },
      });
      if (parent && parent.body === '' && parent._count.replies === 0) {
        await this.prisma.studyGroupQuestionAnswer.delete({ where: { id: parent.id } });
      }
    }
    return { success: true, tombstoned: false };
  }

  /** 답변 추천(좋아요) — 토글, 사용자당 1회. 본인 답변 추천 불가. */
  async upvoteAnswer(answerId: string, userId: string) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    const answer = await this.prisma.studyGroupQuestionAnswer.findUnique({
      where: { id: answerId },
      include: { question: { select: { groupId: true } } },
    });
    if (!answer) throw new NotFoundException('답변을 찾을 수 없습니다');
    await this.assertMemberOrPublic(answer.question.groupId, userId);
    if (answer.body === '') {
      throw new BadRequestException('삭제된 답변은 추천할 수 없습니다');
    }
    if (answer.userId === userId) {
      throw new BadRequestException('본인 답변은 추천할 수 없습니다');
    }

    const existing = await this.prisma.studyGroupQuestionAnswerVote.findUnique({
      where: { answerId_userId: { answerId, userId } },
    });

    if (existing) {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.studyGroupQuestionAnswerVote.delete({ where: { id: existing.id } }),
        this.prisma.studyGroupQuestionAnswer.update({
          where: { id: answerId },
          data: { upvotes: { decrement: 1 } },
          select: { id: true, upvotes: true },
        }),
      ]);
      return { id: updated.id, upvotes: updated.upvotes, upvoted: false };
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.studyGroupQuestionAnswerVote.create({ data: { answerId, userId } }),
      this.prisma.studyGroupQuestionAnswer.update({
        where: { id: answerId },
        data: { upvotes: { increment: 1 } },
        select: { id: true, upvotes: true },
      }),
    ]);
    return { id: updated.id, upvotes: updated.upvotes, upvoted: true };
  }
}
