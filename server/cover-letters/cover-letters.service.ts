import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoverLettersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, company: true, position: true, tone: true,
        content: true, resumeId: true, applicationId: true,
        createdAt: true, updatedAt: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const cl = await this.prisma.coverLetter.findUnique({ where: { id } });
    if (!cl) throw new NotFoundException('자소서를 찾을 수 없습니다');
    if (cl.userId !== userId) throw new ForbiddenException('권한이 없습니다');
    return cl;
  }

  async create(userId: string, data: {
    resumeId?: string;
    applicationId?: string;
    company: string;
    position: string;
    tone: string;
    jobDescription: string;
    content: string;
  }) {
    return this.prisma.coverLetter.create({
      data: { userId, ...data },
    });
  }

  async update(id: string, userId: string, data: { content?: string; company?: string; position?: string }) {
    const cl = await this.prisma.coverLetter.findUnique({ where: { id } });
    if (!cl) throw new NotFoundException();
    if (cl.userId !== userId) throw new ForbiddenException();
    return this.prisma.coverLetter.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    const cl = await this.prisma.coverLetter.findUnique({ where: { id } });
    if (!cl) throw new NotFoundException();
    if (cl.userId !== userId) throw new ForbiddenException();
    await this.prisma.coverLetter.delete({ where: { id } });
    return { success: true };
  }

  async getByResume(resumeId: string, userId: string) {
    return this.prisma.coverLetter.findMany({
      where: { resumeId, userId },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
