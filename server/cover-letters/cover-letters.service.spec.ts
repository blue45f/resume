import { Test, TestingModule } from '@nestjs/testing';
import { CoverLettersService } from './cover-letters.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

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

  it('자소서 목록 반환', async () => {
    mockPrisma.coverLetter.findMany.mockResolvedValue([{ id: 'cl-1', company: '네이버' }]);
    const result = await service.findAll('user-1');
    expect(result).toHaveLength(1);
  });

  it('자소서 생성', async () => {
    mockPrisma.coverLetter.create.mockResolvedValue({ id: 'cl-1', company: '카카오' });
    const result = await service.create('user-1', { company: '카카오', position: '개발자', tone: 'formal', jobDescription: 'JD', content: '내용' });
    expect(result.id).toBe('cl-1');
  });

  it('다른 사용자 자소서 접근 → ForbiddenException', async () => {
    mockPrisma.coverLetter.findUnique.mockResolvedValue({ id: 'cl-1', userId: 'user-2' });
    await expect(service.findOne('cl-1', 'user-1')).rejects.toThrow(ForbiddenException);
  });

  it('없는 자소서 → NotFoundException', async () => {
    mockPrisma.coverLetter.findUnique.mockResolvedValue(null);
    await expect(service.findOne('fake', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('자소서 삭제', async () => {
    mockPrisma.coverLetter.findUnique.mockResolvedValue({ id: 'cl-1', userId: 'user-1' });
    mockPrisma.coverLetter.delete.mockResolvedValue({});
    const result = await service.remove('cl-1', 'user-1');
    expect(result.success).toBe(true);
  });
});
