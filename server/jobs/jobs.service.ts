import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

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

  async createExternalLink(data: any, role: string) {
    if (role !== 'admin' && role !== 'superadmin') throw new ForbiddenException();
    return this.prisma.externalJobLink.create({ data });
  }

  async updateExternalLink(id: string, data: any, role: string) {
    if (role !== 'admin' && role !== 'superadmin') throw new ForbiddenException();
    return this.prisma.externalJobLink.update({ where: { id }, data });
  }

  async deleteExternalLink(id: string, role: string) {
    if (role !== 'admin' && role !== 'superadmin') throw new ForbiddenException();
    await this.prisma.externalJobLink.delete({ where: { id } });
    return { success: true };
  }
}
