import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateInterviewAnswerDto {
  question: string;
  answer: string;
  resumeId?: string;
  jobRole?: string;
}

@Injectable()
export class InterviewService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateInterviewAnswerDto) {
    if (!data?.question || typeof data.question !== 'string' || !data.question.trim()) {
      throw new BadRequestException('질문은 필수입니다');
    }
    if (!data?.answer || typeof data.answer !== 'string' || !data.answer.trim()) {
      throw new BadRequestException('답변은 필수입니다');
    }
    return this.prisma.interviewAnswer.create({
      data: {
        userId,
        question: data.question,
        answer: data.answer,
        resumeId: data.resumeId ?? null,
        jobRole: data.jobRole ?? null,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.interviewAnswer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        question: true,
        answer: true,
        resumeId: true,
        jobRole: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.interviewAnswer.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('답변을 찾을 수 없습니다');
    if (item.userId !== userId) throw new ForbiddenException('권한이 없습니다');
    await this.prisma.interviewAnswer.delete({ where: { id } });
    return { success: true };
  }
}
