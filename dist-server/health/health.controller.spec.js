"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const health_controller_1 = require("./health.controller");
const prisma_service_1 = require("../prisma/prisma.service");
const admin_stats_service_1 = require("./admin-stats.service");
const usage_service_1 = require("./usage.service");
const mockPrisma = {
    $queryRaw: jest.fn(),
    resume: {
        count: jest.fn(),
        aggregate: jest.fn(),
    },
    user: {
        count: jest.fn(),
    },
    template: {
        count: jest.fn(),
    },
};
const mockConfig = {
    get: jest.fn(),
};
const mockStatsService = {
    getStats: jest.fn(),
};
const mockUsageService = {
    getUsage: jest.fn(),
};
describe('HealthController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [health_controller_1.HealthController],
            providers: [
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: config_1.ConfigService, useValue: mockConfig },
                { provide: admin_stats_service_1.AdminStatsService, useValue: mockStatsService },
                { provide: usage_service_1.UsageService, useValue: mockUsageService },
            ],
        }).compile();
        controller = module.get(health_controller_1.HealthController);
        jest.clearAllMocks();
    });
    describe('ping (GET /health)', () => {
        it('ok 상태 + 타임스탬프 + 버전 반환', () => {
            const result = controller.ping();
            expect(result.status).toBe('ok');
            expect(result.timestamp).toBeDefined();
            expect(typeof result.timestamp).toBe('string');
            expect(result.version).toBeDefined();
        });
        it('ISO 형식의 타임스탬프 반환', () => {
            const result = controller.ping();
            expect(() => new Date(result.timestamp)).not.toThrow();
            expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
        });
    });
    describe('check (GET /health/detailed)', () => {
        it('DB 정상 → status ok, 통계 포함', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
            mockPrisma.resume.count.mockResolvedValue(42);
            mockPrisma.user.count.mockResolvedValue(10);
            mockConfig.get.mockImplementation((key) => {
                if (key === 'GOOGLE_CLIENT_ID')
                    return 'google-id';
                if (key === 'GITHUB_CLIENT_ID')
                    return 'github-id';
                return undefined;
            });
            const result = await controller.check();
            expect(result.status).toBe('ok');
            expect(result.database).toBe('ok');
            expect(result.stats).toEqual({ resumes: 42, users: 10 });
            expect(result.providers.google).toBe(true);
            expect(result.providers.github).toBe(true);
            expect(result.providers.kakao).toBe(false);
            expect(result.memory).toBeDefined();
            expect(result.memory.rss).toBeGreaterThan(0);
        });
        it('DB 오류 → status degraded', async () => {
            mockPrisma.$queryRaw.mockRejectedValue(new Error('DB connection failed'));
            const result = await controller.check();
            expect(result.status).toBe('degraded');
            expect(result.database).toBe('error');
        });
    });
    describe('publicStats (GET /health/stats)', () => {
        it('사용자수, 이력서수, 조회수, 템플릿수 반환', async () => {
            mockPrisma.user.count.mockResolvedValue(100);
            mockPrisma.resume.count.mockResolvedValue(250);
            mockPrisma.resume.aggregate.mockResolvedValue({ _sum: { viewCount: 5000 } });
            mockPrisma.template.count.mockResolvedValue(26);
            const result = await controller.publicStats();
            expect(result).toEqual({
                users: { total: 100 },
                resumes: { total: 250 },
                activity: { totalViews: 5000 },
                content: { templates: 26 },
            });
        });
        it('조회수 null → 0으로 기본값 처리', async () => {
            mockPrisma.user.count.mockResolvedValue(0);
            mockPrisma.resume.count.mockResolvedValue(0);
            mockPrisma.resume.aggregate.mockResolvedValue({ _sum: { viewCount: null } });
            mockPrisma.template.count.mockResolvedValue(0);
            const result = await controller.publicStats();
            expect(result.activity.totalViews).toBe(0);
        });
    });
    describe('adminStats (GET /health/admin/stats)', () => {
        it('admin 사용자 → 관리자 통계 반환', async () => {
            const stats = { totalUsers: 100, totalResumes: 250, newUsersToday: 5 };
            mockStatsService.getStats.mockResolvedValue(stats);
            const result = await controller.adminStats({ user: { id: 'admin1', role: 'admin' } });
            expect(result).toEqual(stats);
            expect(mockStatsService.getStats).toHaveBeenCalled();
        });
        it('superadmin 사용자 → 관리자 통계 반환', async () => {
            const stats = { totalUsers: 200 };
            mockStatsService.getStats.mockResolvedValue(stats);
            const result = await controller.adminStats({ user: { id: 'sa1', role: 'superadmin' } });
            expect(result).toEqual(stats);
        });
        it('일반 사용자 → ForbiddenException', async () => {
            await expect(controller.adminStats({ user: { id: 'u1', role: 'user' } })).rejects.toThrow(common_1.ForbiddenException);
            expect(mockStatsService.getStats).not.toHaveBeenCalled();
        });
        it('비로그인 → UnauthorizedException', async () => {
            await expect(controller.adminStats({ user: null })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('user.id 없음 → UnauthorizedException', async () => {
            await expect(controller.adminStats({ user: {} })).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    describe('getUsage (GET /health/usage)', () => {
        it('로그인 사용자 → 사용량 반환', async () => {
            const usage = { ai_transform: { used: 3, limit: 5, remaining: 2 } };
            mockUsageService.getUsage.mockResolvedValue(usage);
            const result = await controller.getUsage({ user: { id: 'u1' } });
            expect(result).toEqual(usage);
            expect(mockUsageService.getUsage).toHaveBeenCalledWith('u1');
        });
        it('비로그인 → UnauthorizedException', async () => {
            await expect(controller.getUsage({ user: null })).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
});
