import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async findAll(userId?: string) {
    const resumes = await this.prisma.resume.findMany({
      where: userId ? { userId } : {},
      include: { personalInfo: true, tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return resumes.map((r) => this.formatSummary(r));
  }

  async findPublic() {
    const resumes = await this.prisma.resume.findMany({
      where: { visibility: 'public' },
      include: { personalInfo: true, tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return resumes.map((r) => this.formatSummary(r));
  }

  async searchPublic(opts: { query?: string; tag?: string; page: number; limit: number }) {
    const where: any = { visibility: 'public' };

    // 텍스트 검색 (이름, 제목, 요약)
    if (opts.query) {
      where.OR = [
        { title: { contains: opts.query, mode: 'insensitive' } },
        { personalInfo: { name: { contains: opts.query, mode: 'insensitive' } } },
        { personalInfo: { summary: { contains: opts.query, mode: 'insensitive' } } },
      ];
    }

    // 태그 필터
    if (opts.tag) {
      where.tags = { some: { tag: { name: opts.tag } } };
    }

    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        include: { personalInfo: true, tags: { include: { tag: true } } },
        orderBy: { updatedAt: 'desc' },
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
    };
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

    return this.formatFull(resume);
  }

  /** 소유권 검증 - 수정/삭제 시 사용 */
  private async verifyOwnership(resumeId: string, userId?: string) {
    const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');
    // 소유자가 있는 이력서는 소유자만 수정/삭제 가능
    if (resume.userId && resume.userId !== userId) {
      throw new ForbiddenException('이 이력서를 수정할 권한이 없습니다');
    }
    return resume;
  }

  async setVisibility(id: string, visibility: string, userId?: string) {
    if (!['public', 'private', 'link-only'].includes(visibility)) {
      throw new NotFoundException('유효하지 않은 공개 설정입니다');
    }
    await this.verifyOwnership(id, userId);
    await this.prisma.resume.update({ where: { id }, data: { visibility } });
    return { id, visibility };
  }

  async create(dto: CreateResumeDto, userId?: string) {
    const resume = await this.prisma.resume.create({
      data: {
        title: dto.title || '',
        userId: userId || null,
        personalInfo: dto.personalInfo ? { create: dto.personalInfo } : undefined,
        experiences: dto.experiences?.length ? {
          create: dto.experiences.map((e, i) => ({
            company: e.company || '', position: e.position || '',
            startDate: e.startDate || '', endDate: e.endDate || '',
            current: e.current || false, description: e.description || '',
            sortOrder: e.sortOrder ?? i,
          })),
        } : undefined,
        educations: dto.educations?.length ? {
          create: dto.educations.map((e, i) => ({
            school: e.school || '', degree: e.degree || '', field: e.field || '',
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
            name: p.name || '', role: p.role || '',
            startDate: p.startDate || '', endDate: p.endDate || '',
            description: p.description || '', link: p.link || '',
            sortOrder: p.sortOrder ?? i,
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
        await tx.personalInfo.upsert({
          where: { resumeId: id },
          create: { resumeId: id, ...dto.personalInfo },
          update: dto.personalInfo,
        });
      }

      await replaceCollection(tx, tx.experience, id, dto.experiences, (e, i) => ({
        company: e.company || '', position: e.position || '',
        startDate: e.startDate || '', endDate: e.endDate || '',
        current: e.current || false, description: e.description || '',
        sortOrder: e.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.education, id, dto.educations, (e, i) => ({
        school: e.school || '', degree: e.degree || '', field: e.field || '',
        startDate: e.startDate || '', endDate: e.endDate || '',
        description: e.description || '', sortOrder: e.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.skill, id, dto.skills, (s, i) => ({
        category: s.category || '', items: s.items || '', sortOrder: s.sortOrder ?? i,
      }));

      await replaceCollection(tx, tx.project, id, dto.projects, (p, i) => ({
        name: p.name || '', role: p.role || '',
        startDate: p.startDate || '', endDate: p.endDate || '',
        description: p.description || '', link: p.link || '',
        sortOrder: p.sortOrder ?? i,
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

  async remove(id: string, userId?: string) {
    await this.verifyOwnership(id, userId);
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

  private formatSummary(resume: any) {
    return {
      id: resume.id, title: resume.title, visibility: resume.visibility || 'private',
      personalInfo: resume.personalInfo
        ? { name: resume.personalInfo.name, email: resume.personalInfo.email, phone: resume.personalInfo.phone, address: resume.personalInfo.address, website: resume.personalInfo.website, summary: resume.personalInfo.summary }
        : { name: '', email: '', phone: '', address: '', website: '', summary: '' },
      tags: resume.tags?.map((t: any) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })) ?? [],
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    };
  }

  private formatFull(resume: any) {
    const pick = (arr: any[], fields: string[]) =>
      arr?.map((item: any) => Object.fromEntries(fields.map(f => [f, item[f]]))) ?? [];

    return {
      ...this.formatSummary(resume),
      experiences: pick(resume.experiences, ['id', 'company', 'position', 'startDate', 'endDate', 'current', 'description']),
      educations: pick(resume.educations, ['id', 'school', 'degree', 'field', 'startDate', 'endDate', 'description']),
      skills: pick(resume.skills, ['id', 'category', 'items']),
      projects: pick(resume.projects, ['id', 'name', 'role', 'startDate', 'endDate', 'description', 'link']),
      certifications: pick(resume.certifications, ['id', 'name', 'issuer', 'issueDate', 'expiryDate', 'credentialId', 'description']),
      languages: pick(resume.languages, ['id', 'name', 'testName', 'score', 'testDate']),
      awards: pick(resume.awards, ['id', 'name', 'issuer', 'awardDate', 'description']),
      activities: pick(resume.activities, ['id', 'name', 'organization', 'role', 'startDate', 'endDate', 'description']),
    };
  }
}
