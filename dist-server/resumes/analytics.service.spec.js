"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const analytics_service_1 = require("./analytics.service");
const prisma_service_1 = require("../prisma/prisma.service");
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
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                analytics_service_1.AnalyticsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(analytics_service_1.AnalyticsService);
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
