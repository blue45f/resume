import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';

export interface CreateInterviewAnswerDto {
  question: string;
  answer: string;
  resumeId?: string;
  jobRole?: string;
}

export interface AiAnswerFeedback {
  overallScore: number; // 1-100
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  rewrittenAnswer: string;
  starBreakdown: { situation: string; task: string; action: string; result: string };
}

@Injectable()
export class InterviewService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LlmService)) private llm: LlmService,
  ) {}

  /**
   * LLM 기반 면접 답변 분석 — 휴리스틱 클라이언트 분석기 + 깊이감 위해 LLM 호출.
   * heuristic 보다 풍부한 피드백 (구체적 강점/약점/개선안/리라이트 답변).
   * 비용: 매 호출당 ~500-1000 토큰. throttle: 5 req/min/user (controller 측).
   */
  async analyzeAnswer(
    userId: string,
    body: { question: string; answer: string; jobRole?: string; save?: boolean },
  ): Promise<AiAnswerFeedback> {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    if (!body?.question?.trim() || !body?.answer?.trim()) {
      throw new BadRequestException('질문과 답변이 필요합니다');
    }
    if (body.answer.length > 3000) {
      throw new BadRequestException('답변은 3000자 이내여야 합니다');
    }

    const systemPrompt = `당신은 한국 채용 시장 전문 면접 코치입니다. 면접 답변을 분석하여 JSON 으로 응답하세요. 마크다운/추가 설명 금지.

스키마:
{
  "overallScore": number (1-100, 면접관 관점 종합 점수),
  "strengths": string[] (2-3개, 답변의 잘된 점),
  "weaknesses": string[] (2-3개, 부족한 점, 신랄하지 않게 친절히),
  "improvements": string[] (3-5개, 구체적 개선 행동),
  "rewrittenAnswer": string (개선된 모범 답변, 200-400자, 자연스러운 한국어),
  "starBreakdown": {
    "situation": string (1줄, 답변에서 추출 또는 보강 제안),
    "task": string (1줄),
    "action": string (1줄),
    "result": string (1줄)
  }
}

평가 기준:
- STAR 구조 명확성, 정량적 결과, 1인칭 책임감, 구체성, 한국 면접 문화 적합성.
- rewrittenAnswer 는 사용자의 사실 관계는 유지하되 표현/구조만 개선.`;

    const userMessage = `[질문]
${body.question}

${body.jobRole ? `[지원 직무] ${body.jobRole}\n\n` : ''}[답변]
${body.answer}`;

    const res = await this.llm.generateWithFallback(systemPrompt, userMessage);
    const parsed = this.parseLlmJson(res.text);
    // save=true 면 InterviewAnswer row 로 누적 저장 (시간별 점수 추세 비교용)
    if (body.save) {
      await this.prisma.interviewAnswer
        .create({
          data: {
            userId,
            question: body.question.slice(0, 500),
            answer: body.answer,
            jobRole: body.jobRole ?? null,
            analysisScore: parsed.overallScore,
            analysisJson: JSON.stringify(parsed),
            analyzedAt: new Date(),
          },
        })
        .catch(() => {});
    }
    return parsed;
  }

  /** 최근 90일 점수 추세 — 차트용 daily aggregation. */
  async scoreHistory(userId: string) {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.interviewAnswer.findMany({
      where: { userId, analysisScore: { not: null }, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        question: true,
        analysisScore: true,
        jobRole: true,
        createdAt: true,
      },
    });
    return rows;
  }

  private parseLlmJson(text: string): AiAnswerFeedback {
    const cleaned = (text || '')
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) {
        throw new BadRequestException('AI 응답을 파싱하지 못했습니다. 다시 시도해주세요.');
      }
      obj = JSON.parse(cleaned.slice(start, end + 1));
    }
    const arr = (v: unknown): string[] => {
      if (!Array.isArray(v)) return [];
      return v
        .filter((x): x is string => typeof x === 'string')
        .map((s) => s.trim())
        .filter(Boolean);
    };
    const star = (obj.starBreakdown as Record<string, unknown>) || {};
    const score = Math.max(1, Math.min(100, Number(obj.overallScore) || 50));
    return {
      overallScore: score,
      strengths: arr(obj.strengths).slice(0, 5),
      weaknesses: arr(obj.weaknesses).slice(0, 5),
      improvements: arr(obj.improvements).slice(0, 7),
      rewrittenAnswer: String(obj.rewrittenAnswer || '').slice(0, 1500),
      starBreakdown: {
        situation: String(star.situation || ''),
        task: String(star.task || ''),
        action: String(star.action || ''),
        result: String(star.result || ''),
      },
    };
  }

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

  /** 단건 조회 — 시간별 추세 chart 클릭 시 detail modal 용. analysisJson 파싱해서 반환. */
  async findOne(id: string, userId: string) {
    const item = await this.prisma.interviewAnswer.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('답변을 찾을 수 없습니다');
    if (item.userId !== userId) throw new ForbiddenException('권한이 없습니다');
    let analysis: any = null;
    if (item.analysisJson) {
      try {
        analysis = JSON.parse(item.analysisJson);
      } catch {
        analysis = null;
      }
    }
    return {
      id: item.id,
      question: item.question,
      answer: item.answer,
      jobRole: item.jobRole,
      analysisScore: item.analysisScore,
      analyzedAt: item.analyzedAt,
      createdAt: item.createdAt,
      analysis,
    };
  }
}
