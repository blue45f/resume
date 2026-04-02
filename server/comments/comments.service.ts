import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

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

    const cleanContent = content.trim().replace(/<[^>]*>/g, '');

    let name = authorName || '익명';
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) name = user.name || user.email;
    }

    const comment = await this.prisma.comment.create({
      data: { resumeId, userId, authorName: name, content: cleanContent },
    });

    // Notify resume owner
    if (resume.userId && resume.userId !== userId) {
      await this.notificationsService.create(
        resume.userId,
        'comment',
        `${name}님이 이력서에 의견을 남겼습니다: "${content.slice(0, 50)}..."`,
        `/resumes/${resumeId}/preview`,
      );
    }

    return comment;
  }

  async remove(id: string, userId?: string, role?: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('의견을 찾을 수 없습니다');
    // Author or admin can delete
    if (comment.userId !== userId && role !== 'admin' && role !== 'superadmin') {
      throw new ForbiddenException('삭제 권한이 없습니다');
    }
    await this.prisma.comment.delete({ where: { id } });
    return { success: true };
  }
}
