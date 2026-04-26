import { Test, TestingModule } from '@nestjs/testing';
import { ResumeViewerCleanupService } from './resume-viewer-cleanup.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ResumeViewerCleanupService', () => {
  let service: ResumeViewerCleanupService;
  let mockPrisma: {
    resumeViewer: { deleteMany: jest.Mock };
    jobUrlCache: { deleteMany: jest.Mock };
  };

  beforeEach(async () => {
    mockPrisma = {
      resumeViewer: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      jobUrlCache: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResumeViewerCleanupService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ResumeViewerCleanupService);
  });

  it('만료된 ResumeViewer + 24h 지난 JobUrlCache 삭제 호출', async () => {
    mockPrisma.resumeViewer.deleteMany.mockResolvedValueOnce({ count: 3 });
    mockPrisma.jobUrlCache.deleteMany.mockResolvedValueOnce({ count: 5 });

    await service.cleanupExpired();

    expect(mockPrisma.resumeViewer.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { not: null, lt: expect.any(Date) } },
    });
    expect(mockPrisma.jobUrlCache.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
  });

  it('Prisma 에러 → 로깅만 하고 throw 안 함 (cron 안정성)', async () => {
    mockPrisma.resumeViewer.deleteMany.mockRejectedValueOnce(new Error('DB 연결 실패'));
    await expect(service.cleanupExpired()).resolves.toBeUndefined();
  });

  it('JobUrlCache 컷오프: 정확히 24시간 전 시점', async () => {
    const before = Date.now();
    await service.cleanupExpired();
    const call = mockPrisma.jobUrlCache.deleteMany.mock.calls[0][0];
    const cutoff = call.where.createdAt.lt as Date;
    const after = Date.now();
    const expectedMin = before - 24 * 60 * 60 * 1000;
    const expectedMax = after - 24 * 60 * 60 * 1000;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(expectedMin);
    expect(cutoff.getTime()).toBeLessThanOrEqual(expectedMax);
  });
});
