import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { BillingService } from '../billing/billing.service';

const mockPrisma: any = {
  interviewAnswer: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  },
};

const mockLlm = { generateWithFallback: jest.fn() };
const mockBilling = { checkQuota: jest.fn().mockResolvedValue(undefined) };

describe('InterviewService', () => {
  let service: InterviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LlmService, useValue: mockLlm },
        { provide: BillingService, useValue: mockBilling },
      ],
    }).compile();
    service = module.get(InterviewService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('question 공백 → BadRequest', async () => {
      await expect(service.create('u1', { question: '  ', answer: 'A' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('answer 공백 → BadRequest', async () => {
      await expect(service.create('u1', { question: 'Q?', answer: '  ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('question 비문자열 → BadRequest', async () => {
      await expect(service.create('u1', { question: 123 as any, answer: 'A' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('정상 입력 + 선택 필드 null 기본값', async () => {
      mockPrisma.interviewAnswer.create.mockResolvedValueOnce({ id: 'a1' });
      await service.create('u1', { question: '왜 이 회사?', answer: '성장 가능성' });
      expect(mockPrisma.interviewAnswer.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          question: '왜 이 회사?',
          answer: '성장 가능성',
          resumeId: null,
          jobRole: null,
        },
      });
    });

    it('resumeId/jobRole 전달 시 함께 저장', async () => {
      mockPrisma.interviewAnswer.create.mockResolvedValueOnce({ id: 'a1' });
      await service.create('u1', {
        question: '강점?',
        answer: '집중력',
        resumeId: 'r1',
        jobRole: 'frontend',
      });
      expect(mockPrisma.interviewAnswer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ resumeId: 'r1', jobRole: 'frontend' }),
      });
    });
  });

  describe('findAll', () => {
    it('본인 userId 필터 + 최신순 정렬', async () => {
      mockPrisma.interviewAnswer.findMany.mockResolvedValueOnce([]);
      await service.findAll('u1');
      expect(mockPrisma.interviewAnswer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('remove', () => {
    it('존재하지 않으면 NotFound', async () => {
      mockPrisma.interviewAnswer.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove('a1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('타인 답변 삭제 Forbidden (IDOR 방지)', async () => {
      mockPrisma.interviewAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'other',
      });
      await expect(service.remove('a1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('본인 답변 삭제 성공', async () => {
      mockPrisma.interviewAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'u1',
      });
      mockPrisma.interviewAnswer.delete.mockResolvedValueOnce({});
      await expect(service.remove('a1', 'u1')).resolves.toEqual({ success: true });
    });
  });

  describe('analyzeAnswer', () => {
    const validResp = {
      text: JSON.stringify({
        overallScore: 75,
        strengths: ['STAR 구조 명확', '정량 결과 포함'],
        weaknesses: ['약점 표현 부족'],
        improvements: ['더 구체적인 숫자 추가', '1인칭 강화'],
        rewrittenAnswer: '저는 ...',
        starBreakdown: { situation: 'A', task: 'B', action: 'C', result: 'D' },
      }),
    };

    it('비로그인 → ForbiddenException', async () => {
      await expect(service.analyzeAnswer('', { question: 'q', answer: 'a' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('빈 question/answer → BadRequestException', async () => {
      await expect(service.analyzeAnswer('u1', { question: '', answer: 'a' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.analyzeAnswer('u1', { question: 'q', answer: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('답변 3000자 초과 → BadRequestException', async () => {
      await expect(
        service.analyzeAnswer('u1', { question: 'q', answer: 'a'.repeat(3001) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('LLM 응답 파싱 + 스코어 clamp', async () => {
      mockLlm.generateWithFallback.mockResolvedValueOnce(validResp);
      const r = await service.analyzeAnswer('u1', {
        question: '본인을 소개해주세요',
        answer: '저는 백엔드 개발자입니다.',
      });
      expect(r.overallScore).toBe(75);
      expect(r.strengths).toHaveLength(2);
      expect(r.improvements).toHaveLength(2);
      expect(r.rewrittenAnswer).toBe('저는 ...');
      expect(r.starBreakdown.situation).toBe('A');
    });

    it('스코어 100 초과 → 100 으로 clamp', async () => {
      mockLlm.generateWithFallback.mockResolvedValueOnce({
        text: JSON.stringify({
          overallScore: 150,
          strengths: [],
          weaknesses: [],
          improvements: [],
          rewrittenAnswer: '',
          starBreakdown: {},
        }),
      });
      const r = await service.analyzeAnswer('u1', { question: 'q', answer: 'a' });
      expect(r.overallScore).toBe(100);
    });

    it('LLM 응답에 ```json``` 마커 → 정상 파싱', async () => {
      mockLlm.generateWithFallback.mockResolvedValueOnce({
        text:
          '```json\n' +
          JSON.stringify({
            overallScore: 60,
            strengths: ['s1'],
            weaknesses: [],
            improvements: [],
            rewrittenAnswer: '',
            starBreakdown: {},
          }) +
          '\n```',
      });
      const r = await service.analyzeAnswer('u1', { question: 'q', answer: 'a' });
      expect(r.overallScore).toBe(60);
    });

    it('LLM 응답이 JSON 아님 → BadRequestException', async () => {
      mockLlm.generateWithFallback.mockResolvedValueOnce({ text: '평범한 텍스트만 반환' });
      await expect(service.analyzeAnswer('u1', { question: 'q', answer: 'a' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('save=true 면 InterviewAnswer row 누적 저장 (analysisScore + analysisJson)', async () => {
      mockLlm.generateWithFallback.mockResolvedValueOnce(validResp);
      mockPrisma.interviewAnswer.create.mockResolvedValueOnce({ id: 'a1' });
      await service.analyzeAnswer('u1', {
        question: 'Q',
        answer: 'A 내용',
        save: true,
      });
      expect(mockPrisma.interviewAnswer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          analysisScore: 75,
          jobRole: null,
          analyzedAt: expect.any(Date),
          analysisJson: expect.stringContaining('overallScore'),
        }),
      });
    });

    it('save=false 또는 미지정 → row 저장 안 함', async () => {
      mockLlm.generateWithFallback.mockResolvedValue(validResp);
      await service.analyzeAnswer('u1', { question: 'Q', answer: 'A' });
      await service.analyzeAnswer('u1', { question: 'Q', answer: 'A', save: false });
      expect(mockPrisma.interviewAnswer.create).not.toHaveBeenCalled();
    });
  });

  describe('scoreHistory', () => {
    it('analysisScore 있는 row 만 반환 + 90일 cutoff', async () => {
      mockPrisma.interviewAnswer.findMany.mockResolvedValueOnce([
        { id: 'r1', question: 'Q1', analysisScore: 70, jobRole: 'BE', createdAt: new Date() },
      ]);
      const r = await service.scoreHistory('u1');
      expect(mockPrisma.interviewAnswer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'u1',
            analysisScore: { not: null },
            createdAt: { gte: expect.any(Date) },
          }),
          orderBy: { createdAt: 'asc' },
        }),
      );
      expect(r).toHaveLength(1);
    });
  });
});
