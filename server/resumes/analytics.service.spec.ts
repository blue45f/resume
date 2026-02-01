import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  resume: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  resumeVersion: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  llmTransformation: {
    count: jest.fn(),
  },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AnalyticsService);
    jest.clearAllMocks();
  });

  it('대시보드 통계 반환', async () => {
    mockPrisma.resume.findMany.mockResolvedValue([
      { id: 'r1', title: 'Test', viewCount: 10, visibility: 'public', updatedAt: new Date() },
      { id: 'r2', title: 'Test2', viewCount: 5, visibility: 'private', updatedAt: new Date() },
    ]);
    mockPrisma.resume.aggregate.mockResolvedValue({ _sum: { viewCount: 15 } });
    mockPrisma.resumeVersion.findMany.mockResolvedValue([]);
    mockPrisma.resumeVersion.count.mockResolvedValue(3);
    mockPrisma.llmTransformation.count.mockResolvedValue(7);

    const result = await service.getUserDashboard('user-1');
    expect(result.summary.totalResumes).toBe(2);
    expect(result.summary.publicResumes).toBe(1);
    expect(result.summary.totalViews).toBe(15);
    expect(result.summary.totalTransforms).toBe(7);
    expect(result.summary.recentEdits).toBe(3);
    expect(result.resumes).toHaveLength(2);
  });
});
