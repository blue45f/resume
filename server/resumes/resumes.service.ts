import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100); // Cap at 100 to prevent abuse
    const where = userId ? { userId } : {};
    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        select: {
          id: true, title: true, slug: true, userId: true,
          viewCount: true, visibility: true, createdAt: true, updatedAt: true,
          personalInfo: {
            select: { name: true, email: true, phone: true, address: true, website: true, github: true, summary: true, photo: true, birthYear: true, links: true, military: true },
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
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const where = { visibility: 'public' as const };
    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        select: {
          id: true, title: true, slug: true, userId: true,
          viewCount: true, visibility: true, createdAt: true, updatedAt: true,
          personalInfo: {
            select: { name: true, email: true, phone: true, address: true, website: true, github: true, summary: true, photo: true, birthYear: true, links: true, military: true },
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

  async searchPublic(opts: { query?: string; tag?: string; sort?: string; page: number; limit: number }) {
    opts.page = Math.max(1, opts.page);
    opts.limit = Math.min(Math.max(1, opts.limit), 100);
    const where: any = { visibility: 'public' };

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

    const orderBy = opts.sort === 'views'
      ? { viewCount: 'desc' as const }
      : { updatedAt: 'desc' as const };

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

  async findBySlug(username: string, slug: string) {
    const user = await this.prisma.user.findFirst({ where: { username } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    const resume = await this.prisma.resume.findFirst({
      where: { userId: user.id, slug },
      include: FULL_INCLUDE,
    });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');
    if (resume.visibility === 'private') {
      throw new NotFoundException('이력서를 찾을 수 없습니다');
    }
    // 조회수 증가 (비동기, 에러 무시)
    this.prisma.resume.update({ where: { id: resume.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
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
    this.prisma.resume.update({ where: { id: resume.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return this.formatFull(resume);
  }

  async findOne(id: string, userId?: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');

    // 비공개 이력서는 소유자만 조회 가능
    if (resume.visibility === 'private' && resume.userId && resume.userId !== userId) {
      throw new ForbiddenException('이 이력서에 접근할 권한이 없습니다');
    }

    // 조회수 증가: 소유자가 아닌 경우에만
    if (!userId || resume.userId !== userId) {
      this.prisma.resume.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
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
    if (!['public', 'private', 'link-only'].includes(visibility)) {
      throw new BadRequestException('유효하지 않은 공개 설정입니다. public, private, link-only 중 하나를 선택하세요');
    }
    await this.verifyOwnership(id, userId, role);
    await this.prisma.resume.update({ where: { id }, data: { visibility } });
    return { id, visibility };
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
    return (title || 'untitled')
      .replace(/[^\w가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 60) || 'untitled';
  }

  async create(dto: CreateResumeDto, userId?: string) {
    const slug = this.generateSlug(dto.title || '');
    const resume = await this.prisma.resume.create({
      data: {
        title: dto.title || '',
        slug,
        userId: userId || null,
        personalInfo: dto.personalInfo ? { create: {
          ...dto.personalInfo,
          links: dto.personalInfo.links ? JSON.stringify(dto.personalInfo.links) : '[]',
        } } : undefined,
        experiences: dto.experiences?.length ? {
          create: dto.experiences.map((e, i) => ({
            company: e.company || '', position: e.position || '',
            department: e.department || '',
            startDate: e.startDate || '', endDate: e.endDate || '',
            current: e.current || false, description: e.description || '',
            achievements: e.achievements || '', techStack: e.techStack || '',
            sortOrder: e.sortOrder ?? i,
          })),
        } : undefined,
        educations: dto.educations?.length ? {
          create: dto.educations.map((e, i) => ({
            school: e.school || '', degree: e.degree || '', field: e.field || '',
            gpa: e.gpa || '',
            startDate: e.startDate || '', endDate: e.endDate || '',
            description: e.description || '', sortOrder: e.sortOrder ?? i,
          })),
        } : undefined,
        skills: dto.skills?.length ? {
          create: dto.skills.map((s, i) => ({
            category: s.category || '', items: s.items || '', sortOrder: s.sortOrder ?? i,
          })),
        } : undefined,
        projects: dto.projects?.length ? {
          create: dto.projects.map((p, i) => ({
            name: p.name || '', company: p.company || '', role: p.role || '',
            startDate: p.startDate || '', endDate: p.endDate || '',
            description: p.description || '', techStack: p.techStack || '',
            link: p.link || '', sortOrder: p.sortOrder ?? i,
          })),
        } : undefined,
        certifications: dto.certifications?.length ? {
          create: dto.certifications.map((c, i) => ({
            name: c.name || '', issuer: c.issuer || '',
            issueDate: c.issueDate || '', expiryDate: c.expiryDate || '',
            credentialId: c.credentialId || '', description: c.description || '',
            sortOrder: c.sortOrder ?? i,
          })),
        } : undefined,
        languages: dto.languages?.length ? {
          create: dto.languages.map((l, i) => ({
            name: l.name || '', testName: l.testName || '',
            score: l.score || '', testDate: l.testDate || '',
            sortOrder: l.sortOrder ?? i,
          })),
        } : undefined,
        awards: dto.awards?.length ? {
          create: dto.awards.map((a, i) => ({
            name: a.name || '', issuer: a.issuer || '',
            awardDate: a.awardDate || '', description: a.description || '',
            sortOrder: a.sortOrder ?? i,
          })),
        } : undefined,
        activities: dto.activities?.length ? {
          create: dto.activities.map((a, i) => ({
            name: a.name || '', organization: a.organization || '',
            role: a.role || '', startDate: a.startDate || '',
            endDate: a.endDate || '', description: a.description || '',
            sortOrder: a.sortOrder ?? i,
          })),
        } : undefined,
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
        company: e.company || '', position: e.position || '',
        department: e.department || '',
        startDate: e.startDate || '', endDate: e.endDate || '',
        current: e.current || false, description: e.description || '',
        achievements: e.achievements || '', techStack: e.techStack || '',
        sortOrder: e.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.education, id, dto.educations, (e, i) => ({
        school: e.school || '', degree: e.degree || '', field: e.field || '',
        gpa: e.gpa || '',
        startDate: e.startDate || '', endDate: e.endDate || '',
        description: e.description || '', sortOrder: e.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.skill, id, dto.skills, (s, i) => ({
        category: s.category || '', items: s.items || '', sortOrder: s.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.project, id, dto.projects, (p, i) => ({
        name: p.name || '', company: p.company || '', role: p.role || '',
        startDate: p.startDate || '', endDate: p.endDate || '',
        description: p.description || '', techStack: p.techStack || '',
        link: p.link || '', sortOrder: p.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.certification, id, dto.certifications, (c, i) => ({
        name: c.name || '', issuer: c.issuer || '',
        issueDate: c.issueDate || '', expiryDate: c.expiryDate || '',
        credentialId: c.credentialId || '', description: c.description || '',
        sortOrder: c.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.language, id, dto.languages, (l, i) => ({
        name: l.name || '', testName: l.testName || '',
        score: l.score || '', testDate: l.testDate || '',
        sortOrder: l.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.award, id, dto.awards, (a, i) => ({
        name: a.name || '', issuer: a.issuer || '',
        awardDate: a.awardDate || '', description: a.description || '',
        sortOrder: a.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.activity, id, dto.activities, (a, i) => ({
        name: a.name || '', organization: a.organization || '',
        role: a.role || '', startDate: a.startDate || '',
        endDate: a.endDate || '', description: a.description || '',
        sortOrder: a.sortOrder ?? i,
      }));
    });

    return this.findOne(id);
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
    } catch { /* Cloudinary 미설정 시 무시 */ }

    await this.prisma.resume.delete({ where: { id } });
    return { success: true };
  }

  async duplicate(id: string, userId?: string) {
    const source = await this.prisma.resume.findUnique({ where: { id }, include: FULL_INCLUDE });
    if (!source) throw new NotFoundException('이력서를 찾을 수 없습니다');
    const f = this.formatFull(source);
    return this.create({
      title: `${f.title} (복사본)`,
      personalInfo: f.personalInfo, experiences: f.experiences,
      educations: f.educations, skills: f.skills, projects: f.projects,
      certifications: f.certifications, languages: f.languages,
      awards: f.awards, activities: f.activities,
    }, userId);
  }

  private async saveVersionSnapshot(resumeId: string) {
    const current = await this.prisma.resume.findUnique({ where: { id: resumeId }, include: FULL_INCLUDE });
    if (!current) return;
    const lastVersion = await this.prisma.resumeVersion.findFirst({ where: { resumeId }, orderBy: { versionNumber: 'desc' } });
    await this.prisma.resumeVersion.create({
      data: { resumeId, versionNumber: (lastVersion?.versionNumber ?? 0) + 1, snapshot: JSON.stringify(this.formatFull(current)) },
    });
  }

  /** 조회수 증가 (다운로드/내보내기 시 사용) */
  incrementViewCount(id: string) {
    this.prisma.resume.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
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
    return bookmarks.map(b => ({
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

  private formatSummary(resume: any) {
    const pi = resume.personalInfo;
    return {
      id: resume.id, title: resume.title, slug: resume.slug || '', userId: resume.userId || '', viewCount: resume.viewCount || 0, visibility: resume.visibility || 'private',
      isOpenToWork: resume.user?.isOpenToWork || false,
      openToWorkRoles: resume.user?.openToWorkRoles || '',
      personalInfo: pi
        ? {
            name: pi.name, email: pi.email, phone: pi.phone, address: pi.address,
            website: pi.website, github: pi.github || '', summary: pi.summary, photo: pi.photo || '',
            birthYear: pi.birthYear || '',
            links: pi.links ? (typeof pi.links === 'string' ? JSON.parse(pi.links || '[]') : pi.links) : [],
            military: pi.military || '',
          }
        : { name: '', email: '', phone: '', address: '', website: '', github: '', summary: '', photo: '', birthYear: '', links: [], military: '' },
      tags: resume.tags?.map((t: any) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })) ?? [],
      skills: resume.skills?.map((s: any) => ({ id: s.id, category: s.category, items: s.items })) ?? [],
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    };
  }

  private formatFull(resume: any) {
    const pick = (arr: any[], fields: string[]) =>
      arr?.map((item: any) => Object.fromEntries(fields.map(f => [f, item[f]]))) ?? [];

    return {
      ...this.formatSummary(resume),
      experiences: pick(resume.experiences, ['id', 'company', 'position', 'department', 'startDate', 'endDate', 'current', 'description', 'achievements', 'techStack']),
      educations: pick(resume.educations, ['id', 'school', 'degree', 'field', 'gpa', 'startDate', 'endDate', 'description']),
      skills: pick(resume.skills, ['id', 'category', 'items']),
      projects: pick(resume.projects, ['id', 'name', 'company', 'role', 'startDate', 'endDate', 'description', 'techStack', 'link']),
      certifications: pick(resume.certifications, ['id', 'name', 'issuer', 'issueDate', 'expiryDate', 'credentialId', 'description']),
      languages: pick(resume.languages, ['id', 'name', 'testName', 'score', 'testDate']),
      awards: pick(resume.awards, ['id', 'name', 'issuer', 'awardDate', 'description']),
      activities: pick(resume.activities, ['id', 'name', 'organization', 'role', 'startDate', 'endDate', 'description']),
    };
  }
}
