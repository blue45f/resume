import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';

const FULL_INCLUDE = {
  personalInfo: true,
  experiences: { orderBy: { sortOrder: 'asc' as const } },
  educations: { orderBy: { sortOrder: 'asc' as const } },
  skills: { orderBy: { sortOrder: 'asc' as const } },
  projects: { orderBy: { sortOrder: 'asc' as const } },
  certifications: { orderBy: { sortOrder: 'asc' as const } },
  languages: { orderBy: { sortOrder: 'asc' as const } },
  awards: { orderBy: { sortOrder: 'asc' as const } },
  activities: { orderBy: { sortOrder: 'asc' as const } },
  tags: { include: { tag: true } },
};

// Helper to replace a child collection in a transaction
async function replaceCollection(
  tx: any,
  model: any,
  resumeId: string,
  items: any[] | undefined,
  mapper: (item: any, index: number) => any,
) {
  if (items === undefined) return;
  await model.deleteMany({ where: { resumeId } });
  if (items.length > 0) {
    await model.createMany({
      data: items.map((item, i) => ({ resumeId, ...mapper(item, i) })),
    });
  }
}

@Injectable()
export class ResumesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private systemConfig: SystemConfigService,
  ) {}

  // ── 이력서 신고 (reportResume) + 임계치 도달 시 자동 숨김 ─────
  async reportResume(resumeId: string, reporterId: string, reason: string, detail: string) {
    if (!reporterId) throw new ForbiddenException('로그인이 필요합니다');
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      select: { id: true, userId: true, visibility: true, reportCount: true },
    });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');
    if (resume.visibility !== 'public') {
      throw new BadRequestException('공개 이력서만 신고할 수 있습니다');
    }
    if (resume.userId === reporterId) {
      throw new BadRequestException('본인 이력서는 신고할 수 없습니다');
    }

    const allowedReasons = ['spam', 'inappropriate', 'fake', 'copyright', 'other'];
    const safeReason = allowedReasons.includes(reason) ? reason : 'other';
    const safeDetail = (detail || '').slice(0, 500);

    // (resumeId, reporterId) unique — 중복 시 update로 덮어씀
    await this.prisma.resumeReport.upsert({
      where: { resumeId_reporterId: { resumeId, reporterId } },
      create: { resumeId, reporterId, reason: safeReason, detail: safeDetail },
      update: { reason: safeReason, detail: safeDetail },
    });

    // reportCount 재계산 (unique 한 신고자 수 = count)
    const count = await this.prisma.resumeReport.count({ where: { resumeId } });
    const threshold = await this.systemConfig.getReportThreshold();
    const autoHidden = count >= threshold;
    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { reportCount: count, autoHidden },
    });
    return { reportCount: count, autoHidden, threshold };
  }

  // ── admin: 신고 관리 ────────────────────────────────
  async adminListReports(opts: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(Math.max(1, opts.limit ?? 20), 100);
    const [items, total] = await Promise.all([
      this.prisma.resumeReport.findMany({
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          resume: {
            select: {
              id: true,
              title: true,
              reportCount: true,
              autoHidden: true,
              visibility: true,
            },
          },
          reporter: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.resumeReport.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminListAutoHidden() {
    return this.prisma.resume.findMany({
      where: { autoHidden: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        reportCount: true,
        visibility: true,
        userId: true,
        updatedAt: true,
      },
    });
  }

  /** admin 이 자동숨김 해제 + reportCount 리셋 */
  async adminUnhideResume(id: string) {
    const resume = await this.prisma.resume.findUnique({ where: { id } });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');
    // 기존 신고 기록은 유지하되 resumeReport 테이블은 그대로 (감사 기록), 플래그만 해제
    return this.prisma.resume.update({
      where: { id },
      data: { autoHidden: false, reportCount: 0 },
    });
  }

  async adminDeleteReport(reportId: string) {
    const report = await this.prisma.resumeReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다');
    await this.prisma.resumeReport.delete({ where: { id: reportId } });
    // reportCount 재계산
    const count = await this.prisma.resumeReport.count({ where: { resumeId: report.resumeId } });
    const threshold = await this.systemConfig.getReportThreshold();
    await this.prisma.resume.update({
      where: { id: report.resumeId },
      data: { reportCount: count, autoHidden: count >= threshold },
    });
    return { success: true, newReportCount: count };
  }

  /** 이력서 열람 알림 — 소유자가 다를 때만 1시간 쿨타임으로 알림 생성 */
  /**
   * viewerId가 이 resume과 연결된 CoachingSession의 코치인지 확인.
   * 연결된 코치는 비공개 이력서라도 열람 허용 (예약된 피코칭 이력서).
   */
  private async isCoachOfResumeSession(resumeId: string, viewerId: string): Promise<boolean> {
    try {
      const coachProfile = await (this.prisma as any).coachProfile.findUnique({
        where: { userId: viewerId },
      });
      if (!coachProfile) return false;
      const session = await (this.prisma as any).coachingSession.findFirst({
        where: {
          resumeId,
          coachId: coachProfile.id,
          status: { in: ['requested', 'confirmed', 'completed'] },
        },
      });
      return !!session;
    } catch {
      return false;
    }
  }

  private async sendViewNotification(
    resumeId: string,
    resumeTitle: string,
    ownerId: string,
    viewerId?: string,
  ): Promise<void> {
    if (!ownerId) return;
    try {
      // 중복 알림 방지: 최근 1시간 내 같은 이력서 열람 알림이 있으면 건너뜀
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recent = await this.prisma.notification.findFirst({
        where: {
          userId: ownerId,
          type: 'resume_viewed',
          link: `/resumes/${resumeId}/preview`,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recent) return;

      // 뷰어 이름 조회 (로그인한 경우)
      let viewerName = '누군가';
      if (viewerId) {
        const viewer = await this.prisma.user.findUnique({
          where: { id: viewerId },
          select: { name: true, username: true },
        });
        if (viewer) viewerName = viewer.name || viewer.username || '누군가';
      }

      const title = resumeTitle || '이력서';
      await this.notifications.create(
        ownerId,
        'resume_viewed',
        `${viewerName}가 "${title}" 이력서를 열람했습니다`,
        `/resumes/${resumeId}/preview`,
      );
    } catch {
      // 알림 생성 실패는 무시 (주요 기능 차단 방지)
    }
  }

  async findAll(userId?: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100); // Cap at 100 to prevent abuse
    const where = userId ? { userId } : {};
    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          userId: true,
          viewCount: true,
          visibility: true,
          createdAt: true,
          updatedAt: true,
          personalInfo: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
              website: true,
              github: true,
              summary: true,
              photo: true,
              birthYear: true,
              links: true,
              military: true,
            },
          },
          tags: { include: { tag: true } },
          skills: { select: { id: true, category: true, items: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.resume.count({ where }),
    ]);
    return {
      data: resumes.map((r) => this.formatSummary(r)),
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
      limit: safeLimit,
    };
  }

  async findPublic(page = 1, limit = 20) {
    // publicResume 기능 OFF 시 빈 리스트 반환 (관리자가 공개 탐색 일시 중단)
    if (!(await this.systemConfig.isFeatureEnabled('publicResume'))) {
      return { data: [], page: 1, limit, total: 0, totalPages: 0 };
    }
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    // autoHidden=true 인 이력서는 신고 누적으로 숨김 — admin 은 별도 /admin/resumes 에서 조회
    const where = { visibility: 'public' as const, autoHidden: false };
    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          userId: true,
          viewCount: true,
          visibility: true,
          createdAt: true,
          updatedAt: true,
          personalInfo: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
              website: true,
              github: true,
              summary: true,
              photo: true,
              birthYear: true,
              links: true,
              military: true,
            },
          },
          tags: { include: { tag: true } },
          skills: { select: { id: true, category: true, items: true } },
          user: { select: { isOpenToWork: true, openToWorkRoles: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.resume.count({ where }),
    ]);
    return {
      data: resumes.map((r) => this.formatSummary(r)),
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
      limit: safeLimit,
    };
  }

  async searchPublic(opts: {
    query?: string;
    tag?: string;
    sort?: string;
    page: number;
    limit: number;
  }) {
    if (!(await this.systemConfig.isFeatureEnabled('publicResume'))) {
      return { data: [], total: 0, page: 1, limit: opts.limit };
    }
    opts.page = Math.max(1, opts.page);
    opts.limit = Math.min(Math.max(1, opts.limit), 100);
    // autoHidden (신고 누적) 자동 제외 — 공개 탐색 목록에서 영구 감춤
    const where: any = { visibility: 'public', autoHidden: false };

    // 텍스트 검색 (이름, 제목, 요약)
    if (opts.query) {
      where.OR = [
        { title: { contains: opts.query, mode: 'insensitive' } },
        { personalInfo: { name: { contains: opts.query, mode: 'insensitive' } } },
        { personalInfo: { summary: { contains: opts.query, mode: 'insensitive' } } },
        { skills: { some: { items: { contains: opts.query, mode: 'insensitive' } } } },
      ];
    }

    // 태그 필터
    if (opts.tag) {
      where.tags = { some: { tag: { name: opts.tag } } };
    }

    // 정렬 — recent(updatedAt) | views | oldest | name(personalInfo.name)
    const orderBy: any = (() => {
      switch (opts.sort) {
        case 'views':
          return { viewCount: 'desc' };
        case 'oldest':
          return { updatedAt: 'asc' };
        case 'trending':
          // 최근 7일 + 조회수 — where 에 추가 필터
          if (!where.createdAt) {
            where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
          }
          return { viewCount: 'desc' };
        case 'recent':
        default:
          return { updatedAt: 'desc' };
      }
    })();

    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        include: {
          personalInfo: {
            select: { name: true, email: true, phone: true, summary: true, photo: true },
          },
          tags: { include: { tag: true } },
          skills: { select: { id: true, category: true, items: true }, take: 5 },
          user: { select: { isOpenToWork: true, openToWorkRoles: true } },
        },
        orderBy,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.resume.count({ where }),
    ]);

    return {
      data: resumes.map((r) => this.formatSummary(r)),
      total,
      page: opts.page,
      totalPages: Math.ceil(total / opts.limit),
      limit: opts.limit,
    };
  }

  async findBySlug(_username: string, slug: string) {
    // slug 는 site-wide unique (updateSlug 에서 검증). username (URL path 의 @handle)
    // 은 user.username, user.name, resume.personalInfo.name 셋 중 어느 것일지 클라이언트
    // PublicLinkSettings 의 fallback 체인 때문에 일관 보장이 어렵다 — slug 자체가 unique
    // 하므로 username 무관하게 slug + visibility 만으로 lookup 한다.
    const resume = await this.prisma.resume.findFirst({
      where: { slug, visibility: { not: 'private' } },
      include: FULL_INCLUDE,
    });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');
    // 조회수 증가 (비동기, 에러 무시)
    this.prisma.resume
      .update({ where: { id: resume.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});
    return this.formatFull(resume);
  }

  async findByShortCode(code: string) {
    // UUID 앞 8자로 검색 (숏코드)
    const resume = await this.prisma.resume.findFirst({
      where: {
        id: { startsWith: code },
        visibility: { not: 'private' },
      },
      include: FULL_INCLUDE,
    });
    if (!resume) return null;
    this.prisma.resume
      .update({ where: { id: resume.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});
    return this.formatFull(resume);
  }

  async findOne(id: string, userId?: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');

    const isOwner = !!resume.userId && resume.userId === userId;

    // 비공개 이력서는 소유자만 조회 가능
    // 예외: 이 이력서를 연결한 CoachingSession의 코치는 열람 허용 (예약된 피코칭 이력서)
    if (resume.visibility === 'private' && resume.userId && !isOwner) {
      const isLinkedCoach = userId ? await this.isCoachOfResumeSession(id, userId) : false;
      if (!isLinkedCoach) {
        throw new ForbiddenException('이 이력서에 접근할 권한이 없습니다');
      }
    }

    // 선택 공개(selective): 화이트리스트(ResumeViewer) 에 등록된 사용자만 조회.
    // expiresAt 만료 항목은 자동 차단.
    let viewerRecord: { id: string } | null = null;
    if (resume.visibility === 'selective' && resume.userId && !isOwner) {
      if (!userId) {
        throw new ForbiddenException('이 이력서는 선택 공개 — 로그인이 필요합니다');
      }
      const v = await this.prisma.resumeViewer.findUnique({
        where: { resumeId_userId: { resumeId: id, userId } },
        select: { id: true, expiresAt: true },
      });
      const valid = !!v && (!v.expiresAt || v.expiresAt > new Date());
      if (!valid) {
        // CoachingSession 코치도 폴백으로 허용
        const isLinkedCoach = await this.isCoachOfResumeSession(id, userId);
        if (!isLinkedCoach) {
          throw new ForbiddenException('이 이력서에 대한 접근 권한이 없습니다');
        }
      } else {
        viewerRecord = { id: v.id };
      }
    }

    // 조회수 증가 + 열람 알림: 소유자가 아닌 경우에만
    if (!isOwner) {
      this.prisma.resume
        .update({ where: { id }, data: { viewCount: { increment: 1 } } })
        .catch(() => {});
      if (resume.userId && resume.visibility === 'public') {
        this.sendViewNotification(id, resume.title, resume.userId, userId).catch(() => {});
      }
      // selective viewer 의 last view 추적
      if (viewerRecord) {
        this.prisma.resumeViewer
          .update({
            where: { id: viewerRecord.id },
            data: { lastViewedAt: new Date(), viewCount: { increment: 1 } },
          })
          .catch(() => {});
      }
    }

    const result = this.formatFull(resume);
    const bookmarkCount = await this.prisma.bookmark.count({ where: { resumeId: id } });
    return { ...result, bookmarkCount };
  }

  /** 소유권 검증 - 수정/삭제 시 사용 (admin은 모든 이력서 접근 가능) */
  private async verifyOwnership(resumeId: string, userId?: string, role?: string) {
    const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');
    if (role === 'admin' || role === 'superadmin') return resume;
    if (resume.userId && resume.userId !== userId) {
      throw new ForbiddenException('이 이력서를 수정할 권한이 없습니다');
    }
    return resume;
  }

  async setVisibility(id: string, visibility: string, userId?: string, role?: string) {
    if (!['public', 'private', 'link-only', 'selective'].includes(visibility)) {
      throw new BadRequestException(
        '유효하지 않은 공개 설정입니다. public, private, link-only, selective 중 하나를 선택하세요',
      );
    }
    await this.verifyOwnership(id, userId, role);
    await this.prisma.resume.update({ where: { id }, data: { visibility } });
    return { id, visibility };
  }

  // ──────── 선택 공개 (selective) — 화이트리스트 관리 ────────

  /** 소유자만 호출 가능. 이력서의 허용 viewer 목록 반환. */
  async listAllowedViewers(resumeId: string, userId?: string, role?: string) {
    await this.verifyOwnership(resumeId, userId, role);
    return this.prisma.resumeViewer.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, username: true, email: true, avatar: true } },
      },
    });
  }

  /** 소유자가 username/email/userId 로 viewer 추가. 자기 자신·중복은 no-op. */
  async addAllowedViewer(
    resumeId: string,
    inviteeRef: {
      userId?: string;
      username?: string;
      email?: string;
      message?: string;
      expiresAt?: string | null;
    },
    ownerId?: string,
    role?: string,
  ) {
    const resume = await this.verifyOwnership(resumeId, ownerId, role);
    let target;
    if (inviteeRef.userId) {
      target = await this.prisma.user.findUnique({ where: { id: inviteeRef.userId } });
    } else if (inviteeRef.username) {
      target = await this.prisma.user.findFirst({ where: { username: inviteeRef.username } });
    } else if (inviteeRef.email) {
      target = await this.prisma.user.findUnique({ where: { email: inviteeRef.email } });
    }
    if (!target) {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다 (가입한 사용자만 추가 가능)');
    }
    if (target.id === resume.userId) {
      throw new BadRequestException('본인은 추가할 수 없습니다');
    }
    const existing = await this.prisma.resumeViewer.findUnique({
      where: { resumeId_userId: { resumeId, userId: target.id } },
    });
    if (existing) {
      // 이미 등록 — message/expiresAt 만 업데이트 (idempotent)
      const updated = await this.prisma.resumeViewer.update({
        where: { id: existing.id },
        data: {
          message: inviteeRef.message ?? existing.message,
          expiresAt:
            inviteeRef.expiresAt === undefined
              ? existing.expiresAt
              : inviteeRef.expiresAt
                ? new Date(inviteeRef.expiresAt)
                : null,
        },
      });
      return updated;
    }
    const created = await this.prisma.resumeViewer.create({
      data: {
        resumeId,
        userId: target.id,
        addedById: ownerId,
        message: inviteeRef.message ?? null,
        expiresAt: inviteeRef.expiresAt ? new Date(inviteeRef.expiresAt) : null,
      },
    });
    // 알림: 새로 추가될 때만 (idempotent 재호출 시 스팸 방지)
    this.sendSelectiveAccessNotification(resume.title || '이력서', target.id, resume.userId!).catch(
      () => {},
    );
    return created;
  }

  /** 소유자가 viewer 제거. */
  async removeAllowedViewer(
    resumeId: string,
    viewerUserId: string,
    ownerId?: string,
    role?: string,
  ) {
    await this.verifyOwnership(resumeId, ownerId, role);
    const removed = await this.prisma.resumeViewer
      .delete({ where: { resumeId_userId: { resumeId, userId: viewerUserId } } })
      .catch(() => null);
    return { removed: !!removed };
  }

  /** 로그인 사용자 본인이 공유받은 이력서 목록. */
  async listMySharedResumes(userId: string) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    const now = new Date();
    return this.prisma.resumeViewer.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        resume: {
          select: {
            id: true,
            title: true,
            slug: true,
            visibility: true,
            updatedAt: true,
            personalInfo: { select: { name: true, photo: true } },
          },
        },
        addedBy: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });
  }

  /** 알림 — 선택 공개 추가 시 viewer 에게 직접 메시지 + 알림. */
  private async sendSelectiveAccessNotification(
    resumeTitle: string,
    viewerUserId: string,
    ownerId: string,
  ) {
    try {
      const owner = await this.prisma.user.findUnique({
        where: { id: ownerId },
        select: { name: true },
      });
      const ownerName = owner?.name || '사용자';
      await this.notifications.create(
        viewerUserId,
        'resume_shared',
        `${ownerName}님이 '${resumeTitle}' 이력서를 공유했습니다`,
      );
    } catch {
      // 알림 실패는 silent — viewer 추가 자체는 성공해야 함
    }
  }

  async updateSlug(id: string, slug: string, userId?: string, role?: string) {
    await this.verifyOwnership(id, userId, role);
    const sanitized = slug
      .toLowerCase()
      .replace(/[^\w가-힣-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    if (!sanitized) throw new BadRequestException('유효한 슬러그를 입력해 주세요');
    // Check uniqueness
    const existing = await this.prisma.resume.findFirst({
      where: { slug: sanitized, id: { not: id } },
    });
    if (existing) throw new BadRequestException('이미 사용 중인 슬러그입니다');
    await this.prisma.resume.update({ where: { id }, data: { slug: sanitized } });
    return { id, slug: sanitized };
  }

  private generateSlug(title: string): string {
    return (
      (title || 'untitled')
        .replace(/[^\w가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
        .slice(0, 60) || 'untitled'
    );
  }

  async create(dto: CreateResumeDto, userId?: string) {
    const slug = this.generateSlug(dto.title || '');
    const resume = await this.prisma.resume.create({
      data: {
        title: dto.title || '',
        slug,
        userId: userId || null,
        personalInfo: dto.personalInfo
          ? {
              create: {
                ...dto.personalInfo,
                links: dto.personalInfo.links ? JSON.stringify(dto.personalInfo.links) : '[]',
              },
            }
          : undefined,
        experiences: dto.experiences?.length
          ? {
              create: dto.experiences.map((e, i) => ({
                company: e.company || '',
                position: e.position || '',
                department: e.department || '',
                startDate: e.startDate || '',
                endDate: e.endDate || '',
                current: e.current || false,
                description: e.description || '',
                achievements: e.achievements || '',
                techStack: e.techStack || '',
                sortOrder: e.sortOrder ?? i,
              })),
            }
          : undefined,
        educations: dto.educations?.length
          ? {
              create: dto.educations.map((e, i) => ({
                school: e.school || '',
                degree: e.degree || '',
                field: e.field || '',
                gpa: e.gpa || '',
                startDate: e.startDate || '',
                endDate: e.endDate || '',
                description: e.description || '',
                sortOrder: e.sortOrder ?? i,
              })),
            }
          : undefined,
        skills: dto.skills?.length
          ? {
              create: dto.skills.map((s, i) => ({
                category: s.category || '',
                items: s.items || '',
                sortOrder: s.sortOrder ?? i,
              })),
            }
          : undefined,
        projects: dto.projects?.length
          ? {
              create: dto.projects.map((p, i) => ({
                name: p.name || '',
                company: p.company || '',
                role: p.role || '',
                startDate: p.startDate || '',
                endDate: p.endDate || '',
                description: p.description || '',
                techStack: p.techStack || '',
                link: p.link || '',
                sortOrder: p.sortOrder ?? i,
              })),
            }
          : undefined,
        certifications: dto.certifications?.length
          ? {
              create: dto.certifications.map((c, i) => ({
                name: c.name || '',
                issuer: c.issuer || '',
                issueDate: c.issueDate || '',
                expiryDate: c.expiryDate || '',
                credentialId: c.credentialId || '',
                description: c.description || '',
                sortOrder: c.sortOrder ?? i,
              })),
            }
          : undefined,
        languages: dto.languages?.length
          ? {
              create: dto.languages.map((l, i) => ({
                name: l.name || '',
                testName: l.testName || '',
                score: l.score || '',
                testDate: l.testDate || '',
                sortOrder: l.sortOrder ?? i,
              })),
            }
          : undefined,
        awards: dto.awards?.length
          ? {
              create: dto.awards.map((a, i) => ({
                name: a.name || '',
                issuer: a.issuer || '',
                awardDate: a.awardDate || '',
                description: a.description || '',
                sortOrder: a.sortOrder ?? i,
              })),
            }
          : undefined,
        activities: dto.activities?.length
          ? {
              create: dto.activities.map((a, i) => ({
                name: a.name || '',
                organization: a.organization || '',
                role: a.role || '',
                startDate: a.startDate || '',
                endDate: a.endDate || '',
                description: a.description || '',
                sortOrder: a.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: FULL_INCLUDE,
    });
    return this.formatFull(resume);
  }

  async update(id: string, dto: UpdateResumeDto, userId?: string) {
    const existing = await this.verifyOwnership(id, userId);

    await this.saveVersionSnapshot(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.resume.update({ where: { id }, data: { title: dto.title ?? existing.title } });

      if (dto.personalInfo) {
        const piData = {
          ...dto.personalInfo,
          links: dto.personalInfo.links ? JSON.stringify(dto.personalInfo.links) : undefined,
        };
        await tx.personalInfo.upsert({
          where: { resumeId: id },
          create: { resumeId: id, ...piData, links: piData.links || '[]' },
          update: piData,
        });
      }

      await replaceCollection(tx, tx.experience, id, dto.experiences, (e, i) => ({
        company: e.company || '',
        position: e.position || '',
        department: e.department || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        current: e.current || false,
        description: e.description || '',
        achievements: e.achievements || '',
        techStack: e.techStack || '',
        sortOrder: e.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.education, id, dto.educations, (e, i) => ({
        school: e.school || '',
        degree: e.degree || '',
        field: e.field || '',
        gpa: e.gpa || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        description: e.description || '',
        sortOrder: e.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.skill, id, dto.skills, (s, i) => ({
        category: s.category || '',
        items: s.items || '',
        sortOrder: s.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.project, id, dto.projects, (p, i) => ({
        name: p.name || '',
        company: p.company || '',
        role: p.role || '',
        startDate: p.startDate || '',
        endDate: p.endDate || '',
        description: p.description || '',
        techStack: p.techStack || '',
        link: p.link || '',
        sortOrder: p.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.certification, id, dto.certifications, (c, i) => ({
        name: c.name || '',
        issuer: c.issuer || '',
        issueDate: c.issueDate || '',
        expiryDate: c.expiryDate || '',
        credentialId: c.credentialId || '',
        description: c.description || '',
        sortOrder: c.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.language, id, dto.languages, (l, i) => ({
        name: l.name || '',
        testName: l.testName || '',
        score: l.score || '',
        testDate: l.testDate || '',
        sortOrder: l.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.award, id, dto.awards, (a, i) => ({
        name: a.name || '',
        issuer: a.issuer || '',
        awardDate: a.awardDate || '',
        description: a.description || '',
        sortOrder: a.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.activity, id, dto.activities, (a, i) => ({
        name: a.name || '',
        organization: a.organization || '',
        role: a.role || '',
        startDate: a.startDate || '',
        endDate: a.endDate || '',
        description: a.description || '',
        sortOrder: a.sortOrder ?? i,
      }));
    });

    return this.findOne(id, userId);
  }

  async transferOwnership(id: string, newUserId: string) {
    const resume = await this.prisma.resume.findUnique({ where: { id } });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');
    const user = await this.prisma.user.findUnique({ where: { id: newUserId } });
    if (!user) throw new NotFoundException('대상 사용자를 찾을 수 없습니다');
    await this.prisma.resume.update({ where: { id }, data: { userId: newUserId } });
    return { success: true, message: `이력서가 ${user.name}에게 이전되었습니다` };
  }

  async remove(id: string, userId?: string, role?: string) {
    await this.verifyOwnership(id, userId, role);
    // Cloudinary 첨부파일 정리 (cascade 전에 URL 수집)
    try {
      const { v2: cloudinary } = await import('cloudinary');
      const attachments = await this.prisma.attachment.findMany({
        where: { resumeId: id },
        select: { filename: true },
      });
      for (const att of attachments) {
        if (att.filename?.startsWith('http')) {
          const parts = att.filename.split('/upload/');
          if (parts[1]) {
            const publicId = parts[1].replace(/^v\d+\//, '').replace(/\.[^.]+$/, '');
            cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {});
          }
        }
      }
    } catch {
      /* Cloudinary 미설정 시 무시 */
    }

    await this.prisma.resume.delete({ where: { id } });
    return { success: true };
  }

  async duplicate(id: string, userId?: string) {
    const source = await this.prisma.resume.findUnique({ where: { id }, include: FULL_INCLUDE });
    if (!source) throw new NotFoundException('이력서를 찾을 수 없습니다');
    const f = this.formatFull(source);
    return this.create(
      {
        title: `${f.title} (복사본)`,
        personalInfo: f.personalInfo,
        experiences: f.experiences,
        educations: f.educations,
        skills: f.skills,
        projects: f.projects,
        certifications: f.certifications,
        languages: f.languages,
        awards: f.awards,
        activities: f.activities,
      },
      userId,
    );
  }

  private async saveVersionSnapshot(resumeId: string) {
    const current = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      include: FULL_INCLUDE,
    });
    if (!current) return;
    const lastVersion = await this.prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
    });
    await this.prisma.resumeVersion.create({
      data: {
        resumeId,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        snapshot: JSON.stringify(this.formatFull(current)),
      },
    });
  }

  /** 조회수 증가 (다운로드/내보내기 시 사용) */
  incrementViewCount(id: string) {
    this.prisma.resume
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});
  }

  // --- Bookmark ---
  async addBookmark(resumeId: string, userId: string) {
    try {
      await this.prisma.bookmark.create({ data: { userId, resumeId } });
    } catch {} // unique constraint - already bookmarked
    return { bookmarked: true };
  }

  async removeBookmark(resumeId: string, userId: string) {
    await this.prisma.bookmark.deleteMany({ where: { userId, resumeId } });
    return { bookmarked: false };
  }

  async getBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: { resume: { include: { personalInfo: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return bookmarks.map((b) => ({
      id: b.id,
      resumeId: b.resume.id,
      title: b.resume.title,
      name: (b.resume as any).personalInfo?.name || '',
      createdAt: b.createdAt.toISOString(),
    }));
  }

  async isBookmarked(resumeId: string, userId: string): Promise<boolean> {
    const bookmark = await this.prisma.bookmark.findFirst({ where: { userId, resumeId } });
    return !!bookmark;
  }

  /** 스킬 추천 목록 조회 — { skill: { count, endorsed } } */
  async getEndorsements(
    resumeId: string,
    viewerId?: string,
  ): Promise<Record<string, { count: number; endorsed: boolean }>> {
    const rows = await this.prisma.skillEndorsement.findMany({ where: { resumeId } });
    const result: Record<string, { count: number; endorsed: boolean }> = {};
    for (const row of rows) {
      if (!result[row.skill]) result[row.skill] = { count: 0, endorsed: false };
      result[row.skill].count++;
      if (viewerId && row.userId === viewerId) result[row.skill].endorsed = true;
    }
    return result;
  }

  /** 스킬 추천 토글 (없으면 추가, 있으면 삭제) */
  async toggleEndorse(
    resumeId: string,
    userId: string,
    skill: string,
  ): Promise<{ endorsed: boolean; count: number }> {
    const existing = await this.prisma.skillEndorsement.findUnique({
      where: { resumeId_userId_skill: { resumeId, userId, skill } },
    });

    if (existing) {
      await this.prisma.skillEndorsement.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.skillEndorsement.create({ data: { resumeId, userId, skill } });
    }

    const count = await this.prisma.skillEndorsement.count({ where: { resumeId, skill } });
    return { endorsed: !existing, count };
  }

  private formatSummary(resume: any) {
    const pi = resume.personalInfo;
    return {
      id: resume.id,
      title: resume.title,
      slug: resume.slug || '',
      userId: resume.userId || '',
      viewCount: resume.viewCount || 0,
      visibility: resume.visibility || 'private',
      isOpenToWork: resume.user?.isOpenToWork || false,
      openToWorkRoles: resume.user?.openToWorkRoles || '',
      personalInfo: pi
        ? {
            name: pi.name,
            email: pi.email,
            phone: pi.phone,
            address: pi.address,
            website: pi.website,
            github: pi.github || '',
            summary: pi.summary,
            photo: pi.photo || '',
            birthYear: pi.birthYear || '',
            links: pi.links
              ? typeof pi.links === 'string'
                ? JSON.parse(pi.links || '[]')
                : pi.links
              : [],
            military: pi.military || '',
          }
        : {
            name: '',
            email: '',
            phone: '',
            address: '',
            website: '',
            github: '',
            summary: '',
            photo: '',
            birthYear: '',
            links: [],
            military: '',
          },
      tags:
        resume.tags?.map((t: any) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })) ??
        [],
      skills:
        resume.skills?.map((s: any) => ({ id: s.id, category: s.category, items: s.items })) ?? [],
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    };
  }

  private formatFull(resume: any) {
    const pick = (arr: any[], fields: string[]) =>
      arr?.map((item: any) => Object.fromEntries(fields.map((f) => [f, item[f]]))) ?? [];

    return {
      ...this.formatSummary(resume),
      experiences: pick(resume.experiences, [
        'id',
        'company',
        'position',
        'department',
        'startDate',
        'endDate',
        'current',
        'description',
        'achievements',
        'techStack',
      ]),
      educations: pick(resume.educations, [
        'id',
        'school',
        'degree',
        'field',
        'gpa',
        'startDate',
        'endDate',
        'description',
      ]),
      skills: pick(resume.skills, ['id', 'category', 'items']),
      projects: pick(resume.projects, [
        'id',
        'name',
        'company',
        'role',
        'startDate',
        'endDate',
        'description',
        'techStack',
        'link',
      ]),
      certifications: pick(resume.certifications, [
        'id',
        'name',
        'issuer',
        'issueDate',
        'expiryDate',
        'credentialId',
        'description',
      ]),
      languages: pick(resume.languages, ['id', 'name', 'testName', 'score', 'testDate']),
      awards: pick(resume.awards, ['id', 'name', 'issuer', 'awardDate', 'description']),
      activities: pick(resume.activities, [
        'id',
        'name',
        'organization',
        'role',
        'startDate',
        'endDate',
        'description',
      ]),
    };
  }
}
