import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { NotificationsService } from '../notifications/notifications.service';

const VALID_STAGES = ['interested', 'contacted', 'interview', 'hired', 'rejected', 'withdrawn'];

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private config: SystemConfigService,
    private notifications: NotificationsService,
  ) {}

  async findAll(status = 'active', query?: string) {
    const where: any = { status };
    if (query) {
      where.OR = [
        { position: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { skills: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ];
    }
    return this.prisma.jobPost.findMany({
      where,
      include: { user: { select: { id: true, name: true, companyName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, companyName: true, avatar: true, email: true } },
      },
    });
    if (!job) throw new NotFoundException('채용 공고를 찾을 수 없습니다');
    return job;
  }

  async findByUser(userId: string) {
    return this.prisma.jobPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.userType === 'personal') {
      throw new ForbiddenException('채용 공고는 리크루터 또는 기업 회원만 등록할 수 있습니다');
    }
    return this.prisma.jobPost.create({
      data: {
        userId,
        company: data.company || user.companyName || '',
        position: data.position || '',
        location: data.location || '',
        salary: data.salary || '',
        description: data.description || '',
        requirements: data.requirements || '',
        benefits: data.benefits || '',
        type: data.type || 'fulltime',
        skills: data.skills || '',
        status: data.status || 'active',
      },
    });
  }

  async update(id: string, userId: string, data: any) {
    const job = await this.prisma.jobPost.findUnique({ where: { id } });
    if (!job) throw new NotFoundException();
    if (job.userId !== userId) throw new ForbiddenException();
    return this.prisma.jobPost.update({ where: { id }, data });
  }

  async remove(id: string, userId: string, role?: string) {
    const job = await this.prisma.jobPost.findUnique({ where: { id } });
    if (!job) throw new NotFoundException();
    if (job.userId !== userId && role !== 'admin' && role !== 'superadmin')
      throw new ForbiddenException();
    await this.prisma.jobPost.delete({ where: { id } });
    return { success: true };
  }

  // ── External Job Links ──────────────────────────────────────────────

  async getExternalLinks(filters: {
    category?: string;
    companySize?: string;
    careerLevel?: string;
    jobType?: string;
    location?: string;
    jobCategory?: string;
    q?: string;
  }) {
    const andClauses: any[] = [{ isActive: true }];

    if (filters.category && filters.category !== 'all') {
      andClauses.push({ category: filters.category });
    }
    if (filters.companySize && filters.companySize !== 'all') {
      andClauses.push({
        OR: [{ companySize: filters.companySize }, { companySize: 'all' }],
      });
    }
    if (filters.careerLevel && filters.careerLevel !== 'all') {
      andClauses.push({
        OR: [{ careerLevel: filters.careerLevel }, { careerLevel: 'all' }],
      });
    }
    if (filters.location && filters.location !== 'all') {
      andClauses.push({
        OR: [{ location: filters.location }, { location: 'nationwide' }, { location: 'all' }],
      });
    }
    if (filters.jobCategory && filters.jobCategory !== 'all') {
      andClauses.push({
        OR: [{ jobCategory: filters.jobCategory }, { jobCategory: 'all' }],
      });
    }
    if (filters.jobType && filters.jobType !== 'all') {
      andClauses.push({
        OR: [{ jobTypes: { contains: filters.jobType } }, { jobTypes: 'all' }],
      });
    }
    if (filters.q) {
      const q = filters.q;
      andClauses.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { badgeText: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    return this.prisma.externalJobLink.findMany({
      where: { AND: andClauses },
      orderBy: [{ order: 'asc' }, { clickCount: 'desc' }],
    });
  }

  async recordExternalLinkClick(id: string) {
    const link = await this.prisma.externalJobLink.findUnique({ where: { id } });
    if (!link) throw new NotFoundException();
    await this.prisma.externalJobLink.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    });
    return { url: link.url };
  }

  async createExternalLink(data: any, user: { id?: string; role?: string; userType?: string }) {
    const allowed = await this.config.checkPermission('perm.externalLinks.create', user);
    if (!allowed) throw new ForbiddenException('채용 링크 등록 권한이 없습니다');
    return this.prisma.externalJobLink.create({ data });
  }

  async updateExternalLink(
    id: string,
    data: any,
    user: { id?: string; role?: string; userType?: string },
  ) {
    const allowed = await this.config.checkPermission('perm.externalLinks.edit', user);
    if (!allowed) throw new ForbiddenException();
    return this.prisma.externalJobLink.update({ where: { id }, data });
  }

  async deleteExternalLink(id: string, user: { id?: string; role?: string; userType?: string }) {
    const allowed = await this.config.checkPermission('perm.externalLinks.delete', user);
    if (!allowed) throw new ForbiddenException();
    await this.prisma.externalJobLink.delete({ where: { id } });
    return { success: true };
  }

  // ── Curated Jobs (외부 채용 정보 카드) ─────────────────────────────

  async getCuratedJobs(filters: {
    jobType?: string;
    experienceLevel?: string;
    companySize?: string;
    industry?: string;
    location?: string;
    q?: string;
    /** recent | deadline | popular | hot | oldest */
    sort?: string;
    /** true 면 마감 7일 이내 긴급건만 */
    urgent?: boolean;
    /** 마감 N일 이내 (숫자) */
    deadlineWithinDays?: number;
    /** true 면 연봉 표시된 공고만 */
    hasSalary?: boolean;
    /** true 면 마감 지난 공고 제외 */
    excludeExpired?: boolean;
    page?: number;
    limit?: number;
  }) {
    const where: any = { status: 'active' };

    if (filters.jobType && filters.jobType !== 'all') {
      where.jobType = filters.jobType;
    }
    if (filters.experienceLevel && filters.experienceLevel !== 'all') {
      where.experienceLevel = filters.experienceLevel;
    }
    if (filters.companySize && filters.companySize !== 'all') {
      where.companySize = filters.companySize;
    }
    if (filters.industry && filters.industry !== 'all') {
      where.industry = filters.industry;
    }
    if (filters.location && filters.location !== 'all') {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }
    if (filters.q) {
      where.OR = [
        { company: { contains: filters.q, mode: 'insensitive' } },
        { position: { contains: filters.q, mode: 'insensitive' } },
        { skills: { contains: filters.q, mode: 'insensitive' } },
        { summary: { contains: filters.q, mode: 'insensitive' } },
      ];
    }
    if (filters.hasSalary) {
      where.NOT = [...(where.NOT ?? []), { salary: '' }];
    }

    const now = new Date();
    if (filters.excludeExpired) {
      where.OR = [
        ...(where.OR ?? []),
        { deadline: null },
        { deadline: { gte: now } },
        { isRolling: true },
      ];
    }
    if (filters.urgent) {
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.deadline = { gte: now, lte: sevenDaysLater };
    } else if (filters.deadlineWithinDays && filters.deadlineWithinDays > 0) {
      const cutoff = new Date(now.getTime() + filters.deadlineWithinDays * 24 * 60 * 60 * 1000);
      where.deadline = { gte: now, lte: cutoff };
    }

    const orderBy: any = (() => {
      switch (filters.sort) {
        case 'recent':
          return [{ createdAt: 'desc' }];
        case 'oldest':
          return [{ createdAt: 'asc' }];
        case 'popular':
          return [{ viewCount: 'desc' }, { createdAt: 'desc' }];
        case 'hot':
          return [{ clickCount: 'desc' }, { createdAt: 'desc' }];
        case 'deadline':
        default:
          return [{ deadline: 'asc' }, { createdAt: 'desc' }];
      }
    })();

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);

    const [items, total] = await Promise.all([
      this.prisma.curatedJob.findMany({
        where,
        include: { author: { select: { id: true, name: true, companyName: true } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.curatedJob.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCuratedJob(id: string) {
    const job = await this.prisma.curatedJob.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, companyName: true } } },
    });
    if (!job) throw new NotFoundException();
    await this.prisma.curatedJob.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return job;
  }

  async createCuratedJob(data: any, userId: string, userRole: string, userType: string) {
    const allowed = await this.config.checkPermission('perm.curatedJobs.create', {
      id: userId,
      role: userRole,
      userType,
    });
    if (!allowed) throw new ForbiddenException('채용 정보 등록 권한이 없습니다');
    return this.prisma.curatedJob.create({
      data: {
        company: data.company || '',
        companyLogo: data.companyLogo || '',
        position: data.position || '',
        department: data.department || '',
        summary: data.summary || '',
        requirements: data.requirements || '',
        benefits: data.benefits || '',
        skills: data.skills || '',
        jobType: data.jobType || 'fulltime',
        experienceLevel: data.experienceLevel || 'any',
        education: data.education || '',
        salary: data.salary || '',
        location: data.location || '',
        companySize: data.companySize || '',
        industry: data.industry || '',
        sourceUrl: data.sourceUrl || '',
        sourceSite: data.sourceSite || '',
        deadline: data.deadline ? new Date(data.deadline) : null,
        isRolling: data.isRolling || false,
        authorId: userId,
      },
    });
  }

  async updateCuratedJob(
    id: string,
    data: any,
    userId: string,
    userRole: string,
    userType?: string,
  ) {
    const job = await this.prisma.curatedJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException();
    const allowed = await this.config.checkPermission(
      'perm.curatedJobs.edit',
      { id: userId, role: userRole, userType },
      job.authorId,
    );
    if (!allowed) throw new ForbiddenException();
    const updateData: any = { ...data };
    if (data.deadline) updateData.deadline = new Date(data.deadline);
    delete updateData.id;
    delete updateData.authorId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    return this.prisma.curatedJob.update({ where: { id }, data: updateData });
  }

  async deleteCuratedJob(id: string, userId: string, userRole: string, userType?: string) {
    const job = await this.prisma.curatedJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException();
    const allowed = await this.config.checkPermission(
      'perm.curatedJobs.delete',
      { id: userId, role: userRole, userType },
      job.authorId,
    );
    if (!allowed) throw new ForbiddenException();
    await this.prisma.curatedJob.delete({ where: { id } });
    return { success: true };
  }

  async getJobStats(location?: string, type?: string, skill?: string) {
    const where: any = { status: 'active' };
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (type) where.type = type;

    const jobs = await this.prisma.jobPost.findMany({
      where,
      select: {
        company: true,
        position: true,
        location: true,
        type: true,
        skills: true,
        salary: true,
        createdAt: true,
      },
    });

    const companyCount: Record<string, number> = {};
    const locationCount: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    const skillCount: Record<string, number> = {};
    const monthlyCount: Record<string, number> = {};

    for (const job of jobs) {
      if (job.company) companyCount[job.company] = (companyCount[job.company] || 0) + 1;
      if (job.location) {
        const loc = job.location.split(' ')[0];
        locationCount[loc] = (locationCount[loc] || 0) + 1;
      }
      if (job.type) typeCount[job.type] = (typeCount[job.type] || 0) + 1;
      if (job.skills) {
        for (const s of job.skills
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)) {
          if (!skill || s.toLowerCase().includes(skill.toLowerCase())) {
            skillCount[s] = (skillCount[s] || 0) + 1;
          }
        }
      }
      const month = new Date(job.createdAt).toISOString().slice(0, 7);
      monthlyCount[month] = (monthlyCount[month] || 0) + 1;
    }

    const toRanked = (obj: Record<string, number>, limit = 10) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));

    return {
      total: jobs.length,
      byCompany: toRanked(companyCount),
      byLocation: toRanked(locationCount),
      byType: toRanked(typeCount),
      bySkill: toRanked(skillCount, 20),
      byMonth: Object.entries(monthlyCount)
        .sort()
        .map(([month, count]) => ({ month, count })),
    };
  }

  async recordCuratedJobClick(id: string) {
    const job = await this.prisma.curatedJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException();
    await this.prisma.curatedJob.update({ where: { id }, data: { clickCount: { increment: 1 } } });
    return { sourceUrl: job.sourceUrl };
  }

  // ── 채용공고 applications (recruiter dashboard surface) ──

  /** 구직자가 내부 공고에 직접 지원. 동일 공고 중복 지원 차단. 회사에 알림 발송. */
  async applyToJob(
    jobId: string,
    applicantId: string,
    body: { resumeId?: string; coverLetter?: string },
  ) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { user: true },
    });
    if (!job) throw new NotFoundException('채용 공고를 찾을 수 없습니다');
    if (job.status !== 'active')
      throw new BadRequestException('마감된 공고에는 지원할 수 없습니다');
    if (job.userId === applicantId) throw new BadRequestException('본인 공고에 지원할 수 없습니다');

    // resumeId 검증 — 본인 소유 + private 아님
    if (body.resumeId) {
      const resume = await this.prisma.resume.findUnique({ where: { id: body.resumeId } });
      if (!resume) throw new BadRequestException('이력서를 찾을 수 없습니다');
      if (resume.userId !== applicantId)
        throw new ForbiddenException('본인 이력서만 첨부할 수 있습니다');
    }

    try {
      const created = await (this.prisma as any).jobPostApplication.create({
        data: {
          jobId,
          applicantId,
          resumeId: body.resumeId ?? null,
          coverLetter: (body.coverLetter || '').slice(0, 5000),
          stage: 'interested',
        },
      });
      // 회사에 신규 지원 알림
      const applicant = await this.prisma.user.findUnique({ where: { id: applicantId } });
      await this.notifications
        .create(
          job.userId,
          'job_application_received',
          `${applicant?.name || '익명'}님이 [${job.position}] 공고에 지원했어요`,
          `/recruiter?tab=pipeline`,
        )
        .catch(() => {});
      return created;
    } catch (err: any) {
      // unique 충돌 — 이미 지원함
      if (err?.code === 'P2002') {
        throw new ConflictException('이미 지원한 공고입니다');
      }
      throw err;
    }
  }

  /** Recruiter — 내가 등록한 모든 공고에 들어온 application 목록 (최근순). */
  async listApplicantsForRecruiter(recruiterUserId: string) {
    const myJobs = await this.prisma.jobPost.findMany({
      where: { userId: recruiterUserId },
      select: { id: true, position: true },
    });
    if (myJobs.length === 0) return [];
    const jobIds = myJobs.map((j) => j.id);
    const positionByJobId: Record<string, string> = {};
    myJobs.forEach((j) => (positionByJobId[j.id] = j.position));

    const apps = await (this.prisma as any).jobPostApplication.findMany({
      where: { jobId: { in: jobIds } },
      include: {
        applicant: {
          select: { id: true, name: true, username: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return apps.map((a: any) => ({
      id: a.id,
      jobId: a.jobId,
      position: positionByJobId[a.jobId] || '',
      stage: a.stage,
      resumeId: a.resumeId,
      coverLetter: a.coverLetter,
      createdAt: a.createdAt,
      // RecruiterDashboardPage 가 기대하는 shape 와 일치
      userId: a.applicant.id,
      name: a.applicant.name,
      email: a.applicant.email,
      avatar: a.applicant.avatar,
    }));
  }

  /** Recruiter — pipeline view: stage 별 applicant 조회. */
  async listPipelineForRecruiter(recruiterUserId: string) {
    const all = await this.listApplicantsForRecruiter(recruiterUserId);
    return all.map((a: any) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      resumeId: a.resumeId,
      stage: a.stage,
      position: a.position,
      updatedAt: a.createdAt,
    }));
  }

  /** Recruiter — application 의 stage 변경 (소유 공고만). 변경 시 지원자에게 알림. */
  async updatePipelineStage(applicationId: string, recruiterUserId: string, newStage: string) {
    if (!VALID_STAGES.includes(newStage)) {
      throw new BadRequestException(`유효하지 않은 stage: ${newStage}`);
    }
    const app = await (this.prisma as any).jobPostApplication.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!app) throw new NotFoundException('지원 내역을 찾을 수 없습니다');
    if (app.job.userId !== recruiterUserId)
      throw new ForbiddenException('본인 공고의 지원만 관리할 수 있습니다');
    if (app.stage === newStage) return app;

    const updated = await (this.prisma as any).jobPostApplication.update({
      where: { id: applicationId },
      data: { stage: newStage },
    });

    // 지원자에게 stage 변경 알림 (interested 는 noise 라 skip)
    if (newStage !== 'interested' && newStage !== 'withdrawn') {
      const stageLabel: Record<string, string> = {
        contacted: '연락',
        interview: '면접',
        hired: '채용',
        rejected: '거절',
      };
      await this.notifications
        .create(
          app.applicantId,
          'job_application_stage',
          `[${app.job.position}] 지원 단계가 '${stageLabel[newStage] || newStage}'(으)로 변경됐어요`,
          `/applications`,
        )
        .catch(() => {});
    }
    return updated;
  }

  /** Recruiter — 내 활성 공고 skills 와 매칭되는 공개 이력서 보유 user 추천. */
  async listRecommendedCandidates(recruiterUserId: string) {
    const activeJobs = await this.prisma.jobPost.findMany({
      where: { userId: recruiterUserId, status: 'active' },
      select: { id: true, skills: true, position: true },
    });
    if (activeJobs.length === 0) return [];

    // 모든 활성 공고의 skill 합집합
    const skillSet = new Set<string>();
    activeJobs.forEach((j) => {
      (j.skills || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .forEach((s) => skillSet.add(s));
    });
    if (skillSet.size === 0) return [];

    // 공개 이력서 + 스킬 join
    const publicResumes = await this.prisma.resume.findMany({
      where: { visibility: 'public', userId: { not: null } },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        skills: { select: { items: true } },
        personalInfo: { select: { name: true } },
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });

    const scored = publicResumes
      .map((r) => {
        const userSkills = new Set<string>();
        r.skills.forEach((s) => {
          (s.items || '')
            .split(',')
            .map((x) => x.trim().toLowerCase())
            .filter(Boolean)
            .forEach((x) => userSkills.add(x));
        });
        const matched: string[] = [];
        skillSet.forEach((s) => {
          if (userSkills.has(s)) matched.push(s);
        });
        if (matched.length === 0) return null;
        const matchScore = Math.round((matched.length / skillSet.size) * 100);
        return {
          id: r.id,
          resumeId: r.id,
          userId: r.user?.id,
          name: r.personalInfo?.name || r.user?.name || '익명',
          title: r.title || '',
          skills: matched.slice(0, 8),
          matchScore,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 12);

    return scored;
  }

  /** 구직자 — 내가 지원한 공고 목록. */
  async listMyApplications(applicantId: string) {
    const apps = await (this.prisma as any).jobPostApplication.findMany({
      where: { applicantId },
      include: {
        job: {
          select: { id: true, position: true, company: true, location: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return apps.map((a: any) => ({
      id: a.id,
      jobId: a.jobId,
      job: a.job,
      stage: a.stage,
      resumeId: a.resumeId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }
}
