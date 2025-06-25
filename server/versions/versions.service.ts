import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VersionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(resumeId: string) {
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

  async findOne(resumeId: string, versionId: string) {
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

  async restore(resumeId: string, versionId: string, userId?: string) {
    const version = await this.prisma.resumeVersion.findFirst({
      where: { id: versionId, resumeId },
      include: { resume: { select: { userId: true } } },
    });
    if (!version) throw new NotFoundException('버전을 찾을 수 없습니다');

    // 소유권 검증
    if (version.resume.userId && version.resume.userId !== userId) {
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
        await tx.personalInfo.upsert({
          where: { resumeId },
          create: { resumeId, ...snapshot.personalInfo },
          update: snapshot.personalInfo,
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
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            current: e.current || false,
            description: e.description || '',
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
            role: p.role || '',
            startDate: p.startDate || '',
            endDate: p.endDate || '',
            description: p.description || '',
            link: p.link || '',
            sortOrder: i,
          })),
        });
      }
    });

    return { success: true, restoredVersion: version.versionNumber };
  }
}
