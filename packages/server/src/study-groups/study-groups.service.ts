import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private prisma: PrismaService) {}

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

    const [items, total] = await Promise.all([
      this.prisma.studyGroup.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
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
    opts: { category?: string; page?: number; limit?: number } = {},
  ) {
    await this.assertMemberOrPublic(groupId, userId);
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = Math.min(opts.limit ?? 20, 50);
    const where: any = { groupId };
    if (opts.category && opts.category !== 'all') where.category = opts.category;
    const [items, total] = await Promise.all([
      this.prisma.studyGroupPost.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.studyGroupPost.count({ where }),
    ]);
    return { items, total, page, limit };
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
    return this.prisma.studyGroupPost.create({
      data: {
        group: { connect: { id: groupId } },
        user: { connect: { id: userId } },
        title,
        content,
        category,
        attachments: (data.attachments ?? []) as any,
        isPinned,
      },
    });
  }

  async updatePost(
    postId: string,
    userId: string,
    data: Partial<{ title: string; content: string; category: string; isPinned: boolean }>,
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

  async listQuestions(groupId: string, userId?: string) {
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

    return this.prisma.studyGroupQuestion.findMany({
      where: { groupId },
      orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }
}
