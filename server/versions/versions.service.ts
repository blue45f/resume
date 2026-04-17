import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VersionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 이력서 소유권 검증 (versions는 이력서 스냅샷 전체를 포함하므로
   * 공개/비공개와 무관하게 소유자만 접근 가능)
   */
  private async assertOwnership(resumeId: string, userId?: string, role?: string) {
    const isAdmin = role === 'admin' || role === 'superadmin';
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');
    if (!isAdmin && resume.userId && resume.userId !== userId) {
      throw new ForbiddenException('이 이력서의 버전에 접근할 권한이 없습니다');
    }
  }

  async findAll(resumeId: string, userId?: string, role?: string) {
    await this.assertOwnership(resumeId, userId, role);
    const versions = await this.prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        description: true,
        createdAt: true,
      },
    });
    return versions.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
    }));
  }

  async findOne(resumeId: string, versionId: string, userId?: string, role?: string) {
    await this.assertOwnership(resumeId, userId, role);
    const version = await this.prisma.resumeVersion.findFirst({
      where: { id: versionId, resumeId },
    });
    if (!version) throw new NotFoundException('버전을 찾을 수 없습니다');
    return {
      ...version,
      snapshot: JSON.parse(version.snapshot),
      createdAt: version.createdAt.toISOString(),
    };
  }

  async restore(resumeId: string, versionId: string, userId?: string, role?: string) {
    const version = await this.prisma.resumeVersion.findFirst({
      where: { id: versionId, resumeId },
      include: { resume: { select: { userId: true } } },
    });
    if (!version) throw new NotFoundException('버전을 찾을 수 없습니다');

    // 소유권 검증 (admin은 우회 가능)
    const isAdmin = role === 'admin' || role === 'superadmin';
    if (!isAdmin && version.resume.userId && version.resume.userId !== userId) {
      throw new ForbiddenException('이 이력서의 버전을 복원할 권한이 없습니다');
    }

    let snapshot: any;
    try {
      snapshot = JSON.parse(version.snapshot);
    } catch {
      throw new BadRequestException('버전 데이터가 손상되었습니다');
    }

    // Use a transaction to restore
    await this.prisma.$transaction(async (tx) => {
      await tx.resume.update({
        where: { id: resumeId },
        data: { title: snapshot.title },
      });

      if (snapshot.personalInfo) {
        const piData = { ...snapshot.personalInfo };
        // links가 배열이면 JSON으로 변환
        if (Array.isArray(piData.links)) piData.links = JSON.stringify(piData.links);
        // id 필드 제거 (Prisma가 자동 생성)
        delete piData.id;
        await tx.personalInfo.upsert({
          where: { resumeId },
          create: { resumeId, ...piData },
          update: piData,
        });
      }

      // Replace collections
      await tx.experience.deleteMany({ where: { resumeId } });
      if (snapshot.experiences?.length) {
        await tx.experience.createMany({
          data: snapshot.experiences.map((e: any, i: number) => ({
            resumeId,
            company: e.company || '',
            position: e.position || '',
            department: e.department || '',
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            current: e.current || false,
            description: e.description || '',
            achievements: e.achievements || '',
            techStack: e.techStack || '',
            sortOrder: i,
          })),
        });
      }

      await tx.education.deleteMany({ where: { resumeId } });
      if (snapshot.educations?.length) {
        await tx.education.createMany({
          data: snapshot.educations.map((e: any, i: number) => ({
            resumeId,
            school: e.school || '',
            degree: e.degree || '',
            field: e.field || '',
            gpa: e.gpa || '',
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            description: e.description || '',
            sortOrder: i,
          })),
        });
      }

      await tx.skill.deleteMany({ where: { resumeId } });
      if (snapshot.skills?.length) {
        await tx.skill.createMany({
          data: snapshot.skills.map((s: any, i: number) => ({
            resumeId,
            category: s.category || '',
            items: s.items || '',
            sortOrder: i,
          })),
        });
      }

      await tx.project.deleteMany({ where: { resumeId } });
      if (snapshot.projects?.length) {
        await tx.project.createMany({
          data: snapshot.projects.map((p: any, i: number) => ({
            resumeId,
            name: p.name || '',
            company: p.company || '',
            role: p.role || '',
            startDate: p.startDate || '',
            endDate: p.endDate || '',
            description: p.description || '',
            techStack: p.techStack || '',
            link: p.link || '',
            sortOrder: i,
          })),
        });
      }
    });

    return { success: true, restoredVersion: version.versionNumber };
  }
}
