"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const analytics_service_1 = require("./analytics.service");
const prisma_service_1 = require("../prisma/prisma.service");
const mockPrisma = {
    resume: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
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
    comment: {
        count: jest.fn(),
    },
    shareLink: {
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
    it('이력서 분석 통계 반환', async () => {
        mockPrisma.resume.findUnique.mockResolvedValue({ viewCount: 100, visibility: 'public', createdAt: new Date(), updatedAt: new Date() });
        mockPrisma.comment.count.mockResolvedValue(5);
        mockPrisma.bookmark.count.mockResolvedValue(3);
        mockPrisma.shareLink.count.mockResolvedValue(2);
        mockPrisma.resumeVersion.count.mockResolvedValue(8);
        const result = await service.getResumeAnalytics('r1');
        expect(result).not.toBeNull();
        expect(result.viewCount).toBe(100);
        expect(result.commentCount).toBe(5);
        expect(result.bookmarkCount).toBe(3);
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
