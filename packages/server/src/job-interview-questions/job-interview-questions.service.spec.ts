import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JobInterviewQuestionsService } from './job-interview-questions.service';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';

const mockPrisma: any = {
  jobInterviewQuestion: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  jobInterviewQuestionVote: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  jobPost: { findUnique: jest.fn() },
  curatedJob: { findUnique: jest.fn() },
  $transaction: jest.fn(async (ops: any) => {
    if (Array.isArray(ops)) return Promise.all(ops);
    return ops(mockPrisma);
  }),
};

const mockLlm: Partial<LlmService> = {
  generateWithFallback: jest.fn(),
};

describe('JobInterviewQuestionsService', () => {
  let service: JobInterviewQuestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobInterviewQuestionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LlmService, useValue: mockLlm },
      ],
    }).compile();
    service = module.get(JobInterviewQuestionsService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('로그인 안 한 경우 myVote=false', async () => {
      mockPrisma.jobInterviewQuestion.findMany.mockResolvedValueOnce([{ id: 'q1' }, { id: 'q2' }]);
      const res = await service.list({});
      expect(res).toEqual([
        { id: 'q1', myVote: false },
        { id: 'q2', myVote: false },
      ]);
      expect(mockPrisma.jobInterviewQuestionVote.findMany).not.toHaveBeenCalled();
    });

    it('로그인 유저는 myVote 실제 반영', async () => {
      mockPrisma.jobInterviewQuestion.findMany.mockResolvedValueOnce([{ id: 'q1' }, { id: 'q2' }]);
      mockPrisma.jobInterviewQuestionVote.findMany.mockResolvedValueOnce([{ questionId: 'q1' }]);
      const res = await service.list({}, 'u1');
      expect(res[0].myVote).toBe(true);
      expect(res[1].myVote).toBe(false);
    });

    it('limit 상한 200 clamp', async () => {
      mockPrisma.jobInterviewQuestion.findMany.mockResolvedValueOnce([]);
      await service.list({ limit: 9999 });
      expect(mockPrisma.jobInterviewQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 200 }),
      );
    });
  });

  describe('create', () => {
    it('companyName 공백 → BadRequest', async () => {
      await expect(
        service.create('u1', {
          companyName: '  ',
          position: '프론트엔드',
          question: '왜?',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('position 공백 → BadRequest', async () => {
      await expect(
        service.create('u1', {
          companyName: '네이버',
          position: '',
          question: '왜?',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('question 공백 → BadRequest', async () => {
      await expect(
        service.create('u1', {
          companyName: '네이버',
          position: 'FE',
          question: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('존재하지 않는 jobPostId → NotFound', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create('u1', {
          companyName: '네이버',
          position: 'FE',
          question: '왜?',
          jobPostId: 'missing',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('정상 입력 시 생성 + authorId/기본 source 설정', async () => {
      mockPrisma.jobInterviewQuestion.create.mockResolvedValueOnce({ id: 'q1' });
      await service.create('u1', {
        companyName: '  네이버 ',
        position: ' FE ',
        question: ' 왜 지원? ',
      });
      expect(mockPrisma.jobInterviewQuestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyName: '네이버',
          position: 'FE',
          question: '왜 지원?',
          authorId: 'u1',
          source: 'user',
          difficulty: 'intermediate',
        }),
      });
    });
  });

  describe('toggleUpvote', () => {
    it('존재하지 않는 질문 → NotFound', async () => {
      mockPrisma.jobInterviewQuestion.findUnique.mockResolvedValueOnce(null);
      await expect(service.toggleUpvote('q1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('이미 투표한 경우 → 삭제 + upvotes 감소', async () => {
      mockPrisma.jobInterviewQuestion.findUnique.mockResolvedValueOnce({ id: 'q1' });
      mockPrisma.jobInterviewQuestionVote.findUnique.mockResolvedValueOnce({ id: 'v1' });
      const result = await service.toggleUpvote('q1', 'u1');
      expect(result).toEqual({ upvoted: false });
    });

    it('신규 투표 → 생성 + upvotes 증가', async () => {
      mockPrisma.jobInterviewQuestion.findUnique.mockResolvedValueOnce({ id: 'q1' });
      mockPrisma.jobInterviewQuestionVote.findUnique.mockResolvedValueOnce(null);
      const result = await service.toggleUpvote('q1', 'u1');
      expect(result).toEqual({ upvoted: true });
    });
  });

  describe('remove', () => {
    it('타인 질문 삭제 Forbidden', async () => {
      mockPrisma.jobInterviewQuestion.findUnique.mockResolvedValueOnce({
        id: 'q1',
        authorId: 'other',
      });
      await expect(service.remove('q1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('admin 역할은 타인 질문 삭제 가능', async () => {
      mockPrisma.jobInterviewQuestion.findUnique.mockResolvedValueOnce({
        id: 'q1',
        authorId: 'other',
      });
      await expect(service.remove('q1', 'u1', 'admin')).resolves.toEqual({ success: true });
    });

    it('작성자 본인은 삭제 가능', async () => {
      mockPrisma.jobInterviewQuestion.findUnique.mockResolvedValueOnce({
        id: 'q1',
        authorId: 'u1',
      });
      await expect(service.remove('q1', 'u1')).resolves.toEqual({ success: true });
    });
  });

  describe('admin APIs', () => {
    it('adminList status=pending 필터 — isApproved=false + isRejected=false', async () => {
      mockPrisma.jobInterviewQuestion.findMany.mockResolvedValueOnce([]);
      mockPrisma.jobInterviewQuestion.count.mockResolvedValueOnce(0);
      await service.adminList({ status: 'pending', page: 1, limit: 10 });
      expect(mockPrisma.jobInterviewQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isApproved: false, isRejected: false }),
        }),
      );
    });

    it('adminApprove → isApproved=true, isRejected=false', async () => {
      await service.adminApprove('q1');
      expect(mockPrisma.jobInterviewQuestion.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { isApproved: true, isRejected: false },
      });
    });

    it('adminReject → isRejected=true, isApproved=false', async () => {
      await service.adminReject('q1');
      expect(mockPrisma.jobInterviewQuestion.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { isRejected: true, isApproved: false },
      });
    });

    it('adminSetUpvotes 음수 → 0 clamp', async () => {
      await service.adminSetUpvotes('q1', -5);
      expect(mockPrisma.jobInterviewQuestion.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { upvotes: 0 },
      });
    });

    it('adminSetUpvotes 소수점 → 내림 정수', async () => {
      await service.adminSetUpvotes('q1', 7.9 as any);
      expect(mockPrisma.jobInterviewQuestion.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { upvotes: 7 },
      });
    });
  });

  describe('aiGenerate', () => {
    it('companyName/position 누락 시 BadRequest', async () => {
      await expect(service.aiGenerate('u1', { companyName: '', position: 'FE' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('count 범위 1~10 clamp (11 → 10) + LLM 성공 응답 파싱', async () => {
      (mockLlm.generateWithFallback as jest.Mock).mockResolvedValueOnce({
        text: JSON.stringify([
          { question: 'Q1?', sampleAnswer: 'A1', category: '기술', difficulty: 'hard' },
          { question: 'Q2?', sampleAnswer: 'A2', category: '인성', difficulty: 'weird' },
        ]),
        provider: 'groq',
        model: 'llama',
      });
      const res = await service.aiGenerate(null, {
        companyName: '네이버',
        position: 'FE',
        count: 11,
      });
      expect(res.persisted).toBe(false);
      expect(res.questions).toHaveLength(2);
      // 유효하지 않은 difficulty 는 'intermediate' 로 보정
      expect(res.questions[1].difficulty).toBe('intermediate');
    });

    it('persist=true + userId 있을 때 DB 저장', async () => {
      (mockLlm.generateWithFallback as jest.Mock).mockResolvedValueOnce({
        text: '[{"question":"Q1?","sampleAnswer":"A1","category":"기술","difficulty":"easy"}]',
        provider: 'groq',
        model: 'llama',
      });
      mockPrisma.jobInterviewQuestion.create.mockImplementation((args: any) => ({
        id: 'q1',
        ...args.data,
      }));
      const res = await service.aiGenerate('u1', {
        companyName: '네이버',
        position: 'FE',
        persist: true,
      });
      expect(res.persisted).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('파싱 실패 → BadRequest', async () => {
      (mockLlm.generateWithFallback as jest.Mock).mockResolvedValueOnce({
        text: 'not-json-at-all',
        provider: 'groq',
        model: 'llama',
      });
      await expect(
        service.aiGenerate(null, { companyName: '네이버', position: 'FE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('question 필드 없는 항목은 필터링', async () => {
      (mockLlm.generateWithFallback as jest.Mock).mockResolvedValueOnce({
        text: JSON.stringify([
          { question: 'Valid?', sampleAnswer: 'A' },
          { sampleAnswer: 'no question here' },
          { question: '   ' },
        ]),
        provider: 'groq',
        model: 'llama',
      });
      const res = await service.aiGenerate(null, { companyName: '네이버', position: 'FE' });
      expect(res.questions).toHaveLength(1);
      expect(res.questions[0].question).toBe('Valid?');
    });
  });
});
