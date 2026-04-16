import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private config: SystemConfigService,
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
      include: { user: { select: { id: true, name: true, companyName: true, avatar: true, email: true } } },
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
    if (job.userId !== userId && role !== 'admin' && role !== 'superadmin') throw new ForbiddenException();
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
        OR: [
          { location: filters.location },
          { location: 'nationwide' },
          { location: 'all' },
        ],
      });
    }
    if (filters.jobCategory && filters.jobCategory !== 'all') {
      andClauses.push({
        OR: [{ jobCategory: filters.jobCategory }, { jobCategory: 'all' }],
      });
    }
    if (filters.jobType && filters.jobType !== 'all') {
      andClauses.push({
        OR: [
          { jobTypes: { contains: filters.jobType } },
          { jobTypes: 'all' },
        ],
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

  async updateExternalLink(id: string, data: any, user: { id?: string; role?: string; userType?: string }) {
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

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);

    const [items, total] = await Promise.all([
      this.prisma.curatedJob.findMany({
        where,
        include: { author: { select: { id: true, name: true, companyName: true } } },
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
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
    const allowed = await this.config.checkPermission('perm.curatedJobs.create', { id: userId, role: userRole, userType });
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

  async updateCuratedJob(id: string, data: any, userId: string, userRole: string, userType?: string) {
    const job = await this.prisma.curatedJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException();
    const allowed = await this.config.checkPermission('perm.curatedJobs.edit', { id: userId, role: userRole, userType }, job.authorId);
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
    const allowed = await this.config.checkPermission('perm.curatedJobs.delete', { id: userId, role: userRole, userType }, job.authorId);
    if (!allowed) throw new ForbiddenException();
    await this.prisma.curatedJob.delete({ where: { id } });
    return { success: true };
  }

  async recordCuratedJobClick(id: string) {
    const job = await this.prisma.curatedJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException();
    await this.prisma.curatedJob.update({ where: { id }, data: { clickCount: { increment: 1 } } });
    return { sourceUrl: job.sourceUrl };
  }
}
