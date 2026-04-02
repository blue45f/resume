import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByResume(resumeId: string) {
    // Only allow comments on public resumes
    const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.visibility !== 'public') {
      throw new NotFoundException('공개 이력서를 찾을 수 없습니다');
    }
    return this.prisma.comment.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(resumeId: string, content: string, userId?: string, authorName?: string) {
    const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.visibility !== 'public') {
      throw new NotFoundException('공개 이력서에만 의견을 남길 수 있습니다');
    }
    if (!content || content.trim().length < 5) {
      throw new ForbiddenException('의견은 5자 이상 입력해주세요');
    }
    if (content.length > 500) {
      throw new ForbiddenException('의견은 500자 이내로 입력해주세요');
    }

    let name = authorName || '익명';
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) name = user.name || user.email;
    }

    return this.prisma.comment.create({
      data: { resumeId, userId, authorName: name, content: content.trim() },
    });
  }

  async remove(id: string, userId?: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('의견을 찾을 수 없습니다');
    // Only author can delete
    if (comment.userId !== userId) {
      throw new ForbiddenException('삭제 권한이 없습니다');
    }
    await this.prisma.comment.delete({ where: { id } });
    return { success: true };
  }
}
