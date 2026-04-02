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
  skill: {
    findMany: jest.fn(),
  },
  bookmark: {
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

  it('이력서 변경 추이 반환', async () => {
    mockPrisma.resumeVersion.findMany.mockResolvedValue([
      { versionNumber: 1, snapshot: JSON.stringify({ experiences: [{}], skills: [{}] }), createdAt: new Date() },
      { versionNumber: 2, snapshot: JSON.stringify({ experiences: [{}], skills: [{}], projects: [{}] }), createdAt: new Date() },
    ]);
    const result = await service.getResumeTrend('r1');
    expect(result).toHaveLength(2);
    expect(result[0].sections).toBe(2);
    expect(result[1].sections).toBe(3);
  });

  it('인기 기술 스택 반환', async () => {
    mockPrisma.skill.findMany.mockResolvedValue([
      { items: 'React, TypeScript, Node.js' },
      { items: 'React, Python' },
      { items: 'TypeScript, Java' },
    ]);
    const result = await service.getPopularSkills();
    expect(result[0].name).toBe('react');
    expect(result[0].count).toBe(2);
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
