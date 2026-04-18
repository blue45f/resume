import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma: any = {
  interviewAnswer: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('InterviewService', () => {
  let service: InterviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InterviewService, { provide: PrismaService, useValue: mockPrisma }],
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
});
