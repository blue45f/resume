import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';

export interface CreateJobInterviewQuestionDto {
  jobPostId?: string;
  curatedJobId?: string;
  companyName: string;
  position: string;
  question: string;
  sampleAnswer?: string;
  category?: string;
  difficulty?: string;
  source?: string;
}

export interface ListJobInterviewQuestionsQuery {
  company?: string;
  position?: string;
  jobPostId?: string;
  curatedJobId?: string;
  limit?: number;
}

export interface AiGenerateDto {
  jobPostId?: string;
  curatedJobId?: string;
  companyName: string;
  position: string;
  description?: string;
  requirements?: string;
  skills?: string;
  count?: number;
  persist?: boolean;
}

@Injectable()
export class JobInterviewQuestionsService {
  constructor(
    private prisma: PrismaService,
    private llm: LlmService,
  ) {}

  async list(query: ListJobInterviewQuestionsQuery, userId?: string | null) {
    const where: any = {};
    if (query.jobPostId) where.jobPostId = query.jobPostId;
    if (query.curatedJobId) where.curatedJobId = query.curatedJobId;
    if (query.company) where.companyName = { contains: query.company, mode: 'insensitive' };
    if (query.position) where.position = { contains: query.position, mode: 'insensitive' };

    const limit = Math.min(query.limit ?? 50, 200);

    const items = await this.prisma.jobInterviewQuestion.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { votes: true } },
      },
      orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    if (!userId) {
      return items.map((q) => ({ ...q, myVote: false }));
    }

    const votes = await this.prisma.jobInterviewQuestionVote.findMany({
      where: { userId, questionId: { in: items.map((i) => i.id) } },
      select: { questionId: true },
    });
    const votedSet = new Set(votes.map((v) => v.questionId));
    return items.map((q) => ({ ...q, myVote: votedSet.has(q.id) }));
  }

  async create(userId: string, data: CreateJobInterviewQuestionDto) {
    if (!data?.companyName || !data.companyName.trim()) {
      throw new BadRequestException('회사명은 필수입니다');
    }
    if (!data?.position || !data.position.trim()) {
      throw new BadRequestException('직무는 필수입니다');
    }
    if (!data?.question || !data.question.trim()) {
      throw new BadRequestException('질문은 필수입니다');
    }

    // Validate refs if provided
    if (data.jobPostId) {
      const exists = await this.prisma.jobPost.findUnique({ where: { id: data.jobPostId }, select: { id: true } });
      if (!exists) throw new NotFoundException('채용 공고를 찾을 수 없습니다');
    }
    if (data.curatedJobId) {
      const exists = await this.prisma.curatedJob.findUnique({ where: { id: data.curatedJobId }, select: { id: true } });
      if (!exists) throw new NotFoundException('큐레이션 채용을 찾을 수 없습니다');
    }

    return this.prisma.jobInterviewQuestion.create({
      data: {
        jobPostId: data.jobPostId ?? null,
        curatedJobId: data.curatedJobId ?? null,
        companyName: data.companyName.trim(),
        position: data.position.trim(),
        question: data.question.trim(),
        sampleAnswer: (data.sampleAnswer ?? '').trim(),
        category: data.category ?? '',
        difficulty: data.difficulty ?? 'intermediate',
        source: data.source ?? 'user',
        authorId: userId,
      },
    });
  }

  async toggleUpvote(questionId: string, userId: string) {
    const question = await this.prisma.jobInterviewQuestion.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!question) throw new NotFoundException('질문을 찾을 수 없습니다');

    const existing = await this.prisma.jobInterviewQuestionVote.findUnique({
      where: { questionId_userId: { questionId, userId } },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.jobInterviewQuestionVote.delete({ where: { id: existing.id } }),
        this.prisma.jobInterviewQuestion.update({
          where: { id: questionId },
          data: { upvotes: { decrement: 1 } },
        }),
      ]);
      return { upvoted: false };
    }

    await this.prisma.$transaction([
      this.prisma.jobInterviewQuestionVote.create({ data: { questionId, userId } }),
      this.prisma.jobInterviewQuestion.update({
        where: { id: questionId },
        data: { upvotes: { increment: 1 } },
      }),
    ]);
    return { upvoted: true };
  }

  async remove(id: string, userId: string, role?: string) {
    const question = await this.prisma.jobInterviewQuestion.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('질문을 찾을 수 없습니다');
    const isAdmin = role === 'admin' || role === 'superadmin';
    if (question.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('권한이 없습니다');
    }
    await this.prisma.jobInterviewQuestion.delete({ where: { id } });
    return { success: true };
  }

  async aiGenerate(userId: string | null, dto: AiGenerateDto) {
    if (!dto?.companyName?.trim() || !dto?.position?.trim()) {
      throw new BadRequestException('회사명/직무는 필수입니다');
    }

    const count = Math.min(Math.max(dto.count ?? 5, 1), 10);

    const systemPrompt = `당신은 기업 면접 질문 설계 전문가입니다. 주어진 채용 정보를 바탕으로 실전에서 나올 수 있는 예상 면접 질문과 모범 답변을 작성해 주세요.
- 자기소개/기술/행동/상황/인성 중 다양한 카테고리를 섞습니다.
- 회사/직무 맥락에 맞는 구체적인 질문을 작성합니다.
- 모범답변은 STAR 기법 또는 구체적 경험 중심으로 150~250자로 작성합니다.
- 반드시 순수 JSON 배열만 출력합니다. 설명/마크다운/코드블록 금지.`;

    const userMessage = JSON.stringify(
      {
        company: dto.companyName,
        position: dto.position,
        description: dto.description ?? '',
        requirements: dto.requirements ?? '',
        skills: dto.skills ?? '',
        count,
        schema: [
          {
            question: 'string',
            sampleAnswer: 'string',
            category: '자기소개 | 기술 | 행동 | 상황 | 인성',
            difficulty: 'easy | intermediate | hard',
          },
        ],
      },
      null,
      2,
    );

    const result = await this.llm.generateWithFallback(systemPrompt, userMessage);

    let parsed: any[] = [];
    try {
      const text = (result.text || '').trim();
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']');
      const jsonStr = jsonStart >= 0 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text;
      parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) parsed = [];
    } catch {
      throw new BadRequestException('AI 응답을 파싱하지 못했습니다. 다시 시도해주세요.');
    }

    const sanitized = parsed
      .filter((q) => q && typeof q.question === 'string' && q.question.trim())
      .slice(0, count)
      .map((q) => ({
        question: String(q.question).trim(),
        sampleAnswer: String(q.sampleAnswer ?? '').trim(),
        category: String(q.category ?? '').trim(),
        difficulty: ['easy', 'intermediate', 'hard'].includes(q.difficulty) ? q.difficulty : 'intermediate',
      }));

    if (dto.persist && userId) {
      const created = await this.prisma.$transaction(
        sanitized.map((q) =>
          this.prisma.jobInterviewQuestion.create({
            data: {
              jobPostId: dto.jobPostId ?? null,
              curatedJobId: dto.curatedJobId ?? null,
              companyName: dto.companyName.trim(),
              position: dto.position.trim(),
              question: q.question,
              sampleAnswer: q.sampleAnswer,
              category: q.category,
              difficulty: q.difficulty,
              source: 'ai',
              authorId: userId,
            },
          }),
        ),
      );
      return { questions: created, persisted: true, provider: result.provider, model: result.model };
    }

    return { questions: sanitized, persisted: false, provider: result.provider, model: result.model };
  }
}
