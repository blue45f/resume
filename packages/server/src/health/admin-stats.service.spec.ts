import { Test, TestingModule } from '@nestjs/testing';
import { AdminStatsService } from './admin-stats.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
  resume: { count: jest.fn(), aggregate: jest.fn() },
  template: { count: jest.fn() },
  tag: { count: jest.fn() },
  comment: { count: jest.fn() },
  jobApplication: { count: jest.fn() },
  resumeVersion: { count: jest.fn() },
  llmTransformation: { count: jest.fn() },
};

describe('AdminStatsService', () => {
  let service: AdminStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminStatsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(AdminStatsService);
    jest.clearAllMocks();
    // Default mocks
    mockPrisma.user.count.mockResolvedValue(10);
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u1', name: 'Test', email: 't@t.com', provider: 'local', createdAt: new Date() },
    ]);
    mockPrisma.user.groupBy.mockResolvedValue([]);
    mockPrisma.resume.count.mockResolvedValue(25);
    mockPrisma.resume.aggregate.mockResolvedValue({ _sum: { viewCount: 1500 } });
    mockPrisma.template.count.mockResolvedValue(26);
    mockPrisma.tag.count.mockResolvedValue(8);
    mockPrisma.comment.count.mockResolvedValue(15);
    mockPrisma.jobApplication.count.mockResolvedValue(30);
    mockPrisma.resumeVersion.count.mockResolvedValue(50);
    mockPrisma.llmTransformation.count.mockResolvedValue(12);
  });

  it('사이트 전체 통계 반환', async () => {
    const result = await service.getStats();
    expect(result.users.total).toBe(10);
    expect(result.resumes.total).toBe(25);
    expect(result.content.templates).toBe(26);
    expect(result.content.tags).toBe(8);
    expect(result.content.comments).toBe(15);
    expect(result.activity.totalViews).toBe(1500);
    expect(result.activity.transforms).toBe(12);
    expect(result.activity.applications).toBe(30);
  });
});
