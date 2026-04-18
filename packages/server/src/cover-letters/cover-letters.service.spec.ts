import { Test, TestingModule } from '@nestjs/testing';
import { CoverLettersService } from './cover-letters.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockCoverLetter = {
  id: 'cl-1',
  userId: 'user-1',
  resumeId: 'resume-1',
  applicationId: null,
  company: '네이버',
  position: 'FE 개발자',
  tone: 'formal',
  jobDescription: 'React 전문가',
  content: '자기소개서 내용입니다.',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  coverLetter: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('CoverLettersService', () => {
  let service: CoverLettersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoverLettersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(CoverLettersService);
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────────────
  describe('findAll', () => {
    it('사용자의 자소서 목록 반환', async () => {
      mockPrisma.coverLetter.findMany.mockResolvedValue([mockCoverLetter]);
      const result = await service.findAll('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('네이버');
    });

    it('userId로 필터링하고 updatedAt 내림차순 정렬', async () => {
      mockPrisma.coverLetter.findMany.mockResolvedValue([]);
      await service.findAll('user-1');
      expect(mockPrisma.coverLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { updatedAt: 'desc' },
        }),
      );
    });

    it('자소서가 없으면 빈 배열', async () => {
      mockPrisma.coverLetter.findMany.mockResolvedValue([]);
      const result = await service.findAll('user-1');
      expect(result).toEqual([]);
    });

    it('반환값에 필요한 필드만 select', async () => {
      mockPrisma.coverLetter.findMany.mockResolvedValue([]);
      await service.findAll('user-1');
      expect(mockPrisma.coverLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            company: true,
            position: true,
            tone: true,
            content: true,
            resumeId: true,
            applicationId: true,
            createdAt: true,
            updatedAt: true,
          }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // findOne
  // ──────────────────────────────────────────────────
  describe('findOne', () => {
    it('소유자가 자소서 조회 성공', async () => {
      mockPrisma.coverLetter.findUnique.mockResolvedValue(mockCoverLetter);
      const result = await service.findOne('cl-1', 'user-1');
      expect(result.id).toBe('cl-1');
      expect(result.company).toBe('네이버');
    });

    it('다른 사용자 자소서 접근 → ForbiddenException', async () => {
      mockPrisma.coverLetter.findUnique.mockResolvedValue(mockCoverLetter);
      await expect(service.findOne('cl-1', 'other-user')).rejects.toThrow(ForbiddenException);
      await expect(service.findOne('cl-1', 'other-user')).rejects.toThrow('권한이 없습니다');
    });

    it('없는 자소서 → NotFoundException', async () => {
      mockPrisma.coverLetter.findUnique.mockResolvedValue(null);
      await expect(service.findOne('fake', 'user-1')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('fake', 'user-1')).rejects.toThrow('자소서를 찾을 수 없습니다');
    });
  });

  // ──────────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────────
  describe('create', () => {
    it('자소서 생성 성공', async () => {
      const data = {
        company: '카카오',
        position: '백엔드',
        tone: 'formal',
        jobDescription: 'JD',
        content: '내용',
      };
      mockPrisma.coverLetter.create.mockResolvedValue({ id: 'cl-2', userId: 'user-1', ...data });

      const result = await service.create('user-1', data);
      expect(result.id).toBe('cl-2');
      expect(result.company).toBe('카카오');
    });

    it('userId와 data가 함께 저장', async () => {
      const data = {
        company: '라인',
        position: 'FE',
        tone: 'casual',
        jobDescription: 'JD',
        content: '내용',
      };
      mockPrisma.coverLetter.create.mockResolvedValue({ id: 'cl-3', ...data });

      await service.create('user-1', data);
      expect(mockPrisma.coverLetter.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', ...data },
      });
    });

    it('resumeId와 applicationId 포함 생성', async () => {
      const data = {
        resumeId: 'resume-1',
        applicationId: 'app-1',
        company: '쿠팡',
        position: 'BE',
        tone: 'formal',
        jobDescription: 'JD',
        content: '내용',
      };
      mockPrisma.coverLetter.create.mockResolvedValue({ id: 'cl-4', ...data });

      await service.create('user-1', data);
      expect(mockPrisma.coverLetter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          resumeId: 'resume-1',
          applicationId: 'app-1',
        }),
      });
    });
  });

  // ──────────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────────
  describe('update', () => {
    it('소유자가 자소서 수정 성공', async () => {
      mockPrisma.coverLetter.findUnique.mockResolvedValue(mockCoverLetter);
      mockPrisma.coverLetter.update.mockResolvedValue({
        ...mockCoverLetter,
        content: '수정된 내용',
      });

      const result = await service.update('cl-1', 'user-1', { content: '수정된 내용' });
      expect(result.content).toBe('수정된 내용');
      expect(mockPrisma.coverLetter.update).toHaveBeenCalledWith({
        where: { id: 'cl-1' },
        data: { content: '수정된 내용' },
      });
    });

    it('회사명과 포지션 수정', async () => {
      mockPrisma.coverLetter.findUnique.mockResolvedValue(mockCoverLetter);
      mockPrisma.coverLetter.update.mockResolvedValue({
        ...mockCoverLetter,
        company: '구글',
        position: 'SWE',
      });

      const result = await service.update('cl-1', 'user-1', { company: '구글', position: 'SWE' });
      expect(result.company).toBe('구글');
      expect(result.position).toBe('SWE');
    });

    it('다른 사용자 자소서 수정 → ForbiddenException', async () => {
      mockPrisma.coverLetter.findUnique.mockResolvedValue(mockCoverLetter);
      await expect(service.update('cl-1', 'other-user', { content: 'hack' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.coverLetter.update).not.toHaveBeenCalled();
    });

    it('없는 자소서 수정 → NotFoundException', async () => {
      mockPrisma.coverLetter.findUnique.mockResolvedValue(null);
      await expect(service.update('fake', 'user-1', { content: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ──────────────────────────────────────────────────
  // remove
  // ──────────────────────────────────────────────────
  describe('remove', () => {
    it('소유자가 자소서 삭제 성공', async () => {
      mockPrisma.coverLetter.findUnique.mockResolvedValue(mockCoverLetter);
      mockPrisma.coverLetter.delete.mockResolvedValue({});
      const result = await service.remove('cl-1', 'user-1');
      expect(result).toEqual({ success: true });
      expect(mockPrisma.coverLetter.delete).toHaveBeenCalledWith({ where: { id: 'cl-1' } });
    });

    it('다른 사용자 자소서 삭제 → ForbiddenException', async () => {
      mockPrisma.coverLetter.findUnique.mockResolvedValue(mockCoverLetter);
      await expect(service.remove('cl-1', 'other-user')).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.coverLetter.delete).not.toHaveBeenCalled();
    });

    it('없는 자소서 삭제 → NotFoundException', async () => {
      mockPrisma.coverLetter.findUnique.mockResolvedValue(null);
      await expect(service.remove('fake', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────
  // getByResume
  // ──────────────────────────────────────────────────
  describe('getByResume', () => {
    it('특정 이력서의 자소서 목록 반환', async () => {
      mockPrisma.coverLetter.findMany.mockResolvedValue([mockCoverLetter]);
      const result = await service.getByResume('resume-1', 'user-1');
      expect(result).toHaveLength(1);
      expect(result[0].resumeId).toBe('resume-1');
    });

    it('resumeId + userId로 필터링', async () => {
      mockPrisma.coverLetter.findMany.mockResolvedValue([]);
      await service.getByResume('resume-1', 'user-1');
      expect(mockPrisma.coverLetter.findMany).toHaveBeenCalledWith({
        where: { resumeId: 'resume-1', userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('해당 이력서에 자소서가 없으면 빈 배열', async () => {
      mockPrisma.coverLetter.findMany.mockResolvedValue([]);
      const result = await service.getByResume('resume-no', 'user-1');
      expect(result).toEqual([]);
    });
  });
});
