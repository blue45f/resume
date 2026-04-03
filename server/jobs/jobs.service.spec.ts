import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  jobPost: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  user: { findUnique: jest.fn() },
};

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(JobsService);
    jest.clearAllMocks();
  });

  it('채용 공고 목록 반환', async () => {
    mockPrisma.jobPost.findMany.mockResolvedValue([{ id: 'j1', position: 'FE' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('리크루터만 공고 생성 가능', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', userType: 'personal' });
    await expect(service.create('u1', { position: 'FE' })).rejects.toThrow(ForbiddenException);
  });

  it('리크루터 공고 생성 성공', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', userType: 'recruiter', companyName: '네이버' });
    mockPrisma.jobPost.create.mockResolvedValue({ id: 'j1', position: 'FE' });
    const result = await service.create('u1', { position: 'FE' });
    expect(result.id).toBe('j1');
  });

  it('소유자만 수정 가능', async () => {
    mockPrisma.jobPost.findUnique.mockResolvedValue({ id: 'j1', userId: 'u1' });
    await expect(service.update('j1', 'u2', {})).rejects.toThrow(ForbiddenException);
  });

  it('존재하지 않는 공고 → NotFoundException', async () => {
    mockPrisma.jobPost.findUnique.mockResolvedValue(null);
    await expect(service.findOne('fake')).rejects.toThrow(NotFoundException);
  });

  it('admin은 타인 공고 삭제 가능', async () => {
    mockPrisma.jobPost.findUnique.mockResolvedValue({ id: 'j1', userId: 'u1' });
    mockPrisma.jobPost.delete.mockResolvedValue({});
    const result = await service.remove('j1', 'u2', 'admin');
    expect(result.success).toBe(true);
  });
});
