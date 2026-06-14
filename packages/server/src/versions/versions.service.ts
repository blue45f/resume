import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import type { Prisma } from '@prisma/client'

type SnapshotRecord = Record<string, unknown>

type ResumeSnapshot = {
  title?: unknown
  personalInfo?: unknown
  experiences?: unknown
  educations?: unknown
  skills?: unknown
  projects?: unknown
}

const isSnapshotRecord = (value: unknown): value is SnapshotRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const snapshotItems = (value: unknown): SnapshotRecord[] =>
  Array.isArray(value) ? value.filter(isSnapshotRecord) : []

const snapshotString = (value: unknown): string => (typeof value === 'string' ? value : '')
const snapshotBoolean = (value: unknown): boolean => (typeof value === 'boolean' ? value : false)

@Injectable()
export class VersionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 이력서 소유권 검증 (versions는 이력서 스냅샷 전체를 포함하므로
   * 공개/비공개와 무관하게 소유자만 접근 가능)
   */
  private async assertOwnership(resumeId: string, userId?: string, role?: string) {
    const isAdmin = role === 'admin' || role === 'superadmin'
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    })
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다')
    if (!isAdmin && resume.userId && resume.userId !== userId) {
      throw new ForbiddenException('이 이력서의 버전에 접근할 권한이 없습니다')
    }
  }

  async findAll(resumeId: string, userId?: string, role?: string) {
    await this.assertOwnership(resumeId, userId, role)
    const versions = await this.prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        description: true,
        createdAt: true,
      },
    })
    return versions.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
    }))
  }

  async findOne(resumeId: string, versionId: string, userId?: string, role?: string) {
    await this.assertOwnership(resumeId, userId, role)
    const version = await this.prisma.resumeVersion.findFirst({
      where: { id: versionId, resumeId },
    })
    if (!version) throw new NotFoundException('버전을 찾을 수 없습니다')
    return {
      ...version,
      snapshot: JSON.parse(version.snapshot),
      createdAt: version.createdAt.toISOString(),
    }
  }

  async restore(resumeId: string, versionId: string, userId?: string, role?: string) {
    const version = await this.prisma.resumeVersion.findFirst({
      where: { id: versionId, resumeId },
      include: { resume: { select: { userId: true } } },
    })
    if (!version) throw new NotFoundException('버전을 찾을 수 없습니다')

    // 소유권 검증 (admin은 우회 가능)
    const isAdmin = role === 'admin' || role === 'superadmin'
    if (!isAdmin && version.resume.userId && version.resume.userId !== userId) {
      throw new ForbiddenException('이 이력서의 버전을 복원할 권한이 없습니다')
    }

    let snapshot: ResumeSnapshot
    try {
      snapshot = JSON.parse(version.snapshot) as ResumeSnapshot
    } catch {
      throw new BadRequestException('버전 데이터가 손상되었습니다')
    }

    // Use a transaction to restore
    await this.prisma.$transaction(async (tx) => {
      await tx.resume.update({
        where: { id: resumeId },
        data: { title: snapshotString(snapshot.title) },
      })

      if (isSnapshotRecord(snapshot.personalInfo)) {
        const piData = { ...snapshot.personalInfo }
        // links가 배열이면 JSON으로 변환
        if (Array.isArray(piData.links)) piData.links = JSON.stringify(piData.links)
        // id 필드 제거 (Prisma가 자동 생성)
        delete piData.id
        delete piData.resumeId
        const personalInfoData = piData as Omit<Prisma.PersonalInfoUncheckedCreateInput, 'resumeId'>
        await tx.personalInfo.upsert({
          where: { resumeId },
          create: { ...personalInfoData, resumeId },
          update: personalInfoData,
        })
      }

      // Replace collections
      await tx.experience.deleteMany({ where: { resumeId } })
      const experiences = snapshotItems(snapshot.experiences)
      if (experiences.length) {
        await tx.experience.createMany({
          data: experiences.map((e, i) => ({
            resumeId,
            company: snapshotString(e.company),
            position: snapshotString(e.position),
            department: snapshotString(e.department),
            startDate: snapshotString(e.startDate),
            endDate: snapshotString(e.endDate),
            current: snapshotBoolean(e.current),
            description: snapshotString(e.description),
            achievements: snapshotString(e.achievements),
            techStack: snapshotString(e.techStack),
            sortOrder: i,
          })),
        })
      }

      await tx.education.deleteMany({ where: { resumeId } })
      const educations = snapshotItems(snapshot.educations)
      if (educations.length) {
        await tx.education.createMany({
          data: educations.map((e, i) => ({
            resumeId,
            school: snapshotString(e.school),
            degree: snapshotString(e.degree),
            field: snapshotString(e.field),
            gpa: snapshotString(e.gpa),
            startDate: snapshotString(e.startDate),
            endDate: snapshotString(e.endDate),
            description: snapshotString(e.description),
            sortOrder: i,
          })),
        })
      }

      await tx.skill.deleteMany({ where: { resumeId } })
      const skills = snapshotItems(snapshot.skills)
      if (skills.length) {
        await tx.skill.createMany({
          data: skills.map((s, i) => ({
            resumeId,
            category: snapshotString(s.category),
            items: snapshotString(s.items),
            sortOrder: i,
          })),
        })
      }

      await tx.project.deleteMany({ where: { resumeId } })
      const projects = snapshotItems(snapshot.projects)
      if (projects.length) {
        await tx.project.createMany({
          data: projects.map((p, i) => ({
            resumeId,
            name: snapshotString(p.name),
            company: snapshotString(p.company),
            role: snapshotString(p.role),
            startDate: snapshotString(p.startDate),
            endDate: snapshotString(p.endDate),
            description: snapshotString(p.description),
            techStack: snapshotString(p.techStack),
            link: snapshotString(p.link),
            sortOrder: i,
          })),
        })
      }
    })

    return { success: true, restoredVersion: version.versionNumber }
  }
}
